const Stripe = require('stripe');

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2023-10-16',
});

/**
 * Serverless Function: Send Order Confirmation Email
 *
 * This function sends order confirmation emails using Resend API.
 * Triggered by Stripe webhook or manual invocation.
 *
 * Environment Variables Required:
 * - RESEND_API_KEY: API key from Resend
 * - FROM_EMAIL: Verified sender email (e.g., orders@fancymonkey.shop)
 */

module.exports = async (req, res) => {
    // Only allow POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({
            error: 'Method not allowed',
            message: 'This endpoint only accepts POST requests'
        });
    }

    try {
        const {
            sessionId,
            orderData // Optional: pre-formatted order data
        } = req.body;

        // Validate input
        if (!sessionId && !orderData) {
            return res.status(400).json({
                error: 'Missing required fields',
                message: 'Either sessionId or orderData is required'
            });
        }

        let emailData;

        // If sessionId provided, fetch data from Stripe
        if (sessionId) {
            try {
                const session = await stripe.checkout.sessions.retrieve(sessionId, {
                    expand: ['line_items', 'customer', 'payment_intent']
                });

                // Extract order information from Stripe session
                emailData = {
                    customerEmail: session.customer_details.email,
                    customerName: session.customer_details.name,
                    orderId: session.payment_intent.id || session.id,
                    orderDate: new Date(session.created * 1000).toLocaleString('en-US', {
                        dateStyle: 'long',
                        timeStyle: 'short'
                    }),
                    items: session.line_items.data.map(item => ({
                        name: item.description,
                        quantity: item.quantity,
                        price: (item.amount_total / 100).toFixed(2),
                        size: session.metadata?.size || 'N/A'
                    })),
                    subtotal: ((session.amount_subtotal || 0) / 100).toFixed(2),
                    shipping: ((session.total_details?.amount_shipping || 0) / 100).toFixed(2),
                    tax: ((session.total_details?.amount_tax || 0) / 100).toFixed(2),
                    total: (session.amount_total / 100).toFixed(2),
                    shippingAddress: session.shipping_details?.address ? {
                        line1: session.shipping_details.address.line1,
                        line2: session.shipping_details.address.line2,
                        city: session.shipping_details.address.city,
                        state: session.shipping_details.address.state,
                        zip: session.shipping_details.address.postal_code,
                        country: session.shipping_details.address.country
                    } : null,
                    shippingMethod: session.shipping_details?.name || 'Standard Shipping'
                };
            } catch (stripeError) {
                console.error('Stripe session retrieval error:', stripeError);
                return res.status(500).json({
                    error: 'Failed to retrieve order details',
                    message: 'Could not fetch order information from Stripe'
                });
            }
        } else {
            // Use provided order data
            emailData = orderData;
        }

        // Validate email data
        if (!emailData.customerEmail) {
            return res.status(400).json({
                error: 'Missing customer email',
                message: 'Cannot send confirmation without customer email address'
            });
        }

        // Send email using Resend
        const emailResult = await sendOrderConfirmationEmail(emailData);

        // Log successful email send
        console.log('Order confirmation email sent:', {
            orderId: emailData.orderId,
            email: emailData.customerEmail,
            emailId: emailResult.id
        });

        return res.status(200).json({
            success: true,
            message: 'Order confirmation email sent successfully',
            emailId: emailResult.id
        });

    } catch (error) {
        console.error('Email sending error:', error);

        // Return appropriate error response
        return res.status(500).json({
            error: 'Email sending failed',
            message: process.env.NODE_ENV === 'development'
                ? error.message
                : 'Failed to send order confirmation email'
        });
    }
};

/**
 * Send order confirmation email via Resend API
 *
 * @param {Object} orderData - Order information
 * @returns {Promise<Object>} Resend API response
 */
