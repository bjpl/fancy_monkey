const fs = require('fs').promises;
const path = require('path');

// CORS headers - Whitelist specific domains
const ALLOWED_ORIGINS = [
    'https://fancymonkey.shop',
    'https://www.fancymonkey.shop',
    'https://bjpl.github.io',
    ...(process.env.NODE_ENV === 'development' ? ['http://localhost:3000', 'http://localhost:5500', 'http://127.0.0.1:5500'] : [])
];

function getCorsHeaders(origin) {
    return {
        'Access-Control-Allow-Origin': ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0],
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Max-Age': '86400',
    };
}

// Admin authentication - NO DEFAULT PASSWORD FOR SECURITY
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

if (!ADMIN_PASSWORD) {
    console.error('CRITICAL: ADMIN_PASSWORD environment variable is not set. Admin endpoints will not work.');
}

/**
 * BULK UPDATE Inventory API
 *
 * Updates multiple products in a single transaction
 * Requires admin authentication
 *
 * Body:
 * {
 *   password: string,
 *   action: 'set' | 'adjust' | 'reset',
 *   filter: {
 *     category?: string,
 *     productIds?: string[],
 *     lowStockOnly?: boolean
 *   },
 *   changes: {
 *     stock?: number (for 'set' and 'adjust'),
 *     reserved?: number,
 *     lowStockThreshold?: number,
 *     soldOut?: boolean
 *   }
 * }
 */
module.exports = async (req, res) => {
    const origin = req.headers.origin;
    const corsHeaders = getCorsHeaders(origin);

    // Handle preflight
    if (req.method === 'OPTIONS') {
        Object.keys(corsHeaders).forEach(key => {
            res.setHeader(key, corsHeaders[key]);
        });
        return res.status(200).end();
    }

    // Only allow POST requests
    if (req.method !== 'POST') {
        Object.keys(corsHeaders).forEach(key => {
            res.setHeader(key, corsHeaders[key]);
        });
        return res.status(405).json({
            error: 'Method not allowed'
        });
    }

    // Set CORS headers
    Object.keys(corsHeaders).forEach(key => {
        res.setHeader(key, corsHeaders[key]);
    });

    try {
        const { password, action, filter = {}, changes = {} } = req.body;

        // Verify admin password
        if (password !== ADMIN_PASSWORD) {
            return res.status(401).json({
                error: 'Invalid admin password'
            });
        }

        if (!action || !['set', 'adjust', 'reset'].includes(action)) {
            return res.status(400).json({
                error: 'Invalid action. Must be: set, adjust, or reset'
            });
        }

        // Read products.json
        const productsPath = path.join(process.cwd(), '..', 'products.json');
        let products;
        let retryCount = 0;
        const maxRetries = 3;

        while (retryCount < maxRetries) {
            try {
                const productsData = await fs.readFile(productsPath, 'utf8');
                products = JSON.parse(productsData);
                break;
            } catch (error) {
                retryCount++;
                if (retryCount >= maxRetries) {
                    throw error;
                }
                await new Promise(resolve => setTimeout(resolve, 100 * Math.pow(2, retryCount)));
            }
        }

        // Apply filters
        let targetProducts = products;

        if (filter.category) {
            targetProducts = targetProducts.filter(p => p.category === filter.category);
        }

        if (filter.productIds && Array.isArray(filter.productIds)) {
            targetProducts = targetProducts.filter(p => filter.productIds.includes(p.id));
        }

        if (filter.lowStockOnly) {
            targetProducts = targetProducts.filter(product => {
                return Object.values(product.sizes).some(sizeData => {
                    const available = (sizeData.stock || 0) - (sizeData.reserved || 0);
                    return available > 0 && available <= (sizeData.lowStockThreshold || 5);
                });
            });
        }

        if (targetProducts.length === 0) {
            return res.status(200).json({
                success: true,
                message: 'No products matched the filter criteria',
                updated: 0
            });
        }

        // Track changes
        const updateLog = [];
        let updatedCount = 0;

        // Apply bulk updates
        for (const product of targetProducts) {
            for (const [sizeName, sizeData] of Object.entries(product.sizes)) {
                const oldValues = { ...sizeData };

                switch (action) {
                    case 'set':
                        if (typeof changes.stock === 'number') {
                            sizeData.stock = Math.max(0, changes.stock);
                        }
                        if (typeof changes.reserved === 'number') {
                            sizeData.reserved = Math.max(0, changes.reserved);
                        }
                        if (typeof changes.lowStockThreshold === 'number') {
                            sizeData.lowStockThreshold = Math.max(0, changes.lowStockThreshold);
                        }
                        if (typeof changes.soldOut === 'boolean') {
                            sizeData.soldOut = changes.soldOut;
                        }
                        break;

                    case 'adjust':
                        if (typeof changes.stock === 'number') {
                            sizeData.stock = Math.max(0, (sizeData.stock || 0) + changes.stock);
                        }
                        if (typeof changes.reserved === 'number') {
                            sizeData.reserved = Math.max(0, (sizeData.reserved || 0) + changes.reserved);
                        }
                        break;

                    case 'reset':
                        sizeData.reserved = 0;
                        if (typeof changes.stock === 'number') {
                            sizeData.stock = changes.stock;
                        }
                        sizeData.soldOut = false;
                        break;
                }

                // Auto-update soldOut based on available stock
                const available = (sizeData.stock || 0) - (sizeData.reserved || 0);
                if (available <= 0) {
                    sizeData.soldOut = true;
                } else if (action === 'reset' || (sizeData.soldOut && available > 0)) {
                    sizeData.soldOut = false;
                }

                updateLog.push({
                    productId: product.id,
                    productName: product.name,
                    size: sizeName,
                    oldValues,
                    newValues: { ...sizeData }
                });

                updatedCount++;
            }

            product.lastUpdated = new Date().toISOString();
        }

        // Write updated products atomically
        const tempPath = productsPath + '.tmp';
        await fs.writeFile(tempPath, JSON.stringify(products, null, 4), 'utf8');
        await fs.rename(tempPath, productsPath);

        // Log bulk update
        await logInventoryChange({
            action: 'bulk_update',
            bulkAction: action,
            filter,
            changes,
            updatedCount,
            timestamp: new Date().toISOString(),
            adminAction: true
        });

        return res.status(200).json({
            success: true,
            message: `Bulk ${action} completed`,
            results: {
                productsAffected: targetProducts.length,
                itemsUpdated: updatedCount,
                action,
                filter,
                changes
            },
            updateLog: updateLog.slice(0, 50), // Return first 50 for response size
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Bulk update inventory error:', error);
        return res.status(500).json({
            error: 'Failed to perform bulk update',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Helper function to log inventory changes
async function logInventoryChange(changeData) {
    try {
        const logsDir = path.join(process.cwd(), '..', 'logs');
        const logFile = path.join(logsDir, 'inventory-changes.log');

        try {
            await fs.access(logsDir);
        } catch {
            await fs.mkdir(logsDir, { recursive: true });
        }

        const logEntry = JSON.stringify(changeData) + '\n';
        await fs.appendFile(logFile, logEntry);
    } catch (error) {
        console.error('Failed to log inventory change:', error);
    }
}
