const Stripe = require('stripe');
const fs = require('fs').promises;
const path = require('path');

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

/**
 * Stripe Webhook Handler
 *
 * Handles Stripe events to update inventory on successful purchases
 *
 * Events handled:
 * - checkout.session.completed: Decrease stock, release reservation
 * - checkout.session.expired: Release reservation
 */
module.exports = async (req, res) => {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const sig = req.headers['stripe-signature'];

    let event;

    try {
        // Verify webhook signature
        event = stripe.webhooks.constructEvent(
            req.body,
            sig,
            endpointSecret
        );
    } catch (err) {
        console.error('Webhook signature verification failed:', err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the event
    try {
        switch (event.type) {
            case 'checkout.session.completed':
                await handleCheckoutCompleted(event.data.object);
                break;

            case 'checkout.session.expired':
                await handleCheckoutExpired(event.data.object);
                break;

            case 'payment_intent.succeeded':
                // Additional confirmation that payment went through
                console.log('Payment succeeded:', event.data.object.id);
                break;

            default:
                console.log(`Unhandled event type: ${event.type}`);
        }

        res.json({ received: true });
    } catch (error) {
        console.error('Webhook handler error:', error);
        res.status(500).json({
            error: 'Webhook handler failed',
            details: error.message
        });
    }
};

/**
 * Handle successful checkout - decrease stock and release reservation
 */
async function handleCheckoutCompleted(session) {
    const { id: sessionId, metadata } = session;
    const { productId, skuId } = metadata;

    if (!productId || !skuId) {
        console.error('Missing metadata in checkout session:', sessionId);
        return;
    }

    console.log('Processing completed checkout:', {
        sessionId,
        productId,
        skuId
    });

    // Read products.json
    const productsPath = path.join(process.cwd(), '..', 'products.json');
    let products;
    let retryCount = 0;
    const maxRetries = 5;

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
            await new Promise(resolve => setTimeout(resolve, 200 * Math.pow(2, retryCount)));
        }
    }

    // Find product and size
    const product = products.find(p => p.id === productId);
    if (!product) {
        console.error('Product not found:', productId);
        return;
    }

    // Find the size by SKU ID
    let targetSize = null;
    let sizeName = null;

    for (const [size, data] of Object.entries(product.sizes)) {
        if (data.skuId === skuId) {
            targetSize = data;
            sizeName = size;
            break;
        }
    }

    if (!targetSize) {
        console.error('Size not found for SKU:', skuId);
        return;
    }

    // Decrease stock by 1 (customer purchased)
    const oldStock = targetSize.stock || 0;
    const oldReserved = targetSize.reserved || 0;

    targetSize.stock = Math.max(0, oldStock - 1);
    targetSize.reserved = Math.max(0, oldReserved - 1);

    // Mark as sold out if stock is depleted
    const available = targetSize.stock - (targetSize.reserved || 0);
    if (available <= 0) {
        targetSize.soldOut = true;
    }

    // Update product timestamp
    product.lastUpdated = new Date().toISOString();

    // Write updated products atomically
    const tempPath = productsPath + '.tmp';
    await fs.writeFile(tempPath, JSON.stringify(products, null, 4), 'utf8');
    await fs.rename(tempPath, productsPath);

    // Remove reservation from tracking
    await removeReservation(sessionId);

    // Log the sale
    await logSale({
        sessionId,
        productId,
        productName: product.name,
        size: sizeName,
        skuId,
        priceId: targetSize.priceId,
        price: product.price,
        oldStock,
        newStock: targetSize.stock,
        timestamp: new Date().toISOString()
    });

    console.log('Inventory updated for sale:', {
        product: product.name,
        size: sizeName,
        oldStock,
        newStock: targetSize.stock
    });
}

/**
 * Handle expired checkout - release reservation
 */
async function handleCheckoutExpired(session) {
    const { id: sessionId, metadata } = session;

    console.log('Checkout session expired:', sessionId);

    // Release reservation via API
    try {
        const reservationsPath = path.join(process.cwd(), '..', 'data', 'reservations.json');
        let reservations = [];

        try {
            const data = await fs.readFile(reservationsPath, 'utf8');
            reservations = JSON.parse(data);
        } catch {
            // No reservations file
            return;
        }

        // Find reservation for this session
        const reservation = reservations.find(r => r.sessionId === sessionId);
        if (!reservation) {
            console.log('No reservation found for expired session:', sessionId);
            return;
        }

        // Read products
        const productsPath = path.join(process.cwd(), '..', 'products.json');
        const productsData = await fs.readFile(productsPath, 'utf8');
        const products = JSON.parse(productsData);

        // Find product and release reservation
        const product = products.find(p => p.id === reservation.productId);
        if (product && product.sizes[reservation.size]) {
            const sizeData = product.sizes[reservation.size];
            sizeData.reserved = Math.max(0, (sizeData.reserved || 0) - reservation.quantity);
            product.lastUpdated = new Date().toISOString();

            // Write updated products
            const tempPath = productsPath + '.tmp';
            await fs.writeFile(tempPath, JSON.stringify(products, null, 4), 'utf8');
            await fs.rename(tempPath, productsPath);

            console.log('Released reservation:', {
                product: product.name,
                size: reservation.size,
                quantity: reservation.quantity
            });
        }

        // Remove from reservations
        await removeReservation(sessionId);

    } catch (error) {
        console.error('Error releasing expired reservation:', error);
    }
}

/**
 * Remove reservation from tracking file
 */
async function removeReservation(sessionId) {
    try {
        const reservationsPath = path.join(process.cwd(), '..', 'data', 'reservations.json');
        let reservations = [];

        try {
            const data = await fs.readFile(reservationsPath, 'utf8');
            reservations = JSON.parse(data);
        } catch {
            return; // No reservations file
        }

        // Filter out this session
        reservations = reservations.filter(r => r.sessionId !== sessionId);

        // Write back
        await fs.writeFile(reservationsPath, JSON.stringify(reservations, null, 2));
    } catch (error) {
        console.error('Error removing reservation:', error);
    }
}

/**
 * Log sale to sales log
 */
async function logSale(saleData) {
    try {
        const logsDir = path.join(process.cwd(), '..', 'logs');
        const logFile = path.join(logsDir, 'sales.log');

        try {
            await fs.access(logsDir);
        } catch {
            await fs.mkdir(logsDir, { recursive: true });
        }

        const logEntry = JSON.stringify(saleData) + '\n';
        await fs.appendFile(logFile, logEntry);
    } catch (error) {
        console.error('Failed to log sale:', error);
    }
}