async function sendOrderConfirmationEmail(orderData) {
    const RESEND_API_KEY = process.env.RESEND_API_KEY;
    const FROM_EMAIL = process.env.FROM_EMAIL || 'orders@fancymonkey.shop';

    if (!RESEND_API_KEY) {
        throw new Error('RESEND_API_KEY environment variable not set');
    }

    // Generate HTML email content
    const htmlContent = generateOrderConfirmationHTML(orderData);

    // Generate plain text fallback
    const textContent = generateOrderConfirmationText(orderData);

    // Prepare email payload
    const emailPayload = {
        from: FROM_EMAIL,
        to: orderData.customerEmail,
        subject: `🍌 Your Fancy Monkey Order Confirmation - ${orderData.orderId}`,
        html: htmlContent,
        text: textContent,
        headers: {
            'X-Order-ID': orderData.orderId,
            'X-Customer-Name': orderData.customerName
        }
    };

    // Send email via Resend API
    const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${RESEND_API_KEY}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(emailPayload)
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Resend API error: ${errorData.message || response.statusText}`);
    }

    return await response.json();
}

/**
 * Generate HTML email template with Fancy Monkey branding
 */
function generateOrderConfirmationHTML(data) {
    const itemsHTML = data.items.map(item => `
        <tr>
            <td style="padding: 12px 0; border-bottom: 1px solid #eee;">
                <strong>${item.name}</strong>
                ${item.size !== 'N/A' ? `<br><span style="color: #666; font-size: 14px;">Size: ${item.size}</span>` : ''}
            </td>
            <td style="padding: 12px 0; border-bottom: 1px solid #eee; text-align: center;">
                ${item.quantity}
            </td>
            <td style="padding: 12px 0; border-bottom: 1px solid #eee; text-align: right;">
                $${item.price}
            </td>
        </tr>
    `).join('');

    const shippingAddressHTML = data.shippingAddress ? `
        <div style="margin-bottom: 30px;">
            <h2 style="font-size: 18px; margin-bottom: 10px; color: #000; letter-spacing: 0.05em;">
                📦 SHIPPING ADDRESS
            </h2>
            <p style="margin: 0; line-height: 1.6; color: #333;">
                ${data.shippingAddress.line1}<br>
                ${data.shippingAddress.line2 ? `${data.shippingAddress.line2}<br>` : ''}
                ${data.shippingAddress.city}, ${data.shippingAddress.state} ${data.shippingAddress.zip}<br>
                ${data.shippingAddress.country}
            </p>
        </div>
    ` : '';

    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Order Confirmation - Fancy Monkey</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; background-color: #f5f5f5;">
    <!-- Main Container -->
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
        <tr>
            <td align="center">
                <!-- Email Content Container -->
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border: 2px solid #000; max-width: 600px;">

                    <!-- Header with Monkey Branding -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
                            <div style="font-size: 60px; margin-bottom: 10px;">🐵</div>
                            <h1 style="margin: 0; color: #fff; font-size: 32px; letter-spacing: 0.2em; font-weight: 900;">
                                FANCY MONKEY
                            </h1>
                            <p style="margin: 10px 0 0; color: #fff; font-size: 14px; letter-spacing: 0.1em; opacity: 0.95;">
                                EXCLUSIVE PEOPLE CLOTHES
                            </p>
                        </td>
                    </tr>

                    <!-- Success Banner -->
                    <tr>
                        <td style="background-color: #000; color: #fff; padding: 20px 30px; text-align: center;">
                            <div style="font-size: 24px; margin-bottom: 5px;">🎉</div>
                            <h2 style="margin: 0; font-size: 20px; letter-spacing: 0.1em; font-weight: 700;">
                                ORDER CONFIRMED!
                            </h2>
                            <p style="margin: 5px 0 0; font-size: 14px; opacity: 0.9;">
                                Thanks for being part of the monkey family!
                            </p>
                        </td>
                    </tr>

                    <!-- Main Content -->
                    <tr>
                        <td style="padding: 40px 30px;">

                            <!-- Greeting -->
                            <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #333;">
                                Hey ${data.customerName || 'there'}! 🍌
                            </p>

                            <p style="margin: 0 0 30px; font-size: 16px; line-height: 1.6; color: #333;">
                                Your order is confirmed and our monkey crew is getting it ready for shipment!
                                You'll receive tracking information within 24-48 hours.
                            </p>

                            <!-- Order Details Box -->
                            <div style="background: #f9f9f9; border: 1px solid #ddd; padding: 20px; margin-bottom: 30px; border-radius: 4px;">
                                <p style="margin: 0 0 10px; font-size: 14px; color: #666; letter-spacing: 0.05em;">
                                    ORDER NUMBER
                                </p>
                                <p style="margin: 0; font-size: 18px; font-weight: 700; color: #000; font-family: monospace;">
                                    ${data.orderId}
                                </p>
                                <p style="margin: 10px 0 0; font-size: 14px; color: #666;">
                                    ${data.orderDate}
                                </p>
                            </div>

                            <!-- Order Items -->
                            <h2 style="font-size: 18px; margin-bottom: 15px; color: #000; letter-spacing: 0.05em;">
                                🛍️ ORDER DETAILS
                            </h2>

                            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 30px;">
                                <thead>
                                    <tr>
                                        <th style="text-align: left; padding-bottom: 10px; border-bottom: 2px solid #000; font-size: 12px; letter-spacing: 0.1em; color: #666;">
                                            ITEM
                                        </th>
                                        <th style="text-align: center; padding-bottom: 10px; border-bottom: 2px solid #000; font-size: 12px; letter-spacing: 0.1em; color: #666;">
                                            QTY
                                        </th>
                                        <th style="text-align: right; padding-bottom: 10px; border-bottom: 2px solid #000; font-size: 12px; letter-spacing: 0.1em; color: #666;">
                                            PRICE
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${itemsHTML}
                                </tbody>
                            </table>

                            <!-- Order Summary -->
                            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 30px;">
                                <tr>
                                    <td style="padding: 8px 0; text-align: right; color: #666;">Subtotal:</td>
                                    <td style="padding: 8px 0 8px 20px; text-align: right; font-weight: 600;">$${data.subtotal}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 8px 0; text-align: right; color: #666;">Shipping (${data.shippingMethod}):</td>
                                    <td style="padding: 8px 0 8px 20px; text-align: right; font-weight: 600;">$${data.shipping}</td>
                                </tr>
                                ${parseFloat(data.tax) > 0 ? `
                                <tr>
                                    <td style="padding: 8px 0; text-align: right; color: #666;">Tax:</td>
                                    <td style="padding: 8px 0 8px 20px; text-align: right; font-weight: 600;">$${data.tax}</td>
                                </tr>
                                ` : ''}
                                <tr>
                                    <td style="padding: 15px 0 0; text-align: right; border-top: 2px solid #000; font-size: 18px; font-weight: 700;">
                                        TOTAL:
                                    </td>
                                    <td style="padding: 15px 0 0 20px; text-align: right; border-top: 2px solid #000; font-size: 18px; font-weight: 700;">
                                        $${data.total}
                                    </td>
                                </tr>
                            </table>

                            ${shippingAddressHTML}

                            <!-- Tracking Info -->
                            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; margin-bottom: 30px; border-radius: 4px; text-align: center;">
                                <div style="font-size: 40px; margin-bottom: 10px;">📦</div>
                                <h3 style="margin: 0 0 10px; color: #fff; font-size: 16px; letter-spacing: 0.05em;">
                                    SHIPPING TIMELINE
                                </h3>
                                <p style="margin: 0; color: #fff; font-size: 14px; line-height: 1.6; opacity: 0.95;">
                                    Processing: 1-3 business days<br>
                                    Shipping: 3-7 business days<br>
                                    <strong>You'll receive tracking info within 48 hours!</strong>
                                </p>
                            </div>

                            <!-- Customer Support -->
                            <div style="border-top: 1px solid #ddd; padding-top: 20px; text-align: center;">
                                <p style="margin: 0 0 10px; font-size: 14px; color: #666;">
                                    Need help? Our monkey support team is here!
                                </p>
                                <p style="margin: 0; font-size: 14px;">
                                    <a href="mailto:help@fancymonkey.shop" style="color: #667eea; text-decoration: none; font-weight: 600;">
                                        help@fancymonkey.shop
                                    </a>
                                </p>
                                <p style="margin: 10px 0 0; font-size: 14px;">
                                    <a href="https://instagram.com/fancymonkey" style="color: #667eea; text-decoration: none; font-weight: 600;">
                                        @fancymonkey on Instagram
                                    </a>
                                </p>
                            </div>

                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #000; color: #fff; padding: 30px; text-align: center; font-size: 12px; line-height: 1.6;">
                            <p style="margin: 0 0 10px; opacity: 0.8;">
                                © 2024 Fancy Monkey. All rights reserved.
                            </p>
                            <p style="margin: 0 0 10px; opacity: 0.8;">
                                <a href="https://fancymonkey.shop" style="color: #fff; text-decoration: none;">fancymonkey.shop</a>
                            </p>
                            <p style="margin: 0; opacity: 0.6; font-size: 11px;">
                                You're receiving this email because you made a purchase at Fancy Monkey.
                            </p>
                        </td>
                    </tr>

                </table>
            </td>
        </tr>
    </table>
</body>
</html>
    `.trim();
}

