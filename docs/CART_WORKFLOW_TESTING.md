# 🛒 Cart Workflow Testing Guide

**Purpose:** Comprehensive testing protocol for cart functionality after emergency fix  
**Date:** October 18, 2025  
**Status:** Ready for deployment testing

---

## 🎯 Testing Objectives

1. Verify cart API is functional (add/update/remove)
2. Confirm cart persistence across page reloads
3. Validate cart UI updates correctly
4. Ensure checkout flow works end-to-end
5. Check mobile responsiveness
6. Verify no JavaScript errors

---

## ✅ Pre-Test Checklist

Before starting tests:

- [ ] Emergency fix has been deployed to live site
- [ ] Browser cache cleared (Cmd+Shift+R / Ctrl+Shift+R)
- [ ] Testing in incognito/private window
- [ ] DevTools console open (F12 → Console tab)
- [ ] Network tab open (F12 → Network tab)
- [ ] Mobile device or emulator ready

---

## 🧪 Test Suite

### Test 1: Basic Add to Cart

**Objective:** Verify items can be added to cart

**Steps:**
1. Navigate to https://wtfswag.com
2. Click on any product
3. Select options if required (size, variant, etc.)
4. Click "Add to Cart" button
5. Observe cart behavior

**Expected Results:**
- ✅ No JavaScript errors in console
- ✅ Cart drawer opens (or cart count updates)
- ✅ Item appears in cart
- ✅ Cart icon shows count "1"
- ✅ Success message or visual feedback

**Console Should Show:**
```
[WTF Cart] Item added: {id: 12345, quantity: 1}
[WTF Cart] Cart updated: {item_count: 1, items: [...]}
```

**Pass Criteria:** All expected results achieved, no errors

---

### Test 2: Cart Persistence

**Objective:** Verify cart persists across page reloads

**Steps:**
1. Add item to cart (from Test 1)
2. Verify cart shows 1 item
3. Reload page (Cmd+R / Ctrl+R)
4. Check cart icon count
5. Open cart drawer/page
6. Verify item is still there

**Expected Results:**
- ✅ Cart icon still shows "1" after reload
- ✅ Item still in cart
- ✅ Item details preserved (size, customizations, etc.)
- ✅ Price correct
- ✅ Quantity correct

**Console Should Show:**
```
[WTF Cart] Hydrated on page load: {item_count: 1, items: [...]}
```

**Pass Criteria:** Cart state fully preserved after reload

---

### Test 3: Custom Drink Builder

**Objective:** Verify custom drink orders work with line item properties

**Steps:**
1. Navigate to Kratom Teas or Kava Drinks page
2. Select size (Medium/Large/Gallon)
3. Select strain (Green/Red/White/Yellow or Mix)
4. Select flavors with pump counts
5. Add optional notes
6. Click "Add to Cart"
7. Open cart
8. Verify customizations are displayed

**Expected Results:**
- ✅ Size selection updates price
- ✅ Strain selection works (or Mix with A/B strains)
- ✅ Flavor counters work
- ✅ Pump limits enforced
- ✅ Validation prevents invalid submissions
- ✅ Item added with all customizations
- ✅ Cart shows all line item properties:
  - Size
  - Strain (or Strain A + Strain B)
  - Flavors & Pumps
  - Notes

**Console Should Show:**
```
[WTF Cart] Adding item with properties: {
  Strain: "Green",
  Mix: "No",
  "Flavors & Pumps": "Mango:2 | Peach:1",
  Notes: "Extra ice please"
}
```

**Pass Criteria:** All customizations preserved and displayed in cart

---

### Test 4: Update Quantity

**Objective:** Verify cart quantities can be updated

**Steps:**
1. Add item to cart
2. Open cart drawer/page
3. Find quantity selector
4. Increase quantity to 2
5. Observe cart update
6. Decrease quantity to 1
7. Observe cart update

**Expected Results:**
- ✅ Quantity updates immediately
- ✅ Subtotal recalculates correctly
- ✅ Total updates
- ✅ Cart count badge updates
- ✅ No page reload required

**Console Should Show:**
```
[WTF Cart] Quantity updated: line 1, quantity 2
[WTF Cart] Cart updated: {item_count: 2, ...}
```

**Pass Criteria:** Quantity updates work smoothly without errors

---

### Test 5: Remove from Cart

**Objective:** Verify items can be removed from cart

**Steps:**
1. Add item to cart
2. Open cart drawer/page
3. Click "Remove" or set quantity to 0
4. Observe cart behavior

