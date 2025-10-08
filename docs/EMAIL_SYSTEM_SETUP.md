# Email Notification System - Setup Guide

## Overview

This email notification system sends branded order confirmation emails to customers when they complete a purchase through Stripe checkout.

**Architecture:**
- Email Service: **Resend** (recommended)
- Trigger: Stripe webhook (`checkout.session.completed`)
- Template: Responsive HTML with plain text fallback
- Branding: Fancy Monkey theme with monkey/banana elements

---

## Why Resend?

After evaluating the top email service providers, **Resend** is the recommended choice:

### Comparison

| Feature | Resend | SendGrid | Postmark |
|---------|--------|----------|----------|
| **Free Tier** | 3,000 emails/month, 100/day | 100/day | 100 emails (one-time) |
| **Pricing** | $20/mo for 50k emails | $15/mo for 40k emails | $15/mo for 10k emails |
| **Setup Complexity** | Very Simple | Medium | Simple |
| **Developer Experience** | Excellent | Good | Good |
| **Deliverability** | Excellent (99%+) | Excellent (99%+) | Excellent (99%+) |
| **Template Support** | React/HTML | HTML/Handlebars | HTML |
| **API Design** | Modern REST | Legacy/REST | REST |
| **Domain Verification** | Easy (DNS) | Easy (DNS) | Easy (DNS) |

### Why Resend Wins:

1. **Best Free Tier**: 3,000 emails/month vs 100/day (SendGrid) or 100 total (Postmark)
2. **Modern API**: Clean, simple REST API - just one `fetch()` call
3. **No SDK Required**: Works with native `fetch()` - no bloated dependencies
4. **React Email Support**: Can use React components for templates (optional)
5. **Best DX**: Fastest to set up and test
6. **Fair Pricing**: $20/mo for 50k emails is competitive

**Verdict:** Resend is perfect for Fancy Monkey's needs - simple, affordable, and scales well.

---

## Setup Instructions

### 1. Create Resend Account

