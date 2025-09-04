# Fancy Monkey - Complete Deployment Guide

## 🎯 What You've Got

A bulletproof e-commerce system with:
- **Zero hosting costs** (GitHub Pages + Vercel free tier)
- **Inventory protection** (real-time Stripe validation)
- **Mobile payments** (Apple Pay/Google Pay ready)
- **Professional checkout** (Stripe's trusted UI)
- **Simple operations** (one person can run it)

## 🚦 Step-by-Step Deployment

### Step 1: Stripe Setup (30 minutes)

1. **Create Stripe Account**
   - Go to [stripe.com](https://stripe.com)
   - Complete business verification
   - Add bank account for payouts

2. **Create Products**
   ```
   Dashboard → Products → Add Product
   
   Example:
   Name: VOID HOODIE
   Price: $180.00
   
   For each size, create a price:
   - Click "Add another price"
   - Set metadata: size = "M"
   ```

3. **Get Your IDs**
   - Product ID: `prod_xxxxx`
   - Price IDs: `price_xxxxx` (one per size)
   - Copy these for products.json

4. **Configure Payments**
   - Settings → Payment methods
   - Enable: Cards, Apple Pay, Google Pay
   - Add domain for Apple Pay: `fancymonkey.shop`

### Step 2: GitHub Pages Setup (15 minutes)

1. **Create GitHub Repository**
   ```bash
   # Go to github.com
   # New repository: "fancymonkey" (or yourusername.github.io)
   # Make it public
   ```

2. **Push Frontend Code**
   ```bash
   git init
   git add .
   git commit -m "Initial Fancy Monkey site"
   git remote add origin https://github.com/yourusername/fancymonkey.git
   git push -u origin main
   ```

3. **Enable GitHub Pages**
   ```
   Repository → Settings → Pages
   Source: Deploy from branch
   Branch: main
   Folder: / (root)
   ```

4. **Add Custom Domain**
   ```
   Custom domain: fancymonkey.shop
   Enforce HTTPS: ✓
   ```

### Step 3: Vercel Function Setup (20 minutes)

1. **Create Vercel Account**
   - Sign up at [vercel.com](https://vercel.com)
   - Free tier is perfect for this

2. **Deploy Checkout Function**
   ```bash
   cd fancymonkey-checkout
   npm install
   
   # Install Vercel CLI
   npm install -g vercel
   
   # Login and deploy
   vercel login
   vercel
   
   # Follow prompts:
   # Set up and deploy? Y
   # Which scope? (your username)
   # Link to existing project? N
   # Project name? fancymonkey-checkout
   # Directory? ./
   # Override settings? N
   ```

3. **Add Environment Variable**
   ```
   Vercel Dashboard → Project → Settings → Environment Variables
   
   Add:
   Name: STRIPE_SECRET_KEY
   Value: sk_test_... (your test key)
   Environment: Production
   ```

### Step 4: Update Configuration (10 minutes)

1. **Update products.json**
   ```json
   {
     "id": "prod_xxx",  // Your Stripe product ID
     "priceId": "price_xxx",  // Your Stripe price ID
     "fallbackLink": "https://buy.stripe.com/xxx"  // Payment link backup
   }
   ```

2. **Update Frontend API URL**
   ```javascript
   // In index.html
   const CHECKOUT_API = 'https://fancymonkey-checkout.vercel.app/api/checkout';
   ```

3. **Update CORS Settings**
   ```javascript
   // In vercel.json and checkout.js
   'Access-Control-Allow-Origin': 'https://fancymonkey.shop'
   ```

### Step 5: Domain Configuration (varies)

1. **At Your Domain Registrar**
   ```
   Type: CNAME
   Name: @ (or www)
   Value: yourusername.github.io
   TTL: 1 hour
   ```

2. **Wait for Propagation**
   - Usually 1-48 hours
   - Check with: `nslookup fancymonkey.shop`

### Step 6: Testing (CRITICAL - 30 minutes)

1. **Test Mode Checklist**
   - [ ] Products load correctly
   - [ ] Size selection works
   - [ ] Checkout button responds
   - [ ] Stripe checkout opens
   - [ ] Use test card: 4242 4242 4242 4242
   - [ ] Success page shows
   - [ ] Mobile view works
   - [ ] Apple Pay appears (on Safari/iPhone)

2. **Test Edge Cases**
   - [ ] Sold out handling
   - [ ] Network timeout
   - [ ] Invalid product ID
   - [ ] Multiple tabs open

### Step 7: Go Live! 🚀

1. **Switch to Production**
   ```
   Stripe Dashboard → Toggle "Test Mode" OFF
   Vercel → Update STRIPE_SECRET_KEY to live key
   ```

2. **Final Checks**
   - [ ] Do ONE real purchase yourself
   - [ ] Verify email receipt
   - [ ] Check Stripe Dashboard
   - [ ] Monitor Vercel logs

3. **Launch**
   - Post on Instagram
   - Send email blast
   - Monitor first 30 minutes closely

## 🔥 Quick Commands Reference

```bash
# Deploy frontend changes
git add .
git commit -m "Update products"
git push

# Deploy function changes
cd fancymonkey-checkout
vercel --prod

# Check function logs
vercel logs --follow

# Switch to maintenance mode
mv index.html index-backup.html
mv maintenance.html index.html
git add . && git commit -m "Maintenance" && git push

# Restore from maintenance
mv index.html maintenance.html
mv index-backup.html index.html
git add . && git commit -m "Back online" && git push
```

## ⚡ Performance Tips

1. **Image Optimization**
   - Keep images under 200KB
   - Use JPEG for photos, PNG for graphics
   - Square format (1:1 ratio)
   - 1200x1200px recommended

2. **Drop Timing**
   - Avoid Friday 3-5 PM (high traffic)
   - Midnight drops create urgency
   - Sunday evening good for browsing

3. **Inventory Management**
   - Start with limited quantities
   - Hold back 10% for customer service
   - Track size ratios for restocks

## 🚨 Common Issues & Fixes

| Issue | Fix |
|-------|-----|
| "CORS error" | Check domain in Vercel settings matches exactly |
| "Function timeout" | Stripe API might be slow, fallback links work |
| "Images not loading" | Check /images/ folder and file names |
| "Apple Pay not showing" | Domain verification needed in Stripe |
| "Can't push to GitHub" | Check repository permissions |
| "Domain not working" | DNS can take 48 hours, use GitHub URL |

## 📱 Mobile Testing Checklist

- [ ] iPhone Safari - Apple Pay works
- [ ] Android Chrome - Google Pay works
- [ ] Buttons are tappable (44px minimum)
- [ ] Text is readable (16px minimum)
- [ ] Images load quickly
- [ ] No horizontal scroll
- [ ] Checkout completes

## 💡 Pro Tips

1. **Always Have Backups**
   - Stripe Payment Links ready
   - Maintenance page ready
   - Previous products.json saved

2. **Customer Service = Everything**
   - Respond within hours, not days
   - Be honest about delays
   - Over-communicate

3. **Start Small**
   - Test with friends first
   - Soft launch to email list
   - Full launch when confident

## 🎉 You're Ready!

Your site is:
- ✅ Professional enough for real customers
- ✅ Simple enough to maintain alone
- ✅ Safe from overselling disasters
- ✅ Free to run at small scale
- ✅ Ready to scale when needed

**Next Steps:**
1. Add your real products
2. Test everything twice
3. Launch to a small group
4. Iterate based on feedback
5. Scale gradually

---

**Questions?** The setup is intentionally simple. If something seems complex, you're probably overthinking it. Keep it minimal, focus on selling.

**Remember:** You're selling streetwear, not building complex tech. This system handles the basics perfectly. Ship great products, the rest follows.