**Expected Results:**
- ✅ Item removed from cart
- ✅ Cart count updates to 0
- ✅ Cart shows "empty" state
- ✅ Subtotal shows $0.00
- ✅ No JavaScript errors

**Console Should Show:**
```
[WTF Cart] Item removed: line 1
[WTF Cart] Cart updated: {item_count: 0, items: []}
```

**Pass Criteria:** Item successfully removed, cart shows empty state

---

### Test 6: Multiple Items

**Objective:** Verify cart handles multiple different items

**Steps:**
1. Add first item to cart
2. Continue shopping
3. Add second item (different product)
4. Add third item
5. Open cart
6. Verify all items present

**Expected Results:**
- ✅ All 3 items in cart
- ✅ Cart count shows "3"
- ✅ Each item has correct details
- ✅ Subtotal is sum of all items
- ✅ Can update/remove individual items

**Pass Criteria:** Cart correctly manages multiple items

---

### Test 7: Cart Drawer UI

**Objective:** Verify cart drawer opens and functions correctly

**Steps:**
1. Add item to cart
2. Click cart icon in header
3. Observe drawer behavior
4. Test drawer interactions
5. Close drawer
6. Reopen drawer

**Expected Results:**
- ✅ Drawer opens smoothly
- ✅ Shows all cart items
- ✅ Shows subtotal
- ✅ "Checkout" button visible and clickable
- ✅ Can update quantities in drawer
- ✅ Can remove items from drawer
- ✅ Drawer closes properly
- ✅ Drawer reopens with updated state

**Pass Criteria:** Drawer UI is fully functional

---

### Test 8: Checkout Flow

**Objective:** Verify checkout can be initiated

**Steps:**
1. Add item to cart
2. Open cart
3. Click "Checkout" button
4. Observe redirect

**Expected Results:**
- ✅ Redirects to Shopify checkout
- ✅ Cart items appear in checkout
- ✅ Customizations visible in checkout
- ✅ Prices correct
- ✅ Can proceed through checkout

**Note:** Don't complete purchase unless testing on staging

**Pass Criteria:** Checkout initiates successfully with correct cart data

---

### Test 9: Mobile Responsiveness

**Objective:** Verify cart works on mobile devices

**Steps:**
1. Open site on mobile device or emulator
2. Navigate to product page
3. Add item to cart
4. Open cart
5. Test all cart operations

**Expected Results:**
- ✅ Add to cart button accessible
- ✅ Cart drawer opens on mobile
- ✅ Cart items readable
- ✅ Quantity controls work on touch
- ✅ Checkout button accessible
- ✅ No layout issues
- ✅ No horizontal scroll

**Devices to Test:**
- iPhone (Safari)
- Android (Chrome)
- Tablet (iPad/Android)

**Pass Criteria:** Full cart functionality on all mobile devices

---

### Test 10: Error Handling

**Objective:** Verify graceful error handling

**Steps:**
1. Try adding invalid variant ID (if possible)
2. Try adding quantity of 0
3. Try updating to negative quantity
4. Disconnect internet, try cart operation
5. Reconnect, verify cart recovers

**Expected Results:**
- ✅ Invalid operations show error messages
- ✅ No crashes or blank pages
- ✅ Helpful error messages to user
- ✅ Cart state remains consistent
- ✅ Network errors handled gracefully

**Console Should Show:**
```
[WTFCartAPI] Error: Invalid variant id: ...
[WTFCartAPI] Error: Network error adding to cart
```

**Pass Criteria:** Errors handled gracefully without breaking cart

---

## 📊 Test Results Template

### Test Session Info

**Date:** _______________  
**Tester:** _______________  
**Browser:** _______________  
**Device:** _______________  
**Theme Version:** _______________

### Results Summary

| Test # | Test Name | Pass/Fail | Notes |
|--------|-----------|-----------|-------|
| 1 | Basic Add to Cart | ☐ Pass ☐ Fail | |
| 2 | Cart Persistence | ☐ Pass ☐ Fail | |
| 3 | Custom Drink Builder | ☐ Pass ☐ Fail | |
| 4 | Update Quantity | ☐ Pass ☐ Fail | |
| 5 | Remove from Cart | ☐ Pass ☐ Fail | |
| 6 | Multiple Items | ☐ Pass ☐ Fail | |
| 7 | Cart Drawer UI | ☐ Pass ☐ Fail | |
| 8 | Checkout Flow | ☐ Pass ☐ Fail | |
| 9 | Mobile Responsiveness | ☐ Pass ☐ Fail | |
| 10 | Error Handling | ☐ Pass ☐ Fail | |

