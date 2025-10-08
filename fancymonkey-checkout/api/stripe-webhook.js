const Stripe = require('stripe');

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2023-10-16',
});

/**
 * Serverless Function: Stripe Webhook Handler
 *
 * Handles Stripe webhook events, particularly checkout.session.completed
 * Triggers order confirmation email when payment is successful
 *
 * Environment Variables Required:
 * - STRIPE_SECRET_KEY: Stripe secret key
 * - STRIPE_WEBHOOK_SECRET: Webhook signing secret from Stripe dashboard
 * - VERCEL_URL: Automatically set by Vercel (for email API endpoint)
 */

// Raw body is needed for Stripe signature verification
module.exports = async (req, res) => {
    // Only accept POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({
            error: 'Method not allowed',
            message: 'This endpoint only accepts POST requests'
        });
    }

    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!webhookSecret) {
        console.error('STRIPE_WEBHOOK_SECRET not configured');
        return res.status(500).json({
            error: 'Webhook not configured',
            message: 'Server configuration error'
        });
    }

    let event;

    try {
        // Get the signature from headers
        const signature = req.headers['stripe-signature'];

        if (!signature) {
            console.error('No Stripe signature found in headers');
            return res.status(400).json({
                error: 'Invalid request',
                message: 'Missing Stripe signature'
            });
        }

        // Get raw body - Vercel provides this as req.body when it's a Buffer
        const rawBody = req.body;

        // Verify webhook signature
        try {
            event = stripe.webhooks.constructEvent(
                rawBody,
                signature,
                webhookSecret
            );
        } catch (signatureError) {
            console.error('Webhook signature verification failed:', signatureError.message);
            return res.status(400).json({
                error: 'Invalid signature',
                message: 'Webhook signature verification failed'
            });
        }

    } catch (error) {
        console.error('Webhook processing error:', error);
        return res.status(400).json({
            error: 'Invalid payload',
            message: 'Could not parse webhook payload'
        });
    }

    // Log event type for monitoring
    console.log('Webhook event received:', {
        type: event.type,
        id: event.id,
        created: new Date(event.created * 1000).toISOString()
    });

    // Handle different event types
    try {
        switch (event.type) {
            case 'checkout.session.completed':
                await handleCheckoutSessionCompleted(event.data.object);
                break;

            case 'checkout.session.async_payment_succeeded':
                await handleCheckoutSessionCompleted(event.data.object);
                break;

            case 'checkout.session.async_payment_failed':
                await handlePaymentFailed(event.data.object);
                break;

            case 'payment_intent.succeeded':
                console.log('Payment intent succeeded:', event.data.object.id);
                // Additional payment success handling if needed
                break;

            case 'payment_intent.payment_failed':
                console.log('Payment intent failed:', event.data.object.id);
                // Handle payment failure logging/alerting
                break;

            default:
                console.log('Unhandled event type:', event.type);
        }

        // Return success response to Stripe
        return res.status(200).json({
            received: true,
            eventType: event.type
        });

    } catch (handlerError) {
        console.error('Event handler error:', handlerError);

        // Still return 200 to Stripe to prevent retries for handler errors
        // Log the error for investigation
        return res.status(200).json({
            received: true,
            error: 'Handler error',
            message: 'Event received but handler failed'
        });
    }
};

/**
 * Handle successful checkout session completion
 * Triggers order confirmation email
 */
async function handleCheckoutSessionCompleted(session) {
    console.log('Processing completed checkout session:', session.id);

    try {
        // Verify payment was successful
        if (session.payment_status !== 'paid') {
            console.warn('Session completed but payment not marked as paid:', {
                sessionId: session.id,
                paymentStatus: session.payment_status
            });
            return;
        }

        // Call email API to send order confirmation
        const emailApiUrl = process.env.VERCEL_URL
            ? `https://${process.env.VERCEL_URL}/api/send-email`
            : 'http://localhost:3000/api/send-email';

        console.log('Sending order confirmation email via:', emailApiUrl);

        const emailResponse = await fetch(emailApiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                sessionId: session.id
            })
        });

        if (!emailResponse.ok) {
            const errorData = await emailResponse.json();
            throw new Error(`Email API error: ${errorData.message || emailResponse.statusText}`);
        }

        const emailResult = await emailResponse.json();

        console.log('Order confirmation email sent successfully:', {
            sessionId: session.id,
            emailId: emailResult.emailId,
            customerEmail: session.customer_details?.email
        });

        // Log successful order for analytics/tracking
        logOrder(session);

    } catch (error) {
        console.error('Failed to send order confirmation email:', {
            sessionId: session.id,
            error: error.message,
            stack: error.stack
        });

        // Send alert to monitoring system (implement as needed)
        await sendAlertToMonitoring({
            severity: 'high',
            message: 'Order confirmation email failed',
            sessionId: session.id,
            error: error.message
        });

        // Don't throw - we don't want to fail the webhook
        // The order is already completed, email failure shouldn't break the flow
    }
}

/**
 * Handle async payment failures
 */
async function handlePaymentFailed(session) {
    console.error('Async payment failed for session:', {
        sessionId: session.id,
        customerEmail: session.customer_details?.email
    });

    // Send alert for failed payment
    await sendAlertToMonitoring({
        severity: 'medium',
        message: 'Async payment failed',
        sessionId: session.id,
        customerEmail: session.customer_details?.email
    });

    // Optionally send email to customer about payment failure
    // (implement customer notification as needed)
}

/**
 * Log order for analytics and inventory management
 */
function logOrder(session) {
    const orderLog = {
        timestamp: new Date().toISOString(),
        sessionId: session.id,
        orderId: session.payment_intent,
        customerEmail: session.customer_details?.email,
        customerName: session.customer_details?.name,
        amount: session.amount_total / 100,
        currency: session.currency,
        paymentStatus: session.payment_status,
        shippingAddress: session.shipping_details?.address,
        metadata: session.metadata
    };

    console.log('Order logged:', orderLog);

    // In production, you would:
    // 1. Save to database
    // 2. Update inventory
    // 3. Send to analytics platform
    // 4. Trigger fulfillment workflow
}

/**
 * Send alerts to monitoring system
 * Placeholder - implement with your monitoring tool (e.g., Sentry, LogRocket, etc.)
 */
async function sendAlertToMonitoring(alert) {
    // Log to console for now
    console.error('[ALERT]', alert);

    // In production, integrate with monitoring service:
    // - Sentry
    // - LogRocket
    // - Datadog
    // - CloudWatch
    // - etc.

    // Example (pseudo-code):
    // if (process.env.SENTRY_DSN) {
    //     Sentry.captureMessage(alert.message, {
    //         level: alert.severity,
    //         extra: alert
    //     });
    // }
}

/**
 * Configuration for Vercel to handle raw body
 */
module.exports.config = {
    api: {
        bodyParser: false, // Disable body parsing, we need raw body for Stripe
    },
};
