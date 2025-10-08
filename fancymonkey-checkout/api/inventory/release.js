const fs = require('fs').promises;
const path = require('path');

// CORS headers
const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
};

/**
 * RELEASE Inventory API
 *
 * Releases reserved inventory (expired sessions or cancelled checkouts)
 *
 * Body:
 * {
 *   sessionId: string (optional - release specific session)
 *   releaseExpired: boolean (optional - release all expired reservations)
 * }
 */
module.exports = async (req, res) => {
    // Handle preflight
    if (req.method === 'OPTIONS') {
        return res.status(200).setHeader('Access-Control-Allow-Origin', '*').end();
    }

    // Only allow POST requests
    if (req.method !== 'POST') {
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
        const { sessionId, releaseExpired = false } = req.body;

        if (!sessionId && !releaseExpired) {
            return res.status(400).json({
                error: 'Must provide sessionId or set releaseExpired=true'
            });
        }

        // Read reservations
        const reservationsPath = path.join(process.cwd(), '..', 'data', 'reservations.json');
        let reservations = [];
        try {
            const data = await fs.readFile(reservationsPath, 'utf8');
            reservations = JSON.parse(data);
        } catch {
            return res.status(200).json({
                success: true,
                message: 'No reservations to release',
                released: 0
            });
        }

        const now = Date.now();
        const toRelease = [];
        const toKeep = [];

        // Determine which reservations to release
        for (const reservation of reservations) {
            if (
                (releaseExpired && reservation.expiresAt <= now) ||
                (sessionId && reservation.sessionId === sessionId)
            ) {
                toRelease.push(reservation);
            } else if (reservation.expiresAt > now) {
                toKeep.push(reservation);
            }
        }

        if (toRelease.length === 0) {
            return res.status(200).json({
                success: true,
                message: 'No reservations to release',
                released: 0
            });
        }

        // Read products.json with retry mechanism
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

        // Release inventory
        const released = [];
        for (const reservation of toRelease) {
            const product = products.find(p => p.id === reservation.productId);
            if (!product) continue;

            const sizeData = product.sizes[reservation.size];
            if (!sizeData) continue;

            const currentReserved = sizeData.reserved || 0;
            sizeData.reserved = Math.max(0, currentReserved - reservation.quantity);

            product.lastUpdated = new Date().toISOString();

            released.push({
                productId: reservation.productId,
                size: reservation.size,
                quantity: reservation.quantity,
                sessionId: reservation.sessionId
            });
        }

        // Write updated products
        const tempPath = productsPath + '.tmp';
        await fs.writeFile(tempPath, JSON.stringify(products, null, 4), 'utf8');
        await fs.rename(tempPath, productsPath);

        // Write updated reservations (only keep non-released)
        await fs.writeFile(reservationsPath, JSON.stringify(toKeep, null, 2));

        // Log release
        await logInventoryChange({
            action: 'release',
            released,
            reason: releaseExpired ? 'expired' : 'manual',
            timestamp: new Date().toISOString()
        });

        return res.status(200).json({
            success: true,
            message: `Released ${released.length} reservations`,
            released,
            remaining: toKeep.length
        });

    } catch (error) {
        console.error('Release inventory error:', error);
        return res.status(500).json({
            error: 'Failed to release inventory',
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
