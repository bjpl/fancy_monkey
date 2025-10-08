# Add to Cart Feature - Design Document

**Feature:** Shopping Cart with Multi-Item Support
**Version:** 1.0.0
**Date:** 2025-10-07
**Implementation Time:** ~4 hours

---

## Overview

Transform the current direct-to-checkout flow into a multi-item shopping cart experience, allowing customers to browse, add multiple items, and checkout when ready.

## Current State

**Existing Behavior:**
- Select size → Click "BUY" → Immediate checkout (Stripe)
- One item at a time
- No way to purchase multiple products
- Cart persistence exists but only stores selected sizes (not full cart)

**Limitations:**
- Cannot buy multiple items in one order
- No cart review before checkout
- No quantity adjustments
- Poor multi-product UX

## Proposed Solution

**New Flow:**
1. Select size → Click "ADD TO CART" → Item added to cart (sidebar opens)
2. Continue shopping or click "CHECKOUT"
3. Cart sidebar shows all items with quantity controls
4. Checkout creates Stripe session with all cart items

---

## UI/UX Design

### Cart Icon (Header)

**Location:** Fixed top-right corner (always visible)

**Design:**
```
┌─────────────────────────┐
│  🍌 FANCY MONKEY   [🛒3] │  ← Cart icon with badge
└─────────────────────────┘
```

**Features:**
- Shopping bag emoji (🛒) or icon
- Badge showing item count (e.g., "3")
- Badge hidden when cart is empty
- Pulse animation when item added
- Click to toggle cart sidebar

**CSS:**
```css
.cart-icon {
  position: fixed;
  top: 20px;
  right: 20px;
  background: #000;
  color: #fff;
  padding: 12px 20px;
  border-radius: 50px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 10px;
  z-index: 999;
  transition: all 0.3s ease;
}

.cart-badge {
  background: #667eea;
  color: #fff;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 700;
}

.cart-icon.pulse {
  animation: pulse 0.6s ease-out;
}

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
}
```

---

### Cart Sidebar

**Location:** Slides in from right side of screen

**Layout:**
```
┌───────────────────────────────┐
│  YOUR CART              [X]   │ ← Header
├───────────────────────────────┤
│                               │
│  ┌─────────────────────────┐ │
│  │ [img] HOODIE - Size M   │ │ ← Cart Item
│  │       $58.00            │ │
│  │       [−] 1 [+]  Remove │ │
│  └─────────────────────────┘ │
│                               │
│  ┌─────────────────────────┐ │
│  │ [img] T-SHIRT - Size L  │ │
│  │       $28.00            │ │
│  │       [−] 2 [+]  Remove │ │
│  └─────────────────────────┘ │
│                               │
│  ────────────────────────────│
│                               │
│  Subtotal: $114.00            │
│  Shipping: Calculated at      │
│            checkout           │
│                               │
│  [CHECKOUT 🍌]                │ ← Primary CTA
│  [Continue Shopping]          │ ← Secondary
│                               │
└───────────────────────────────┘
```

**Features:**
- Slides in from right (400px width on desktop, full width on mobile)
- Semi-transparent overlay behind sidebar
- Scrollable item list
- Sticky header and footer
- Close button (X) and overlay click to close
- Empty state with playful message

**CSS:**
```css
.cart-sidebar {
  position: fixed;
  top: 0;
  right: -400px; /* Hidden by default */
  width: 400px;
  height: 100vh;
  background: #fff;
  box-shadow: -5px 0 15px rgba(0, 0, 0, 0.1);
  z-index: 1000;
  display: flex;
  flex-direction: column;
  transition: right 0.3s ease;
}

.cart-sidebar.open {
  right: 0;
}

.cart-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100vh;
  background: rgba(0, 0, 0, 0.5);
  z-index: 999;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.3s ease;
}

.cart-overlay.visible {
  opacity: 1;
  pointer-events: all;
}

/* Mobile responsive */
@media (max-width: 768px) {
  .cart-sidebar {
    width: 100%;
    right: -100%;
  }
}
```

---

### Cart Item Component

