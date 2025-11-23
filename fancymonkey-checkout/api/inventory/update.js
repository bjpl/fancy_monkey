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
 * UPDATE Inventory API
 *
 * Updates stock levels for products
 * Requires admin authentication
 *
 * Body:
 * {
 *   password: string (admin password)
 *   updates: [
 *     {
 *       productId: string,
 *       size: string,
 *       stock: number (optional - sets absolute stock level)
 *       adjustStock: number (optional - adjusts stock by amount, can be negative)
 *       reserved: number (optional - sets reserved count)
 *       lowStockThreshold: number (optional)
 *       soldOut: boolean (optional)
 *       restockDate: string (optional ISO date)
 *     }
 *   ]
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
        const { password, updates } = req.body;

        // Verify admin password
        if (password !== ADMIN_PASSWORD) {
            return res.status(401).json({
                error: 'Invalid admin password'
            });
        }

        if (!updates || !Array.isArray(updates) || updates.length === 0) {
            return res.status(400).json({
                error: 'No updates provided. Expected array of update objects.'
            });
        }

        // Read products.json with file locking simulation (retry mechanism)
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
                // Wait before retry (exponential backoff)
                await new Promise(resolve => setTimeout(resolve, 100 * Math.pow(2, retryCount)));
            }
        }

        // Track successful and failed updates
        const results = {
            successful: [],
            failed: []
        };

        // Apply updates
        for (const update of updates) {
            const { productId, size, stock, adjustStock, reserved, lowStockThreshold, soldOut, restockDate } = update;

            if (!productId || !size) {
                results.failed.push({
                    update,
                    reason: 'Missing productId or size'
                });
                continue;
            }

            // Find product
            const product = products.find(p => p.id === productId);
            if (!product) {
                results.failed.push({
                    update,
                    reason: `Product not found: ${productId}`
                });
                continue;
            }

            // Find size
            if (!product.sizes[size]) {
                results.failed.push({
                    update,
                    reason: `Size not found: ${size} for product ${productId}`
                });
                continue;
            }

            // Apply updates to size
            const sizeData = product.sizes[size];
            const oldValues = { ...sizeData };

            // Update stock (absolute or adjustment)
            if (typeof stock === 'number') {
                sizeData.stock = Math.max(0, stock);
            } else if (typeof adjustStock === 'number') {
                sizeData.stock = Math.max(0, (sizeData.stock || 0) + adjustStock);
            }

            // Update reserved
            if (typeof reserved === 'number') {
                sizeData.reserved = Math.max(0, reserved);
            }

            // Update low stock threshold
            if (typeof lowStockThreshold === 'number') {
                sizeData.lowStockThreshold = Math.max(0, lowStockThreshold);
            }

            // Update soldOut status
            if (typeof soldOut === 'boolean') {
                sizeData.soldOut = soldOut;
            }

            // Auto-set soldOut based on stock
            const available = (sizeData.stock || 0) - (sizeData.reserved || 0);
            if (available <= 0) {
                sizeData.soldOut = true;
            } else if (sizeData.soldOut && available > 0) {
                // If stock is available but marked as soldOut, clear soldOut flag
                sizeData.soldOut = false;
            }

            // Update restock date
            if (restockDate !== undefined) {
                sizeData.restockDate = restockDate;
            }

            // Update product lastUpdated timestamp
            product.lastUpdated = new Date().toISOString();

            results.successful.push({
                productId,
                size,
                oldValues,
                newValues: { ...sizeData }
            });
        }

        // Write updated products back to file (atomic write with temp file)
        const tempPath = productsPath + '.tmp';
        const productsJson = JSON.stringify(products, null, 4);

        await fs.writeFile(tempPath, productsJson, 'utf8');
        await fs.rename(tempPath, productsPath);

        // Log inventory change
        await logInventoryChange({
            action: 'update',
            updates: results.successful,
            timestamp: new Date().toISOString(),
            adminAction: true
        });

        return res.status(200).json({
            success: true,
            message: `Updated ${results.successful.length} inventory items`,
            results: {
                successful: results.successful.length,
                failed: results.failed.length,
                details: results
            },
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Update inventory error:', error);
        return res.status(500).json({
            error: 'Failed to update inventory',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Helper function to log inventory changes
async function logInventoryChange(changeData) {
    try {
        const logsDir = path.join(process.cwd(), '..', 'logs');
        const logFile = path.join(logsDir, 'inventory-changes.log');

        // Ensure logs directory exists
        try {
            await fs.access(logsDir);
        } catch {
            await fs.mkdir(logsDir, { recursive: true });
        }

        const logEntry = JSON.stringify(changeData) + '\n';
        await fs.appendFile(logFile, logEntry);
    } catch (error) {
        console.error('Failed to log inventory change:', error);
        // Don't throw - logging failure shouldn't break inventory update
    }
}
