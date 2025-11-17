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

## Installation

### Prerequisites
- Node.js 18 or higher
- GitHub account
- Vercel account
- Stripe account
- Custom domain (optional)

### Frontend Setup

Clone and configure the repository:

```bash
git clone https://github.com/bjpl/fancy_monkey.git
cd fancy_monkey
```

Update product catalog in `products.json` with Stripe product IDs. Add product images to `images/` directory.

Commit and push changes:

```bash
git add .
git commit -m "Initial setup"
git push origin main
```

Enable GitHub Pages in repository settings. Configure source as main branch, root directory. Optionally configure custom domain.

### Backend Setup

Navigate to checkout function directory:

```bash
cd fancymonkey-checkout
npm install
```

Configure environment variables:

```bash
cp .env.example .env
```

Update `.env` with Stripe secret key:

```env
STRIPE_SECRET_KEY=sk_test_your_test_key
```

Test locally:

```bash
npm run dev
```

Deploy to Vercel:

```bash
npm run deploy
```

Set production environment variable in Vercel dashboard:

```env
STRIPE_SECRET_KEY=sk_live_your_live_key
```

## Usage

### Stripe Configuration

Create products in Stripe Dashboard:

1. Create product with name and description
2. Add prices for each size variant
3. Add SKU IDs to product metadata
4. Enable payment methods (Card, Apple Pay, Google Pay)
5. Configure webhooks for payment events (optional)

### Domain Configuration

For custom domain:

1. Add CNAME record pointing to `bjpl.github.io`
2. Wait for DNS propagation
3. GitHub provisions SSL certificate automatically

### Mobile Payment Setup

Apple Pay:

1. Domain verification file is included in `.well-known/` directory
2. Register domain in Stripe Dashboard → Settings → Apple Pay

Google Pay:

1. Enable in Stripe Dashboard → Settings → Payment Methods
2. No additional configuration required

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
