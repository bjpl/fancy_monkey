# Fancy Monkey Operations Manual

## 📅 Pre-Drop Checklist (T-minus 48 hours)

### Product Preparation
- [ ] Finalize product photography
- [ ] Write product descriptions
- [ ] Determine pricing
- [ ] Set inventory quantities in Stripe
- [ ] Create size chart if needed

### Technical Setup
- [ ] Create products in Stripe Dashboard
- [ ] Get Product IDs, Price IDs, SKU IDs
- [ ] Update products.json with new items
- [ ] Upload images to /images/ folder
- [ ] Test with Stripe Test Mode
- [ ] Verify mobile payments work

### Marketing
- [ ] Draft Instagram posts
- [ ] Prepare email announcement
- [ ] Update Instagram bio with drop time
- [ ] Create story countdown
- [ ] Alert VIP customers

## 🚀 Drop Day Operations

### T-minus 2 hours
```bash
# Final checks
1. Pull latest code
2. Verify products.json is updated
3. Test checkout with test card
4. Clear browser cache
5. Have Stripe Dashboard open
```

### T-minus 30 minutes
- Post "dropping soon" story
- Send email blast
- Final inventory count verification
- Have backup Stripe Payment Links ready

### Go Live (T-0)
1. Monitor Stripe Dashboard
2. Watch Vercel logs
3. Respond to DMs quickly
4. Post "LIVE NOW" on all channels

### First 30 minutes
- Most critical time
- Watch for payment failures
- Monitor site performance
- Update sold-out items quickly

## 📦 Post-Drop Procedures

### Immediate (within 2 hours)
```javascript
// Update sold out items in products.json
{
  "sizes": {
    "M": {
      "soldOut": true  // Set to true for sold out sizes
    }
  }
}
```

### Same Day
1. Export orders from Stripe
2. Send order confirmation emails
3. Post "thank you" message
4. Start preparing shipping

### Next Day
1. Print shipping labels
2. Package orders
3. Update customers on processing
4. Plan restock if needed

## 🎯 Customer Service Templates

### Order Confirmation
```
Subject: Order Confirmed - Fancy Monkey #[ORDER_ID]

Thanks for your order!

Order #: [ORDER_ID]
Items: [PRODUCT_NAME] - Size [SIZE]
Total: $[AMOUNT] USD

Your order is being processed and will ship within 1-3 business days.
You'll receive tracking information within 48 hours.

Questions? Reply to this email or DM @fancymonkey

Stay fresh,
Fancy Monkey Team
```

### Shipping Notification
```
Subject: Your Fancy Monkey Order Has Shipped!

Good news! Your order is on the way.

Tracking Number: [TRACKING]
Carrier: [USPS/UPS]
Estimated Delivery: [DATE]

Track your package: [TRACKING_URL]

Can't wait to see you in your new gear! Tag us @fancymonkey

- FM Team
```

### Sold Out Response
```
Hey! Unfortunately that item/size just sold out. 

We may restock - follow @fancymonkey for updates.

Check out what's still available at fancymonkey.shop

Thanks for the support!
```

### Payment Issue
```
Hi! We noticed an issue with your payment.

Common fixes:
- Check billing address matches card
- Try a different card
- Make sure shipping is to USA

Still having issues? Let us know and we'll help sort it out.

You can also try our direct checkout: [STRIPE_PAYMENT_LINK]
```

## 💳 Refund Process

### Valid Refund Reasons
- Item not as described
- Damaged in shipping
- Wrong size sent
- Never received (after investigation)

### Refund Steps
1. Verify order in Stripe Dashboard
2. Check return condition (unworn, tags attached)
3. Process refund in Stripe
4. Email customer confirmation
5. Note reason in order metadata

### Refund Template
```
Subject: Refund Processed - Order #[ORDER_ID]

Your refund has been processed.

Amount: $[AMOUNT]
Reason: [REASON]

The refund will appear on your statement in 5-10 business days.

We appreciate your understanding.

- Fancy Monkey
```

## 🔧 Troubleshooting Guide

### "Checkout not working"
1. Check Vercel function status
2. Verify Stripe API key is valid
3. Check CORS settings
4. Use fallback Stripe Payment Link

### "Can't see products"
1. Check products.json is valid JSON
2. Verify images exist in /images/
3. Check browser console for errors
4. Clear cache and reload

### "Payment declined"
- Insufficient funds
- Incorrect billing info
- Card doesn't support online payments
- International card (if US-only)

### "Site is down"
1. Check GitHub Pages status
2. Verify domain DNS
3. Check SSL certificate
4. Use direct GitHub URL as backup

## 📊 Weekly Reporting

### Sales Report
```
Week of [DATE]

Revenue: $[TOTAL]
Orders: [COUNT]
Average Order Value: $[AOV]
Top Product: [NAME]
Return Rate: [X]%

Notes:
- [Observations]
- [Issues]
- [Opportunities]
```

### Inventory Status
```
Current Stock:

[PRODUCT_NAME]
- S: [QTY]
- M: [QTY]
- L: [QTY]
- XL: [QTY]

Reorder needed:
- [Items below threshold]
```

## 🔄 Restock Procedures

1. Analyze sell-through rate
2. Check customer demand (DMs, emails)
3. Calculate reorder quantity
4. Update Stripe inventory
5. Announce restock date
6. Update products.json

## 📱 Social Media SOPs

### Post-Drop
- Thank you post
- Customer photos repost
- Behind-the-scenes content
- Next drop teaser

### Engagement
- Respond to DMs within 24 hours
- Like customer photos
- Share to story
- Build hype for next drop

## 🚨 Crisis Management

### Major Outage
1. Post on Instagram immediately
2. Switch to Stripe Payment Links
3. Email customers about issue
4. Extend drop if needed

### Overselling
1. Contact affected customers immediately
2. Offer full refund
3. Provide discount for next drop
4. Apologize sincerely

### Shipping Delays
1. Email affected customers
2. Provide updated timeline
3. Offer discount code
4. Track resolution

## 📈 Growth Tactics

### Build Email List
- Offer 10% off first order
- Create exclusive early access
- Send drops to email first

### Increase AOV
- Bundle deals
- Free shipping over $150
- Limited edition items

### Customer Retention
- VIP early access
- Loyalty rewards
- Exclusive colorways
- Personal thank you notes

## 🔑 Access Checklist

Ensure you have access to:
- [ ] Stripe Dashboard (with 2FA)
- [ ] GitHub repository
- [ ] Vercel account
- [ ] Domain registrar
- [ ] Email service
- [ ] Instagram account
- [ ] Password manager

## 📞 Emergency Contacts

Keep these readily available:
- Stripe Support: [Phone/Email]
- Domain Support: [Registrar info]
- Developer/Tech: [Contact info]
- Fulfillment: [Shipping partner]
- Legal: [If applicable]

---

**Golden Rule**: Customer experience is everything. Fast responses, honest communication, and quality products build the brand.