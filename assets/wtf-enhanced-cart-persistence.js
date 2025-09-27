/**
 * WTF Enhanced Cart Persistence System
 * Ensures all product customizations persist properly in cart
 * Handles: Kratom Tea, Kava Drinks, THC Drinks, THC Shots, and all custom builders
 */

(function() {
  'use strict';

  // Enhanced cart persistence configuration
  const WTF_CART_CONFIG = {
    debug: false,
    storage: {
      key: 'wtf_cart_backup',
      ttl: 24 * 60 * 60 * 1000 // 24 hours
    },
    validation: {
      required: ['id', 'quantity'],
      properties: {
        kratom: ['Strain', 'Size', 'Flavors & Pumps'],
        kava: ['Size', 'Boosters', 'Sweeteners', 'Creamers'],
        thc_drinks: ['Size', 'Flavor', 'Ice'],
        thc_shots: ['Flavor', 'Ice']
      }
    }
  };

  // Utility functions
  function log(...args) {
    if (WTF_CART_CONFIG.debug) {
      console.log('[WTF Cart Persistence]', ...args);
    }
  }

  function getTimestamp() {
    return new Date().toISOString();
  }

  function generateOrderId() {
    return 'wtf_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  // Enhanced form data extraction
  function extractFormData(form) {
    const formData = new FormData(form);
    const data = {
      id: formData.get('id'),
      quantity: parseInt(formData.get('quantity') || '1', 10),
      properties: {},
      timestamp: getTimestamp(),
      orderId: generateOrderId()
    };

    // Extract all line item properties
    for (const [key, value] of formData.entries()) {
      if (key.startsWith('properties[') && key.endsWith(']')) {
        const propName = key.slice(11, -1); // Remove 'properties[' and ']'
        if (value && value.trim()) {
          data.properties[propName] = value.trim();
        }
      }
    }

    // Extract product type from form or URL
    const productType = form.dataset.productType || 
                       form.querySelector('[name="properties[Product Type]"]')?.value ||
                       detectProductType(window.location.pathname);
    
    if (productType) {
      data.properties['Product Type'] = productType;
    }

    log('Extracted form data:', data);
    return data;
  }

  // Detect product type from URL or form context
  function detectProductType(pathname) {
    if (pathname.includes('kratom')) return 'Kratom Tea';
    if (pathname.includes('kava')) return 'Kava Drink';
    if (pathname.includes('thc-drinks')) return 'THC Drinks';
    if (pathname.includes('thc-shots')) return 'THC Shots';
    return 'Unknown';
  }

  // Validate cart item data
  function validateCartItem(data) {
    const errors = [];

    // Check required fields
    WTF_CART_CONFIG.validation.required.forEach(field => {
      if (!data[field]) {
        errors.push(`Missing required field: ${field}`);
      }
    });

    // Validate quantity
    if (data.quantity < 1 || data.quantity > 50) {
      errors.push('Quantity must be between 1 and 50');
    }

    // Product-specific validation
    const productType = data.properties['Product Type']?.toLowerCase();
    if (productType && WTF_CART_CONFIG.validation.properties[productType]) {
      const requiredProps = WTF_CART_CONFIG.validation.properties[productType];
      requiredProps.forEach(prop => {
        if (!data.properties[prop]) {
          errors.push(`Missing required property for ${productType}: ${prop}`);
        }
      });
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Enhanced local storage backup
  function backupToLocalStorage(data) {
    try {
      const backup = {
        timestamp: getTimestamp(),
        data: data,
        ttl: Date.now() + WTF_CART_CONFIG.storage.ttl
      };
      localStorage.setItem(WTF_CART_CONFIG.storage.key, JSON.stringify(backup));
      log('Backed up to localStorage:', backup);
    } catch (error) {
      console.warn('Failed to backup to localStorage:', error);
    }
  }

  // Restore from local storage if needed
  function restoreFromLocalStorage() {
    try {
      const backup = localStorage.getItem(WTF_CART_CONFIG.storage.key);
      if (!backup) return null;

      const parsed = JSON.parse(backup);
      if (Date.now() > parsed.ttl) {
        localStorage.removeItem(WTF_CART_CONFIG.storage.key);
        return null;
      }

      log('Restored from localStorage:', parsed);
      return parsed.data;
    } catch (error) {
      console.warn('Failed to restore from localStorage:', error);
      return null;
    }
  }

  // Enhanced AJAX cart submission
  async function submitToCart(data) {
    const body = new URLSearchParams();
    
    // Add basic fields
    body.set('id', String(data.id));
    body.set('quantity', String(data.quantity));
    
    // Add all properties
    Object.entries(data.properties).forEach(([key, value]) => {
      body.set(`properties[${key}]`, String(value));
    });

    // Add metadata
    body.set('properties[Order ID]', data.orderId);
    body.set('properties[Added At]', data.timestamp);

    log('Submitting to cart:', Object.fromEntries(body));

    const response = await fetch('/cart/add.js', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'Accept': 'application/json',
      },
      credentials: 'same-origin',
      body: body
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.description || errorData.message || `HTTP ${response.status}`);
    }

    return await response.json();
  }

  // Update cart count in UI
  async function updateCartCount() {
    try {
      const response = await fetch('/cart.js', { credentials: 'same-origin' });
      if (response.ok) {
        const cart = await response.json();
        
        // Update all cart count elements
        document.querySelectorAll('[data-cart-count]').forEach(el => {
          el.textContent = cart.item_count || 0;
          el.hidden = cart.item_count === 0;
        });

        // Update cart badge
        const badge = document.querySelector('.cart-badge, .header-cart-count');
        if (badge) {
          badge.textContent = cart.item_count || 0;
          badge.style.display = cart.item_count > 0 ? 'block' : 'none';
        }

        log('Updated cart count:', cart.item_count);
        return cart;
      }
    } catch (error) {
      console.warn('Failed to update cart count:', error);
    }
    return null;
  }

  // Show success message
  function showSuccessMessage(data) {
    const message = document.createElement('div');
    message.className = 'wtf-cart-success';
    message.innerHTML = `
      <div class="success-content">
        <span class="success-icon">✅</span>
        <div class="success-text">
          <strong>Added to cart!</strong><br>
          ${data.properties['Product Type'] || 'Item'} - ${data.properties.Size || 'Standard'}
          ${data.properties.Flavor ? `<br>Flavor: ${data.properties.Flavor}` : ''}
        </div>
      </div>
    `;
    
    // Style the message
    Object.assign(message.style, {
      position: 'fixed',
      top: '20px',
      right: '20px',
      background: '#d4edda',
      color: '#155724',
      padding: '15px 20px',
      borderRadius: '8px',
      border: '1px solid #c3e6cb',
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
      zIndex: '10000',
      maxWidth: '300px',
      fontSize: '14px',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    });

    document.body.appendChild(message);

    // Auto-remove after 4 seconds
    setTimeout(() => {
      if (message.parentNode) {
        message.style.opacity = '0';
        message.style.transform = 'translateX(100%)';
        setTimeout(() => message.remove(), 300);
      }
    }, 4000);
  }

  // Enhanced form submission handler
  async function handleFormSubmission(form, event) {
    event.preventDefault();
    
    const submitButton = form.querySelector('[type="submit"]');
    const originalText = submitButton?.textContent || 'Add to Cart';
    
    try {
      // Extract and validate data
      const data = extractFormData(form);
      const validation = validateCartItem(data);
      
      if (!validation.isValid) {
        alert('❗ Please complete your selection:\n' + validation.errors.join('\n'));
        return;
      }

      // Update button state
      if (submitButton) {
        submitButton.disabled = true;
        submitButton.textContent = '⏳ Adding...';
      }

      // Backup to localStorage first
      backupToLocalStorage(data);

      // Submit to Shopify cart
      const result = await submitToCart(data);
      log('Cart submission successful:', result);

      // Update UI
      const cart = await updateCartCount();
      showSuccessMessage(data);

      // Dispatch events for other components
      const detail = { cart, last_added: result, data };
      document.dispatchEvent(new CustomEvent('wtf:cart:update', { detail }));
      document.dispatchEvent(new CustomEvent('cart:updated', { detail: cart }));
      document.dispatchEvent(new CustomEvent('cart:added', { detail: { item: result, cart } }));

      // Try to open cart drawer if available
      if (window.WTF_CART?.open) {
        window.WTF_CART.open();
      }

      // Reset form if it's a builder
      if (form.classList.contains('drink-builder-form')) {
        setTimeout(() => {
          form.reset();
          // Reset any custom UI state
          form.querySelectorAll('.selected').forEach(el => el.classList.remove('selected'));
        }, 1000);
      }

    } catch (error) {
      console.error('Cart submission failed:', error);
      alert(`❌ Failed to add to cart: ${error.message}`);
      
      // Try to restore from backup if main submission failed
      const backup = restoreFromLocalStorage();
      if (backup) {
        log('Attempting to restore from backup...');
        // Could implement retry logic here
      }
      
    } finally {
      // Reset button state
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = originalText;
      }
    }
  }

  // Initialize enhanced cart persistence
  function initializeCartPersistence() {
    log('Initializing enhanced cart persistence...');

    // Handle all forms with cart submission
    document.addEventListener('submit', (event) => {
      const form = event.target;
      if (!(form instanceof HTMLFormElement)) return;

      // Check if this is a cart form
      const isCartForm = form.matches('[data-wtf-ajax]') || 
                        form.matches('.drink-builder-form') ||
                        form.querySelector('[name="id"]') ||
                        form.action.includes('/cart/add');

      if (isCartForm) {
        handleFormSubmission(form, event);
      }
    });

    // Handle dynamic forms (for builders loaded via AJAX)
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === 1) { // Element node
            const forms = node.matches?.('form') ? [node] : node.querySelectorAll?.('form') || [];
            forms.forEach(form => {
              if (form.matches('[data-wtf-ajax], .drink-builder-form') && !form.dataset.wtfEnhanced) {
                form.dataset.wtfEnhanced = 'true';
                log('Enhanced dynamic form:', form);
              }
            });
          }
        });
      });
    });

    observer.observe(document.body, { childList: true, subtree: true });

    // Check for any failed submissions on page load
    const backup = restoreFromLocalStorage();
    if (backup) {
      log('Found backup data on page load:', backup);
      // Could show a "Resume order?" prompt here
    }

    log('Enhanced cart persistence initialized successfully');
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeCartPersistence);
  } else {
    initializeCartPersistence();
  }

  // Expose API for debugging and external use
  window.WTF_CART_PERSISTENCE = {
    config: WTF_CART_CONFIG,
    extractFormData,
    validateCartItem,
    submitToCart,
    updateCartCount,
    restoreFromLocalStorage,
    log
  };

})();
