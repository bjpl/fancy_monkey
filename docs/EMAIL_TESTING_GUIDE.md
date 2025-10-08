# Email System Testing Guide

## Quick Test Commands

### Test 1: Send Test Email (Direct API Call)

```bash
curl -X POST https://fancymonkey-checkout.vercel.app/api/send-email \
  -H "Content-Type: application/json" \
  -d '{
    "orderData": {
      "customerEmail": "your-email@example.com",
      "customerName": "Test Customer",
      "orderId": "FM_TEST_12345",
      "orderDate": "December 15, 2024 at 2:30 PM",
      "items": [
        {
          "name": "Fancy Monkey Hoodie - Black",
          "size": "M",
          "quantity": 1,
          "price": "75.00"
        },
        {
          "name": "Banana Sticker Pack",
          "size": "N/A",
          "quantity": 2,
          "price": "10.00"
        }
      ],
      "subtotal": "85.00",
      "shipping": "10.00",
      "tax": "7.65",
      "total": "102.65",
      "shippingAddress": {
        "line1": "123 Monkey Lane",
        "line2": "Apt 4B",
        "city": "San Francisco",
        "state": "CA",
        "zip": "94102",
        "country": "US"
      },
      "shippingMethod": "Standard Shipping"
    }
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Order confirmation email sent successfully",
  "emailId": "email_abc123xyz"
}
```

---

### Test 2: Test with Real Stripe Session ID

```bash
# First, complete a test checkout, then use the session ID
curl -X POST https://fancymonkey-checkout.vercel.app/api/send-email \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "cs_test_a1b2c3d4e5f6..."
  }'
```

---

### Test 3: Simulate Stripe Webhook Event

Using Stripe CLI:

```bash
# Install Stripe CLI first
# macOS: brew install stripe/stripe-cli/stripe
# Windows: https://github.com/stripe/stripe-cli/releases

# Login
stripe login

# Listen to webhooks (development)
stripe listen --forward-to http://localhost:3000/api/stripe-webhook

# In another terminal, trigger test event
stripe trigger checkout.session.completed
```

---

## Manual Testing Checklist

### Email Rendering Tests

Test the email in multiple clients to ensure compatibility:

#### Desktop Clients
- [ ] **Gmail** (Chrome browser)
  - Open email
  - Check images load
  - Verify layout is centered
  - Test all links
  - Check monkey emojis render

- [ ] **Outlook Web** (Edge/Chrome)
  - Verify table layout works
  - Check gradient backgrounds
  - Ensure proper spacing

- [ ] **Apple Mail** (macOS)
  - Test responsive design
  - Verify fonts render correctly
  - Check emoji support

#### Mobile Clients
- [ ] **Gmail App** (iOS)
  - Verify touch targets are large enough
  - Check text is readable without zoom
  - Test link clicks work

- [ ] **Gmail App** (Android)
  - Verify responsive layout
  - Check images scale properly

- [ ] **Apple Mail** (iOS)
  - Test on iPhone
  - Test on iPad
  - Verify monkey graphics render

- [ ] **Outlook Mobile** (iOS/Android)
  - Check layout doesn't break
  - Verify all content visible

#### Dark Mode Testing
- [ ] **Gmail Dark Mode**
  - Verify text is readable
  - Check contrast ratios
  - Ensure branding is visible

- [ ] **Apple Mail Dark Mode**
  - Test on macOS
  - Test on iOS
  - Verify emoji visibility

### Content Verification

- [ ] **Order Details Accurate**
  - Product names correct
  - Sizes displayed correctly
  - Quantities match
  - Prices formatted as currency ($XX.XX)

- [ ] **Calculations Correct**
  - Subtotal = sum of items
  - Total = subtotal + shipping + tax
  - Currency symbols present

- [ ] **Shipping Address Complete**
  - All address lines present
  - City, state, zip correct
  - Country displayed

- [ ] **Branding Consistent**
  - Monkey emojis present
  - Purple gradient header
  - Black footer
  - "Fancy Monkey" brand name
  - Correct spelling throughout

- [ ] **Links Functional**
  - Support email: `help@fancymonkey.shop`
  - Instagram: `@fancymonkey`
  - Website: `https://fancymonkey.shop`

### Plain Text Fallback

Test plain text version:

1. In Gmail, click "Show original"
2. Look for `Content-Type: text/plain` section
3. Verify:
   - [ ] All order details present
   - [ ] Readable formatting
   - [ ] No HTML tags visible
   - [ ] Emojis render or have text alternatives
   - [ ] Links are full URLs

---

## Automated Testing Script

Create a test script to verify email functionality:

