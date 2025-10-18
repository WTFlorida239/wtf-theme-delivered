# Cart Persistence Analysis & Fix Plan

**Date:** October 18, 2025  
**Issue:** Cart items not persisting/showing in GUI after page reload  
**Status:** Under Investigation

---

## How Cart Persistence SHOULD Work

### Shopify Native Cart Persistence

Shopify automatically persists cart data via **session cookies**, not localStorage. This means:

1. When a customer adds items to cart → Shopify stores cart data server-side
2. Cart is tied to the customer's session cookie
3. When customer returns (same browser, same session) → cart items are automatically there
4. **No additional localStorage/sessionStorage needed** for basic persistence

### Current Implementation

**Cart API Layer (`assets/wtf-cart-api.js`):**
- Uses Shopify's native `/cart/add.js`, `/cart/change.js`, `/cart.js` endpoints
- Dispatches events: `cart:added`, `cart:updated`, `wtf:cart:add`, `wtf:cart:update`
- Properly uses `credentials: 'same-origin'` to maintain session

**Cart UI Layer (`snippets/wtf-cart-drawer.liquid`):**
- Listens for `cart:added` and `cart:updated` events
- Fetches cart state from `/cart.js` on page load (line 324-327)
- Renders cart items dynamically
- Updates cart count badge

**Product Forms (`sections/main-product.liquid`, builders):**
- Submit via `WTFCartAPI.addToCart()`
- Properly dispatch events after successful add

---

## Cart Flow Trace

### Add to Cart Flow

```
1. User clicks "Add to Cart" button
   ↓
2. Form submission intercepted (main-product.liquid line 356)
   ↓
3. WTFCartAPI.addToCart() called (line 379)
   ↓
4. POST to /cart/add.js (wtf-cart-api.js line 81)
   ↓
5. Shopify adds item to server-side cart
   ↓
6. Response returns added item
   ↓
7. Fetch cart state from /cart.js (line 104)
   ↓
8. Dispatch events: cart:added, wtf:cart:add (line 105)
   ↓
9. Cart drawer listens for cart:added (wtf-cart-drawer.liquid line 261)
   ↓
10. Cart drawer renders cart and opens (line 266-267)
    ↓
11. Cart count badge updates (line 118-132)
```

### Page Load Flow

```
1. Page loads
   ↓
2. Cart drawer snippet executes (wtf-cart-drawer.liquid line 100)
   ↓
3. Hydration: getCart() called (line 324)
   ↓
4. GET /cart.js fetches current cart state (line 148)
   ↓
5. renderCart(cart) displays items (line 325)
   ↓
6. broadcastCart(cart) dispatches events (line 326)
   ↓
7. updateCartCount() updates badge (line 118-132)
```

---

## Potential Issues Identified

### Issue #1: Cart Icon Click Behavior

**Current:** Cart icon links to `/cart` page (header.liquid line 78)
```liquid
<a href="{{ routes.cart_url }}" class="header__cart-link" aria-label="Cart">
```

**Problem:** Clicking cart icon navigates to cart page instead of opening drawer

**Expected:** Should open cart drawer to show persisted items

**Fix:** Add click handler to open drawer instead of navigating

---

### Issue #2: Cart Count Not Updating on Page Load

**Current:** Cart count is server-rendered (header.liquid line 84)
```liquid
<span class="header__cart-count" data-cart-count>{{ cart.item_count }}</span>
```

**Problem:** If cart is updated via AJAX and page isn't reloaded, count might be stale

**Expected:** Cart count should update from /cart.js on page load

**Fix:** Ensure cart drawer's updateCartCount() runs on initial hydration

---

### Issue #3: Missing Cart Page Template

**Potential Issue:** If `/cart` page doesn't exist or isn't properly configured

**Check:** Verify `templates/cart.json` or `templates/cart.liquid` exists

**Impact:** Users clicking cart icon would see 404 or broken page

---

### Issue #4: Session Cookie Issues

**Potential Issue:** Cart session cookie might not be persisting

**Causes:**
- Browser privacy settings blocking cookies
- Shopify session expired
- Cross-domain issues (if using custom domain incorrectly)

**Check:** Verify cookies are being set in browser DevTools

---

### Issue #5: Script Loading Order

**Current:** Scripts loaded with `defer` (theme.liquid line 309)
```liquid
<script src="{{ 'wtf-cart-api.js' | asset_url }}" defer></script>
```

**Problem:** If cart drawer snippet runs before wtf-cart-api.js loads, `window.WTFCartAPI` might be undefined

**Fix:** Ensure proper initialization order or add existence checks

---

## Diagnostic Steps

### Step 1: Check if Cart Data Persists Server-Side

