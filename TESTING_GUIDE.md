# Cart Structural Upgrade - Testing Guide

## 🧪 Quick Testing Checklist

Use this guide to verify the cart structural upgrade is working correctly.

---

## 1️⃣ Enable Debug Mode

Open browser DevTools console and run:

```javascript
// Enable WTF Analytics debug logging
window.WTF_ANALYTICS_DEBUG = true;

// Listen for cart events
document.addEventListener('wtf:cart:update', (e) => {
  console.log('✅ wtf:cart:update fired:', e.detail);
});

document.addEventListener('wtf:cart:add', (e) => {
  console.log('✅ wtf:cart:add fired:', e.detail);
});

console.log('🔍 Debug mode enabled. Add items to cart to see events.');
```

---

## 2️⃣ Test Add to Cart

### Steps:
1. Navigate to any product page (e.g., `/products/custom-kratom-tea`)
2. Click "Add to Cart" button
3. Check Network tab and Console

### Expected Results:

#### Network Tab:
```
POST /cart/add.js
Status: 200 OK
Response Type: application/json

Response Body:
{
  "id": 123456789,
  "variant_id": 987654321,
  "product_title": "Custom Kratom Tea",
  "variant_title": "Medium",
  "price": 900,
  "quantity": 1,
  ...
}
```

#### Console Output:
```
[WTF Cart Bridge] Cart add event: {...}
✅ wtf:cart:add fired: {item: {...}, cart: {...}}
✅ wtf:cart:update fired: {item_count: 1, items: [...], total_price: 900}
[WTF Analytics] Event: add_to_cart
  Enriched Payload: {
    page_type: "product",
    city: "Cape Coral",
    region: "FL",
    value: 9.00,
    items: [...]
  }
```

---

## 3️⃣ Test Cart Count Update

### Steps:
1. Check cart count badge in header before adding
2. Add item to cart
3. Check cart count badge again

### Console Command:
```javascript
// Check current cart count
const cartCount = document.querySelector('[data-cart-count]');
console.log('Cart count:', cartCount?.textContent);

// After adding item, verify it increments
setTimeout(() => {
  console.log('Updated cart count:', cartCount?.textContent);
}, 1000);
```

### Expected Results:
- Cart count increments by 1
- Badge is visible (not hidden)

---

## 4️⃣ Test Cart Drawer

### Steps:
1. Add item to cart
2. Cart drawer should slide in from right
3. Verify line item appears

### Console Command to Open Drawer Manually:
```javascript
// Open cart drawer programmatically
const cartDrawer = document.querySelector('cart-drawer');
if (cartDrawer && typeof cartDrawer.open === 'function') {
  cartDrawer.open();
  console.log('✅ Cart drawer opened');
} else {
  console.error('❌ Cart drawer not found or open() method missing');
}
```

### Expected Results:
- Drawer slides in from right
- Shows product image, title, variant
- Shows quantity input
- Shows remove button
- Shows subtotal and checkout button

---

## 5️⃣ Test Quantity Update

### Steps:
1. Open cart drawer
2. Change quantity in input field
3. Wait 300ms (debounce)
4. Check Network tab and Console

### Expected Results:

#### Network Tab:
```
POST /cart/change.js
Status: 200 OK
Request Body:
{
  "line": 1,
  "quantity": 2,
  "sections_url": "/products/custom-kratom-tea"
}

Response Body:
{
  "item_count": 2,
  "items": [...],
  "total_price": 1800,
  ...
}
```

#### Console Output:
```
✅ wtf:cart:update fired: {item_count: 2, items: [...], total_price: 1800}
[WTF Analytics] Event: cart_view
```

---

## 6️⃣ Test Remove Item

### Steps:
1. Open cart drawer
2. Click "Remove" button
3. Check Network tab and Console

### Expected Results:
- POST to `/cart/change.js` with `quantity: 0`
- Item disappears from drawer
- Cart count decrements
- If cart empty, shows "Your cart is empty" message

---

## 7️⃣ Test Variant Selection

### Steps:
1. Navigate to product with variants
2. Select different variant (e.g., Size: Large)
3. Add to cart
4. Check Network response

