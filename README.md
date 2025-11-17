# Fancy Monkey

A zero-cost e-commerce platform featuring GitHub Pages frontend and Vercel serverless checkout with Stripe integration and mobile payment support.

## Table of Contents
- [Overview](#overview)
- [Features](#features)
- [Installation](#installation)
- [Usage](#usage)
- [Project Structure](#project-structure)
- [Development](#development)
- [Deployment](#deployment)
- [Security](#security)
- [Monitoring](#monitoring)
- [Contributing](#contributing)
- [License](#license)

## Overview

Fancy Monkey is an e-commerce platform designed for minimal infrastructure costs. The application uses a two-repository architecture with a static frontend hosted on GitHub Pages and a serverless checkout function deployed on Vercel. Stripe integration provides payment processing with support for card payments, Apple Pay, and Google Pay, along with real-time inventory validation.

**Version:** 0.1.0
**Status:** Active Production
**Stack:** React 18, TypeScript 5.7, Vite 6.2, Supabase, Vitest

## Features

### Core Functionality
- Static HTML/CSS/JavaScript frontend hosted on GitHub Pages
- Product catalog loaded from JSON configuration
- Serverless checkout API with Stripe integration
- Real-time inventory validation
- Mobile payment support (Apple Pay and Google Pay)
- Automatic SSL with custom domain support
- Zero hosting cost for frontend, free tier serverless backend

### Technical Capabilities
- React 18 with TypeScript 5.7
- Vite 6.2 for build tooling
- Supabase integration for data management
- Vitest for testing
- Stripe payment processing
- Domain verification for mobile payments

## Project Demonstration

This project showcases a zero-cost e-commerce architecture combining static frontend hosting with serverless checkout functionality. The implementation demonstrates cost-effective infrastructure patterns, payment integration, and mobile payment support while maintaining production-grade reliability.

## Technical Overview

**Key Technologies:**
- React 18 with TypeScript 5.7
- Vite 6.2 for build tooling
- GitHub Pages for static frontend hosting
- Vercel for serverless checkout functions
- Stripe payment processing with mobile wallet support
- Supabase for data management
- Vitest for testing

**Implementation Highlights:**
- Zero-cost frontend architecture using GitHub Pages
- Serverless backend with Vercel free tier
- Stripe integration with Card, Apple Pay, and Google Pay support
- Real-time inventory validation
- Automatic SSL with custom domain support
- Two-repository architecture for separation of concerns
- Domain verification for mobile payment methods

## Exploring the Code

The project demonstrates split-architecture e-commerce:

```
fancy_monkey/
├── images/                    # Product images
├── .well-known/               # Apple Pay domain verification
├── products.json              # Product catalog
├── index.html                 # Main storefront
├── maintenance.html           # Maintenance mode page
└── fancymonkey-checkout/      # Vercel serverless function
    ├── api/                   # Checkout API endpoints
    └── package.json           # Dependencies
```

**For Technical Review:**

Those interested in the implementation details can explore:
- Static HTML/CSS/JS frontend architecture in root directory
- Serverless checkout implementation in `/fancymonkey-checkout/api`
- `products.json` for product catalog structure
- `.well-known/` directory for Apple Pay domain verification
- Stripe integration patterns and mobile wallet setup

**Local Development** _(Optional for developers)_

<details>
<summary>Click to expand setup instructions</summary>

### Prerequisites
- Node.js 18 or higher
- GitHub account for frontend hosting
- Vercel account for serverless functions
- Stripe account for payment processing
- Custom domain (optional)

### Frontend Setup

```bash
# Clone repository
git clone https://github.com/bjpl/fancy_monkey.git
cd fancy_monkey

# Update products.json with Stripe product IDs
# Add product images to images/ directory

# Enable GitHub Pages in repository settings
# Configure source as main branch, root directory
```

### Backend Setup

```bash
# Navigate to checkout function
cd fancymonkey-checkout
npm install

# Configure environment variables
cp .env.example .env
# Update .env with Stripe secret key

# Test locally
npm run dev

# Deploy to Vercel
npm run deploy
```

### Payment Configuration

1. Create products in Stripe Dashboard with prices and SKUs
2. Enable payment methods (Card, Apple Pay, Google Pay)
3. For custom domain: Add CNAME record pointing to bjpl.github.io
4. Register domain in Stripe Dashboard for Apple Pay verification

</details>

## Project Structure

```
fancy_monkey/
├── images/                    # Product images
├── .well-known/               # Apple Pay domain verification
├── products.json              # Product catalog
├── index.html                 # Main page
├── maintenance.html           # Maintenance mode page
└── fancymonkey-checkout/      # Vercel function
    ├── api/                   # Serverless functions
    ├── .env.example           # Environment template
    └── package.json           # Dependencies
```

## Development

### Testing

Run tests:

```bash
npm run test
```

### Local Development

Start development server:

```bash
npm run dev
```

## Deployment

### Production Checklist

Pre-launch (24 hours before):
- Verify Stripe products and SKUs
- Test checkout with Stripe Test Mode
- Upload product images
- Update products.json with Stripe IDs
- Verify domain DNS configuration
- Deploy Vercel function
- Test mobile payment methods
- Verify inventory counts in Stripe

Launch day:
- Switch Stripe to Live Mode
- Update Vercel environment with live Stripe key
- Perform final test transaction
- Monitor Stripe Dashboard and Vercel function logs

### Maintenance Mode

To pause sales:

1. Rename `index.html` to `index-live.html`
2. Rename `maintenance.html` to `index.html`
3. Push to GitHub

The site will display maintenance message.

## Security

Security best practices:

- Never commit `.env` files to repository
- Use environment variables in Vercel
- Enable two-factor authentication on all accounts
- Regularly rotate API keys
- Maintain backups of products.json

## Monitoring

### Platforms
- Stripe Dashboard for real-time payments and inventory
- Vercel Dashboard for function logs and usage
- GitHub Actions for deployment status
- UptimeRobot for uptime monitoring (optional)

### Key Metrics
- Conversion rate (visits to purchases)
- Average order value
- Sell-through rate by product
- Customer acquisition cost
- Return rate

## Contributing

Contributions are welcome. Please open an issue or submit a pull request.

## License

MIT License
