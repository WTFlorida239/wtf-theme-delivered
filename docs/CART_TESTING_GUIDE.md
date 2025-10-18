# Cart Persistence Testing Guide

**Date:** October 18, 2025  
**Purpose:** Validate cart persistence fixes work correctly  
**Time Required:** 15-20 minutes

---

## Prerequisites

Before testing, ensure:
- [ ] Branch `feat/technical-optimization` is deployed to staging or development theme
- [ ] Browser DevTools console is open (F12 → Console tab)
- [ ] You have at least one product available to add to cart
- [ ] You're testing in a private/incognito window (to simulate new user)

---

## Test 1: Basic Cart Persistence

**Goal:** Verify cart persists across page reloads

### Steps:

1. **Navigate to a product page**
   - Go to any product (e.g., `/products/custom-kava-drink`)

2. **Add item to cart**
   - Click "Add to Cart" button
   - **Expected:** Cart drawer opens automatically
   - **Expected:** Console shows: `[WTF Cart] Hydrated on page load:` with cart data

3. **Check cart drawer**
   - **Expected:** Item appears in drawer
   - **Expected:** Cart count badge shows "1"
   - **Expected:** Subtotal shows correct price

4. **Close cart drawer**
   - Click X or backdrop to close

5. **Reload the page**
   - Press F5 or Cmd+R
   - **Expected:** Page reloads

6. **Check cart count badge**
   - Look at cart icon in header
   - **Expected:** Badge still shows "1"

7. **Click cart icon**
   - Click the cart icon in header
   - **Expected:** Cart drawer opens
   - **Expected:** Item still appears in drawer
   - **Expected:** Console shows cart data with 1 item

### Success Criteria:
- ✅ Cart drawer opens on add
- ✅ Cart count updates immediately
- ✅ Cart persists after reload
- ✅ Cart icon opens drawer (not navigating to /cart)

### If Test Fails:
- Check console for errors
- Verify `/cart.js` returns cart data (Network tab)
- Check if cookies are enabled in browser
- Verify `window.WTF_CART` is defined in console

---

## Test 2: Multi-Item Cart Persistence

**Goal:** Verify multiple items persist correctly

### Steps:

1. **Start with cart from Test 1**
   - Should have 1 item already

2. **Navigate to different product**
   - Go to another product page

3. **Add second item**
   - Click "Add to Cart"
   - **Expected:** Cart drawer opens
   - **Expected:** Shows 2 items

4. **Check cart count**
   - **Expected:** Badge shows "2"

5. **Reload page**
   - Press F5

6. **Click cart icon**
   - **Expected:** Drawer shows both items
   - **Expected:** Count shows "2"

7. **Navigate to homepage**
   - Click logo or go to `/`

8. **Check cart count**
   - **Expected:** Still shows "2"

9. **Click cart icon**
   - **Expected:** Both items still in cart

### Success Criteria:
- ✅ Multiple items can be added
- ✅ All items persist across reloads
- ✅ Cart persists across page navigation
- ✅ Cart count always accurate

---

## Test 3: Cart Drawer Functionality

**Goal:** Verify cart drawer UI works correctly

### Steps:

1. **Open cart drawer**
   - Click cart icon
   - **Expected:** Drawer slides in from right

2. **Check item display**
   - **Expected:** Product image shows
   - **Expected:** Product title shows
   - **Expected:** Price shows
   - **Expected:** Quantity controls show

3. **Increase quantity**
   - Click + button on an item
   - **Expected:** Quantity increases
   - **Expected:** Subtotal updates
   - **Expected:** Console shows cart update

4. **Decrease quantity**
   - Click - button
   - **Expected:** Quantity decreases
   - **Expected:** Subtotal updates

5. **Remove item**
   - Click "Remove" button
   - **Expected:** Item disappears
   - **Expected:** Cart count decreases
   - **Expected:** If cart empty, shows "Your cart is empty"

6. **Close drawer**
   - Click X or backdrop
   - **Expected:** Drawer closes smoothly

### Success Criteria:
- ✅ Drawer opens/closes smoothly
- ✅ All item details display correctly
- ✅ Quantity controls work
- ✅ Remove button works
- ✅ Empty cart message shows when cart is empty

---

## Test 4: Session Persistence

**Goal:** Verify cart persists across browser tabs/windows

### Steps:

