# Fancy Monkey

Zero-cost e-commerce platform with serverless architecture, demonstrating GitHub Pages static frontend and Vercel function integration with Stripe payments.

[![Version](https://img.shields.io/badge/version-0.1.0-blue.svg)](https://github.com/bjpl/fancy_monkey)
[![Node](https://img.shields.io/badge/Node-18.x-green.svg)](https://nodejs.org/)
[![Stripe](https://img.shields.io/badge/Stripe-14.5+-purple.svg)](https://stripe.com/)

## Live Demo

**[https://fancymonkey.shop](https://fancymonkey.shop)**

## Tech Stack

- **Frontend**: React 18, TypeScript 5.7, Vite 6.2
- **Hosting**: GitHub Pages (static frontend)
- **Backend**: Vercel serverless functions
- **Database**: Supabase
- **Payments**: Stripe Checkout API
- **Testing**: Vitest
- **Mobile Payments**: Apple Pay, Google Pay

## Technical Overview

This project demonstrates a cost-optimized e-commerce architecture using static site hosting with serverless checkout processing. The implementation separates frontend presentation from payment processing, utilizing free-tier cloud services while maintaining production-grade functionality.

**Key Technical Features:**
- Two-repository architecture (frontend + checkout API)
- Real-time inventory validation via Stripe API
- Serverless function for checkout session creation
- Mobile payment integration (Apple Pay/Google Pay)
- Custom domain with automatic SSL
- Zero hosting costs within free tier limits

## Architecture

**Frontend Repository (GitHub Pages):**
- Static HTML/CSS/JavaScript
- Product catalog loaded from JSON
- Client-side cart management
- Automatic SSL via GitHub

**Checkout API Repository (Vercel):**
- Single serverless function
- Real-time Stripe inventory validation
- Checkout session creation
- Free tier: 100k requests/month

## Exploring the Code

<details>
<summary>Click to expand</summary>

**Repository Structure:**
- Frontend served from GitHub Pages
- Separate Vercel project for checkout function
- `products.json` - Product catalog with Stripe IDs
- `images/` - Product images
- `.well-known/` - Apple Pay domain verification

**Technical Implementation:**
The platform prevents overselling through Stripe API inventory checks before checkout session creation. The serverless function validates available quantity in real-time, while the static frontend provides fast page loads and zero hosting costs.

**For Technical Review:**
The implementation showcases serverless architecture, third-party API integration (Stripe), and cost optimization strategies using free-tier cloud services.

</details>

## License

MIT License - See LICENSE file