**Structure:**
```html
<div class="cart-item">
  <img src="product-image.jpg" alt="Product">
  <div class="cart-item-details">
    <div class="cart-item-name">MIDNIGHT EMERALD HOODIE</div>
    <div class="cart-item-meta">Size: M</div>
    <div class="cart-item-price">$58.00</div>
  </div>
  <div class="cart-item-controls">
    <div class="quantity-control">
      <button class="qty-btn minus">−</button>
      <input type="number" value="1" min="1" readonly>
      <button class="qty-btn plus">+</button>
    </div>
    <button class="remove-btn">Remove</button>
  </div>
</div>
```

**Features:**
- Product thumbnail (60x60px)
- Product name + size
- Price per unit
- Quantity controls (−/+)
- Remove button
- Hover states on all interactive elements

**Quantity Behavior:**
- Min quantity: 1
- Max quantity: 10 (or stock limit if implementing inventory)
- Plus/minus buttons
- Manual input disabled (use buttons only for consistency)
- Updates subtotal in real-time

---

### Empty Cart State

**Design:**
```
┌───────────────────────────────┐
│  YOUR CART              [X]   │
├───────────────────────────────┤
│                               │
│        🙈                      │
│                               │
│   Your cart is empty!         │
│                               │
│   No bananas in the bunch     │
│   yet. Let's fix that!        │
│                               │
│   [START SHOPPING 🍌]         │
│                               │
└───────────────────────────────┘
```

**Copy Options:**
- "Your cart is empty!"
- "No bananas in the bunch yet!"
- "No monkey business here yet!"
- "Time to go bananas! Start shopping."

---

## Data Structure

### Cart State

```javascript
const cart = {
  items: [
    {
      id: "cart_item_1", // Unique cart item ID
      productId: "prod_hoodie_001",
      name: "MIDNIGHT EMERALD HOODIE",
      size: "M",
      skuId: "sku_midnight_emerald_m",
      priceId: "price_midnight_emerald_m",
      price: 58.00,
      quantity: 1,
      image: "images/black_hoodie_green_1.png",
      category: "hoodies"
    },
    {
      id: "cart_item_2",
      productId: "prod_tshirt_001",
      name: "CLASSIC MONKEY TEE",
      size: "L",
      skuId: "sku_classic_tee_l",
      priceId: "price_classic_tee_l",
      price: 28.00,
      quantity: 2,
      image: "images/tshirt_1.png",
      category: "t-shirts"
    }
  ],
  subtotal: 114.00,
  itemCount: 3, // Total quantity (1 + 2)
  lastUpdated: "2025-10-07T12:00:00.000Z"
};
```

**Key:**
- `id`: Unique identifier for cart item (not product ID!)
  - Allows same product in different sizes
  - Example: Hoodie M and Hoodie L are separate cart items
- `quantity`: Number of this specific item
- `subtotal`: Sum of all items (price × quantity)
- `itemCount`: Total number of items (sum of all quantities)

### Cart Persistence

**Extends existing `CartPersistenceManager`:**
```javascript
// Old format (selected sizes only)
{
  "prod_hoodie_001": "M",
  "prod_tshirt_001": "L"
}

// New format (full cart)
{
  version: "2.0.0", // Increment version
  timestamp: Date.now(),
  cart: {
    items: [...],
    subtotal: 114.00,
    itemCount: 3
  },
  expiresAt: Date.now() + 24h
}
```

**Migration Strategy:**
- Check version on load
- If v1.0.0 (selectedSizes only), migrate to v2.0.0
- Convert selectedSizes to full cart items
- Preserve TTL and other metadata

---

## Functional Specifications

### Add to Cart

**Trigger:** Click "ADD TO CART" button on product card

**Process:**
1. Validate size is selected
2. Check if item already in cart (same product + same size)
   - If yes: Increment quantity (+1)
   - If no: Add new cart item
3. Update cart state
4. Save to localStorage
5. Update cart icon badge
6. Pulse cart icon animation
7. Open cart sidebar (slide in from right)
8. Show success feedback in sidebar

**Error Handling:**
- No size selected → Show error: "Please select a size first! 🙈"
- Product already at max quantity (10) → "Whoa! That's enough bananas for now."
- Out of stock (if inventory enabled) → "This item is sold out 😢"

