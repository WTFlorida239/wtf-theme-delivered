/**
 * WTF Error Prevention & Safe Defaults
 * 
 * This script provides safe fallbacks for all WTF APIs to prevent
 * "is not a function" errors that break cart functionality.
 * 
 * Must load BEFORE any code that calls these APIs.
 */

(function() {
  'use strict';

  // ============================================================================
  // 1. WTFAnalytics Safe Defaults
  // ============================================================================
  
  const noop = function() {};
  
  const analyticsAPI = {
    init: noop,
    identify: noop,
    trackPageView: noop,
    trackViewItem: noop,
    trackAddToCart: noop,
    trackRemoveFromCart: noop,
    trackCheckoutStart: noop,
    trackPurchase: noop,
    trackSearch: noop,
    trackCustomEvent: noop
  };
  
  // Merge with existing (if any), but don't overwrite real implementations
  window.WTFAnalytics = Object.assign({}, analyticsAPI, window.WTFAnalytics || {});
  
  console.info('[WTF] Analytics API initialized with safe defaults');

  // ============================================================================
  // 2. WTFConfig Safe Defaults & Helper Methods
  // ============================================================================
  
  // Add .get() method if it doesn't exist
  if (window.WTFConfig && typeof window.WTFConfig.get !== 'function') {
    window.WTFConfig.get = function(path, defaultValue) {
      if (!path) return defaultValue;
      
      const keys = path.split('.');
      let current = window.WTFConfig;
      
      for (const key of keys) {
        if (current && typeof current === 'object' && key in current) {
          current = current[key];
        } else {
          return defaultValue;
        }
      }
      
      return current !== undefined ? current : defaultValue;
    };
    
    console.info('[WTF] Added WTFConfig.get() helper method');
  }

  // ============================================================================
  // 3. Integration Feature Flags
  // ============================================================================
  
  window.WTF_FEATURES = window.WTF_FEATURES || {};
  
  // Check if integrations are actually configured
  const lightspeedEnabled = window.WTFConfig?.integrations?.lightspeed?.enabled && 
                           window.WTFConfig?.integrations?.lightspeed?.accountId;
  
  const twoAcceptEnabled = window.WTFConfig?.integrations?.twoaccept?.enabled && 
                          window.WTFConfig?.integrations?.twoaccept?.publicKey;
  
  // Set feature flags (can be overridden by settings)
  window.WTF_FEATURES.lightspeed = lightspeedEnabled || false;
  window.WTF_FEATURES.twoaccept = twoAcceptEnabled || false;
  window.WTF_FEATURES.analytics = true; // Always enabled (uses safe stubs)
  
  console.info('[WTF] Feature flags:', window.WTF_FEATURES);

  // ============================================================================
  // 4. Safe Integration Initializers
  // ============================================================================
  
  // Lightspeed safe initializer
  window.initLightspeedSafe = function() {
    if (!window.WTF_FEATURES.lightspeed) {
      console.info('[WTF] Lightspeed integration disabled');
      return;
    }
    
    if (typeof window.WTFLightspeed?.init === 'function') {
      try {
        window.WTFLightspeed.init();
        console.info('[WTF] Lightspeed integration initialized');
      } catch (error) {
        console.warn('[WTF] Lightspeed init failed:', error);
        window.WTF_FEATURES.lightspeed = false;
      }
    } else {
      console.warn('[WTF] Lightspeed integration not available');
      window.WTF_FEATURES.lightspeed = false;
    }
  };
  
  // 2Accept safe initializer
  window.init2AcceptSafe = function() {
    if (!window.WTF_FEATURES.twoaccept) {
      console.info('[WTF] 2Accept integration disabled');
      return;
    }
    
    if (typeof window.WTF2Accept?.init === 'function') {
      try {
        window.WTF2Accept.init();
        console.info('[WTF] 2Accept integration initialized');
      } catch (error) {
        console.warn('[WTF] 2Accept init failed:', error);
        window.WTF_FEATURES.twoaccept = false;
      }
    } else {
      console.warn('[WTF] 2Accept integration not available');
      window.WTF_FEATURES.twoaccept = false;
    }
  };

  // ============================================================================
  // 5. Cart API Error Prevention
  // ============================================================================
  
  // Ensure cart API can always be called safely
  document.addEventListener('DOMContentLoaded', function() {
    // Wrap any existing cart add handlers with error catching
    const originalAddToCart = window.WTFCartAPI?.addToCart;
    
    if (originalAddToCart && typeof originalAddToCart === 'function') {
      window.WTFCartAPI.addToCart = function(data) {
        try {
          return originalAddToCart.call(this, data);
        } catch (error) {
          console.error('[WTF] Cart add error:', error);
          
          // Fallback: try direct Shopify API
          return fetch('/cart/add.js', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            },
            body: JSON.stringify({
              id: data.id || data.variantId,
              quantity: data.quantity || 1,
              properties: data.properties || {}
            })
          })
          .then(response => {
            if (!response.ok) throw new Error('Cart add failed');
            return response.json();
          })
          .then(item => {
            // Dispatch success event
            document.dispatchEvent(new CustomEvent('wtf:cart:add', {
              detail: { item } 
            }));
            return item;
          })
          .catch(err => {
            console.error('[WTF] Fallback cart add failed:', err);
            alert('Could not add item to cart. Please try again.');
            throw err;
          });
        }
      };
    }
  });

  // ============================================================================
  // 6. Global Error Handler
  // ============================================================================
  
  // Catch and log errors without breaking the page
  window.addEventListener('error', function(event) {
    // Don't break on integration errors
    if (event.message && (
      event.message.includes('Lightspeed') ||
      event.message.includes('2Accept') ||
      event.message.includes('WTFAnalytics') ||
      event.message.includes('WTFConfig')
    )) {
      console.warn('[WTF] Caught non-critical error:', event.message);
      event.preventDefault(); // Prevent error from breaking page
    }
  });

  console.info('[WTF] Error prevention initialized');
})();

