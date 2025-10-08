const fs = require('fs').promises;
const path = require('path');

// CORS headers
const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
};

// Reservation expiration time (30 minutes)
const RESERVATION_TTL = 30 * 60 * 1000;

/**
 * RESERVE Inventory API
 *
 * Reserves inventory during checkout process
 * Reservations expire after 30 minutes
 *
 * Body:
 * {
 *   productId: string,
 *   size: string,
 *   quantity: number (default 1),
 *   sessionId: string (checkout session ID)
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
        const { productId, size, quantity = 1, sessionId } = req.body;

        if (!productId || !size || !sessionId) {
            return res.status(400).json({
                error: 'Missing required fields: productId, size, sessionId'
            });
        }

        if (quantity < 1 || quantity > 10) {
            return res.status(400).json({
                error: 'Quantity must be between 1 and 10'
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

        // Find product and size
        const product = products.find(p => p.id === productId);
        if (!product) {
            return res.status(404).json({
                error: 'Product not found'
            });
        }

        const sizeData = product.sizes[size];
        if (!sizeData) {
            return res.status(404).json({
                error: 'Size not found'
            });
        }

        // Check if enough stock available
        const currentReserved = sizeData.reserved || 0;
        const currentStock = sizeData.stock || 0;
        const available = currentStock - currentReserved;

        if (available < quantity) {
            return res.status(409).json({
                error: 'Insufficient stock available',
                available,
                requested: quantity,
                stock: currentStock,
                reserved: currentReserved
            });
        }

        // Create or update reservation
        sizeData.reserved = currentReserved + quantity;

        // Track reservation with expiration
        await trackReservation({
            sessionId,
            productId,
            size,
            quantity,
            expiresAt: Date.now() + RESERVATION_TTL,
            createdAt: Date.now()
        });

        // Update product timestamp
        product.lastUpdated = new Date().toISOString();

        // Write updated products back atomically
        const tempPath = productsPath + '.tmp';
        await fs.writeFile(tempPath, JSON.stringify(products, null, 4), 'utf8');
        await fs.rename(tempPath, productsPath);

        // Log reservation
        await logInventoryChange({
            action: 'reserve',
            productId,
            size,
            quantity,
            sessionId,
            timestamp: new Date().toISOString()
        });

        return res.status(200).json({
            success: true,
            message: 'Inventory reserved',
            reservation: {
                productId,
                size,
                quantity,
                sessionId,
                expiresAt: new Date(Date.now() + RESERVATION_TTL).toISOString(),
                expiresInMinutes: 30
            },
            stock: {
                total: currentStock,
                reserved: sizeData.reserved,
                available: currentStock - sizeData.reserved
            }
        });

    } catch (error) {
        console.error('Reserve inventory error:', error);
        return res.status(500).json({
            error: 'Failed to reserve inventory',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Helper function to track reservations
async function trackReservation(reservationData) {
    try {
        const reservationsPath = path.join(process.cwd(), '..', 'data', 'reservations.json');
        const reservationsDir = path.dirname(reservationsPath);

        // Ensure directory exists
        try {
            await fs.access(reservationsDir);
        } catch {
            await fs.mkdir(reservationsDir, { recursive: true });
        }

        // Read existing reservations
        let reservations = [];
        try {
            const data = await fs.readFile(reservationsPath, 'utf8');
            reservations = JSON.parse(data);
        } catch {
            // File doesn't exist yet
        }

        // Remove expired reservations
        const now = Date.now();
        reservations = reservations.filter(r => r.expiresAt > now);

        // Add new reservation
        reservations.push(reservationData);

        // Write back
        await fs.writeFile(reservationsPath, JSON.stringify(reservations, null, 2));
    } catch (error) {
        console.error('Failed to track reservation:', error);
    }
}

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