/**
 * Generate plain text fallback
 */
function generateOrderConfirmationText(data) {
    const itemsText = data.items.map(item =>
        `- ${item.name}${item.size !== 'N/A' ? ` (Size: ${item.size})` : ''} x${item.quantity} - $${item.price}`
    ).join('\n');

    const shippingText = data.shippingAddress ? `
SHIPPING ADDRESS:
${data.shippingAddress.line1}
${data.shippingAddress.line2 || ''}
${data.shippingAddress.city}, ${data.shippingAddress.state} ${data.shippingAddress.zip}
${data.shippingAddress.country}
` : '';

    return `
🍌 FANCY MONKEY - ORDER CONFIRMATION 🍌

Hey ${data.customerName || 'there'}!

Your order is confirmed and our monkey crew is getting it ready for shipment!

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ORDER NUMBER: ${data.orderId}
DATE: ${data.orderDate}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ORDER DETAILS:
${itemsText}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SUMMARY:
Subtotal: $${data.subtotal}
Shipping (${data.shippingMethod}): $${data.shipping}
${parseFloat(data.tax) > 0 ? `Tax: $${data.tax}\n` : ''}TOTAL: $${data.total}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${shippingText}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📦 SHIPPING TIMELINE:
• Processing: 1-3 business days
• Shipping: 3-7 business days
• You'll receive tracking info within 48 hours!

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

NEED HELP?
Email: help@fancymonkey.shop
Instagram: @fancymonkey

Response time: Within 24 hours

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Thanks for being part of the monkey family! 🐵

© 2024 Fancy Monkey. All rights reserved.
https://fancymonkey.shop
    `.trim();
}