1. **Add item to cart**
   - Add at least one item

2. **Open new tab**
   - Open new tab to same site (Cmd+T or Ctrl+T)

3. **Check cart count in new tab**
   - **Expected:** Shows same count as first tab

4. **Click cart icon in new tab**
   - **Expected:** Shows same items

5. **Add item in new tab**
   - Add another item

6. **Switch back to first tab**
   - Go back to original tab

7. **Click cart icon**
   - **Expected:** Shows updated cart with new item
   - **Note:** May need to reload page to see update

### Success Criteria:
- ✅ Cart data shared across tabs
- ✅ Updates in one tab reflect in others (after reload)

---

## Test 5: Custom Product Properties

**Goal:** Verify custom drink builder properties persist

### Steps:

1. **Navigate to drink builder**
   - Go to `/products/custom-kava-drink` or `/products/custom-kratom-tea`

2. **Customize drink**
   - Select size (e.g., Large)
   - Select strain (e.g., Green)
   - Add flavors (e.g., Mango: 2 pumps, Peach: 1 pump)
   - Add notes (e.g., "Extra ice")

3. **Add to cart**
   - Click "Add to Cart"
   - **Expected:** Cart drawer opens

4. **Check item in drawer**
   - **Expected:** Shows size
   - **Expected:** Shows strain
   - **Expected:** Shows flavors with pump counts
   - **Expected:** Shows notes

5. **Reload page**
   - Press F5

6. **Open cart drawer**
   - Click cart icon
   - **Expected:** All customizations still show

7. **Navigate to cart page**
   - Go to `/cart`
   - **Expected:** All properties display on cart page

### Success Criteria:
- ✅ Custom properties saved to cart
- ✅ Properties persist across reloads
- ✅ Properties display in drawer
- ✅ Properties display on cart page

---

## Test 6: Browser Console Validation

**Goal:** Verify no JavaScript errors

### Steps:

1. **Open DevTools Console**
   - Press F12 → Console tab

2. **Clear console**
   - Click clear button or type `console.clear()`

3. **Add item to cart**
   - Add any item

4. **Check console output**
   - **Expected:** See `[WTF Cart] Hydrated on page load:`
   - **Expected:** See cart object with items array
   - **Expected:** No red error messages

5. **Reload page**
   - Press F5

6. **Check console again**
   - **Expected:** See hydration message again
   - **Expected:** No 404 errors for scripts
   - **Expected:** No "persistent-cart.js" errors

7. **Open cart drawer**
   - Click cart icon

8. **Check console**
   - **Expected:** No errors when drawer opens

### Success Criteria:
- ✅ No JavaScript errors
- ✅ No 404 errors for missing scripts
- ✅ Cart hydration logs appear
- ✅ Debug logging shows cart data

---

## Test 7: Network Request Validation

**Goal:** Verify cart API calls work correctly

### Steps:

1. **Open DevTools Network tab**
   - Press F12 → Network tab

2. **Filter for XHR/Fetch**
   - Click "Fetch/XHR" filter

3. **Add item to cart**
   - Add any item

4. **Check network requests**
   - **Expected:** See POST to `/cart/add.js`
   - **Expected:** Response status 200
   - **Expected:** Response contains item data

5. **Check for cart.js request**
   - **Expected:** See GET to `/cart.js`
   - **Expected:** Response status 200
   - **Expected:** Response contains cart with items

6. **Update quantity in drawer**
   - Change quantity of an item

7. **Check network requests**
   - **Expected:** See POST to `/cart/change.js`
   - **Expected:** Response status 200

### Success Criteria:
- ✅ All cart API calls return 200
- ✅ No failed requests
- ✅ Response data looks correct

---

## Test 8: Cross-Browser Testing

**Goal:** Verify cart works in all major browsers

### Browsers to Test:
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)

### For Each Browser:

1. **Run Test 1** (Basic Cart Persistence)
2. **Run Test 3** (Cart Drawer Functionality)
3. **Check console** for errors

### Success Criteria:
- ✅ Cart works in all browsers
- ✅ No browser-specific errors
- ✅ UI looks correct in all browsers

---

## Test 9: Mobile Testing

**Goal:** Verify cart works on mobile devices

### Devices to Test:
- [ ] iPhone (Safari)
- [ ] Android (Chrome)

