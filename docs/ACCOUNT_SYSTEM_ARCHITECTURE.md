# Fancy Monkey Customer Account System - Architecture Design

**Project:** Fancy Monkey E-Commerce
**Document Version:** 1.0.0
**Date:** 2025-10-07
**Status:** Design Phase - Awaiting Implementation Approval

---

## Table of Contents
1. [Authentication Approach Recommendation](#authentication-approach-recommendation)
2. [Database Architecture](#database-architecture)
3. [API Endpoint Specifications](#api-endpoint-specifications)
4. [UI Wireframe Descriptions](#ui-wireframe-descriptions)
5. [Security Architecture](#security-architecture)
6. [Implementation Roadmap](#implementation-roadmap)
7. [Technical Constraints & Considerations](#technical-constraints--considerations)

---

## 1. Authentication Approach Recommendation

### RECOMMENDED: Passwordless (Magic Link) Authentication

**Choice:** Magic link email authentication with optional social OAuth
**Priority:** Magic link primary, OAuth as secondary convenience option

### Comparative Analysis

| Approach | Pros | Cons | Fancy Monkey Fit |
|----------|------|------|-----------------|
| **Magic Link** (RECOMMENDED) | ✅ No password management<br>✅ Excellent UX (1-click)<br>✅ Secure by default<br>✅ Low maintenance<br>✅ Mobile-friendly<br>✅ Free tier available | ⚠️ Requires email delivery<br>⚠️ Slightly slower first login | ⭐ BEST - Aligns with minimal aesthetic, modern UX, low maintenance |
| **OAuth** (GitHub, Google) | ✅ Very fast login<br>✅ No credentials to manage<br>✅ High trust | ⚠️ Requires external accounts<br>⚠️ Multiple providers = complexity<br>⚠️ Privacy concerns for some users | ⭐ GOOD - As secondary option only |
| **Traditional** (Email/Password) | ✅ Familiar to users<br>✅ Works offline | ❌ Password reset flows<br>❌ Security liability<br>❌ Poor UX (forgotten passwords)<br>❌ More code to maintain | ❌ NOT RECOMMENDED |

### Final Recommendation: Hybrid Passwordless + OAuth

**Primary Flow:** Magic Link (email-based)
- User enters email → Receives instant magic link → Clicks link → Logged in
- Link expires in 15 minutes
- Branded email with playful monkey theme

**Secondary Flow:** OAuth (Google only)
- Simple "Continue with Google" button
- Reduces options = reduces complexity
- Google chosen because: universal, trusted, best mobile integration

**Rationale for Fancy Monkey:**
1. **Brand Alignment:** Clean, minimal, modern (like the site aesthetic)
2. **UX Excellence:** Reduces friction - critical for e-commerce conversion
3. **Security:** No password database = no password breaches
4. **Mobile-First:** Magic links work perfectly on mobile (tap link in email → auto-login)
5. **Cost:** Free tier on most auth providers (Auth0, Supabase, Firebase)
6. **Maintenance:** Minimal code, no password reset flows

### Authentication Provider Recommendation

**Choice:** Supabase Auth (with custom SMTP for magic links)

**Why Supabase:**
- ✅ Free tier: 50,000 monthly active users
- ✅ Built-in magic link support
- ✅ Built-in OAuth (Google, GitHub, etc.)
- ✅ PostgreSQL database included
- ✅ Serverless functions support
- ✅ Row-level security (RLS) for data protection
- ✅ Excellent documentation
- ✅ Works perfectly with Vercel deployment

**Alternative:** Firebase Auth
- Good option, but slightly more complex setup
- Better for Google ecosystem heavy users
- Consider if you prefer Firebase Firestore over PostgreSQL

---

## 2. Database Architecture

### Database Choice: Supabase (PostgreSQL)

**Rationale:**
1. **Free Tier:** 500MB database, 50,000 monthly active users
2. **PostgreSQL:** Robust, relational, handles complex queries
3. **Real-time:** Built-in subscriptions for order status updates
4. **Edge Functions:** Serverless compute included
5. **Vercel Integration:** Seamless deployment
6. **Row-Level Security:** Fine-grained access control

**Alternative Considered:**
- **Vercel Postgres:** Good, but more expensive at scale
- **Firebase Firestore:** NoSQL, less ideal for relational order data
- **PlanetScale:** Excellent, but overkill for current scale

### Complete Database Schema (PostgreSQL)

```sql
-- ============================================
-- USERS TABLE
-- ============================================
CREATE TABLE users (
  -- Primary identification
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,

  -- Profile information
  full_name VARCHAR(255),
  phone VARCHAR(20),

  -- Preferences
  email_marketing_consent BOOLEAN DEFAULT false,
  sms_marketing_consent BOOLEAN DEFAULT false,
  preferred_currency VARCHAR(3) DEFAULT 'USD',

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login_at TIMESTAMP WITH TIME ZONE,

  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,

  -- Indexes
  CONSTRAINT valid_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$')
);

-- Indexes for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_created_at ON users(created_at DESC);

-- ============================================
-- ADDRESSES TABLE
-- ============================================
CREATE TABLE addresses (
  -- Primary identification
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Address details
  address_type VARCHAR(20) NOT NULL CHECK (address_type IN ('shipping', 'billing', 'both')),
  is_default BOOLEAN DEFAULT false,

  -- Name and contact
  recipient_name VARCHAR(255) NOT NULL,
  phone VARCHAR(20),

  -- Address fields
  address_line1 VARCHAR(255) NOT NULL,
  address_line2 VARCHAR(255),
  city VARCHAR(100) NOT NULL,
  state VARCHAR(100) NOT NULL,
  postal_code VARCHAR(20) NOT NULL,
  country VARCHAR(2) DEFAULT 'US', -- ISO country code

  -- Delivery instructions
  delivery_notes TEXT,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_used_at TIMESTAMP WITH TIME ZONE
);

-- Indexes
CREATE INDEX idx_addresses_user_id ON addresses(user_id);
CREATE INDEX idx_addresses_is_default ON addresses(user_id, is_default) WHERE is_default = true;

-- Ensure only one default address per type per user
CREATE UNIQUE INDEX idx_one_default_shipping
  ON addresses(user_id)
  WHERE is_default = true AND address_type IN ('shipping', 'both');

-- ============================================
-- ORDERS TABLE
-- ============================================
CREATE TABLE orders (
  -- Primary identification
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,

  -- Order identifiers
  order_number VARCHAR(50) UNIQUE NOT NULL, -- e.g., FM-2024-001234
  stripe_checkout_session_id VARCHAR(255) UNIQUE,
  stripe_payment_intent_id VARCHAR(255),

  -- Order totals (in cents)
  subtotal_cents INTEGER NOT NULL,
  shipping_cents INTEGER NOT NULL,
  tax_cents INTEGER DEFAULT 0,
  discount_cents INTEGER DEFAULT 0,
  total_cents INTEGER NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',

  -- Order status
  status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (
    status IN (
      'pending',           -- Checkout session created, awaiting payment
      'paid',              -- Payment successful
      'processing',        -- Order being prepared
      'shipped',           -- Order shipped
      'delivered',         -- Order delivered
      'cancelled',         -- Order cancelled
      'refunded',          -- Order refunded
      'failed'             -- Payment failed
    )
  ),
  fulfillment_status VARCHAR(50) DEFAULT 'unfulfilled' CHECK (
    fulfillment_status IN ('unfulfilled', 'partial', 'fulfilled')
  ),

  -- Shipping information
  shipping_address_id UUID REFERENCES addresses(id),
  billing_address_id UUID REFERENCES addresses(id),
  shipping_method VARCHAR(100),
  tracking_number VARCHAR(255),
  tracking_url TEXT,
  carrier VARCHAR(50),

  -- Dates
  ordered_at TIMESTAMP WITH TIME ZONE,
  paid_at TIMESTAMP WITH TIME ZONE,
  shipped_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  cancelled_at TIMESTAMP WITH TIME ZONE,

  -- Customer notes
  customer_notes TEXT,
  internal_notes TEXT, -- Admin use only

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Metadata for flexibility
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Indexes
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_order_number ON orders(order_number);
CREATE INDEX idx_orders_stripe_session ON orders(stripe_checkout_session_id);
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);

-- Auto-generate order number function
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS VARCHAR(50) AS $$
DECLARE
  new_number VARCHAR(50);
  year_part VARCHAR(4);
  sequence_part INTEGER;
BEGIN
  year_part := TO_CHAR(NOW(), 'YYYY');

  -- Get next sequence number for this year
  SELECT COALESCE(MAX(
    CAST(SUBSTRING(order_number FROM 9) AS INTEGER)
  ), 0) + 1
  INTO sequence_part
  FROM orders
  WHERE order_number LIKE 'FM-' || year_part || '-%';

  new_number := 'FM-' || year_part || '-' || LPAD(sequence_part::TEXT, 6, '0');
  RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-set order number
CREATE OR REPLACE FUNCTION set_order_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.order_number IS NULL THEN
    NEW.order_number := generate_order_number();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_order_number
  BEFORE INSERT ON orders
  FOR EACH ROW
  EXECUTE FUNCTION set_order_number();

-- ============================================
-- ORDER_ITEMS TABLE
-- ============================================
CREATE TABLE order_items (
  -- Primary identification
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,

  -- Product information (snapshot at time of order)
  product_id VARCHAR(100) NOT NULL, -- e.g., prod_hoodie_001
  product_name VARCHAR(255) NOT NULL,
  product_category VARCHAR(50),

  -- SKU details
  sku_id VARCHAR(100) NOT NULL,
  size VARCHAR(50),

  -- Stripe identifiers
  stripe_price_id VARCHAR(255),

  -- Pricing (in cents, snapshot at order time)
  unit_price_cents INTEGER NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  total_price_cents INTEGER NOT NULL,

  -- Product snapshot (for historical reference)
  product_snapshot JSONB, -- Full product details at time of order

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_order_items_product_id ON order_items(product_id);

-- ============================================
-- SAVED_PAYMENT_METHODS TABLE
-- ============================================
CREATE TABLE saved_payment_methods (
  -- Primary identification
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Stripe payment method details
  stripe_payment_method_id VARCHAR(255) UNIQUE NOT NULL,
  stripe_customer_id VARCHAR(255) NOT NULL,

  -- Card details (stored by Stripe, we only store metadata)
  card_brand VARCHAR(50), -- visa, mastercard, amex, etc.
  card_last4 VARCHAR(4),
  card_exp_month INTEGER,
  card_exp_year INTEGER,

  -- Preferences
  is_default BOOLEAN DEFAULT false,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_used_at TIMESTAMP WITH TIME ZONE
);

-- Indexes
CREATE INDEX idx_payment_methods_user_id ON saved_payment_methods(user_id);
CREATE INDEX idx_payment_methods_stripe_customer ON saved_payment_methods(stripe_customer_id);

-- Ensure only one default payment method per user
CREATE UNIQUE INDEX idx_one_default_payment
  ON saved_payment_methods(user_id)
  WHERE is_default = true;

-- ============================================
-- WISHLIST TABLE
-- ============================================
CREATE TABLE wishlist_items (
  -- Primary identification
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Product reference
  product_id VARCHAR(100) NOT NULL,
  preferred_size VARCHAR(50),

  -- Notifications
  notify_on_restock BOOLEAN DEFAULT false,
  notify_on_sale BOOLEAN DEFAULT false,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_wishlist_user_id ON wishlist_items(user_id);
CREATE UNIQUE INDEX idx_wishlist_unique_item ON wishlist_items(user_id, product_id);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE wishlist_items ENABLE ROW LEVEL SECURITY;

-- Users: Can only read/update their own data
CREATE POLICY users_select_own ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY users_update_own ON users
  FOR UPDATE USING (auth.uid() = id);

-- Addresses: Users can only access their own addresses
CREATE POLICY addresses_all_own ON addresses
  FOR ALL USING (auth.uid() = user_id);

-- Orders: Users can only read their own orders
CREATE POLICY orders_select_own ON orders
  FOR SELECT USING (auth.uid() = user_id);

-- Order items: Users can read items from their orders
CREATE POLICY order_items_select_own ON order_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
      AND orders.user_id = auth.uid()
    )
  );

-- Payment methods: Users can only access their own
CREATE POLICY payment_methods_all_own ON saved_payment_methods
  FOR ALL USING (auth.uid() = user_id);

-- Wishlist: Users can only access their own
CREATE POLICY wishlist_all_own ON wishlist_items
  FOR ALL USING (auth.uid() = user_id);

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Update updated_at timestamp automatically
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_addresses_updated_at
  BEFORE UPDATE ON addresses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_wishlist_updated_at
  BEFORE UPDATE ON wishlist_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to calculate order totals
CREATE OR REPLACE FUNCTION calculate_order_total(order_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
  item_total INTEGER;
  ship_cost INTEGER;
  tax_amount INTEGER;
  discount_amount INTEGER;
BEGIN
  SELECT
    COALESCE(SUM(total_price_cents), 0),
    shipping_cents,
    tax_cents,
    discount_cents
  INTO
    item_total,
    ship_cost,
    tax_amount,
    discount_amount
  FROM order_items
  JOIN orders ON orders.id = order_items.order_id
  WHERE order_id = order_uuid
  GROUP BY shipping_cents, tax_cents, discount_cents;

  RETURN item_total + ship_cost + tax_amount - discount_amount;
END;
$$ LANGUAGE plpgsql;
```

### Database Schema (JSON Format for Documentation)

```json
{
  "users": {
    "description": "Customer accounts and profiles",
    "fields": {
      "id": "UUID (primary key)",
      "email": "VARCHAR(255) UNIQUE NOT NULL",
      "full_name": "VARCHAR(255)",
      "phone": "VARCHAR(20)",
      "email_marketing_consent": "BOOLEAN",
      "sms_marketing_consent": "BOOLEAN",
      "preferred_currency": "VARCHAR(3)",
      "created_at": "TIMESTAMP",
      "updated_at": "TIMESTAMP",
      "last_login_at": "TIMESTAMP",
      "metadata": "JSONB"
    },
    "relationships": {
      "addresses": "one-to-many",
      "orders": "one-to-many",
      "saved_payment_methods": "one-to-many",
      "wishlist_items": "one-to-many"
    }
  },
  "addresses": {
    "description": "Shipping and billing addresses",
    "fields": {
      "id": "UUID (primary key)",
      "user_id": "UUID (foreign key -> users.id)",
      "address_type": "VARCHAR(20) CHECK (shipping|billing|both)",
      "is_default": "BOOLEAN",
      "recipient_name": "VARCHAR(255)",
      "phone": "VARCHAR(20)",
      "address_line1": "VARCHAR(255)",
      "address_line2": "VARCHAR(255)",
      "city": "VARCHAR(100)",
      "state": "VARCHAR(100)",
      "postal_code": "VARCHAR(20)",
      "country": "VARCHAR(2) DEFAULT 'US'",
      "delivery_notes": "TEXT",
      "created_at": "TIMESTAMP",
      "updated_at": "TIMESTAMP",
      "last_used_at": "TIMESTAMP"
    },
    "constraints": {
      "unique_default": "Only one default address per type per user"
    }
  },
  "orders": {
    "description": "Customer order records linked to Stripe",
    "fields": {
      "id": "UUID (primary key)",
      "user_id": "UUID (foreign key -> users.id)",
      "order_number": "VARCHAR(50) UNIQUE (FM-YYYY-NNNNNN)",
      "stripe_checkout_session_id": "VARCHAR(255) UNIQUE",
      "stripe_payment_intent_id": "VARCHAR(255)",
      "subtotal_cents": "INTEGER",
      "shipping_cents": "INTEGER",
      "tax_cents": "INTEGER",
      "discount_cents": "INTEGER",
      "total_cents": "INTEGER",
      "currency": "VARCHAR(3) DEFAULT 'USD'",
      "status": "VARCHAR(50) CHECK (pending|paid|processing|shipped|delivered|cancelled|refunded|failed)",
      "fulfillment_status": "VARCHAR(50) CHECK (unfulfilled|partial|fulfilled)",
      "shipping_address_id": "UUID (foreign key -> addresses.id)",
      "billing_address_id": "UUID (foreign key -> addresses.id)",
      "shipping_method": "VARCHAR(100)",
      "tracking_number": "VARCHAR(255)",
      "tracking_url": "TEXT",
      "carrier": "VARCHAR(50)",
      "ordered_at": "TIMESTAMP",
      "paid_at": "TIMESTAMP",
      "shipped_at": "TIMESTAMP",
      "delivered_at": "TIMESTAMP",
      "cancelled_at": "TIMESTAMP",
      "customer_notes": "TEXT",
      "internal_notes": "TEXT",
      "created_at": "TIMESTAMP",
      "updated_at": "TIMESTAMP",
      "metadata": "JSONB"
    }
  },
  "order_items": {
    "description": "Individual items within orders (product snapshot)",
    "fields": {
      "id": "UUID (primary key)",
      "order_id": "UUID (foreign key -> orders.id)",
      "product_id": "VARCHAR(100)",
      "product_name": "VARCHAR(255)",
      "product_category": "VARCHAR(50)",
      "sku_id": "VARCHAR(100)",
      "size": "VARCHAR(50)",
      "stripe_price_id": "VARCHAR(255)",
      "unit_price_cents": "INTEGER",
      "quantity": "INTEGER",
      "total_price_cents": "INTEGER",
      "product_snapshot": "JSONB (full product data at order time)",
      "created_at": "TIMESTAMP"
    }
  },
  "saved_payment_methods": {
    "description": "Stripe payment methods (cards stored by Stripe)",
    "fields": {
      "id": "UUID (primary key)",
      "user_id": "UUID (foreign key -> users.id)",
      "stripe_payment_method_id": "VARCHAR(255) UNIQUE",
      "stripe_customer_id": "VARCHAR(255)",
      "card_brand": "VARCHAR(50)",
      "card_last4": "VARCHAR(4)",
      "card_exp_month": "INTEGER",
      "card_exp_year": "INTEGER",
      "is_default": "BOOLEAN",
      "created_at": "TIMESTAMP",
      "last_used_at": "TIMESTAMP"
    },
    "security": "Card details stored by Stripe, not in our database"
  },
  "wishlist_items": {
    "description": "User wishlists with notification preferences",
    "fields": {
      "id": "UUID (primary key)",
      "user_id": "UUID (foreign key -> users.id)",
      "product_id": "VARCHAR(100)",
      "preferred_size": "VARCHAR(50)",
      "notify_on_restock": "BOOLEAN",
      "notify_on_sale": "BOOLEAN",
      "created_at": "TIMESTAMP",
      "updated_at": "TIMESTAMP"
    }
  }
}
```

---

## 3. API Endpoint Specifications

### Authentication Endpoints

#### POST /api/auth/magic-link
**Purpose:** Send magic link email for passwordless login

**Request:**
```json
{
  "email": "user@example.com",
  "redirectTo": "/account" // Optional callback URL
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "🍌 Check your email! A magic banana link is on its way!",
  "expiresIn": 900 // 15 minutes in seconds
}
```

**Response (429 - Rate Limited):**
```json
{
  "error": "Too many monkeys sending emails! Wait a minute and try again.",
  "retryAfter": 60
}
```

**Implementation Notes:**
- Rate limit: 3 requests per email per 5 minutes
- Email template: Branded Fancy Monkey theme
- Link expires in 15 minutes
- Use Supabase Auth or custom JWT tokens

---

#### POST /api/auth/verify-magic-link
**Purpose:** Verify magic link token and create session

**Request:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response (200):**
```json
{
  "success": true,
  "user": {
    "id": "uuid-here",
    "email": "user@example.com",
    "full_name": "Jane Doe"
  },
  "session": {
    "access_token": "jwt-token-here",
    "refresh_token": "refresh-token-here",
    "expires_in": 3600
  }
}
```

**Response (401):**
```json
{
  "error": "That banana link expired! Request a fresh one.",
  "code": "LINK_EXPIRED"
}
```

---

#### POST /api/auth/oauth/google
**Purpose:** Initiate Google OAuth flow

**Request:**
```json
{
  "redirectTo": "/account"
}
```

**Response (200):**
```json
{
  "authUrl": "https://accounts.google.com/o/oauth2/v2/auth?..."
}
```

---

#### POST /api/auth/logout
**Purpose:** End user session

**Headers:**
```
Authorization: Bearer {access_token}
```

**Response (200):**
```json
{
  "success": true,
  "message": "🙈 You've swung out! Come back soon!"
}
```

---

### User Profile Endpoints

#### GET /api/user/profile
**Purpose:** Fetch current user profile

**Headers:**
```
Authorization: Bearer {access_token}
```

**Response (200):**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "full_name": "Jane Doe",
  "phone": "+1234567890",
  "email_marketing_consent": true,
  "sms_marketing_consent": false,
  "created_at": "2024-01-15T10:30:00Z",
  "last_login_at": "2024-10-07T14:22:00Z"
}
```

---

#### PATCH /api/user/profile
**Purpose:** Update user profile

**Headers:**
```
Authorization: Bearer {access_token}
```

**Request:**
```json
{
  "full_name": "Jane Doe",
  "phone": "+1234567890",
  "email_marketing_consent": true
}
```

**Response (200):**
```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "full_name": "Jane Doe",
    "phone": "+1234567890",
    "email_marketing_consent": true,
    "updated_at": "2024-10-07T14:25:00Z"
  }
}
```

**Validation:**
- Phone: E.164 format (optional)
- Full name: 2-255 characters
- Email marketing consent: boolean

---

### Address Endpoints

#### GET /api/user/addresses
**Purpose:** List all user addresses

**Headers:**
```
Authorization: Bearer {access_token}
```

**Response (200):**
```json
{
  "addresses": [
    {
      "id": "uuid",
      "address_type": "both",
      "is_default": true,
      "recipient_name": "Jane Doe",
      "phone": "+1234567890",
      "address_line1": "123 Banana Street",
      "address_line2": "Apt 4B",
      "city": "New York",
      "state": "NY",
      "postal_code": "10001",
      "country": "US",
      "delivery_notes": "Leave at door",
      "created_at": "2024-01-15T10:30:00Z",
      "last_used_at": "2024-09-20T16:45:00Z"
    }
  ],
  "count": 1
}
```

---

#### POST /api/user/addresses
**Purpose:** Add new address

**Headers:**
```
Authorization: Bearer {access_token}
```

**Request:**
```json
{
  "address_type": "shipping",
  "is_default": true,
  "recipient_name": "Jane Doe",
  "phone": "+1234567890",
  "address_line1": "123 Banana Street",
  "address_line2": "Apt 4B",
  "city": "New York",
  "state": "NY",
  "postal_code": "10001",
  "country": "US",
  "delivery_notes": "Leave at door"
}
```

**Response (201):**
```json
{
  "success": true,
  "address": {
    "id": "new-uuid",
    "address_type": "shipping",
    "is_default": true,
    "recipient_name": "Jane Doe",
    // ... all fields ...
    "created_at": "2024-10-07T14:30:00Z"
  }
}
```

**Validation:**
- US addresses only (initially)
- Required: recipient_name, address_line1, city, state, postal_code
- Auto-validate postal code for state
- If is_default=true, unset other defaults

---

#### PATCH /api/user/addresses/:id
**Purpose:** Update existing address

**Headers:**
```
Authorization: Bearer {access_token}
```

**Request:** Same as POST (partial updates allowed)

**Response (200):**
```json
{
  "success": true,
  "address": { /* updated address */ }
}
```

---

#### DELETE /api/user/addresses/:id
**Purpose:** Delete address

**Headers:**
```
Authorization: Bearer {access_token}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Address removed from the jungle! 🙈"
}
```

**Validation:**
- Cannot delete address if used in pending/recent orders
- If deleting default, auto-promote another address

---

### Order History Endpoints

#### GET /api/user/orders
**Purpose:** List user order history

**Headers:**
```
Authorization: Bearer {access_token}
```

**Query Parameters:**
- `limit` (default: 20, max: 100)
- `offset` (default: 0)
- `status` (optional filter: paid, shipped, delivered, etc.)

**Response (200):**
```json
{
  "orders": [
    {
      "id": "uuid",
      "order_number": "FM-2024-000123",
      "status": "shipped",
      "fulfillment_status": "fulfilled",
      "total_cents": 6800,
      "currency": "USD",
      "ordered_at": "2024-09-20T16:30:00Z",
      "paid_at": "2024-09-20T16:31:00Z",
      "shipped_at": "2024-09-22T10:15:00Z",
      "estimated_delivery": "2024-09-27",
      "tracking_number": "1Z999AA10123456784",
      "tracking_url": "https://ups.com/track?...",
      "carrier": "UPS",
      "items": [
        {
          "product_id": "prod_hoodie_001",
          "product_name": "MIDNIGHT EMERALD HOODIE",
          "size": "M",
          "quantity": 1,
          "unit_price_cents": 5800,
          "total_price_cents": 5800,
          "image": "images/black_hoodie_green_1.png"
        }
      ],
      "shipping_address": {
        "recipient_name": "Jane Doe",
        "address_line1": "123 Banana Street",
        "city": "New York",
        "state": "NY",
        "postal_code": "10001"
      }
    }
  ],
  "pagination": {
    "total": 5,
    "limit": 20,
    "offset": 0,
    "has_more": false
  }
}
```

---

#### GET /api/user/orders/:orderNumber
**Purpose:** Get specific order details

**Headers:**
```
Authorization: Bearer {access_token}
```

**Response (200):**
```json
{
  "order": {
    "id": "uuid",
    "order_number": "FM-2024-000123",
    "status": "shipped",
    "fulfillment_status": "fulfilled",
    "subtotal_cents": 5800,
    "shipping_cents": 1000,
    "tax_cents": 0,
    "discount_cents": 0,
    "total_cents": 6800,
    "currency": "USD",
    "shipping_method": "Standard Shipping",
    "ordered_at": "2024-09-20T16:30:00Z",
    "paid_at": "2024-09-20T16:31:00Z",
    "shipped_at": "2024-09-22T10:15:00Z",
    "tracking_number": "1Z999AA10123456784",
    "tracking_url": "https://ups.com/track?...",
    "carrier": "UPS",
    "customer_notes": "Please leave at door",
    "items": [
      {
        "id": "item-uuid",
        "product_id": "prod_hoodie_001",
        "product_name": "MIDNIGHT EMERALD HOODIE",
        "product_category": "hoodies",
        "sku_id": "sku_midnight_emerald_m",
        "size": "M",
        "quantity": 1,
        "unit_price_cents": 5800,
        "total_price_cents": 5800,
        "product_snapshot": { /* full product data */ }
      }
    ],
    "shipping_address": {
      "recipient_name": "Jane Doe",
      "phone": "+1234567890",
      "address_line1": "123 Banana Street",
      "address_line2": "Apt 4B",
      "city": "New York",
      "state": "NY",
      "postal_code": "10001",
      "country": "US"
    },
    "billing_address": { /* same structure */ },
    "timeline": [
      {
        "status": "pending",
        "timestamp": "2024-09-20T16:30:00Z",
        "message": "Order placed"
      },
      {
        "status": "paid",
        "timestamp": "2024-09-20T16:31:00Z",
        "message": "Payment successful"
      },
      {
        "status": "processing",
        "timestamp": "2024-09-21T09:00:00Z",
        "message": "Order being prepared"
      },
      {
        "status": "shipped",
        "timestamp": "2024-09-22T10:15:00Z",
        "message": "Order shipped via UPS"
      }
    ]
  }
}
```

---

### Checkout Integration Endpoints

#### POST /api/checkout (ENHANCED)
**Purpose:** Create Stripe checkout session (existing endpoint enhanced)

**Headers:**
```
Authorization: Bearer {access_token} // Optional - if logged in
```

**Request:**
```json
{
  "productId": "prod_hoodie_001",
  "skuId": "sku_midnight_emerald_m",
  "priceId": "price_midnight_emerald_m",
  "savedAddressId": "uuid", // Optional - pre-fill if logged in
  "savedPaymentMethodId": "uuid", // Optional - use saved card
  "customerEmail": "user@example.com" // Required if not authenticated
}
```

**Response (200):**
```json
{
  "checkoutUrl": "https://checkout.stripe.com/c/pay/...",
  "sessionId": "cs_test_...",
  "orderId": "uuid" // Pre-created order in 'pending' state
}
```

**Enhanced Behavior:**
- If user authenticated: Pre-fill shipping/billing from saved addresses
- If user authenticated: Show saved payment methods in Stripe checkout
- Create order record immediately (status='pending')
- Link order to user if authenticated
- Guest checkout still supported (no auth required)

---

#### POST /api/webhook/stripe
**Purpose:** Handle Stripe webhook events (existing + enhanced)

**Events to Handle:**
1. `checkout.session.completed` - Mark order as 'paid', create user if guest
2. `payment_intent.succeeded` - Confirm payment
3. `payment_intent.payment_failed` - Mark order as 'failed'
4. `charge.refunded` - Mark order as 'refunded'

**Enhanced Logic:**
```javascript
// On checkout.session.completed
if (session.metadata.orderId) {
  // Update existing order
  await updateOrder(session.metadata.orderId, {
    status: 'paid',
    paid_at: new Date(),
    stripe_payment_intent_id: session.payment_intent
  });

  // If guest checkout, create account for customer
  if (session.customer_details.email && !session.metadata.userId) {
    const user = await createUserFromCheckout(session);
    await linkOrderToUser(session.metadata.orderId, user.id);
    await sendMagicLinkInvite(user.email); // "Create account to track order"
  }

  // Save payment method if customer opted in
  if (session.setup_intent) {
    await savePaymentMethod(session.customer, session.payment_method);
  }
}
```

---

### Wishlist Endpoints

#### GET /api/user/wishlist
**Purpose:** Get user's wishlist

**Headers:**
```
Authorization: Bearer {access_token}
```

**Response (200):**
```json
{
  "wishlist": [
    {
      "id": "uuid",
      "product_id": "prod_hoodie_002",
      "preferred_size": "L",
      "notify_on_restock": true,
      "notify_on_sale": false,
      "created_at": "2024-09-15T12:00:00Z",
      "product": {
        "id": "prod_hoodie_002",
        "name": "SHADOW VIPER HOODIE",
        "price": 62,
        "image": "images/black_hoodie_green_2.png",
        "available_sizes": ["S", "M", "XL"],
        "in_stock": true
      }
    }
  ],
  "count": 1
}
```

---

#### POST /api/user/wishlist
**Purpose:** Add item to wishlist

**Headers:**
```
Authorization: Bearer {access_token}
```

**Request:**
```json
{
  "product_id": "prod_hoodie_002",
  "preferred_size": "L",
  "notify_on_restock": true,
  "notify_on_sale": false
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "🍌 Saved to your banana bunch!",
  "wishlist_item": { /* full item */ }
}
```

---

#### DELETE /api/user/wishlist/:id
**Purpose:** Remove item from wishlist

**Headers:**
```
Authorization: Bearer {access_token}
```

**Response (200):**
```json
{
  "success": true,
  "message": "🙈 Removed from wishlist!"
}
```

---

### API Implementation Structure

```
fancymonkey-checkout/
├── api/
│   ├── auth/
│   │   ├── magic-link.js          # Send magic link
│   │   ├── verify-magic-link.js   # Verify token
│   │   ├── oauth-google.js        # Google OAuth
│   │   └── logout.js              # End session
│   ├── user/
│   │   ├── profile.js             # GET/PATCH profile
│   │   ├── addresses.js           # CRUD addresses
│   │   ├── orders.js              # Order history
│   │   └── wishlist.js            # CRUD wishlist
│   ├── checkout.js                # ENHANCED with auth
│   └── webhook/
│       └── stripe.js              # ENHANCED webhook handler
├── lib/
│   ├── supabase.js                # Supabase client
│   ├── stripe.js                  # Stripe client
│   ├── auth.js                    # Auth middleware
│   ├── db/
│   │   ├── users.js               # User queries
│   │   ├── addresses.js           # Address queries
│   │   ├── orders.js              # Order queries
│   │   └── wishlist.js            # Wishlist queries
│   └── email/
│       ├── templates/
│       │   ├── magic-link.html    # Magic link email
│       │   ├── order-confirmation.html
│       │   └── shipping-notification.html
│       └── send.js                # Email sender
├── middleware/
│   ├── auth.js                    # JWT verification
│   ├── rate-limit.js              # Rate limiting
│   └── validate.js                # Input validation
├── .env.local
├── package.json
└── vercel.json
```

---

## 4. UI Wireframe Descriptions

### 4.1 Login Page (`login.html`)

**Layout:** Minimal, centered design matching index.html aesthetic

**Components:**

```
┌──────────────────────────────────────────────────────┐
│                   [FANCY MONKEY LOGO]                │
│                   WELCOME BACK                       │
│                                                      │
│  ┌─────────────────────────────────────────────┐   │
│  │  Email Address                              │   │
│  │  [______________________________]           │   │
│  │                                             │   │
│  │  [SEND MAGIC LINK 🍌] ← Primary CTA        │   │
│  └─────────────────────────────────────────────┘   │
│                                                      │
│              ─── OR CONTINUE WITH ───                │
│                                                      │
│         [Continue with Google] ← Secondary          │
│                                                      │
│  Don't have an account? No problem!                  │
│  Just enter your email and we'll create one 🐵      │
│                                                      │
│             [← Back to Shopping]                     │
└──────────────────────────────────────────────────────┘
```

**Details:**
- **Email input:** Large, friendly input field
- **Magic Link button:** Primary black button (matches buy buttons)
- **OAuth button:** Secondary with Google logo
- **Messaging:** Playful but clear ("No password needed!")
- **Error states:** Friendly monkey-themed messages
- **Success state:** "Check your email! 🍌 Magic link sent to..."

**Mobile Responsive:**
- Single column layout
- Large touch targets (min 44px)
- Email keyboard auto-trigger on mobile

---

### 4.2 Account Dashboard (`account.html`)

**Layout:** Clean navigation sidebar + main content area

**Desktop Layout:**
```
┌──────────────────────────────────────────────────────────────────┐
│  [LOGO]                    FANCY MONKEY            [Logout 🙈]   │
├─────────────────┬────────────────────────────────────────────────┤
│                 │                                                │
│  MY ACCOUNT     │  👋 Welcome back, Jane!                       │
│  ─────────────  │  Member since January 2024                     │
│                 │                                                │
│  Orders         │  QUICK STATS                                  │
│  Profile        │  ┌──────────┬──────────┬──────────┐          │
│  Addresses      │  │ 5 Orders │ $320     │ 2 Items  │          │
│  Wishlist       │  │          │ Spent    │ Wishlist │          │
│  Settings       │  └──────────┴──────────┴──────────┘          │
│                 │                                                │
│                 │  RECENT ORDERS                                │
│                 │  ┌──────────────────────────────────────┐    │
│                 │  │ FM-2024-000123    Sep 20, 2024       │    │
│                 │  │ MIDNIGHT EMERALD HOODIE - M          │    │
│                 │  │ Status: Shipped                      │    │
│                 │  │ [Track Package 📦]  [View Details]   │    │
│                 │  └──────────────────────────────────────┘    │
│                 │  ┌──────────────────────────────────────┐    │
│                 │  │ FM-2024-000098    Aug 15, 2024       │    │
│                 │  │ CLASSIC MONKEY TEE - L               │    │
│                 │  │ Status: Delivered                    │    │
│                 │  │ [Reorder]  [View Details]             │    │
│                 │  └──────────────────────────────────────┘    │
│                 │                                                │
│                 │  [View All Orders →]                          │
│                 │                                                │
└─────────────────┴────────────────────────────────────────────────┘
```

**Mobile Layout:**
- Bottom tab navigation (Orders, Profile, Wishlist, More)
- Hamburger menu for account sections
- Cards stack vertically

**Components:**

1. **Navigation Sidebar** (Desktop)
   - My Account (Dashboard)
   - Orders
   - Profile
   - Addresses
   - Wishlist
   - Settings
   - Logout

2. **Dashboard Content**
   - Welcome message with name
   - Quick stats cards (orders count, total spent, wishlist items)
   - Recent orders preview (3 most recent)
   - Wishlist preview (if items exist)
   - Quick actions: "Continue Shopping", "View All Orders"

---

### 4.3 Orders Page (`orders.html`)

**Layout:** Filterable list view with order cards

```
┌──────────────────────────────────────────────────────────────────┐
│  [LOGO]                    ORDER HISTORY           [Logout 🙈]   │
├─────────────────┬────────────────────────────────────────────────┤
│  [SIDEBAR]      │                                                │
│                 │  ORDER HISTORY                                │
│                 │                                                │
│                 │  [All] [Shipped] [Delivered] [Cancelled]      │
│                 │                                                │
│                 │  ┌────────────────────────────────────────┐  │
│                 │  │  🍌 FM-2024-000123                     │  │
│                 │  │  Ordered: Sep 20, 2024                │  │
│                 │  │  Status: Shipped                       │  │
│                 │  │  ──────────────────────────────────── │  │
│                 │  │  [Product Image]  MIDNIGHT EMERALD    │  │
│                 │  │                   HOODIE - Size M     │  │
│                 │  │                   $58.00              │  │
│                 │  │  ──────────────────────────────────── │  │
│                 │  │  Total: $68.00 (incl. $10 shipping)  │  │
│                 │  │                                        │  │
│                 │  │  Tracking: UPS 1Z999AA10123456784     │  │
│                 │  │  Estimated Delivery: Sep 27, 2024     │  │
│                 │  │                                        │  │
│                 │  │  [Track Package 📦]  [View Details]   │  │
│                 │  └────────────────────────────────────────┘  │
│                 │                                                │
│                 │  ┌────────────────────────────────────────┐  │
│                 │  │  🙈 FM-2024-000098                     │  │
│                 │  │  Ordered: Aug 15, 2024                │  │
│                 │  │  Status: Delivered ✓                  │  │
│                 │  │  ──────────────────────────────────── │  │
│                 │  │  [Product Image]  CLASSIC MONKEY TEE  │  │
│                 │  │                   Size L              │  │
│                 │  │                   $28.00              │  │
│                 │  │  ──────────────────────────────────── │  │
│                 │  │  Total: $38.00                        │  │
│                 │  │  Delivered: Aug 20, 2024              │  │
│                 │  │                                        │  │
│                 │  │  [Reorder]  [View Details]             │  │
│                 │  └────────────────────────────────────────┘  │
│                 │                                                │
└─────────────────┴────────────────────────────────────────────────┘
```

**Features:**
- **Status filters:** All, Shipped, Delivered, Cancelled
- **Order cards:** Show product image, name, size, status, tracking
- **Quick actions:** Track Package (opens carrier site), View Details, Reorder
- **Search:** Search by order number or product name
- **Date range:** Filter by date range
- **Pagination:** Load more as scroll (infinite scroll)

**Order Detail Modal/Page:**
```
┌──────────────────────────────────────────────────────┐
│  [← Back to Orders]                        [X Close] │
│                                                      │
│  ORDER FM-2024-000123                               │
│  🍌 Shipped - Arriving Sep 27                       │
│                                                      │
│  TIMELINE                                           │
│  ●─────●─────●─────○─────○                        │
│  Placed  Paid  Shipped  Transit  Delivered          │
│  Sep 20  Sep 20  Sep 22  [Today]  [Pending]        │
│                                                      │
│  ──────────────────────────────────────────────    │
│                                                      │
│  ITEMS                                              │
│  ┌──────────────────────────────────────────────┐ │
│  │ [Image]  MIDNIGHT EMERALD HOODIE             │ │
│  │          Size M                              │ │
│  │          Qty: 1                              │ │
│  │          $58.00                              │ │
│  └──────────────────────────────────────────────┘ │
│                                                      │
│  ORDER SUMMARY                                      │
│  Subtotal:        $58.00                            │
│  Shipping:        $10.00                            │
│  Tax:             $0.00                             │
│  ────────────────────────                         │
│  Total:           $68.00                            │
│                                                      │
│  SHIPPING ADDRESS                                   │
│  Jane Doe                                           │
│  123 Banana Street, Apt 4B                         │
│  New York, NY 10001                                 │
│  +1 (234) 567-8900                                  │
│                                                      │
│  TRACKING INFORMATION                               │
│  Carrier: UPS                                       │
│  Tracking: 1Z999AA10123456784                       │
│  [Track on UPS.com →]                              │
│                                                      │
│  [Need Help?]  [Download Invoice]                  │
└──────────────────────────────────────────────────────┘
```

---

### 4.4 Profile Page

**Layout:** Form-based settings with sections

```
┌──────────────────────────────────────────────────────────────────┐
│  [LOGO]                    MY PROFILE              [Logout 🙈]   │
├─────────────────┬────────────────────────────────────────────────┤
│  [SIDEBAR]      │                                                │
│                 │  PROFILE SETTINGS                             │
│                 │                                                │
│                 │  PERSONAL INFORMATION                         │
│                 │  ┌──────────────────────────────────────────┐│
│                 │  │ Full Name                                ││
│                 │  │ [Jane Doe___________________________]    ││
│                 │  │                                          ││
│                 │  │ Email Address                            ││
│                 │  │ [jane@example.com] (cannot change)       ││
│                 │  │                                          ││
│                 │  │ Phone Number (optional)                  ││
│                 │  │ [+1 (234) 567-8900________________]      ││
│                 │  │                                          ││
│                 │  │ [Save Changes 🍌]                        ││
│                 │  └──────────────────────────────────────────┘│
│                 │                                                │
│                 │  MARKETING PREFERENCES                        │
│                 │  ┌──────────────────────────────────────────┐│
│                 │  │ ☑ Email me about new drops and sales     ││
│                 │  │ ☐ Send me text messages about orders     ││
│                 │  │                                          ││
│                 │  │ [Update Preferences]                     ││
│                 │  └──────────────────────────────────────────┘│
│                 │                                                │
│                 │  ACCOUNT INFO                                 │
│                 │  ┌──────────────────────────────────────────┐│
│                 │  │ Member since: January 15, 2024           ││
│                 │  │ Total orders: 5                          ││
│                 │  │ Total spent: $320.00                     ││
│                 │  └──────────────────────────────────────────┘│
│                 │                                                │
└─────────────────┴────────────────────────────────────────────────┘
```

**Features:**
- **Editable fields:** Full name, phone
- **Read-only:** Email (cannot change after signup)
- **Marketing preferences:** Email and SMS opt-in checkboxes
- **Account stats:** Member since, order count, total spent
- **Success feedback:** "Profile updated! 🍌" banner on save

---

### 4.5 Addresses Page

**Layout:** Card-based address management

```
┌──────────────────────────────────────────────────────────────────┐
│  [LOGO]                    MY ADDRESSES            [Logout 🙈]   │
├─────────────────┬────────────────────────────────────────────────┤
│  [SIDEBAR]      │                                                │
│                 │  SAVED ADDRESSES                              │
│                 │                                                │
│                 │  [+ Add New Address]                          │
│                 │                                                │
│                 │  ┌──────────────────────────────────────────┐│
│                 │  │ 🏠 DEFAULT SHIPPING & BILLING            ││
│                 │  │ ──────────────────────────────────────── ││
│                 │  │ Jane Doe                                 ││
│                 │  │ 123 Banana Street, Apt 4B                ││
│                 │  │ New York, NY 10001                       ││
│                 │  │ +1 (234) 567-8900                        ││
│                 │  │                                          ││
│                 │  │ Delivery notes: Leave at door            ││
│                 │  │                                          ││
│                 │  │ [Edit] [Delete] [Set as Default]         ││
│                 │  └──────────────────────────────────────────┘│
│                 │                                                │
│                 │  ┌──────────────────────────────────────────┐│
│                 │  │ 🏢 WORK ADDRESS (Shipping Only)          ││
│                 │  │ ──────────────────────────────────────── ││
│                 │  │ Jane Doe                                 ││
│                 │  │ 456 Corporate Plaza                      ││
│                 │  │ New York, NY 10002                       ││
│                 │  │ +1 (234) 567-8900                        ││
│                 │  │                                          ││
│                 │  │ [Edit] [Delete] [Set as Default]         ││
│                 │  └──────────────────────────────────────────┘│
│                 │                                                │
└─────────────────┴────────────────────────────────────────────────┘
```

**Add/Edit Address Modal:**
```
┌──────────────────────────────────────────────────────┐
│  ADD NEW ADDRESS                           [X Close] │
│                                                      │
│  Recipient Name                                      │
│  [_____________________________________________]     │
│                                                      │
│  Phone Number                                        │
│  [_____________________________________________]     │
│                                                      │
│  Address Line 1                                      │
│  [_____________________________________________]     │
│                                                      │
│  Address Line 2 (Apt, Suite, etc.) - Optional       │
│  [_____________________________________________]     │
│                                                      │
│  City                         State    ZIP          │
│  [________________]  [____]  [________]             │
│                                                      │
│  Address Type                                        │
│  ○ Shipping Only  ○ Billing Only  ● Both           │
│                                                      │
│  ☑ Set as default address                           │
│                                                      │
│  Delivery Instructions (Optional)                    │
│  [_____________________________________________]     │
│  [_____________________________________________]     │
│                                                      │
│  [Cancel]               [Save Address 🍌]           │
└──────────────────────────────────────────────────────┘
```

**Features:**
- **Default badge:** Visual indicator for default address
- **Quick actions:** Edit, Delete, Set as Default
- **Address types:** Shipping, Billing, or Both
- **Validation:** Real-time US address validation
- **Confirmation:** "Are you sure?" on delete
- **Auto-save:** On checkout, offer to save new address

---

### 4.6 Wishlist Page

**Layout:** Product grid with wishlist-specific actions

```
┌──────────────────────────────────────────────────────────────────┐
│  [LOGO]                    MY WISHLIST             [Logout 🙈]   │
├─────────────────┬────────────────────────────────────────────────┤
│  [SIDEBAR]      │                                                │
│                 │  MY WISHLIST (3 items)                        │
│                 │                                                │
│                 │  ┌─────────┐  ┌─────────┐  ┌─────────┐      │
│                 │  │[Image]  │  │[Image]  │  │[Image]  │      │
│                 │  │         │  │         │  │         │      │
│                 │  │MIDNIGHT │  │SHADOW   │  │CLASSIC  │      │
│                 │  │EMERALD  │  │VIPER    │  │MONKEY   │      │
│                 │  │HOODIE   │  │HOODIE   │  │TEE      │      │
│                 │  │         │  │         │  │         │      │
│                 │  │$58.00   │  │$62.00   │  │$28.00   │      │
│                 │  │         │  │         │  │         │      │
│                 │  │Size: M  │  │Size: L  │  │Size: M  │      │
│                 │  │✓ In Stock│ │⚠️ Low  │  │✓ In Stock│     │
│                 │  │         │  │Stock    │  │         │      │
│                 │  │[Add to  │  │[Add to  │  │[Add to  │      │
│                 │  │ Cart]   │  │ Cart]   │  │ Cart]   │      │
│                 │  │[Remove] │  │[Remove] │  │[Remove] │      │
│                 │  │         │  │         │  │         │      │
│                 │  │🔔 Notify│  │🔔 Notify│  │🔔 Notify│      │
│                 │  │on sale  │  │on sale  │  │on sale  │      │
│                 │  └─────────┘  └─────────┘  └─────────┘      │
│                 │                                                │
│                 │  [Continue Shopping]                          │
│                 │                                                │
└─────────────────┴────────────────────────────────────────────────┘
```

**Features:**
- **Stock indicators:** In stock, Low stock, Out of stock
- **Size preference:** Show preferred size, option to change
- **Quick add:** Add to cart directly from wishlist
- **Notifications:** Toggle restock/sale notifications
- **Price tracking:** Show if price dropped since added
- **Empty state:** "No items in wishlist yet! Start adding some bananas 🍌"

---

### 4.7 Enhanced Checkout Flow (Logged In)

**Changes to existing checkout:**

When user clicks "BUY" on product page:

**IF LOGGED IN:**
```
1. Check if user has saved addresses
   → YES: Pre-fill shipping in Stripe Checkout
   → NO: Normal checkout flow

2. Check if user has saved payment methods
   → YES: Show "Use saved card ending in 1234" option
   → NO: Normal checkout flow

3. After successful checkout:
   → Auto-link order to user account
   → Show "View order in your account" link on success page
```

**IF NOT LOGGED IN (Guest):**
```
1. Normal checkout flow (no changes)

2. After successful checkout:
   → Create user account automatically with email
   → Send magic link: "Track your order! Create account →"
   → Link order to newly created account
```

**Success Page Enhancement (`success.html`):**
```
┌──────────────────────────────────────────────────────┐
│                   [FANCY MONKEY LOGO]                │
│                                                      │
│              🎉 ORDER SUCCESSFUL! 🍌                 │
│                                                      │
│  Order Number: FM-2024-000123                       │
│  Confirmation sent to: jane@example.com             │
│                                                      │
│  ──────────────────────────────────────────────    │
│                                                      │
│  WHAT'S NEXT?                                       │
│  • You'll receive tracking info within 24 hours     │
│  • Estimated delivery: Sep 27, 2024                 │
│  • We'll email you at every step                    │
│                                                      │
│  [View Order Details]  [Continue Shopping]          │
│                                                      │
│  ──────────────────────────────────────────────    │
│                                                      │
│  📧 Check your email for your order confirmation    │
│                                                      │
│  IF GUEST CHECKOUT:                                 │
│  👉 Create an account to track your order!          │
│     We sent you a magic link to get started 🍌      │
│                                                      │
└──────────────────────────────────────────────────────┘
```

---

### 4.8 Mobile Navigation

**Bottom Tab Bar (Mobile):**
```
┌──────────────────────────────────────────────────────┐
│                                                      │
│  [CONTENT AREA]                                      │
│                                                      │
└──────────────────────────────────────────────────────┘
┌──────────────────────────────────────────────────────┐
│  🛍️        📦        👤        🍌        ☰          │
│  Shop     Orders   Profile  Wishlist   More        │
└──────────────────────────────────────────────────────┘
```

**More Menu (Hamburger):**
- Addresses
- Settings
- Help & Support
- Logout

---

## 5. Security Architecture

### 5.1 Authentication Security

**Magic Link Security:**
```javascript
// Token generation
const magicToken = {
  jti: uuidv4(), // Unique token ID
  email: user.email,
  type: 'magic_link',
  exp: Math.floor(Date.now() / 1000) + (15 * 60), // 15 min expiry
  iat: Math.floor(Date.now() / 1000)
};

// Sign with HS256
const token = jwt.sign(magicToken, process.env.MAGIC_LINK_SECRET);

// Store token hash in database (one-time use)
await db.magic_tokens.create({
  token_hash: crypto.createHash('sha256').update(token).digest('hex'),
  email: user.email,
  expires_at: new Date(Date.now() + 15 * 60 * 1000),
  used: false
});
```

**Security Measures:**
1. **One-time use:** Token marked as used after verification
2. **Short expiry:** 15 minutes max
3. **Hash storage:** Never store plain tokens
4. **Rate limiting:** 3 requests per email per 5 minutes
5. **IP tracking:** Log request IPs for abuse detection
6. **Email verification:** Only send to validated email addresses

---

### 5.2 Session Management

**Approach:** JWT tokens with refresh token rotation

**Access Token:**
- **Lifetime:** 1 hour
- **Storage:** httpOnly cookie (preferred) or localStorage (fallback)
- **Contains:** user_id, email, roles
- **Algorithm:** RS256 (asymmetric for better security)

**Refresh Token:**
- **Lifetime:** 30 days
- **Storage:** httpOnly cookie ONLY
- **Rotation:** New refresh token issued on each refresh
- **Revocation:** Stored in database for logout/revocation

**Implementation:**
```javascript
// Access token
const accessToken = jwt.sign(
  {
    sub: user.id,
    email: user.email,
    type: 'access'
  },
  privateKey,
  {
    expiresIn: '1h',
    algorithm: 'RS256'
  }
);

// Refresh token
const refreshToken = crypto.randomBytes(64).toString('hex');
await db.refresh_tokens.create({
  token_hash: hashToken(refreshToken),
  user_id: user.id,
  expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  revoked: false
});

// Set httpOnly cookies
res.setHeader('Set-Cookie', [
  `access_token=${accessToken}; HttpOnly; Secure; SameSite=Strict; Max-Age=3600`,
  `refresh_token=${refreshToken}; HttpOnly; Secure; SameSite=Strict; Max-Age=2592000`
]);
```

**Token Refresh Flow:**
```
Client: Send refresh_token cookie
  ↓
Server: Verify refresh token
  ↓
Server: Check if revoked in database
  ↓
Server: Generate new access + refresh tokens
  ↓
Server: Revoke old refresh token
  ↓
Server: Return new tokens
```

---

### 5.3 CSRF Protection

**Strategy:** SameSite cookies + CSRF tokens for state-changing operations

**Implementation:**
```javascript
// All cookies use SameSite=Strict
Set-Cookie: access_token=...; SameSite=Strict; Secure; HttpOnly

// For POST/PATCH/DELETE requests, require CSRF token
const csrfToken = crypto.randomBytes(32).toString('hex');

// Store in session
session.csrfToken = csrfToken;

// Return to client in meta tag
<meta name="csrf-token" content="${csrfToken}">

// Client includes in requests
fetch('/api/user/profile', {
  method: 'PATCH',
  headers: {
    'X-CSRF-Token': document.querySelector('[name="csrf-token"]').content
  }
});
```

---

### 5.4 Rate Limiting

**Per-Endpoint Limits:**

| Endpoint | Limit | Window | Identifier |
|----------|-------|--------|------------|
| `/api/auth/magic-link` | 3 requests | 5 min | Email address |
| `/api/auth/verify-magic-link` | 5 requests | 15 min | IP address |
| `/api/auth/oauth/*` | 10 requests | 5 min | IP address |
| `/api/user/*` | 100 requests | 15 min | User ID |
| `/api/checkout` | 10 requests | 5 min | User ID or IP |

**Implementation:**
```javascript
// Using Vercel Edge Config or Redis
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(3, '5 m'),
  analytics: true
});

export async function rateLimitCheck(identifier) {
  const { success, limit, remaining, reset } = await ratelimit.limit(identifier);

  if (!success) {
    throw new Error('Rate limit exceeded');
  }

  return { remaining, reset };
}
```

---

### 5.5 Input Validation & Sanitization

**Server-side validation for ALL inputs:**

```javascript
// Using Zod for schema validation
import { z } from 'zod';

const addressSchema = z.object({
  recipient_name: z.string().min(2).max(255).trim(),
  phone: z.string().regex(/^\+1\d{10}$/).optional(),
  address_line1: z.string().min(5).max(255).trim(),
  address_line2: z.string().max(255).trim().optional(),
  city: z.string().min(2).max(100).trim(),
  state: z.string().length(2).regex(/^[A-Z]{2}$/),
  postal_code: z.string().regex(/^\d{5}(-\d{4})?$/),
  country: z.literal('US'), // US only initially
  delivery_notes: z.string().max(500).trim().optional()
});

// Validate
const validatedAddress = addressSchema.parse(req.body);
```

**SQL Injection Prevention:**
- Use parameterized queries ONLY (via Supabase client)
- Never concatenate user input into SQL
- Use ORM methods (Supabase provides this)

**XSS Prevention:**
```javascript
// Sanitize HTML before storing
import DOMPurify from 'isomorphic-dompurify';

const sanitizedNotes = DOMPurify.sanitize(userInput, {
  ALLOWED_TAGS: [], // No HTML allowed
  ALLOWED_ATTR: []
});
```

---

### 5.6 Data Privacy & Encryption

**Encryption at Rest:**
- Database: Supabase provides encryption at rest by default
- Sensitive fields: Additional encryption for customer notes if needed

**Encryption in Transit:**
- All API endpoints HTTPS only (enforced by Vercel)
- Stripe communication uses TLS 1.2+

**PII Handling:**
| Data Type | Storage | Access | Retention |
|-----------|---------|--------|-----------|
| Email | Encrypted at rest | User + Admin | Until account deletion |
| Phone | Encrypted at rest | User + Admin | Until account deletion |
| Address | Encrypted at rest | User + Admin | Until manually deleted |
| Payment methods | NOT STORED (Stripe only) | N/A | N/A |
| Order history | Encrypted at rest | User + Admin | 7 years (tax law) |

**Data Deletion:**
```javascript
// User account deletion request
async function deleteUserAccount(userId) {
  // Anonymize orders (keep for records)
  await db.orders.update({
    where: { user_id: userId },
    data: {
      user_id: null,
      customer_notes: null,
      internal_notes: 'Account deleted on ' + new Date()
    }
  });

  // Delete personal data
  await db.addresses.deleteMany({ user_id: userId });
  await db.wishlist_items.deleteMany({ user_id: userId });
  await db.saved_payment_methods.deleteMany({ user_id: userId });

  // Delete user
  await db.users.delete({ id: userId });

  // Revoke all sessions
  await db.refresh_tokens.updateMany({
    where: { user_id: userId },
    data: { revoked: true }
  });
}
```

---

### 5.7 Stripe Security Best Practices

**Server-side Price Validation:**
```javascript
// NEVER trust client-sent prices
async function createCheckout(req) {
  const { productId, skuId, priceId } = req.body;

  // 1. Fetch product from OUR database
  const product = await fetchProductFromJSON(productId);

  // 2. Verify SKU and price match
  const sizeData = product.sizes[sku];
  if (sizeData.priceId !== priceId) {
    throw new Error('Invalid price ID');
  }

  // 3. Fetch actual price from Stripe
  const stripePrice = await stripe.prices.retrieve(priceId);

  // 4. Create checkout with Stripe price (not client price)
  const session = await stripe.checkout.sessions.create({
    line_items: [{
      price: stripePrice.id, // Use Stripe's price
      quantity: 1
    }]
  });
}
```

**Webhook Signature Verification:**
```javascript
// ALWAYS verify webhook signatures
export async function POST(req) {
  const signature = req.headers.get('stripe-signature');
  const rawBody = await req.text();

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return new Response('Invalid signature', { status: 400 });
  }

  // Process verified event
  await handleStripeEvent(event);
}
```

**Customer Data Handling:**
- Use Stripe Customer objects to store payment methods
- Link Stripe Customer ID to user account
- Never store raw card numbers
- Use Stripe's SetupIntent for saving cards

---

### 5.8 Security Checklist

**Pre-Launch Security Audit:**
- [ ] All API endpoints require authentication (except public routes)
- [ ] Rate limiting configured on all endpoints
- [ ] CSRF protection implemented
- [ ] Input validation on all user inputs
- [ ] SQL injection prevention (parameterized queries)
- [ ] XSS prevention (sanitized outputs)
- [ ] Secure session management (httpOnly cookies)
- [ ] Password-less auth properly implemented
- [ ] Stripe webhook signature verification
- [ ] HTTPS enforced (no HTTP)
- [ ] Environment variables never committed
- [ ] Row-level security (RLS) enabled on all tables
- [ ] Error messages don't leak sensitive data
- [ ] Logging excludes PII
- [ ] GDPR compliance (data deletion capability)
- [ ] Security headers configured (CSP, X-Frame-Options, etc.)

---

## 6. Implementation Roadmap

### Phase 1: Foundation (Week 1-2)

**1.1 Database Setup**
- [ ] Create Supabase project
- [ ] Run database schema SQL
- [ ] Configure Row Level Security policies
- [ ] Test database queries
- [ ] Set up database backups

**1.2 Authentication System**
- [ ] Install Supabase Auth
- [ ] Configure magic link email templates
- [ ] Implement magic link API endpoints
- [ ] Set up Google OAuth (optional)
- [ ] Test authentication flow
- [ ] Implement JWT session management

**1.3 Basic API Structure**
- [ ] Set up API folder structure
- [ ] Create auth middleware
- [ ] Implement rate limiting
- [ ] Set up error handling
- [ ] Configure CORS properly

**Deliverables:**
- Working database with test data
- Magic link authentication working
- Basic API returning dummy data

---

### Phase 2: User Account Features (Week 3-4)

**2.1 Profile Management**
- [ ] Build profile API endpoints (GET, PATCH)
- [ ] Create profile HTML page
- [ ] Implement profile form with validation
- [ ] Add marketing preferences
- [ ] Test profile updates

**2.2 Address Management**
- [ ] Build address CRUD API endpoints
- [ ] Create addresses HTML page
- [ ] Implement address form with US validation
- [ ] Add default address logic
- [ ] Test address operations

**2.3 Account Dashboard**
- [ ] Build account.html page
- [ ] Fetch and display user stats
- [ ] Show recent orders preview
- [ ] Add wishlist preview
- [ ] Implement navigation

**Deliverables:**
- Fully functional account dashboard
- Profile and address management working
- All vanilla JS, matching site aesthetic

---

### Phase 3: Order Integration (Week 5-6)

**3.1 Enhanced Checkout**
- [ ] Modify existing checkout.js API
- [ ] Add user_id to checkout session metadata
- [ ] Pre-fill addresses for logged-in users
- [ ] Link Stripe Customer to user account
- [ ] Test authenticated checkout flow

**3.2 Webhook Enhancement**
- [ ] Update webhook to create orders in database
- [ ] Link orders to users (or create guest users)
- [ ] Send magic link to guest customers
- [ ] Test order creation from checkout

**3.3 Order History**
- [ ] Build order history API endpoints
- [ ] Create orders.html page
- [ ] Implement order list with filters
- [ ] Build order detail view
- [ ] Add tracking information display

**Deliverables:**
- Orders saved to database after purchase
- Order history page fully functional
- Guest customers receive account creation link

---

### Phase 4: Wishlist & Polish (Week 7-8)

**4.1 Wishlist Feature**
- [ ] Build wishlist API endpoints
- [ ] Create wishlist HTML page
- [ ] Add "Add to Wishlist" buttons on product pages
- [ ] Implement notification preferences
- [ ] Test wishlist operations

**4.2 Success Page Enhancement**
- [ ] Update success.html with account link
- [ ] Add "View Order" link for logged-in users
- [ ] Send magic link invitation for guests
- [ ] Test post-purchase flows

**4.3 Mobile Optimization**
- [ ] Implement bottom tab navigation
- [ ] Test all pages on mobile devices
- [ ] Optimize forms for mobile
- [ ] Test touch interactions
- [ ] Fix any responsive issues

**4.4 Email Templates**
- [ ] Design magic link email (branded)
- [ ] Design order confirmation email
- [ ] Design shipping notification email
- [ ] Design guest account invitation email
- [ ] Test all email templates

**Deliverables:**
- Wishlist fully functional
- Mobile experience polished
- All email templates branded and working

---

### Phase 5: Testing & Security (Week 9)

**5.1 Security Audit**
- [ ] Run security checklist
- [ ] Test rate limiting
- [ ] Verify CSRF protection
- [ ] Test authentication edge cases
- [ ] Penetration testing (basic)

**5.2 Functional Testing**
- [ ] Test all user flows end-to-end
- [ ] Test error scenarios
- [ ] Test guest vs. logged-in checkout
- [ ] Test order history accuracy
- [ ] Test address validation

**5.3 Performance Testing**
- [ ] Run Lighthouse audits on all pages
- [ ] Optimize API response times
- [ ] Test database query performance
- [ ] Optimize image loading
- [ ] Test under load (simulated traffic)

**Deliverables:**
- Security audit report
- All tests passing
- Performance metrics documented

---

### Phase 6: Deployment & Monitoring (Week 10)

**6.1 Production Setup**
- [ ] Set production environment variables
- [ ] Configure Supabase production instance
- [ ] Set up Stripe production keys
- [ ] Configure production email sending
- [ ] Set up error tracking (Sentry)

**6.2 Deployment**
- [ ] Deploy database migrations
- [ ] Deploy API functions to Vercel
- [ ] Deploy frontend pages
- [ ] Test production checkout flow
- [ ] Monitor for errors

**6.3 Documentation**
- [ ] Write admin documentation
- [ ] Document API endpoints
- [ ] Create troubleshooting guide
- [ ] Document database schema
- [ ] Create user guide

**Deliverables:**
- Account system live in production
- Monitoring in place
- Documentation complete

---

### Phase 7: Post-Launch Enhancements (Week 11+)

**Optional Features to Consider:**

**7.1 Advanced Features**
- [ ] Order returns/exchanges system
- [ ] Loyalty points program
- [ ] Referral system
- [ ] Product reviews
- [ ] Reorder functionality

**7.2 Admin Dashboard**
- [ ] Admin login system
- [ ] Order management interface
- [ ] Customer list view
- [ ] Inventory management
- [ ] Analytics dashboard

**7.3 Notifications**
- [ ] Email notifications for order updates
- [ ] SMS tracking notifications
- [ ] Wishlist restock alerts
- [ ] Price drop notifications

---

## 7. Technical Constraints & Considerations

### 7.1 Vanilla JavaScript Approach

**Maintaining Consistency:**
- All account pages use same vanilla JS patterns as index.html
- No frameworks or build tools
- Keep bundle size minimal
- Use same utility functions (e.g., error handling patterns)

**Code Organization:**
```
fancy_monkey/
├── js/
│   ├── auth.js           # Authentication utilities
│   ├── api.js            # API client wrapper
│   ├── account.js        # Account page logic
│   ├── orders.js         # Orders page logic
│   ├── profile.js        # Profile page logic
│   ├── addresses.js      # Addresses page logic
│   ├── wishlist.js       # Wishlist page logic
│   └── shared/
│       ├── error-handler.js  # Shared error handling
│       ├── ui-feedback.js    # Shared UI components
│       └── validators.js     # Input validation
```

**Shared Patterns:**
```javascript
// Reuse existing error handling patterns from index.html
class AccountErrorHandler extends ErrorHandler {
  handleAuthError(error) {
    if (error.status === 401) {
      // Redirect to login
      window.location.href = '/login.html?redirect=' +
        encodeURIComponent(window.location.pathname);
    }
  }
}

// Reuse existing UI feedback patterns
const uiFeedback = new UIFeedback(); // From index.html
uiFeedback.showError(element, {
  title: '🙈 Oops!',
  message: 'Something went bananas!',
  severity: 'warning'
});
```

---

### 7.2 Serverless Constraints

**Vercel Function Limits:**
- 10 second timeout (Hobby plan)
- 50 MB deployment size
- Cold start delays (optimize with edge functions)

**Mitigation:**
- Keep functions small and focused
- Use Vercel Edge Functions for auth checks
- Cache frequently accessed data
- Optimize dependencies

**Edge Function Candidates:**
```javascript
// api/edge/auth-check.js
// Fast authentication verification
export const config = { runtime: 'edge' };

export default async function handler(req) {
  const token = req.cookies.get('access_token');
  // Quick JWT verification
  // Return 200 or 401
}
```

---

### 7.3 Database Scalability

**Current Scale:**
- Expected: <1000 users initially
- Expected: <100 orders per day
- Supabase free tier: 500MB database, 50k MAU

**Scaling Plan:**
- Monitor database size monthly
- Index optimization for query performance
- Consider upgrading to Supabase Pro at 10k MAU
- Archive old orders after 2 years (keep for 7 years in cold storage)

**Query Optimization:**
```sql
-- Optimize order history query
CREATE INDEX CONCURRENTLY idx_orders_user_created
  ON orders(user_id, created_at DESC);

-- Optimize address lookup
CREATE INDEX CONCURRENTLY idx_addresses_user_default
  ON addresses(user_id, is_default)
  WHERE is_default = true;
```

---

### 7.4 Cost Estimation

**Monthly Costs (at launch):**

| Service | Free Tier | Paid Plan | Expected Cost |
|---------|-----------|-----------|---------------|
| Supabase | 500MB, 50k MAU | $25/mo (Pro) | $0 (start free) |
| Vercel | 100GB bandwidth | $20/mo (Pro) | $0 (start free) |
| Stripe | 2.9% + 30¢ per transaction | N/A | Transaction-based |
| Email (Resend) | 3,000/mo free | $20/mo (10k) | $0 (start free) |
| Error tracking (Sentry) | 5k events/mo | $26/mo | $0 (start free) |

**Total estimated monthly cost at launch:** $0-25
**At 1,000 users, 200 orders/mo:** ~$25-50

---

### 7.5 Performance Targets

**Page Load Times:**
| Page | Target | Max Acceptable |
|------|--------|----------------|
| login.html | <1.0s | 1.5s |
| account.html | <1.2s | 2.0s |
| orders.html | <1.5s | 2.5s |
| profile.html | <1.0s | 1.5s |

**API Response Times:**
| Endpoint | Target | Max Acceptable |
|----------|--------|----------------|
| GET /api/user/profile | <100ms | 300ms |
| GET /api/user/orders | <200ms | 500ms |
| POST /api/user/addresses | <150ms | 400ms |
| POST /api/checkout | <500ms | 1000ms |

**Lighthouse Scores:**
- Performance: >90
- Accessibility: >95
- Best Practices: >90
- SEO: >90

---

### 7.6 Browser Support

**Target Browsers:**
- Chrome/Edge (last 2 versions)
- Firefox (last 2 versions)
- Safari (last 2 versions)
- Mobile Safari iOS 14+
- Chrome Android (last 2 versions)

**JavaScript Features Used:**
- ES6+ (async/await, arrow functions, modules)
- Fetch API
- LocalStorage/SessionStorage
- Web Crypto API (for hashing)

**Polyfills:** None required (modern browsers only)

---

### 7.7 Accessibility Requirements

**WCAG 2.1 Level AA Compliance:**
- [ ] All forms have labels
- [ ] All buttons have descriptive text
- [ ] All images have alt text
- [ ] Keyboard navigation works on all pages
- [ ] Focus indicators visible
- [ ] Color contrast meets AA standards
- [ ] Screen reader tested (NVDA, VoiceOver)
- [ ] Form errors announced to screen readers
- [ ] ARIA labels on custom controls

**Testing Tools:**
- axe DevTools
- WAVE browser extension
- Lighthouse accessibility audit
- Manual keyboard navigation test
- Manual screen reader test

---

### 7.8 SEO Considerations

**Account Pages (No Index):**
```html
<!-- All account pages should include -->
<meta name="robots" content="noindex, nofollow">
```

**Login Page (Index for branded searches):**
```html
<title>Login - Fancy Monkey</title>
<meta name="description" content="Log in to your Fancy Monkey account to track orders, manage addresses, and view your wishlist.">
<meta name="robots" content="index, nofollow">
```

---

### 7.9 Migration from Guest to Account

**Guest Order Linking Strategy:**

```javascript
// When guest completes checkout
async function handleGuestCheckout(session) {
  // 1. Create order (user_id = null)
  const order = await createOrder({
    stripe_session_id: session.id,
    user_id: null, // Guest
    customer_email: session.customer_details.email
  });

  // 2. Check if email already exists
  const existingUser = await findUserByEmail(session.customer_details.email);

  if (existingUser) {
    // Link order to existing user
    await linkOrderToUser(order.id, existingUser.id);
  } else {
    // Create new user account
    const newUser = await createUserFromEmail(session.customer_details.email);
    await linkOrderToUser(order.id, newUser.id);

    // Send magic link invitation
    await sendMagicLink({
      email: newUser.email,
      message: 'Track your order! Create your Fancy Monkey account →',
      redirectTo: '/orders/' + order.order_number
    });
  }
}
```

---

### 7.10 Future Considerations

**Multi-Currency Support:**
- Database already has `currency` field
- Add currency selector to profile
- Convert prices at checkout
- Store historical exchange rates

**International Shipping:**
- Add more countries to `addresses.country` constraint
- Integrate international shipping rates
- Add customs information fields
- Handle VAT/GST calculations

**Mobile App:**
- API already designed for headless use
- Can build React Native app using same APIs
- Consider OAuth for better mobile UX

**Admin Dashboard:**
- Separate admin authentication system
- Order management interface
- Customer support tools
- Analytics dashboard

---

## Conclusion

This architecture provides a comprehensive, secure, and scalable customer account system for Fancy Monkey that:

✅ **Maintains brand consistency** - Vanilla JS, minimal aesthetic, playful UX
✅ **Prioritizes UX** - Passwordless auth, one-click checkout, mobile-first
✅ **Ensures security** - Magic links, JWT sessions, rate limiting, RLS
✅ **Scales efficiently** - Serverless architecture, free tier friendly
✅ **Integrates seamlessly** - Works with existing Stripe checkout
✅ **Supports growth** - Database designed for future features

**Next Steps:**
1. Review and approve this architecture
2. Set up Supabase project
3. Begin Phase 1 implementation
4. Iterate based on user feedback

**Estimated Timeline:** 10 weeks to production-ready account system

**Estimated Cost:** $0-50/month at launch, scales with users

---

**Document Status:** Ready for Implementation
**Approval Required:** Architecture, Database Schema, Security Approach
**Questions/Feedback:** Please provide feedback before implementation begins

---

**Version History:**
- v1.0.0 (2025-10-07) - Initial architecture design