**Overall Result:** ☐ All Tests Passed ☐ Some Tests Failed

**Critical Issues Found:** _______________

**Non-Critical Issues Found:** _______________

**Recommendations:** _______________

---

## 🐛 Bug Report Template

If tests fail, use this template to report issues:

### Bug Report

**Test Number:** _______________  
**Test Name:** _______________  
**Severity:** ☐ Critical ☐ High ☐ Medium ☐ Low

**Steps to Reproduce:**
1. 
2. 
3. 

**Expected Behavior:**


**Actual Behavior:**


**Console Errors:**
```

```

**Network Errors:**
```

```

**Screenshots:**
(Attach screenshots)

**Browser/Device:**


**Additional Context:**


---

## 🎯 Success Criteria

**Minimum Requirements for Production:**

- ✅ Tests 1-8 must pass (core functionality)
- ✅ Test 9 must pass on at least 2 mobile devices
- ✅ Zero critical bugs
- ✅ No JavaScript console errors
- ✅ Cart persistence verified
- ✅ Checkout flow functional

**Nice to Have:**
- ✅ Test 10 passes (error handling)
- ✅ Performance < 3s page load
- ✅ Lighthouse score 90+ (desktop)
- ✅ Lighthouse score 75+ (mobile)

---

## 📈 Performance Benchmarks

### Cart Operations Timing

**Target Times:**
- Add to cart: < 500ms
- Update quantity: < 300ms
- Remove item: < 300ms
- Cart drawer open: < 200ms
- Checkout redirect: < 1s

**Measure With:**
```javascript
console.time('add-to-cart');
// ... perform operation ...
console.timeEnd('add-to-cart');
```

### Network Requests

**Expected API Calls:**
- `POST /cart/add.js` - Add item
- `POST /cart/change.js` - Update quantity
- `POST /cart/clear.js` - Clear cart
- `GET /cart.js` - Get cart state

**Check in Network Tab:**
- Status: 200 OK
- Response time: < 500ms
- No 404 or 500 errors

---

## 🔍 Console Monitoring

### Expected Console Messages

**On Page Load:**
```
[WTF] Error prevention initialized
[WTF] Analytics API initialized with safe defaults
[WTF Cart] Hydrated on page load: {item_count: 0, items: []}
```

**On Add to Cart:**
```
[WTF Cart] Adding item: {id: 12345, quantity: 1, properties: {...}}
[WTF Cart] Item added successfully
[WTF Cart] Cart updated: {item_count: 1, items: [...]}
```

**On Update:**
```
[WTF Cart] Updating line 1 to quantity 2
[WTF Cart] Cart updated: {item_count: 2, items: [...]}
```

### Red Flags (Should NOT See)

```
❌ Uncaught SyntaxError
❌ Uncaught TypeError: ... is not a function
❌ Failed to fetch
❌ 404 Not Found
❌ 500 Internal Server Error
❌ Uncaught ReferenceError: WTFCartAPI is not defined
```

---

## 🚀 Quick Smoke Test (2 minutes)

For rapid validation after deployment:

1. **Add to cart** - Click any "Add to Cart" button
2. **Check console** - No errors
3. **Reload page** - Cart persists
4. **Open cart** - Items visible
5. **Checkout** - Button works

**If all 5 pass:** ✅ Core functionality working  
**If any fail:** ❌ Investigation needed

---

## 📞 Troubleshooting

### Cart Not Persisting

**Check:**
- Browser cookies enabled
- Not in private/incognito mode (for testing)
- Shopify session active
- `/cart.js` returning correct data

**Debug:**
```javascript
fetch('/cart.js').then(r => r.json()).then(console.log)
```

### Cart Drawer Not Opening

**Check:**
- `wtf-cart-drawer.liquid` included in theme.liquid
- Event listeners attached
- `cart:added` event being dispatched
- No JavaScript errors blocking execution

**Debug:**
```javascript
document.dispatchEvent(new CustomEvent('cart:added', {detail: {}}));
```

### Quantities Not Updating

**Check:**
- `/cart/change.js` endpoint working
- Correct line index being sent
- Network requests succeeding
- Cart UI listening for `cart:updated` event

**Debug:**
```javascript
WTFCartAPI.updateCart({line: 1, quantity: 2})
  .then(console.log)
  .catch(console.error);
```

---

**Testing Prepared By:** AI Assistant (Manus)  
**Date:** October 18, 2025  
**Version:** 1.0  
**Status:** Ready for Use

---

🧪 **COMPREHENSIVE TESTING ENSURES QUALITY** 🧪