**Test:**
1. Add item to cart
2. Open browser DevTools → Network tab
3. Reload page
4. Check for `/cart.js` request
5. Verify response contains items

**Expected:** `/cart.js` should return cart with items
**If fails:** Session cookie issue or Shopify cart not persisting

---

### Step 2: Check if Cart Drawer Hydrates

**Test:**
1. Add item to cart
2. Reload page
3. Open browser DevTools → Console
4. Type: `window.WTF_CART.refresh()`
5. Check if cart drawer shows items

**Expected:** Cart drawer should display items
**If fails:** Cart drawer rendering issue

---

### Step 3: Check Cart Count Updates

**Test:**
1. Add item to cart
2. Reload page
3. Check cart count badge in header

**Expected:** Badge should show correct count
**If fails:** updateCartCount() not running or targeting wrong element

---

### Step 4: Check for JavaScript Errors

**Test:**
1. Open browser DevTools → Console
2. Look for errors on page load
3. Check if WTFCartAPI is defined: `console.log(window.WTFCartAPI)`

**Expected:** No errors, WTFCartAPI should be an object
**If fails:** Script loading or syntax error

---

## Recommended Fixes

### Fix #1: Make Cart Icon Open Drawer

**File:** `sections/header.liquid`  
**Line:** 78

**Current:**
```liquid
<a href="{{ routes.cart_url }}" class="header__cart-link" aria-label="Cart">
```

**Change to:**
```liquid
<button type="button" class="header__cart-link" aria-label="Open cart" data-cart-open>
```

**Add JavaScript:**
```javascript
document.querySelector('[data-cart-open]')?.addEventListener('click', function() {
  if (window.WTF_CART) {
    window.WTF_CART.open();
  }
});
```

---

### Fix #2: Ensure Cart Count Updates on Load

**File:** `snippets/wtf-cart-drawer.liquid`  
**Line:** 324-327

**Current:**
```javascript
// Hydrate on first paint (so it's ready if user opens manually)
getCart().then(function(cart){
  renderCart(cart);
  broadcastCart(cart);
});
```

**Verify:** This already calls `renderCart()` which calls `updateCartCount()` (line 216)

**Status:** ✅ Should be working

---

### Fix #3: Add Fallback Cart Page Link

**File:** `sections/header.liquid`  
**Add:** Fallback link to cart page

**Implementation:**
```liquid
<button type="button" class="header__cart-link" aria-label="Open cart" data-cart-open>
  <!-- cart icon SVG -->
  <span class="header__cart-count" data-cart-count>{{ cart.item_count }}</span>
</button>
<noscript>
  <a href="{{ routes.cart_url }}" class="header__cart-link">Cart ({{ cart.item_count }})</a>
</noscript>
```

---

### Fix #4: Add Debug Logging

**File:** `snippets/wtf-cart-drawer.liquid`  
**Add:** Console logging for debugging

**Implementation:**
```javascript
getCart().then(function(cart){
  console.log('[WTF Cart] Hydrated on page load:', cart);
  renderCart(cart);
  broadcastCart(cart);
});
```

---

### Fix #5: Verify Cart Template Exists

**Check:** Ensure one of these exists:
- `templates/cart.json`
- `templates/cart.liquid`

**If missing:** Create basic cart template

---

## Testing Checklist

After implementing fixes:

- [ ] Add item to cart
- [ ] Reload page
- [ ] Verify cart count shows in header
- [ ] Click cart icon → drawer opens with items
- [ ] Close drawer and reopen → items still there
- [ ] Navigate to different page → cart count persists
- [ ] Clear browser cookies → cart clears (expected)
- [ ] Add item again → persists after reload

---

## Root Cause Hypothesis

Based on the code analysis, the most likely issues are:

**Primary Hypothesis:**
- Cart icon links to `/cart` page instead of opening drawer
- User expects to see cart items by clicking icon
- Cart IS persisting server-side, but UI doesn't show it

**Secondary Hypothesis:**
- JavaScript errors preventing cart drawer from hydrating
- Script loading order issues
- Missing cart template causing confusion

**Tertiary Hypothesis:**
- Session cookie issues (browser privacy settings)
- Shopify cart session expired
- Cross-domain cookie problems

---

## Next Steps

1. **Implement Fix #1** - Make cart icon open drawer
2. **Implement Fix #4** - Add debug logging
3. **Test** - Verify cart persistence works
4. **Check** - Browser DevTools for errors
5. **Verify** - `/cart.js` returns correct data
6. **Document** - Results and any remaining issues

---

**Status:** Ready to implement fixes  
**Priority:** High (critical user experience issue)  
**Estimated Time:** 30 minutes to implement and test