### Or Use Browser DevTools:
- Chrome DevTools → Toggle device toolbar (Cmd+Shift+M)
- Select iPhone or Android device

### Steps:

1. **Add item to cart**
   - **Expected:** Cart drawer opens
   - **Expected:** Drawer is mobile-responsive

2. **Check drawer on mobile**
   - **Expected:** Drawer takes up most of screen
   - **Expected:** All buttons are tappable
   - **Expected:** Text is readable

3. **Test quantity controls**
   - **Expected:** + and - buttons work on touch

4. **Close drawer**
   - **Expected:** Can close by tapping backdrop

### Success Criteria:
- ✅ Cart drawer is mobile-responsive
- ✅ All controls work on touch
- ✅ Text is readable on small screens

---

## Test 10: Edge Cases

**Goal:** Test unusual scenarios

### Test A: Empty Cart

1. Remove all items from cart
2. **Expected:** "Your cart is empty" message shows
3. **Expected:** Cart count shows 0 or is hidden

### Test B: Out of Stock

1. Try to add out-of-stock item (if available)
2. **Expected:** Appropriate error message
3. **Expected:** Item not added to cart

### Test C: Session Expiry

1. Add items to cart
2. Wait 30 minutes (or clear cookies)
3. Reload page
4. **Expected:** Cart may be empty (session expired)
5. **Note:** This is normal Shopify behavior

### Test D: JavaScript Disabled

1. Disable JavaScript in browser
2. Reload page
3. **Expected:** Fallback link to `/cart` shows
4. **Expected:** Can still access cart page

---

## Troubleshooting Guide

### Issue: Cart drawer doesn't open

**Possible Causes:**
- JavaScript error preventing execution
- `window.WTF_CART` not defined
- Event listener not attached

**Debug Steps:**
1. Check console for errors
2. Type `window.WTF_CART` in console
3. Check if cart icon has `data-cart-open` attribute
4. Verify `wtf-cart-drawer.liquid` is included in theme

### Issue: Cart doesn't persist

**Possible Causes:**
- Cookies disabled
- Session expired
- `/cart.js` not returning data

**Debug Steps:**
1. Check if cookies are enabled
2. Check Network tab for `/cart.js` request
3. Verify response contains cart data
4. Check console for hydration errors

### Issue: Cart count doesn't update

**Possible Causes:**
- Event listeners not working
- `data-cart-count` element not found
- Events not being dispatched

**Debug Steps:**
1. Check if `data-cart-count` element exists
2. Verify events are dispatched (check console)
3. Check if event listeners are attached

### Issue: Console shows errors

**Common Errors:**
- `404 for persistent-cart.js` → Should be fixed in this branch
- `WTFCartAPI is not defined` → Script loading order issue
- `Cannot read property 'open' of undefined` → WTF_CART not initialized

**Debug Steps:**
1. Check which script is causing error
2. Verify script exists in assets folder
3. Check script loading order in theme.liquid

---

## Success Checklist

After completing all tests, verify:

- [ ] Cart persists across page reloads
- [ ] Cart persists across page navigation
- [ ] Cart drawer opens when clicking cart icon
- [ ] Cart count updates in real-time
- [ ] Multiple items can be added
- [ ] Quantity controls work
- [ ] Remove button works
- [ ] Custom properties persist
- [ ] No JavaScript errors in console
- [ ] No 404 errors for scripts
- [ ] Works in all major browsers
- [ ] Works on mobile devices
- [ ] Debug logging appears in console

---

## Reporting Issues

If you find issues during testing:

1. **Document the issue:**
   - What you did (steps to reproduce)
   - What you expected
   - What actually happened
   - Browser and device
   - Console errors (screenshot)

2. **Check if it's a known issue:**
   - Review CART_PERSISTENCE_ANALYSIS.md
   - Review BACKEND_VALIDATION_REPORT.md

3. **Report in GitHub:**
   - Create issue in repository
   - Include all documentation
   - Tag with `bug` label

---

## Final Validation

Before marking as complete:

- [ ] All 10 tests passed
- [ ] No critical errors found
- [ ] Works in all target browsers
- [ ] Works on mobile devices
- [ ] Debug logging shows correct data
- [ ] Cart persistence reliable
- [ ] User experience smooth

---

**Testing Guide Version:** 1.0  
**Last Updated:** October 18, 2025  
**Status:** ✅ READY FOR TESTING

