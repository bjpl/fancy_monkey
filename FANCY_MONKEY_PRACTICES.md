# Fancy Monkey - Project-Specific Practices & Implementation Guide

**Purpose:** Detailed implementation guide for how the universal agent directives apply specifically to the Fancy Monkey e-commerce platform.

**Note:** Core directives are in CLAUDE.md (auto-loaded). This file provides extended guidance for developers and detailed best practices.

---

## Table of Contents
1. [Architecture Implementation](#architecture-implementation)
2. [Brand Guidelines](#brand-guidelines)
3. [Error Handling Strategy](#error-handling-strategy)
4. [Performance Standards](#performance-standards)
5. [Security Practices](#security-practices)
6. [Testing Strategy](#testing-strategy)
7. [Deployment Procedures](#deployment-procedures)

---

## Architecture Implementation
**Implements: MANDATORY-10 (Architecture & Design)**

### Technology Decisions

#### Frontend Architecture
**Decision:** Vanilla HTML/CSS/JavaScript (no frameworks)

**Rationale:**
- Fast page load times (<2s)
- Zero build complexity for simple e-commerce
- Direct GitHub Pages deployment
- No framework dependencies to maintain
- Full control over performance optimization

**Trade-offs:**
- Manual DOM manipulation
- No built-in state management
- More verbose code

**When to reconsider:**
- Product catalog exceeds 1000 items
- Complex user interactions require state management
- Team prefers framework structure

#### Data Management
**Decision:** JSON-based product catalog

**Rationale:**
- Simple deployment
- Version control friendly
- Fast load times
- Easy content updates

**Structure:**
```json
{
  "id": "unique-id",
  "name": "Product Name",
  "price": 29.99,
  "category": "category-name",
  "images": ["url1", "url2"],
  "description": "...",
  "sizes": ["S", "M", "L", "XL"]
}
```

**Scalability:** Suitable for <1000 products. Migrate to CMS/database if catalog grows beyond this.

#### Serverless Functions
**Decision:** Vercel serverless for Stripe integration

**Rationale:**
- Secure API key storage
- No server maintenance
- Auto-scaling
- Free tier friendly

**Implementation:**
```
/fancymonkey-checkout/
  ├── api/checkout.js      # Serverless function
  ├── package.json         # Dependencies
  ├── vercel.json          # Configuration
  └── .env.example         # Template
```

### File Organization Rules

**Never save to root folder. Use these directories:**

```
fancy_monkey/
├── assets/              # Brand assets (logos, cursors, mascots)
├── images/              # Product photography
├── daily_reports/       # Development reports
├── docs/                # Documentation
├── fancymonkey-checkout/  # Serverless API code
└── tests/               # Test files (when implemented)
```

---

## Brand Guidelines
**Implements: MANDATORY-19 (User Experience)**

### Visual Identity

**Color Palette:**
- Primary: Warm oranges/yellows (banana theme)
- Secondary: Friendly browns (monkey theme)
- Accent: Playful greens
- Maintain WCAG AA contrast ratios

**Typography:**
- Headings: Playful but readable
- Body: Clean, professional sans-serif
- Always ensure legibility

**Custom Elements:**
- Banana cursor on interactive elements
- Monkey mascot illustrations
- Warm, friendly animations

### Tone & Voice

**Communication Style:**
- **Playful:** Use monkey/banana themed language
- **Professional:** Maintain e-commerce credibility
- **Friendly:** Warm, approachable, helpful

**Examples:**

| Situation | Generic Message | Fancy Monkey Version |
|-----------|----------------|---------------------|
| Loading | "Loading..." | "Monkeys are gathering your items... 🐵" |
| Error | "An error occurred" | "Oops! Our monkeys are taking a banana break! 🍌" |
| Empty cart | "Your cart is empty" | "No monkey business here yet! 🙈" |
| Success | "Order placed" | "Hooray! Your bananas are on the way! 🎉" |

### Accessibility Requirements

**Critical:** All playful elements must have accessible alternatives

- Alt text for all monkey/banana images
- Screen reader friendly error messages
- Keyboard navigation for all features
- ARIA labels on custom controls
- High contrast mode support

**Example:**
```html
<!-- Bad -->
<img src="banana.png">

<!-- Good -->
<img src="banana.png" alt="Decorative banana icon">
```

---

## Error Handling Strategy
**Implements: MANDATORY-7 (Error Handling & Resilience)**

### Core Principles

1. **Never show broken state** - Always have fallbacks
2. **On-brand messaging** - Keep errors fun but informative
3. **Multiple fallback layers** - Primary → Secondary → Manual
4. **User guidance** - Always provide next steps

### Fallback Hierarchy

#### Level 1: Primary Function
```javascript
try {
  // Attempt primary operation (e.g., Stripe checkout)
  await initiateCheckout();
} catch (error) {
  // Log for debugging
  console.error('Checkout failed:', error);
  // Move to Level 2
  showFallbackCheckout();
}
```

#### Level 2: Alternative Method
```javascript
function showFallbackCheckout() {
  // Redirect to manual order form
  window.location.href = '/checkout-fallback.html';
}
```

#### Level 3: Manual Process
- Show contact form
- Collect order details
- Email notification to admin
- User receives confirmation

#### Level 4: Support Contact
- Clear contact information
- Expected response time
- Alternative purchasing methods

### Specific Error Scenarios

**Image Loading Failure:**
```javascript
<img
  src="product.jpg"
  onerror="this.src='images/placeholder_product.svg'"
  alt="Product name"
>
```

**Network Failure:**
- Show offline message
- Cache last successful data
- Retry with exponential backoff
- Provide manual refresh option

**Stripe API Error:**
- Detect XML/API errors
- Auto-redirect to fallback page
- Manual order collection
- No lost customers

---

## Performance Standards
**Implements: MANDATORY-14 (Performance Awareness)**

### Target Metrics

| Metric | Target | Critical Threshold |
|--------|--------|-------------------|
| Page Load Time | <1.5s | 2.0s |
| First Contentful Paint | <0.8s | 1.2s |
| Time to Interactive | <1.2s | 2.0s |
| Total Bundle Size | <50KB | 100KB |

### Optimization Strategies

**Images:**
- Use WebP format with PNG/JPG fallbacks
- Compress to 80% quality
- Implement lazy loading for below-fold images
- Provide responsive image sizes

**JavaScript:**
- Minimize third-party scripts
- Defer non-critical JS
- Use native browser APIs when possible
- Code split large features

**CSS:**
- Component-based architecture
- Remove unused styles
- Minimize CSS animations
- Critical CSS inline

**Fonts:**
- System fonts where appropriate
- Subset custom fonts
- Font-display: swap
- Preload critical fonts

### Monitoring

**Tools to use:**
- Lighthouse audits (target >90 score)
- Chrome DevTools performance profiling
- WebPageTest for real-world testing
- Vercel Analytics for production monitoring

**Regular checks:**
- Run Lighthouse before each deploy
- Profile on 3G network simulation
- Test on low-end devices
- Monitor Core Web Vitals

---

## Security Practices
**Implements: MANDATORY-9 (Security & Privacy)**

### Environment Variable Management

**Required variables:**
```bash
STRIPE_SECRET_KEY=sk_live_...    # Never commit
STRIPE_PUBLIC_KEY=pk_live_...    # Safe for client
VERCEL_URL=https://...           # Auto-set by Vercel
```

**Setup:**
1. Copy `.env.example` to `.env.local`
2. Fill in actual values
3. Add `.env.local` to `.gitignore`
4. Set production values in Vercel dashboard

**Never commit:**
- `.env.local`
- `.env`
- Any file with actual API keys
- Customer data or PII

### Input Sanitization

**All user inputs must be sanitized:**
```javascript
function sanitize(input) {
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}
```

**Validate on both client and server:**
- Email format
- Phone number format
- Address fields
- Payment amounts
- Quantity limits

### Server-Side Security

**Stripe integration:**
- All price calculations server-side
- Validate product IDs against database
- Verify amounts before charging
- Use Stripe's built-in fraud detection

**API routes:**
- Rate limiting (prevent abuse)
- CORS configuration
- Authentication where needed
- Input validation at boundaries

---

## Testing Strategy
**Implements: MANDATORY-8 (Testing & Quality Assurance)**

### Test Pyramid

```
        /\
       /E2E\      <- Few, critical user flows
      /------\
     /Integration\ <- API contracts, checkout flow
    /------------\
   /  Unit Tests  \ <- Functions, utilities
  /----------------\
```

### Manual Testing Checklist

**Before each deployment:**
- [ ] Test all category filters
- [ ] Add item to cart
- [ ] Complete checkout flow (test mode)
- [ ] Verify success page
- [ ] Test fallback checkout page
- [ ] Check mobile responsiveness
- [ ] Validate accessibility (keyboard nav)
- [ ] Test on Chrome, Firefox, Safari
- [ ] Verify all images load
- [ ] Check error messages display correctly

### Automated Testing (Future)

**Unit tests:**
- Cart calculations
- Input sanitization
- Price formatting
- Category filtering logic

**Integration tests:**
- Stripe API integration
- Serverless function behavior
- Product data loading
- Image fallback system

**E2E tests:**
- Full checkout flow
- Product browsing
- Search/filter functionality
- Error recovery paths

---

## Deployment Procedures
**Implements: MANDATORY-11 (Incremental Delivery)**

### Pre-Deployment Checklist

- [ ] All tests passing
- [ ] Lighthouse score >90
- [ ] Mobile responsive verified
- [ ] Cross-browser tested (Chrome, Firefox, Safari)
- [ ] Accessibility validated
- [ ] All secrets in environment variables
- [ ] Error tracking configured
- [ ] Performance benchmarks met
- [ ] Stripe integration tested (test mode)
- [ ] Fallback systems verified
- [ ] Documentation updated
- [ ] README current

### Deployment Steps

**Frontend (GitHub Pages):**
1. Commit all changes
2. Push to main branch
3. GitHub Actions auto-deploys
4. Verify at production URL
5. Check DNS/CNAME configuration

**Backend (Vercel):**
1. Navigate to `/fancymonkey-checkout`
2. Set environment variables in Vercel dashboard
3. Deploy: `vercel deploy --prod`
4. Test serverless function
5. Verify Stripe webhook (if configured)

### Post-Deployment

**Immediate (first hour):**
- [ ] Smoke test critical paths
- [ ] Verify checkout works end-to-end
- [ ] Check error tracking (Sentry/logs)
- [ ] Monitor performance metrics
- [ ] Test from mobile device

**First 24 hours:**
- [ ] Monitor error rates
- [ ] Check performance degradation
- [ ] Verify all analytics tracking
- [ ] Review user feedback channels
- [ ] Monitor Stripe dashboard

**First week:**
- [ ] Review performance trends
- [ ] Analyze user behavior
- [ ] Check for accessibility issues
- [ ] Gather customer feedback
- [ ] Plan next iteration

### Rollback Procedure

**If critical issues occur:**
1. Identify issue severity
2. For frontend: revert git commit and push
3. For backend: `vercel rollback` to previous deployment
4. Notify stakeholders
5. Post-mortem: document what happened
6. Fix in development
7. Re-deploy with fix

---

## Development Workflow
**Implements: MANDATORY-11 (Incremental Delivery) + MANDATORY-3 (Version Control)**

### Git Workflow

**Branch strategy:**
- `main` - production-ready code
- `feature/*` - new features
- `fix/*` - bug fixes
- `docs/*` - documentation updates

**Commit message format:**
```
<type>: <description>

<optional body>

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
```

**Types:**
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation
- `style:` - Formatting
- `refactor:` - Code restructuring
- `test:` - Adding tests
- `chore:` - Maintenance

### Daily Development Cycle

1. **Morning:** Review daily report, plan tasks
2. **Development:** Incremental changes, frequent commits
3. **Testing:** Verify each change before committing
4. **Documentation:** Update as you build
5. **End of day:** Generate daily report, commit progress

---

## Monitoring & Observability
**Implements: MANDATORY-17 (Observability & Monitoring)**

### Metrics to Track

**Performance:**
- Page load time
- First Contentful Paint
- Time to Interactive
- Bundle size

**Business:**
- Conversion rate (visits → purchases)
- Cart abandonment rate
- Average order value
- Checkout completion rate

**Technical:**
- Error rate
- API response time
- Uptime percentage
- Serverless function cold starts

### Logging Strategy

**Client-side:**
```javascript
console.info('[CART] Item added:', productId);
console.warn('[IMAGE] Fallback used for:', imageUrl);
console.error('[CHECKOUT] Failed:', error);
```

**Server-side:**
```javascript
console.log('[STRIPE] Session created:', sessionId);
console.error('[PAYMENT] Failed:', { error, context });
```

**Future:** Integrate with Sentry or similar for production error tracking

---

## Support & Resources

- **Main Repository:** https://github.com/[username]/fancy_monkey
- **API Hosting:** Vercel Dashboard
- **Payment Dashboard:** Stripe Dashboard
- **Documentation:** `/docs` folder
- **Daily Reports:** `/daily_reports` folder
- **Agent Directives:** `AGENT_DIRECTIVES.md`
- **Quick Reference:** `CLAUDE.md`

---

**Version:** 1.0.0
**Last Updated:** 2025-10-07
**Project Status:** Production Ready
**Maintainer:** [Your Name]