### Console Command:
```javascript
// Check selected variant ID
const variantInput = document.querySelector('input[name="id"]');
console.log('Selected variant ID:', variantInput?.value);

// After variant change
document.querySelector('select[name^="options"]')?.addEventListener('change', () => {
  setTimeout(() => {
    console.log('New variant ID:', variantInput?.value);
  }, 100);
});
```

### Expected Results:
- Correct variant ID in hidden input
- Network response shows correct `variant_id`
- Cart shows correct variant title (e.g., "Large")

---

## 8️⃣ Test Line Item Properties

### Steps:
1. Navigate to Custom Kratom Tea or Custom Kava Drink
2. Select customizations (strain, flavors, etc.)
3. Add to cart
4. Open cart drawer
5. Verify properties are displayed

### Expected Results:
- Properties shown under product title
- Format: "Strain: Green", "Flavors & Pumps: Mango:2 | Peach:1"
- Properties also visible in Shopify checkout

---

## 9️⃣ Test Error Handling

### Simulate Out of Stock:
```javascript
// Temporarily break the add-to-cart endpoint
fetch('/cart/add.js', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  body: JSON.stringify({
    id: 999999999, // Invalid variant ID
    quantity: 1
  })
})
.then(r => r.json())
.then(data => {
  console.log('Error response:', data);
})
.catch(err => {
  console.error('Fetch error:', err);
});
```

### Expected Results:
- Error message displayed to user
- No console errors
- Add to cart button re-enabled
- Loading spinner hidden

---

## 🔟 Test Analytics Integration

### Steps:
1. Enable debug mode (see step 1)
2. Add item to cart
3. Check for WTFAnalytics events

### Console Command:
```javascript
// Check if WTFAnalytics is available
if (typeof window.WTFAnalytics !== 'undefined') {
  console.log('✅ WTFAnalytics available');
  console.log('Methods:', Object.keys(window.WTFAnalytics));
} else {
  console.warn('⚠️ WTFAnalytics not loaded yet');
}

// Check enriched context
if (window.WTF_ENV) {
  console.log('WTF_ENV:', window.WTF_ENV);
}
```

### Expected Results:
- `WTFAnalytics.track()` called with `add_to_cart` event
- Event includes enriched context (city, region, distance_km)
- Event sent to Google Analytics, Meta Pixel, etc.

---

## 1️⃣1️⃣ Test Page Load Performance

### Console Command:
```javascript
// Check script loading order
performance.getEntriesByType('resource')
  .filter(r => r.name.includes('.js') && r.name.includes('cart'))
  .forEach(r => {
    console.log(`${r.name.split('/').pop()}: ${r.duration.toFixed(2)}ms`);
  });
```

### Expected Results:
- All scripts load successfully
- No blocking or timeout errors
- Load order: constants → pubsub → fetch-config → dawn-cart → dawn-product-form → wtf-cart-event-bridge

---

## 1️⃣2️⃣ Test Mobile Responsiveness

### Steps:
1. Open DevTools
2. Toggle device toolbar (Cmd+Shift+M / Ctrl+Shift+M)
3. Select mobile device (e.g., iPhone 12)
4. Test add to cart and cart drawer

### Expected Results:
- Cart drawer fills full width on mobile
- Touch-friendly buttons (min 44x44px)
- No horizontal scroll
- Quantity inputs easy to tap

---

## 🐛 Common Issues & Solutions

### Issue: Cart count not updating
**Solution:**
```javascript
// Manually trigger cart update
fetch('/cart.js')
  .then(r => r.json())
  .then(cart => {
    document.dispatchEvent(new CustomEvent('wtf:cart:update', {
      detail: cart
    }));
  });
```

### Issue: Cart drawer not opening
**Solution:**
```javascript
// Check if cart drawer element exists
const drawer = document.querySelector('cart-drawer');
console.log('Cart drawer:', drawer);
console.log('Has open method:', typeof drawer?.open === 'function');

// Check if drawer is in DOM
console.log('Drawer in DOM:', document.body.contains(drawer));
```

### Issue: Events not firing
**Solution:**
```javascript
// Check if event listeners are attached
const listeners = getEventListeners(document);
console.log('wtf:cart:update listeners:', listeners['wtf:cart:update']?.length || 0);
console.log('wtf:cart:add listeners:', listeners['wtf:cart:add']?.length || 0);
```