---

### Update Quantity

**Trigger:** Click +/− buttons in cart item

**Process:**
1. Validate new quantity (min: 1, max: 10)
2. Update cart item quantity
3. Recalculate subtotal
4. Update UI (quantity, subtotal)
5. Save to localStorage
6. Update cart icon badge

**Plus Button (+):**
```javascript
function increaseQuantity(cartItemId) {
  const item = cart.items.find(i => i.id === cartItemId);
  if (item.quantity >= 10) {
    showToast("Maximum quantity reached! 🍌");
    return;
  }
  item.quantity++;
  updateCart();
}
```

**Minus Button (−):**
```javascript
function decreaseQuantity(cartItemId) {
  const item = cart.items.find(i => i.id === cartItemId);
  if (item.quantity <= 1) {
    // Don't allow quantity below 1, show remove button instead
    showToast("Use 'Remove' to delete this item");
    return;
  }
  item.quantity--;
  updateCart();
}
```

---

### Remove from Cart

**Trigger:** Click "Remove" button on cart item

**Process:**
1. Remove item from cart.items array
2. Recalculate subtotal and itemCount
3. Update UI
4. Save to localStorage
5. Update cart icon badge
6. If cart becomes empty, show empty state

**Confirmation:**
- Option A: No confirmation (simple UX, can undo by re-adding)
- Option B: Confirm dialog (safer, but more friction)

**Recommendation:** No confirmation (Option A) for better UX.

---

### Checkout from Cart

**Trigger:** Click "CHECKOUT 🍌" button in cart sidebar

**Process:**
1. Validate cart is not empty
2. Create Stripe checkout session with all cart items
3. Use `line_items` array with multiple products:
   ```javascript
   const session = await stripe.checkout.sessions.create({
     line_items: cart.items.map(item => ({
       price: item.priceId,
       quantity: item.quantity
     })),
     mode: 'payment',
     success_url: '...',
     cancel_url: '...'
   });
   ```
4. Redirect to Stripe checkout
5. On success, clear cart (webhook handles this)

**Error Handling:**
- Empty cart → "Your cart is empty! Add some items first."
- Checkout API error → "Oops! Something went bananas. Try again."
- Network error → Retry with exponential backoff

---

## Button Updates

### Product Card Changes

**Before:**
```html
<button class="buy-btn" disabled>
  SELECT SIZE
</button>
<!-- After size selected -->
<button class="buy-btn">
  BUY NOW - $58.00
</button>
```

**After:**
```html
<button class="add-to-cart-btn" disabled>
  SELECT SIZE
</button>
<!-- After size selected -->
<button class="add-to-cart-btn">
  ADD TO CART - $58.00 🛒
</button>
```

**CSS Updates:**
```css
/* Rename .buy-btn to .add-to-cart-btn */
.add-to-cart-btn {
  background: #000;
  color: #fff;
  border: 2px solid #000;
  padding: 14px 24px;
  font-size: 14px;
  font-weight: 700;
  letter-spacing: 0.1em;
  cursor: pointer;
  transition: all 0.3s ease;
  width: 100%;
}

.add-to-cart-btn:hover:not(:disabled) {
  background: #667eea;
  border-color: #667eea;
  transform: translateY(-2px);
}

.add-to-cart-btn:disabled {
  background: #e0e0e0;
  color: #999;
  cursor: not-allowed;
  border-color: #e0e0e0;
}
```

**Behavior Changes:**
- Click "ADD TO CART" → Add to cart + open sidebar (no redirect)
- Cart icon always visible
- Badge updates in real-time

---

## Implementation Checklist

### Phase 1: Cart State (1 hour)
- [ ] Create `CartManager` class
- [ ] Implement `addItem(product, size, quantity)`
- [ ] Implement `removeItem(cartItemId)`
- [ ] Implement `updateQuantity(cartItemId, quantity)`
- [ ] Implement `calculateSubtotal()`
- [ ] Implement `getItemCount()`
- [ ] Update `CartPersistenceManager` for v2.0.0 format
- [ ] Add migration from v1.0.0 to v2.0.0

