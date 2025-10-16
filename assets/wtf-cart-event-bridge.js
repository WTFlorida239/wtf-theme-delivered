/**
 * WTF Cart Event Bridge
 * Connects Dawn cart system with WTF analytics
 * Ensures wtf:cart:update events are dispatched for all cart operations
 */

(function() {
  'use strict';

  // Listen for wtf:cart:update events and forward to WTF analytics
  document.addEventListener('wtf:cart:update', function(event) {
    const cartData = event.detail;
    
    if (!cartData) return;

    // Log for debugging
    if (window.WTF_ANALYTICS_DEBUG) {
      console.log('[WTF Cart Bridge] Cart update event:', cartData);
    }

    // Update cart count in header
    updateCartCount(cartData.item_count);

    // If WTFAnalytics is available, track the event
    if (typeof window.WTFAnalytics !== 'undefined' && window.WTFAnalytics.track) {
      window.WTFAnalytics.track('cart_view', {
        currency: 'USD',
        value: (cartData.total_price || 0) / 100,
        items: cartData.items || []
      });
    }
  });

  // Listen for wtf:cart:add events specifically
  document.addEventListener('wtf:cart:add', function(event) {
    const detail = event.detail;
    
    if (!detail) return;

    // Log for debugging
    if (window.WTF_ANALYTICS_DEBUG) {
      console.log('[WTF Cart Bridge] Cart add event:', detail);
    }

    // If WTFAnalytics is available, track add to cart
    if (typeof window.WTFAnalytics !== 'undefined' && window.WTFAnalytics.track) {
      const item = detail.item || {};
      const cart = detail.cart || {};
      
      window.WTFAnalytics.track('add_to_cart', {
        currency: 'USD',
        value: (item.price || 0) / 100,
        items: [{
          item_id: item.variant_id || item.id,
          item_name: item.product_title || item.title,
          item_variant: item.variant_title,
          price: (item.price || 0) / 100,
          quantity: item.quantity || 1
        }]
      });
    }
  });

  // Helper function to update cart count
  function updateCartCount(count) {
    const cartCountElements = document.querySelectorAll('[data-cart-count]');
    cartCountElements.forEach(function(el) {
      el.textContent = count;
      el.setAttribute('data-cart-count', count);
      
      // Hide if count is 0
      if (count === 0) {
        el.style.display = 'none';
      } else {
        el.style.display = '';
      }
    });
  }

  // Subscribe to Dawn's PUB_SUB_EVENTS if available
  if (typeof subscribe !== 'undefined' && typeof PUB_SUB_EVENTS !== 'undefined') {
    // Listen for cartUpdate events from Dawn
    subscribe(PUB_SUB_EVENTS.cartUpdate, function(event) {
      if (window.WTF_ANALYTICS_DEBUG) {
        console.log('[WTF Cart Bridge] Dawn cart update:', event);
      }

      // Forward to wtf:cart:update
      if (event.cartData) {
        document.dispatchEvent(new CustomEvent('wtf:cart:update', {
          detail: event.cartData
        }));
      }
    });

    // Listen for cartError events
    subscribe(PUB_SUB_EVENTS.cartError, function(event) {
      console.error('[WTF Cart Bridge] Cart error:', event);
      
      // Show error message to user
      const errorMsg = event.message || event.errors || 'Unable to update cart';
      showCartError(errorMsg);
    });
  }

  // Helper function to show cart errors
  function showCartError(message) {
    // Try to find error container
    const errorContainer = document.getElementById('cart-errors') || 
                          document.getElementById('CartDrawer-CartErrors');
    
    if (errorContainer) {
      errorContainer.textContent = message;
      errorContainer.style.display = 'block';
      
      // Hide after 5 seconds
      setTimeout(function() {
        errorContainer.style.display = 'none';
      }, 5000);
    } else {
      // Fallback to alert
      alert(message);
    }
  }

  // Initialize cart count on page load
  window.addEventListener('DOMContentLoaded', function() {
    fetch('/cart.js', {
      headers: { 'Accept': 'application/json' }
    })
      .then(function(response) { return response.json(); })
      .then(function(cart) {
        updateCartCount(cart.item_count);
        
        // Dispatch initial cart update event
        document.dispatchEvent(new CustomEvent('wtf:cart:update', {
          detail: cart
        }));
      })
      .catch(function(error) {
        console.error('[WTF Cart Bridge] Failed to fetch cart:', error);
      });
  });

  console.log('[WTF Cart Bridge] Initialized');
})();