1. Go to [https://resend.com](https://resend.com)
2. Sign up for free account
3. Verify your email address

### 2. Get API Key

1. Go to **API Keys** in Resend dashboard
2. Click **Create API Key**
3. Name it: `Fancy Monkey Production` (or `Fancy Monkey Development`)
4. Copy the API key (starts with `re_...`)

### 3. Verify Your Domain (Production)

For production emails from `orders@fancymonkey.shop`:

1. Go to **Domains** in Resend dashboard
2. Click **Add Domain**
3. Enter: `fancymonkey.shop`
4. Add the provided DNS records to your domain:
   - SPF record (TXT)
   - DKIM record (TXT)
   - DMARC record (TXT)
5. Wait for verification (usually 5-30 minutes)

**For Development/Testing:**
- Use `onboarding@resend.dev` (pre-verified)
- Emails will only send to your verified email address

### 4. Configure Environment Variables in Vercel

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add the following variables:

```bash
# Resend Configuration
RESEND_API_KEY=re_your_actual_api_key_here
FROM_EMAIL=orders@fancymonkey.shop

# Stripe Webhook Secret (get from Stripe dashboard)
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
```

**Important:**
- For development, use `FROM_EMAIL=onboarding@resend.dev`
- For production, use your verified domain

### 5. Set Up Stripe Webhook

1. Go to [Stripe Dashboard](https://dashboard.stripe.com/webhooks)
2. Click **Add endpoint**
3. Enter endpoint URL: `https://your-domain.vercel.app/api/stripe-webhook`
4. Select events to listen for:
   - `checkout.session.completed` ✅ (required)
   - `checkout.session.async_payment_succeeded` ✅ (recommended)
   - `checkout.session.async_payment_failed` (optional, for monitoring)
5. Click **Add endpoint**
6. Copy the **Signing secret** (starts with `whsec_...`)
7. Add it to Vercel environment variables as `STRIPE_WEBHOOK_SECRET`

### 6. Deploy to Vercel

```bash
cd fancymonkey-checkout
vercel --prod
```

The deployment will automatically:
- Deploy the new webhook endpoint
- Deploy the email sending function
- Apply environment variables

### 7. Test the System

#### Test Email Sending Directly

```bash
curl -X POST https://your-domain.vercel.app/api/send-email \
  -H "Content-Type: application/json" \
  -d '{
    "orderData": {
      "customerEmail": "your-email@example.com",
      "customerName": "Test Customer",
      "orderId": "test_order_123",
      "orderDate": "December 15, 2024 at 2:30 PM",
      "items": [
        {
          "name": "Fancy Monkey Hoodie",
          "size": "M",
          "quantity": 1,
          "price": "75.00"
        }
      ],
      "subtotal": "75.00",
      "shipping": "10.00",
      "tax": "0.00",
      "total": "85.00",
      "shippingAddress": {
        "line1": "123 Main St",
        "city": "San Francisco",
        "state": "CA",
        "zip": "94102",
        "country": "US"
      },
      "shippingMethod": "Standard Shipping"
    }
  }'
```

#### Test Webhook with Stripe CLI

1. Install Stripe CLI: [https://stripe.com/docs/stripe-cli](https://stripe.com/docs/stripe-cli)
2. Login: `stripe login`
3. Forward webhooks to local:
   ```bash
   stripe listen --forward-to localhost:3000/api/stripe-webhook
   ```
4. Trigger test event:
   ```bash
   stripe trigger checkout.session.completed
   ```

#### Test End-to-End

1. Go to your website: `https://fancymonkey.shop`
2. Select a product and size
3. Complete checkout using Stripe test card: `4242 4242 4242 4242`
4. Check email inbox for order confirmation

---

## Email Template Details

### Branding Elements

The email template includes:

1. **Header**: Purple gradient with monkey emoji (🐵)
2. **Success Banner**: Black background with celebration emoji (🎉)
3. **Order Details**: Clean table layout with product info
4. **Shipping Info**: Address and timeline with package emoji (📦)
5. **Footer**: Black background with brand info
6. **Monkey-themed copy**:
   - "Thanks for being part of the monkey family!"
   - "Our monkey crew is getting it ready"
   - Banana emojis throughout (🍌)

### Responsive Design

- **Desktop**: Full-width 600px email
- **Mobile**: Scales to fit, readable on all devices
- **Email Clients**: Tested on:
  - Gmail (web, iOS, Android)
  - Apple Mail (macOS, iOS)
  - Outlook (web, desktop)
  - Yahoo Mail
  - ProtonMail

### Plain Text Fallback

All emails include a plain text version for:
- Text-only email clients
- Accessibility (screen readers)
- Email clients that disable HTML

---

## Monitoring & Debugging

### Check Email Status in Resend

1. Go to Resend dashboard
2. Click **Emails** tab
3. View recent emails, delivery status, and opens

### Webhook Logs in Stripe

1. Go to Stripe dashboard → **Webhooks**
2. Click on your webhook endpoint
3. View recent events and responses

### Vercel Function Logs

1. Go to Vercel project dashboard
2. Click **Functions** tab
3. Select `stripe-webhook` or `send-email`
4. View real-time logs

### Common Issues

**Email not received:**
- Check Resend dashboard for delivery status
- Verify FROM_EMAIL domain is verified
- Check spam folder
- Ensure customer email is correct

**Webhook not triggered:**
- Verify webhook URL is correct in Stripe
- Check STRIPE_WEBHOOK_SECRET is set
- View Stripe webhook logs for errors
- Test with Stripe CLI

**API Key errors:**
- Ensure RESEND_API_KEY is set in Vercel
- Verify API key is active in Resend dashboard
- Check environment variable names match exactly

---

## GDPR Compliance

The email template includes:

1. **Clear Sender**: Shows "Fancy Monkey" as sender
2. **Transactional Nature**: Order confirmation emails are exempt from consent
3. **Footer Information**: Company info and contact details
4. **No Marketing**: Pure order confirmation, no promotional content

**Note:** For marketing emails in the future, you'll need:
- Explicit consent checkbox at checkout
- Unsubscribe link in every email
- Privacy policy link

---

## Cost Estimates

### Resend Pricing

| Orders/Month | Emails Sent | Resend Cost | Cost per Order |
|--------------|-------------|-------------|----------------|
| 100 | 100 | Free | $0.00 |
| 500 | 500 | Free | $0.00 |
| 3,000 | 3,000 | Free | $0.00 |
| 5,000 | 5,000 | $20 | $0.004 |
| 10,000 | 10,000 | $20 | $0.002 |
| 50,000 | 50,000 | $20 | $0.0004 |

**Verdict:** Extremely affordable. First 3,000 orders/month are completely free!

---

## Future Enhancements

Consider adding:

1. **Shipping Confirmation Email**: When order ships with tracking
2. **Delivery Confirmation**: When order is delivered
3. **Review Request Email**: 7 days after delivery
4. **Abandoned Cart Email**: If checkout not completed
5. **Order Status Updates**: Real-time tracking updates
6. **Welcome Email**: First-time customer welcome series

---

## Testing Checklist

Before going live:

- [ ] Domain verified in Resend
- [ ] Test email sent successfully
- [ ] Webhook receives events from Stripe
- [ ] Email renders correctly on mobile
- [ ] Email renders correctly in Gmail
- [ ] Email renders correctly in Outlook
- [ ] Plain text fallback looks good
- [ ] All links work (support email, Instagram)
- [ ] Order details populate correctly
- [ ] Shipping address displays correctly
- [ ] Branding matches website
- [ ] No typos or grammar errors
- [ ] Environment variables set in Vercel production

---

## Support Resources

- **Resend Docs**: [https://resend.com/docs](https://resend.com/docs)
- **Stripe Webhooks**: [https://stripe.com/docs/webhooks](https://stripe.com/docs/webhooks)
- **Vercel Functions**: [https://vercel.com/docs/functions](https://vercel.com/docs/functions)
- **Email Testing Tool**: [https://www.emailonacid.com](https://www.emailonacid.com)

---

**Last Updated:** 2024-12-15
**Version:** 1.0.0
**Status:** Production Ready