### Phase 2: Cart UI (1.5 hours)
- [ ] Add cart icon to header HTML
- [ ] Create cart sidebar HTML structure
- [ ] Add cart overlay
- [ ] Write cart sidebar CSS (slide-in animation)
- [ ] Write cart item component CSS
- [ ] Write empty cart state CSS
- [ ] Mobile responsive styles

### Phase 3: Cart Functionality (1 hour)
- [ ] Implement `openCart()` and `closeCart()`
- [ ] Implement `renderCart()` to populate sidebar
- [ ] Implement `addToCart()` button handler
- [ ] Implement quantity +/− handlers
- [ ] Implement remove item handler
- [ ] Implement cart icon badge update
- [ ] Implement pulse animation on add

### Phase 4: Checkout Integration (0.5 hours)
- [ ] Update checkout API to handle multiple items
- [ ] Implement `checkoutFromCart()` function
- [ ] Clear cart on successful checkout
- [ ] Handle checkout errors

### Phase 5: Testing & Polish (0.5 hours)
- [ ] Test add to cart flow
- [ ] Test quantity updates
- [ ] Test remove items
- [ ] Test checkout with multiple items
- [ ] Test cart persistence across refreshes
- [ ] Test empty cart state
- [ ] Test mobile responsiveness
- [ ] Cross-browser testing

---

## Mobile Considerations

**Cart Sidebar on Mobile:**
- Full-screen overlay (width: 100%)
- Slide in from right (same direction)
- Fixed header and footer
- Scrollable item list
- Larger touch targets (min 44px)
- Quantity buttons: 44x44px minimum

**Cart Icon on Mobile:**
- Positioned top-right (not floating)
- Larger hit area (48x48px)
- Badge more prominent

**Empty Cart on Mobile:**
- Simplified copy
- Larger emoji
- Full-width CTA button

---

## Accessibility

**Keyboard Navigation:**
- Tab through cart items
- Enter/Space to increment/decrement quantity
- Delete key to remove item (when focused)
- Escape to close sidebar

**Screen Reader:**
- Announce cart count: "Shopping cart, 3 items"
- Announce on add: "Item added to cart"
- Announce subtotal: "Subtotal: $114.00"
- Label all buttons clearly

**ARIA Labels:**
```html
<button aria-label="Shopping cart, 3 items" class="cart-icon">
  🛒 <span class="cart-badge">3</span>
</button>

<button aria-label="Increase quantity" class="qty-btn plus">+</button>
<button aria-label="Decrease quantity" class="qty-btn minus">−</button>
<button aria-label="Remove item from cart" class="remove-btn">Remove</button>
```

---

## Performance Targets

- Cart open animation: <300ms
- Add to cart response: <50ms
- Quantity update: <50ms
- Cart re-render: <100ms
- LocalStorage save: <10ms

---

## Analytics Events

Track key cart interactions:

```javascript
// Add to cart
gtag('event', 'add_to_cart', {
  items: [{
    item_id: product.id,
    item_name: product.name,
    price: product.price,
    quantity: 1
  }]
});

// Remove from cart
gtag('event', 'remove_from_cart', {
  items: [...]
});

// View cart
gtag('event', 'view_cart', {
  value: cart.subtotal,
  items: cart.items
});

// Begin checkout from cart
gtag('event', 'begin_checkout', {
  value: cart.subtotal,
  items: cart.items
});
```

---

## Future Enhancements

**Short-term:**
1. Promo code input
2. Estimated shipping costs
3. Gift message option
4. Save for later (move to wishlist)

**Medium-term:**
5. Recommended products in cart
6. Free shipping threshold ("Add $20 more for free shipping!")
7. Cart abandonment email (if implementing accounts)
8. Recently removed items (undo remove)

**Long-term:**
9. Buy now, pay later (Afterpay, Klarna)
10. Gift wrapping options
11. Subscription products
12. Bundle discounts

---

**Document Version:** 1.0.0
**Status:** Ready for Implementation
**Estimated Implementation Time:** 4 hours
**Dependencies:** None (uses existing cart persistence)