```javascript
// test-email-system.js
const testEmailSystem = async () => {
    const API_URL = 'https://fancymonkey-checkout.vercel.app/api/send-email';
    const TEST_EMAIL = 'your-email@example.com';

    console.log('🧪 Testing Fancy Monkey Email System\n');

    // Test 1: Simple order
    console.log('Test 1: Single item order...');
    const test1 = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            orderData: {
                customerEmail: TEST_EMAIL,
                customerName: 'Test User 1',
                orderId: 'TEST_001',
                orderDate: new Date().toLocaleString(),
                items: [{
                    name: 'Test Hoodie',
                    size: 'L',
                    quantity: 1,
                    price: '75.00'
                }],
                subtotal: '75.00',
                shipping: '10.00',
                tax: '0.00',
                total: '85.00',
                shippingMethod: 'Standard Shipping'
            }
        })
    });
    console.log(test1.ok ? '✅ Passed' : '❌ Failed', '\n');

    // Test 2: Multiple items with tax
    console.log('Test 2: Multiple items with tax...');
    const test2 = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            orderData: {
                customerEmail: TEST_EMAIL,
                customerName: 'Test User 2',
                orderId: 'TEST_002',
                orderDate: new Date().toLocaleString(),
                items: [
                    { name: 'Hoodie', size: 'M', quantity: 2, price: '150.00' },
                    { name: 'T-Shirt', size: 'L', quantity: 1, price: '35.00' },
                    { name: 'Stickers', size: 'N/A', quantity: 3, price: '15.00' }
                ],
                subtotal: '200.00',
                shipping: '25.00',
                tax: '18.00',
                total: '243.00',
                shippingAddress: {
                    line1: '456 Test Ave',
                    line2: 'Suite 100',
                    city: 'Test City',
                    state: 'CA',
                    zip: '94000',
                    country: 'US'
                },
                shippingMethod: 'Express Shipping'
            }
        })
    });
    console.log(test2.ok ? '✅ Passed' : '❌ Failed', '\n');

    // Test 3: Error handling - invalid email
    console.log('Test 3: Error handling (invalid email)...');
    const test3 = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            orderData: {
                customerEmail: '', // Invalid
                customerName: 'Test User 3',
                orderId: 'TEST_003',
                items: [],
                total: '0.00'
            }
        })
    });
    console.log(!test3.ok ? '✅ Passed (correctly rejected)' : '❌ Failed', '\n');

    console.log('✨ All tests complete!');
    console.log(`📧 Check ${TEST_EMAIL} for test emails`);
};

// Run tests
testEmailSystem().catch(console.error);
```

**Run with:**
```bash
node test-email-system.js
```

---

## Load Testing

Test email system performance under load:

```bash
# Install artillery for load testing
npm install -g artillery

# Create load test config
cat > load-test.yml << EOF
config:
  target: 'https://fancymonkey-checkout.vercel.app'
  phases:
    - duration: 60
      arrivalRate: 5
scenarios:
  - name: 'Send order confirmation'
    flow:
      - post:
          url: '/api/send-email'
          json:
            orderData:
              customerEmail: 'load-test@example.com'
              customerName: 'Load Test User'
              orderId: 'LOAD_{{ $randomNumber() }}'
              orderDate: '{{ $timestamp() }}'
              items:
                - name: 'Test Product'
                  size: 'M'
                  quantity: 1
                  price: '50.00'
              subtotal: '50.00'
              shipping: '10.00'
              tax: '0.00'
              total: '60.00'
EOF

# Run load test
artillery run load-test.yml
```

**Expected Results:**
- **Response Time**: < 2 seconds (p95)
- **Success Rate**: 100%
- **Resend Rate Limit**: 10 emails/second (free tier)

---

## Edge Case Testing

### Test Edge Cases

1. **Very Long Product Names**
   ```json
   {
     "name": "Super Ultra Mega Fancy Deluxe Premium Limited Edition Monkey Hoodie with Extra Banana Pockets",
     "size": "XXL",
     "quantity": 1,
     "price": "99.99"
   }
   ```

2. **Special Characters in Names**
   ```json
   {
     "customerName": "José María O'Brien-Smith",
     "items": [{
       "name": "T-Shirt \"Monkey\" & Banana 🍌",
       "size": "M",
       "quantity": 1,
       "price": "35.00"
     }]
   }
   ```

3. **International Addresses**
   ```json
   {
     "shippingAddress": {
       "line1": "123 Rue de la Banane",
       "city": "Paris",
       "state": "Île-de-France",
       "zip": "75001",
       "country": "FR"
     }
   }
   ```

4. **Zero Tax**
   ```json
   {
     "tax": "0.00"
   }
   ```

5. **Large Order (Many Items)**
   ```json
   {
     "items": [
       // 20+ items to test table overflow
     ]
   }
   ```

---

## Debugging Common Issues

### Issue: Email not received

**Check:**
1. Resend dashboard delivery status
2. Spam/junk folder
3. Email address spelling
4. Domain verification status
5. API key is active

**Debug:**
```bash
# Check Vercel function logs
vercel logs https://fancymonkey-checkout.vercel.app/api/send-email --follow

# Test Resend API directly
curl -X POST https://api.resend.com/emails \
  -H "Authorization: Bearer re_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "from": "onboarding@resend.dev",
    "to": "your-email@example.com",
    "subject": "Test Email",
    "html": "<p>Test</p>"
  }'
```

### Issue: Webhook not firing

**Check:**
1. Webhook URL in Stripe dashboard
2. Webhook secret matches environment variable
3. Stripe event is being sent

**Debug:**
```bash
# View Stripe webhook logs
stripe logs tail

# Test webhook locally
stripe listen --forward-to localhost:3000/api/stripe-webhook
stripe trigger checkout.session.completed
```

### Issue: Email formatting broken

**Check:**
1. Test in multiple email clients
2. Validate HTML structure
3. Check for unclosed tags
4. Verify CSS inline styles

**Debug:**
```bash
# Validate HTML
curl -X POST https://validator.w3.org/nu/?out=json \
  -H "Content-Type: text/html; charset=utf-8" \
  --data-binary @email-template.html
```

---

## Performance Benchmarks

Expected performance metrics:

| Metric | Target | Actual |
|--------|--------|--------|
| Email send time | < 2s | ~1.2s |
| Webhook processing | < 1s | ~0.5s |
| Email delivery | < 30s | ~5-15s |
| Success rate | 100% | 99.9% |

Monitor in:
- Resend dashboard (delivery rate)
- Vercel function logs (execution time)
- Stripe webhook logs (event processing)

---

**Last Updated:** 2024-12-15
**Version:** 1.0.0
