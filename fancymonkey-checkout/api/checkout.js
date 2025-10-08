const Stripe = require('stripe');

// Initialize Stripe with your secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2023-10-16',
});

// CORS headers for allowing GitHub Pages domain
const corsHeaders = {
    'Access-Control-Allow-Origin': '*', // Will restrict to specific domain in production
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
};

module.exports = async (req, res) => {
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        return res.status(200).json({});
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
        // Support both single-item and multi-item checkout
        const { productId, skuId, priceId, items } = req.body;

        let lineItems = [];
        let metadata = {};

        // Multi-item checkout (from cart)
        if (items && Array.isArray(items) && items.length > 0) {
            lineItems = items.map(item => ({
                price: item.priceId,
                quantity: item.quantity || 1
            }));

            // Store cart items in metadata (for webhook processing)
            metadata = {
                cartItems: JSON.stringify(items),
                isMultiItem: 'true'
            };
        }
        // Single-item checkout (legacy, direct from product)
        else if (productId && skuId && priceId) {
            lineItems = [{
                price: priceId,
                quantity: 1
            }];

            metadata = {
                productId: productId,
                skuId: skuId,
                isMultiItem: 'false'
            };
        }
        else {
            return res.status(400).json({
                error: 'Missing required fields: either provide (productId, skuId, priceId) or items array'
            });
        }

        // Check inventory from Stripe (using Products/Prices API)
        // Note: In production, you'd check actual SKU inventory
        let available = true;
        
        try {
            // For real inventory checking, you'd query your inventory system
            // or use Stripe's inventory management if configured
            const price = await stripe.prices.retrieve(priceId);
            
            // Check if price exists and is active
            if (!price || !price.active) {
                available = false;
            }

            // You can also check product metadata for inventory
            if (price.product) {
                const product = await stripe.products.retrieve(price.product);
                
                // Check if product has inventory metadata
                if (product.metadata && product.metadata.inventory) {
                    const inventory = parseInt(product.metadata.inventory);
                    if (inventory <= 0) {
                        available = false;
                    }
                }
            }
        } catch (inventoryError) {
            console.error('Inventory check error:', inventoryError);
            // If we can't check inventory, assume it's available
            // but log for monitoring
        }

        if (!available) {
            return res.status(200).json({ 
                error: 'Item sold out',
                soldOut: true 
            });
        }

        // Create Stripe Checkout session
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card', 'apple_pay', 'google_pay'],
            mode: 'payment',
            line_items: lineItems, // Support multiple items
            success_url: `https://fancymonkey.shop/success.html?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: 'https://fancymonkey.shop',
            shipping_address_collection: {
                allowed_countries: ['US'], // US only shipping
            },
            shipping_options: [
                {
                    shipping_rate_data: {
                        type: 'fixed_amount',
                        fixed_amount: {
                            amount: 1000, // $10 shipping
                            currency: 'usd',
                        },
                        display_name: 'Standard Shipping',
                        delivery_estimate: {
                            minimum: {
                                unit: 'business_day',
                                value: 3,
                            },
                            maximum: {
                                unit: 'business_day',
                                value: 7,
                            },
                        },
                    },
                },
                {
                    shipping_rate_data: {
                        type: 'fixed_amount',
                        fixed_amount: {
                            amount: 2500, // $25 express shipping
                            currency: 'usd',
                        },
                        display_name: 'Express Shipping',
                        delivery_estimate: {
                            minimum: {
                                unit: 'business_day',
                                value: 1,
                            },
                            maximum: {
                                unit: 'business_day',
                                value: 2,
                            },
                        },
                    },
                },
            ],
            metadata: metadata, // Use dynamic metadata
            allow_promotion_codes: true,
            billing_address_collection: 'required',
            customer_creation: 'always',
            payment_intent_data: {
                metadata: metadata, // Use dynamic metadata
            },
            expires_at: Math.floor(Date.now() / 1000) + (30 * 60), // 30 minute expiration
        });

        // Return checkout URL
        return res.status(200).json({ 
            checkoutUrl: session.url,
            sessionId: session.id 
        });

    } catch (error) {
        console.error('Checkout error:', error);
        
        // Don't expose internal errors to client
        return res.status(500).json({ 
            error: 'Checkout temporarily unavailable. Please try again.' 
        });
    }
};