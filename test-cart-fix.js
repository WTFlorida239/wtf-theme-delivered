/**
 * Test script to validate cart persistence fixes
 * This can be run in the browser console to test functionality
 */

class CartFixTester {
  constructor() {
    this.tests = [];
    this.passed = 0;
    this.failed = 0;
  }

  async runTests() {
    console.log('🧪 Running Cart Persistence Fix Tests...\n');
    
    await this.testCartSystemInitialization();
    await this.testCartAPIAccess();
    await this.testFormDetection();
    await this.testBackupSystem();
    await this.testEventDispatching();
    
    this.printResults();
  }

  async testCartSystemInitialization() {
    this.log('Test 1: Cart System Initialization');
    
    try {
      // Check if unified cart system is loaded
      if (window.WTFCartSystem) {
        this.pass('WTF Cart System is loaded');
        
        if (window.WTFCartSystem.initialized) {
          this.pass('Cart system is initialized');
        } else {
          this.fail('Cart system is not initialized');
        }
        
        // Check for conflicting systems
        if (!window.WTF_CART_PERSISTENCE) {
          this.pass('Conflicting cart persistence system is disabled');
        } else {
          this.warning('Multiple cart systems may be active');
        }
      } else {
        this.fail('WTF Cart System is not loaded');
      }
    } catch (error) {
      this.fail(`Cart system initialization error: ${error.message}`);
    }
  }

  async testCartAPIAccess() {
    this.log('\nTest 2: Shopify Cart API Access');
    
    try {
      const response = await fetch('/cart.js', {
        headers: {
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest'
        },
        credentials: 'same-origin'
      });
      
      if (response.ok) {
        const cart = await response.json();
        this.pass('Cart API is accessible');
        this.log(`  - Current cart: ${cart.item_count} items, $${(cart.total_price / 100).toFixed(2)}`);
        this.log(`  - Cart token: ${cart.token}`);
      } else {
        this.fail(`Cart API returned status ${response.status}`);
      }
    } catch (error) {
      this.fail(`Cart API error: ${error.message}`);
    }
  }

  async testFormDetection() {
    this.log('\nTest 3: Cart Form Detection');
    
    try {
      // Create test forms with different attributes
      const testForms = [
        { attr: 'data-wtf-ajax', name: 'WTF AJAX form' },
        { attr: 'data-cart-form', name: 'Cart form' },
        { class: 'drink-builder-form', name: 'Drink builder form' }
      ];
      
      testForms.forEach(({ attr, class: className, name }) => {
        const form = document.createElement('form');
        if (attr) form.setAttribute(attr, 'true');
        if (className) form.className = className;
        
        const input = document.createElement('input');
        input.name = 'id';
        input.value = 'test-variant';
        form.appendChild(input);
        
        if (window.WTFCartSystem && window.WTFCartSystem.isCartForm(form)) {
          this.pass(`${name} detected correctly`);
        } else {
          this.fail(`${name} not detected`);
        }
      });
    } catch (error) {
      this.fail(`Form detection error: ${error.message}`);
    }
  }

  async testBackupSystem() {
    this.log('\nTest 4: Cart Backup System');
    
    try {
      if (window.WTFCartSystem && typeof window.WTFCartSystem.backupCartData === 'function') {
        // Test backup functionality
        const testData = {
          variantId: 'test-123',
          quantity: 1,
          properties: { 'Test Property': 'Test Value' }
        };
        
        window.WTFCartSystem.backupCartData(testData);
        const restored = window.WTFCartSystem.restoreCartFromBackup();
        
        if (restored && restored.variantId === testData.variantId) {
          this.pass('Cart backup system works');
          
          // Clean up test backup
          window.WTFCartSystem.clearCartBackup();
          this.pass('Cart backup cleanup works');
        } else {
          this.fail('Cart backup/restore failed');
        }
      } else {
        this.fail('Cart backup system not available');
      }
    } catch (error) {
      this.fail(`Backup system error: ${error.message}`);
    }
  }

  async testEventDispatching() {
    this.log('\nTest 5: Event Dispatching');
    
    try {
      let eventReceived = false;
      
      const eventListener = (event) => {
        eventReceived = true;
        console.log(`  - Received event: ${event.type}`, event.detail);
      };
      
      // Listen for cart events
      document.addEventListener('wtf:cart:update', eventListener, { once: true });
      
      // Dispatch test event
      const testCart = { item_count: 1, total_price: 800 };
      document.dispatchEvent(new CustomEvent('wtf:cart:update', {
        detail: { cart: testCart }
      }));
      
      // Wait for event processing
      await new Promise(resolve => setTimeout(resolve, 100));
      
      if (eventReceived) {
        this.pass('Cart events are working');
      } else {
        this.fail('Cart events not working');
      }
    } catch (error) {
      this.fail(`Event dispatching error: ${error.message}`);
    }
  }

  log(message) {
    console.log(message);
  }

  pass(message) {
    console.log(`✅ ${message}`);
    this.passed++;
  }

  fail(message) {
    console.log(`❌ ${message}`);
    this.failed++;
  }

  warning(message) {
    console.log(`⚠️  ${message}`);
  }

  printResults() {
    console.log('\n' + '='.repeat(50));
    console.log('🧪 Cart Fix Test Results');
    console.log('='.repeat(50));
    console.log(`Total Tests: ${this.passed + this.failed}`);
    console.log(`Passed: ${this.passed} ✅`);
    console.log(`Failed: ${this.failed} ❌`);
    
    if (this.failed === 0) {
      console.log('\n🎉 All tests passed! Cart persistence should be working correctly.');
    } else {
      console.log(`\n⚠️  ${this.failed} test(s) failed. Cart persistence may have issues.`);
    }
    
    console.log('\n📋 Recommendations:');
    if (this.failed === 0) {
      console.log('✅ Cart system is properly configured');
      console.log('✅ Test adding items to cart on your pages');
      console.log('✅ Verify cart persists across page refreshes');
    } else {
      console.log('❌ Review failed tests above');
      console.log('❌ Check browser console for JavaScript errors');
      console.log('❌ Ensure all cart scripts are loaded correctly');
    }
  }
}

// Auto-run if in browser
if (typeof window !== 'undefined') {
  window.CartFixTester = CartFixTester;
  
  // Wait for page to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(() => {
        const tester = new CartFixTester();
        tester.runTests();
      }, 1000);
    });
  } else {
    setTimeout(() => {
      const tester = new CartFixTester();
      tester.runTests();
    }, 1000);
  }
}

// Export for manual testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CartFixTester;
}