### Issue: Scripts not loading
**Solution:**
```javascript
// Check if scripts are loaded
const scripts = [
  'constants.js',
  'pubsub.js',
  'fetch-config.js',
  'dawn-cart.js',
  'dawn-product-form.js',
  'wtf-cart-event-bridge.js'
];

scripts.forEach(script => {
  const loaded = document.querySelector(`script[src*="${script}"]`);
  console.log(`${script}: ${loaded ? '✅' : '❌'}`);
});
```

---

## 📸 Screenshot Checklist

For PR documentation, capture:

1. **Network Tab - Add to Cart**
   - POST to `/cart/add.js` with 200 status
   - Response JSON visible

2. **Console - Debug Output**
   - `wtf:cart:update` event logged
   - `wtf:cart:add` event logged
   - WTF Analytics event logged

3. **Cart Drawer - Open State**
   - Drawer visible with line item
   - Product image, title, variant shown
   - Quantity input and remove button visible

4. **Cart Count - Before/After**
   - Before: count = 0 (or hidden)
   - After: count = 1 (or incremented)

5. **Mobile View**
   - Cart drawer on mobile device
   - Touch-friendly controls

---

## ✅ Final Verification

Run this comprehensive check:

```javascript
(async function verifyCartUpgrade() {
  console.log('🔍 Starting cart upgrade verification...\n');
  
  const checks = {
    scriptsLoaded: false,
    customElementsDefined: false,
    eventBridgeActive: false,
    cartCountElement: false,
    cartDrawerElement: false
  };
  
  // Check scripts
  const requiredScripts = ['constants.js', 'pubsub.js', 'dawn-cart.js', 'dawn-product-form.js', 'wtf-cart-event-bridge.js'];
  checks.scriptsLoaded = requiredScripts.every(script => 
    document.querySelector(`script[src*="${script}"]`)
  );
  console.log(`Scripts loaded: ${checks.scriptsLoaded ? '✅' : '❌'}`);
  
  // Check custom elements
  checks.customElementsDefined = 
    customElements.get('wtf-product-form') &&
    customElements.get('cart-drawer') &&
    customElements.get('cart-items') &&
    customElements.get('cart-remove-button');
  console.log(`Custom elements defined: ${checks.customElementsDefined ? '✅' : '❌'}`);
  
  // Check event bridge
  checks.eventBridgeActive = typeof window.WTF_ANALYTICS_DEBUG !== 'undefined';
  console.log(`Event bridge active: ${checks.eventBridgeActive ? '✅' : '❌'}`);
  
  // Check cart count element
  checks.cartCountElement = !!document.querySelector('[data-cart-count]');
  console.log(`Cart count element: ${checks.cartCountElement ? '✅' : '❌'}`);
  
  // Check cart drawer element
  checks.cartDrawerElement = !!document.querySelector('cart-drawer');
  console.log(`Cart drawer element: ${checks.cartDrawerElement ? '✅' : '❌'}`);
  
  // Overall status
  const allPassed = Object.values(checks).every(v => v);
  console.log(`\n${allPassed ? '✅ All checks passed!' : '❌ Some checks failed'}`);
  
  return checks;
})();
```

---

## 🎓 Advanced Testing

### Load Testing
```javascript
// Simulate multiple rapid add-to-cart operations
async function loadTest() {
  const variantId = document.querySelector('input[name="id"]')?.value;
  if (!variantId) {
    console.error('No variant ID found');
    return;
  }
  
  console.log('Starting load test with 10 rapid adds...');
  
  for (let i = 0; i < 10; i++) {
    await fetch('/cart/add.js', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ id: variantId, quantity: 1 })
    });
    console.log(`Add ${i + 1} complete`);
  }
  
  // Check final cart state
  const cart = await fetch('/cart.js').then(r => r.json());
  console.log('Final cart count:', cart.item_count);
}

// Run load test
loadTest();
```

### Memory Leak Check
```javascript
// Check for memory leaks in event listeners
let eventCount = 0;
const originalAddEventListener = document.addEventListener;

document.addEventListener = function(...args) {
  eventCount++;
  console.log(`Event listener added: ${args[0]} (Total: ${eventCount})`);
  return originalAddEventListener.apply(this, args);
};

// Add and remove items multiple times
// Event count should stabilize, not grow indefinitely
```

---

**Happy Testing!** 🚀

