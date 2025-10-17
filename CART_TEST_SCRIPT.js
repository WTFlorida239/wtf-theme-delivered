/**
 * WTF Cart Persistence Test Script
 * 
 * Copy and paste this entire script into the browser console on wtfswag.com
 * to verify cart persistence is working correctly.
 * 
 * Usage:
 * 1. Open wtfswag.com
 * 2. Open DevTools (F12 or Cmd+Option+I)
 * 3. Go to Console tab
 * 4. Paste this entire script and press Enter
 * 5. Follow the instructions in the console
 */

(async function testCartPersistence() {
  console.log('%c🧪 WTF Cart Persistence Test Suite', 'font-size: 20px; font-weight: bold; color: #ff6600;');
  console.log('%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'color: #ccc;');
  
  const results = {
    passed: [],
    failed: [],
    warnings: []
  };

  function pass(test) {
    results.passed.push(test);
    console.log('%c✅ PASS:', 'color: #28a745; font-weight: bold;', test);
  }

  function fail(test, reason) {
    results.failed.push({ test, reason });
    console.log('%c❌ FAIL:', 'color: #dc3545; font-weight: bold;', test);
    console.log('%c   Reason:', 'color: #dc3545;', reason);
  }

  function warn(test, reason) {
    results.warnings.push({ test, reason });
    console.log('%c⚠️  WARN:', 'color: #ffc107; font-weight: bold;', test);
    console.log('%c   Reason:', 'color: #ffc107;', reason);
  }

  console.log('\n%c📋 Test 1: Check WTFCartAPI is loaded', 'font-size: 14px; font-weight: bold;');
  if (typeof window.WTFCartAPI !== 'undefined') {
    pass('WTFCartAPI is available');
    
    const methods = ['getCart', 'addToCart', 'updateCart', 'removeFromCart', 'clearCart'];
    methods.forEach(method => {
      if (typeof window.WTFCartAPI[method] === 'function') {
        pass(`WTFCartAPI.${method}() exists`);
      } else {
        fail(`WTFCartAPI.${method}() exists`, `Method not found`);
      }
    });
  } else {
    fail('WTFCartAPI is available', 'window.WTFCartAPI is undefined');
    console.log('%c⚠️  Cannot continue tests without WTFCartAPI', 'color: #ffc107; font-weight: bold;');
    return;
  }

  console.log('\n%c📋 Test 2: Check cart drawer element exists', 'font-size: 14px; font-weight: bold;');
  const drawer = document.getElementById('wtf-cart-drawer');
  if (drawer) {
    pass('Cart drawer element exists');
  } else {
    warn('Cart drawer element exists', 'Element #wtf-cart-drawer not found');
  }

  console.log('\n%c📋 Test 3: Check cart count element exists', 'font-size: 14px; font-weight: bold;');
  const cartCount = document.querySelector('[data-cart-count]');
  if (cartCount) {
    pass('Cart count element exists');
    console.log('   Current count:', cartCount.textContent);
  } else {
    warn('Cart count element exists', 'Element [data-cart-count] not found');
  }

  console.log('\n%c📋 Test 4: Fetch current cart state', 'font-size: 14px; font-weight: bold;');
  try {
    const cart = await window.WTFCartAPI.getCart();
    pass('Successfully fetched cart from /cart.js');
    console.log('   Item count:', cart.item_count);
    console.log('   Total price:', (cart.total_price / 100).toFixed(2), cart.currency);
    console.log('   Items:', cart.items.length);
    
    if (cart.items.length > 0) {
      console.log('\n   Current cart items:');
      cart.items.forEach((item, idx) => {
        console.log(`   ${idx + 1}. ${item.product_title} - ${item.variant_title || 'Default'} (Qty: ${item.quantity})`);
        if (item.properties && Object.keys(item.properties).length > 0) {
          console.log('      Properties:', item.properties);
        }
      });
    }
  } catch (error) {
    fail('Successfully fetched cart from /cart.js', error.message);
  }

  console.log('\n%c📋 Test 5: Check event listeners are registered', 'font-size: 14px; font-weight: bold;');
  let eventsFired = {
    'wtf:cart:update': false,
    'wtf:cart:add': false
  };

  // Add temporary listeners
  const updateListener = () => { eventsFired['wtf:cart:update'] = true; };
  const addListener = () => { eventsFired['wtf:cart:add'] = true; };
  
  document.addEventListener('wtf:cart:update', updateListener);
  document.addEventListener('wtf:cart:add', addListener);

  console.log('   Listeners registered for testing');
  pass('Event listeners can be attached');

  console.log('\n%c📋 Test 6: Test add to cart (if variant ID available)', 'font-size: 14px; font-weight: bold;');
  
  // Try to find a variant ID from the page
  const variantInput = document.querySelector('input[name="id"]');
  
  if (variantInput && variantInput.value) {
    const testVariantId = variantInput.value;
    console.log('   Found variant ID:', testVariantId);
    console.log('   %cℹ️  This will add 1 item to your cart. Continue? (y/n)', 'color: #0066cc;');
    console.log('   %cTo test: window.testAddToCart()', 'color: #0066cc; font-style: italic;');
    
    // Expose test function
    window.testAddToCart = async function() {
      console.log('\n%c🧪 Running add to cart test...', 'color: #ff6600; font-weight: bold;');
      
      try {
        const item = await window.WTFCartAPI.addToCart({
          id: testVariantId,
          quantity: 1,
          properties: {
            'Test': 'Cart Persistence Test',
            'Timestamp': new Date().toISOString()
          }
        });
        
        pass('Item added to cart successfully');
        console.log('   Added item:', item.product_title, '-', item.variant_title);
        
        // Wait a bit for events to fire
        await new Promise(resolve => setTimeout(resolve, 500));
        
        if (eventsFired['wtf:cart:update']) {
          pass('wtf:cart:update event fired');
        } else {
          fail('wtf:cart:update event fired', 'Event did not fire');
        }
        
        if (eventsFired['wtf:cart:add']) {
          pass('wtf:cart:add event fired');
        } else {
          fail('wtf:cart:add event fired', 'Event did not fire');
        }
        
        // Check if cart count updated
        const newCount = document.querySelector('[data-cart-count]');
        if (newCount) {
          console.log('   New cart count:', newCount.textContent);
        }
        
        // Check if drawer opened
        const drawer = document.getElementById('wtf-cart-drawer');
        if (drawer && drawer.getAttribute('aria-hidden') === 'false') {
          pass('Cart drawer opened automatically');
        } else {
          warn('Cart drawer opened automatically', 'Drawer did not open (may be expected behavior)');
        }
        
        console.log('\n%c✅ Add to cart test complete!', 'color: #28a745; font-weight: bold;');
        console.log('%cℹ️  Now navigate to another page or reload to test persistence', 'color: #0066cc;');
        
      } catch (error) {
        fail('Item added to cart successfully', error.message);
      }
      
      // Clean up listeners
      document.removeEventListener('wtf:cart:update', updateListener);
      document.removeEventListener('wtf:cart:add', addListener);
    };
    
    pass('Test variant ID found - testAddToCart() function available');
  } else {
    warn('Test variant ID found', 'No variant ID found on page - navigate to a product page first');
  }

  console.log('\n%c📋 Test 7: Check localStorage for shadow carts', 'font-size: 14px; font-weight: bold;');
  const shadowCart = localStorage.getItem('wtf-cart');
  if (shadowCart) {
    fail('No localStorage shadow cart', 'Found localStorage cart - this should not exist!');
    console.log('   Shadow cart data:', shadowCart);
    console.log('   %cTo clear: localStorage.removeItem("wtf-cart")', 'color: #0066cc; font-style: italic;');
  } else {
    pass('No localStorage shadow cart found');
  }

  console.log('\n%c📋 Test 8: Check Shopify cart cookie', 'font-size: 14px; font-weight: bold;');
  const cookies = document.cookie.split(';').map(c => c.trim());
  const cartCookie = cookies.find(c => c.startsWith('cart='));
  if (cartCookie) {
    pass('Shopify cart cookie exists');
    console.log('   Cookie:', cartCookie.substring(0, 50) + '...');
  } else {
    warn('Shopify cart cookie exists', 'No cart cookie found - may need to add an item first');
  }

  console.log('\n%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'color: #ccc;');
  console.log('%c📊 Test Results Summary', 'font-size: 16px; font-weight: bold; color: #ff6600;');
  console.log('%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'color: #ccc;');
  
  console.log('%c✅ Passed:', 'color: #28a745; font-weight: bold;', results.passed.length);
  results.passed.forEach(test => {
    console.log('   •', test);
  });
  
  if (results.warnings.length > 0) {
    console.log('\n%c⚠️  Warnings:', 'color: #ffc107; font-weight: bold;', results.warnings.length);
    results.warnings.forEach(({ test, reason }) => {
      console.log('   •', test);
      console.log('     →', reason);
    });
  }
  
  if (results.failed.length > 0) {
    console.log('\n%c❌ Failed:', 'color: #dc3545; font-weight: bold;', results.failed.length);
    results.failed.forEach(({ test, reason }) => {
      console.log('   •', test);
      console.log('     →', reason);
    });
  }
  
  console.log('\n%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'color: #ccc;');
  
  if (results.failed.length === 0) {
    console.log('%c🎉 All critical tests passed!', 'font-size: 18px; color: #28a745; font-weight: bold;');
  } else {
    console.log('%c⚠️  Some tests failed - review above', 'font-size: 18px; color: #dc3545; font-weight: bold;');
  }
  
  console.log('\n%c📝 Next Steps:', 'font-size: 14px; font-weight: bold;');
  console.log('1. If variant ID found, run: %ctestAddToCart()', 'color: inherit;', 'color: #0066cc; font-style: italic;');
  console.log('2. Navigate to another page or reload');
  console.log('3. Run this test script again to verify cart persisted');
  console.log('4. Check cart count badge and drawer');
  
  console.log('\n%c🔧 Debugging Commands:', 'font-size: 14px; font-weight: bold;');
  console.log('%cWTFCartAPI.getCart()', 'color: #0066cc; font-style: italic;', '- Fetch current cart');
  console.log('%cWTFCartAPI.clearCart()', 'color: #0066cc; font-style: italic;', '- Clear entire cart');
  console.log('%clocalStorage.clear()', 'color: #0066cc; font-style: italic;', '- Clear localStorage');
  console.log('%cwindow.WTF_CART.open()', 'color: #0066cc; font-style: italic;', '- Open cart drawer');
  console.log('%cwindow.WTF_CART.refresh()', 'color: #0066cc; font-style: italic;', '- Refresh cart drawer');
  
  console.log('\n%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'color: #ccc;');
  
  return {
    passed: results.passed.length,
    warnings: results.warnings.length,
    failed: results.failed.length,
    total: results.passed.length + results.warnings.length + results.failed.length
  };
})();

