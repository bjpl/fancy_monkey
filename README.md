# Fancy Monkey - Streetwear E-commerce Platform

## 🚀 Quick Start Launch Checklist

### Pre-Launch (24 hours before)
- [ ] Verify Stripe products and SKUs are created
- [ ] Test checkout with Stripe Test Mode
- [ ] Upload product images to `/images/` folder
- [ ] Update `products.json` with correct Stripe IDs
- [ ] Verify domain DNS is pointing to GitHub Pages
- [ ] Deploy Vercel function
- [ ] Test mobile payment methods (Apple Pay/Google Pay)
- [ ] Prepare social media posts
- [ ] Triple-check inventory counts in Stripe

### Launch Day
- [ ] Switch Stripe to Live Mode
- [ ] Update Vercel env with live Stripe key
- [ ] Do final test transaction
- [ ] Post on social media
- [ ] Monitor Stripe Dashboard
- [ ] Check Vercel function logs

## 🏗️ Architecture Overview

Two-repository setup for maximum reliability and zero hosting costs:

1. **Frontend (GitHub Pages)**: `fancymonkey.shop`
   - Static HTML/CSS/JavaScript
   - Products loaded from `products.json`
   - Zero hosting cost
   - Automatic SSL

2. **Checkout API (Vercel)**: `fancymonkey-checkout.vercel.app`
   - Single serverless function
   - Real-time inventory validation
   - Stripe checkout session creation
   - Free tier: 100k requests/month

## 📦 Setup Instructions

### 1. Frontend Setup (GitHub Pages)

```bash
# Clone this repository
git clone https://github.com/yourusername/fancymonkey.git
cd fancymonkey

# Update products.json with your Stripe IDs
# Add product images to images/ folder
# Commit and push
git add .
git commit -m "Initial setup"
git push origin main

# Enable GitHub Pages in repository settings
# Source: main branch, / (root)
# Custom domain: fancymonkey.shop
```

### 2. Vercel Function Setup

```bash
cd fancymonkey-checkout

# Install dependencies
npm install

# Create .env file from example
cp .env.example .env
# Add your Stripe secret key to .env

# Test locally
npm run dev

# Deploy to Vercel
npm run deploy

# Set production environment variable in Vercel dashboard
# STRIPE_SECRET_KEY = your_live_stripe_key
```

### 3. Stripe Configuration

1. Create products in Stripe Dashboard
2. For each product, create:
   - Product with name and description
   - Prices for each size variant
   - Add SKU IDs to product metadata
3. Enable payment methods:
   - Card payments (default)
   - Apple Pay (add domain verification)
   - Google Pay (enable in settings)
4. Configure webhooks (optional):
   - payment_intent.succeeded
   - checkout.session.completed

### 4. Domain Setup

1. Add CNAME record pointing to `yourusername.github.io`
2. Wait for DNS propagation (up to 48 hours)
3. GitHub will automatically provision SSL certificate

## 📱 Mobile Payment Setup

### Apple Pay
1. Domain verification file already included in `.well-known/`
2. Register domain in Stripe Dashboard → Settings → Apple Pay

### Google Pay
1. Enable in Stripe Dashboard → Settings → Payment Methods
2. No additional configuration needed

## 🔑 Environment Variables

**Vercel Function (.env)**
```
STRIPE_SECRET_KEY=sk_test_... (test mode)
STRIPE_SECRET_KEY=sk_live_... (production)
```

## 📝 Daily Operations

### Morning (10 AM)
1. Check Stripe Dashboard for overnight orders
2. Update `products.json` if items sold out
3. Check Vercel function logs for errors
4. Respond to customer emails

### Evening (6 PM)
1. Final inventory reconciliation
2. Export day's orders from Stripe
3. Prepare shipping labels
4. Update tracking numbers

### Weekly
1. Export customer email list
2. Backup products.json
3. Review Vercel usage (should be well under free tier)
4. Plan next drop

## 🚨 Emergency Procedures

### Site Down
1. Check GitHub Pages status
2. Verify domain DNS
3. Use Stripe Payment Links as backup

### Function Timeout
1. Check Vercel logs
2. Customers will see fallback message
3. Direct customers to backup Stripe links

### Overselling Prevention
- Stripe is source of truth for inventory
- Function checks real-time before checkout
- Visual sold-out states are just UI hints

### Payment Issues
1. Check Stripe Dashboard for declines
2. Common issues:
   - Insufficient funds
   - Incorrect billing address
   - International cards (if US-only)
3. Customer service: help@fancymonkey.shop

## 📊 Monitoring

- **Stripe Dashboard**: Real-time payments and inventory
- **Vercel Dashboard**: Function logs and usage
- **GitHub Actions**: Deployment status
- **UptimeRobot**: Free uptime monitoring (optional)

## 🛠️ Maintenance Mode

If you need to pause sales:
1. Rename `index.html` to `index-live.html`
2. Rename `maintenance.html` to `index.html`
3. Push to GitHub
4. Site will show maintenance message

## 📞 Support Contacts

- **Stripe Support**: dashboard.stripe.com/support
- **Vercel Support**: vercel.com/support
- **GitHub Support**: support.github.com
- **Domain Registrar**: (your registrar's support)

## 💰 Business Metrics

Track these KPIs:
- Conversion rate (visits → purchases)
- Average order value
- Sell-through rate by product
- Customer acquisition cost
- Return rate

## 🔐 Security Notes

- Never commit `.env` files
- Use environment variables in Vercel
- Enable 2FA on all accounts
- Regularly rotate API keys
- Keep backups of products.json

## 📈 Scaling Path

When you outgrow free tier:
1. Vercel Pro: $20/month for more functions
2. Custom backend: Node.js on Railway/Render
3. Shopify: Full e-commerce platform
4. Headless commerce: Commerce.js/Snipcart

## 🎯 Launch Success Criteria

- [ ] Test purchase completes successfully
- [ ] Mobile payments work
- [ ] Success page displays correctly
- [ ] Email confirmation received
- [ ] No console errors
- [ ] Page loads under 3 seconds
- [ ] Images optimized and loading
- [ ] Fallback links tested

---

**Remember**: Keep it simple. This system prevents overselling while staying free. Focus on selling great products, not complex tech.