const fs = require('fs').promises;
const path = require('path');

// CORS headers
const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
};

/**
 * GET Inventory API
 *
 * Fetches current inventory levels for products
 *
 * Query Parameters:
 * - productId: (optional) Get inventory for specific product
 * - lowStockOnly: (optional) Get only low stock items
 * - category: (optional) Filter by category
 */
module.exports = async (req, res) => {
    // Handle preflight
    if (req.method === 'OPTIONS') {
        return res.status(200).setHeader('Access-Control-Allow-Origin', '*').end();
    }

    // Only allow GET requests
    if (req.method !== 'GET') {
        return res.status(405).json({
            error: 'Method not allowed',
            ...corsHeaders
        });
    }

    // Set CORS headers
    Object.keys(corsHeaders).forEach(key => {
        res.setHeader(key, corsHeaders[key]);
    });

    try {
        const { productId, lowStockOnly, category } = req.query;

        // Read products.json
        const productsPath = path.join(process.cwd(), '..', 'products.json');
        const productsData = await fs.readFile(productsPath, 'utf8');
        let products = JSON.parse(productsData);

        // Filter by productId if provided
        if (productId) {
            products = products.filter(p => p.id === productId);
            if (products.length === 0) {
                return res.status(404).json({
                    error: 'Product not found',
                    productId
                });
            }
        }

        // Filter by category if provided
        if (category) {
            products = products.filter(p => p.category === category);
        }

        // Build inventory response
        const inventory = products.map(product => {
            const sizes = Object.entries(product.sizes).map(([sizeName, sizeData]) => {
                const available = (sizeData.stock || 0) - (sizeData.reserved || 0);
                const isLowStock = available > 0 && available <= (sizeData.lowStockThreshold || 5);
                const isOutOfStock = available <= 0;

                return {
                    size: sizeName,
                    stock: sizeData.stock || 0,
                    reserved: sizeData.reserved || 0,
                    available,
                    lowStockThreshold: sizeData.lowStockThreshold || 5,
                    isLowStock,
                    isOutOfStock,
                    soldOut: sizeData.soldOut || isOutOfStock,
                    restockDate: sizeData.restockDate || product.restockDate || null,
                    skuId: sizeData.skuId,
                    priceId: sizeData.priceId
                };
            });

            // Calculate total inventory for product
            const totalStock = sizes.reduce((sum, s) => sum + s.stock, 0);
            const totalReserved = sizes.reduce((sum, s) => sum + s.reserved, 0);
            const totalAvailable = sizes.reduce((sum, s) => sum + s.available, 0);

            return {
                productId: product.id,
                name: product.name,
                category: product.category,
                price: product.price,
                sizes,
                totals: {
                    stock: totalStock,
                    reserved: totalReserved,
                    available: totalAvailable
                },
                lastUpdated: product.lastUpdated || new Date().toISOString()
            };
        });

        // Filter for low stock only if requested
        let filteredInventory = inventory;
        if (lowStockOnly === 'true') {
            filteredInventory = inventory.filter(item =>
                item.sizes.some(size => size.isLowStock)
            ).map(item => ({
                ...item,
                sizes: item.sizes.filter(size => size.isLowStock)
            }));
        }

        // Return inventory data
        return res.status(200).json({
            success: true,
            inventory: filteredInventory,
            summary: {
                totalProducts: filteredInventory.length,
                lowStockItems: inventory.filter(item =>
                    item.sizes.some(size => size.isLowStock)
                ).length,
                outOfStockItems: inventory.filter(item =>
                    item.sizes.every(size => size.isOutOfStock)
                ).length
            },
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Get inventory error:', error);
        return res.status(500).json({
            error: 'Failed to retrieve inventory',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};
