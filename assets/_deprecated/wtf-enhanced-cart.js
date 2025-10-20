/**
 * DEPRECATED – superseded by wtf-cart-api.js and wtf-cart-ui.js.
 * This file is no longer included in theme.liquid and will be removed in a future release.
 */

/* WTF Enhanced AJAX Cart System - UNIFIED VERSION
   - Handles all cart operations with proper persistence
   - Supports line item properties for custom drinks
   - Provides real-time cart updates and feedback
   - Includes error handling and retry logic
   - Unified system to prevent conflicts between multiple cart handlers
*/

class WTFCart {
  constructor() {
    this.isLoading = false;
    this.retryCount = 0;
    this.maxRetries = 3;
    this.initialized = false;
    this.eventListenersAttached = false;
    
    // Backup configuration
    this.backupConfig = {
      key: 'wtf_cart_backup',
      ttl: 24 * 60 * 60 * 1000 // 24 hours
    };
    
    this.init();
  }

  init() {
    // Prevent double initialization
    if (this.initialized) return;
    
    this.attachEventListeners();
    this.updateCartCount();
    this.initializeCartDrawer();
    this.initializeFormObserver();
    this.restoreCartFromBackup();
    
    this.initialized = true;
    
    // Dispatch initialization event
    document.dispatchEvent(new CustomEvent('wtf:cart:ready', {
      detail: { cartSystem: this }
    }));
  }

  attachEventListeners() {
    // Prevent duplicate event listeners
    if (this.eventListenersAttached) return;
    
    // Handle form submissions with data-wtf-ajax attribute OR cart-enabled forms
    document.addEventListener('submit', (e) => {
      const form = e.target;
      if (!(form instanceof HTMLFormElement)) return;
      
      // Check if this is a cart form (multiple ways to identify)
      const isCartForm = form.matches('[data-wtf-ajax]') || 
                        form.matches('.drink-builder-form') ||
                        form.matches('[data-cart-form]') ||
                        form.querySelector('[name="id"]') ||
                        form.action.includes('/cart/add');
      
      if (isCartForm) {
        e.preventDefault();
        this.handleAddToCart(form);
      }
    });

    // Handle cart updates
    document.addEventListener('change', (e) => {
      if (e.target.matches('.quantity-selector__input')) {
        this.handleQuantityChange(e.target);
      }
    });

    // Handle item removal
    document.addEventListener('click', (e) => {
      if (e.target.matches('.cart-item__remove-button') || e.target.closest('.cart-item__remove-button')) {
        e.preventDefault();
        const button = e.target.closest('.cart-item__remove-button');
        this.handleRemoveItem(button.dataset.variantId);
      }
    });

    // Handle quantity buttons
    document.addEventListener('click', (e) => {
      if (e.target.matches('.quantity-selector__button') || e.target.closest('.quantity-selector__button')) {
        e.preventDefault();
        const button = e.target.closest('.quantity-selector__button');
        this.handleQuantityButton(button);
      }
    });
    
    this.eventListenersAttached = true;
  }

  async handleAddToCart(form) {
    if (this.isLoading) return;

    const submitButton = form.querySelector('[type="submit"]');
    const originalText = submitButton ? submitButton.textContent : '';
    
    try {
      this.isLoading = true;
      this.setButtonState(submitButton, 'Adding...', true);

      // Extract and validate form data
      const cartData = this.extractCartData(form);
      
      if (!this.validateCartData(cartData)) {
        throw new Error('Please complete all required selections');
      }

      // Backup cart data before submission
      this.backupCartData(cartData);

      // Prepare form data for Shopify
      const formData = this.prepareFormData(cartData);
      
      // Log form data for debugging
      console.log('Cart data being submitted:', cartData);
      console.log('FormData entries:');
      for (let [key, value] of formData.entries()) {
        console.log(`  ${key}: ${value}`);
      }

      // Check if we have a variant ID (required for Shopify)
      if (!cartData.variantId) {
        throw new Error('Product variant ID is required');
      }

      // Add to cart via Shopify API
      const response = await fetch('/cart/add.js', {
        method: 'POST',
        body: formData,
        headers: {
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest'
        },
        credentials: 'same-origin'
      });

      console.log('Cart add response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Cart add error response:', errorData);
        
        // Handle specific Shopify errors
        if (response.status === 422) {
          throw new Error(errorData.description || 'Product variant not found or unavailable');
        } else if (response.status === 404) {
          throw new Error('Product not found');
        } else {
          throw new Error(errorData.description || errorData.message || `Failed to add item to cart (${response.status})`);
        }
      }

      const addedItem = await response.json();
      console.log('Item successfully added:', addedItem);
      
      // Get updated cart to ensure consistency
      const cart = await this.getCart();
      console.log('Updated cart:', cart);
      
      // Clear backup since submission was successful
      this.clearCartBackup();
      
      // Update UI
      this.updateCartCount(cart.item_count);
      this.showSuccessMessage(this.formatSuccessMessage(cartData));
      
      // Dispatch events for other components
      this.dispatchCartEvents(cart, addedItem, cartData);
      
      // Reset form if it's a drink builder
      this.resetForm(form);
      
      // Open cart drawer if available
      this.openCartDrawer();

      this.setButtonState(submitButton, 'Added!', false);
      setTimeout(() => {
        this.setButtonState(submitButton, originalText || 'Add to Cart', false);
      }, 2000);

    } catch (error) {
      console.error('Add to cart error:', error);
      this.showErrorMessage(error.message);
      this.setButtonState(submitButton, 'Try Again', false);
      
      // Attempt to restore from backup if main submission failed
      setTimeout(() => {
        this.attemptCartRecovery(form);
      }, 1000);
      
      setTimeout(() => {
        this.setButtonState(submitButton, originalText || 'Add to Cart', false);
      }, 3000);
    } finally {
      this.isLoading = false;
    }
  }

  extractCartData(form) {
    const formData = new FormData(form);
    const data = {
      variantId: formData.get('id'),
      quantity: parseInt(formData.get('quantity') || '1', 10),
      properties: {},
      timestamp: new Date().toISOString(),
      orderId: this.generateOrderId()
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

    // Extract from data attributes if variant ID is missing
    if (!data.variantId) {
      const variantInput = form.querySelector('[data-variant-id]');
      if (variantInput) {
        data.variantId = variantInput.dataset.variantId;
      }
      
      // Check for global variant IDs for drink builders
      if (!data.variantId && window.KAVA_DRINKS_VARIANT_ID) {
        data.variantId = window.KAVA_DRINKS_VARIANT_ID;
        data.properties['Product Type'] = 'Kava Drink';
      }
      if (!data.variantId && window.KRATOM_TEAS_VARIANT_ID) {
        data.variantId = window.KRATOM_TEAS_VARIANT_ID;
        data.properties['Product Type'] = 'Kratom Tea';
      }
      if (!data.variantId && window.THC_DRINKS_VARIANT_ID) {
        data.variantId = window.THC_DRINKS_VARIANT_ID;
        data.properties['Product Type'] = 'THC Drink';
      }
    }

    return data;
  }

  validateCartData(data) {
    if (!data.variantId) {
      console.warn('No variant ID provided');
      return false;
    }
    
    if (data.quantity < 1 || data.quantity > 50) {
      console.warn('Invalid quantity:', data.quantity);
      return false;
    }

    return true;
  }

  prepareFormData(cartData) {
    const formData = new FormData();
    
    formData.set('id', String(cartData.variantId));
    formData.set('quantity', String(cartData.quantity));
    
    // Add all properties
    Object.entries(cartData.properties).forEach(([key, value]) => {
      formData.set(`properties[${key}]`, String(value));
    });

    // Add metadata
    formData.set('properties[Order ID]', cartData.orderId);
    formData.set('properties[Added At]', cartData.timestamp);

    return formData;
  }

  generateOrderId() {
    return 'wtf_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  backupCartData(data) {
    try {
      const backup = {
        timestamp: new Date().toISOString(),
        data: data,
        ttl: Date.now() + this.backupConfig.ttl
      };
      localStorage.setItem(this.backupConfig.key, JSON.stringify(backup));
      console.log('Cart data backed up:', backup);
    } catch (error) {
      console.warn('Failed to backup cart data:', error);
    }
  }

  clearCartBackup() {
    try {
      localStorage.removeItem(this.backupConfig.key);
    } catch (error) {
      console.warn('Failed to clear cart backup:', error);
    }
  }

  restoreCartFromBackup() {
    try {
      const backup = localStorage.getItem(this.backupConfig.key);
      if (!backup) return null;

      const parsed = JSON.parse(backup);
      if (Date.now() > parsed.ttl) {
        localStorage.removeItem(this.backupConfig.key);
        return null;
      }

      console.log('Found cart backup:', parsed);
      return parsed.data;
    } catch (error) {
      console.warn('Failed to restore cart from backup:', error);
      return null;
    }
  }

  attemptCartRecovery(form) {
    const backup = this.restoreCartFromBackup();
    if (backup) {
      console.log('Attempting cart recovery from backup...');
      // Could show a "retry with backup data" option to user
      this.showMessage('Cart data saved. You can try again.', 'info');
    }
  }

  formatSuccessMessage(cartData) {
    let message = 'Item added to cart!';
    
    if (cartData.properties['Product Type']) {
      message = `${cartData.properties['Product Type']} added to cart!`;
    }
    
    if (cartData.properties.Size) {
      message += ` (${cartData.properties.Size})`;
    }
    
    return message;
  }

  initializeFormObserver() {
    // Watch for dynamically added forms
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === 1) { // Element node
            const forms = node.matches?.('form') ? [node] : node.querySelectorAll?.('form') || [];
            forms.forEach(form => {
              if (this.isCartForm(form) && !form.dataset.wtfEnhanced) {
                form.dataset.wtfEnhanced = 'true';
                console.log('Enhanced dynamic cart form:', form);
              }
            });
          }
        });
      });
    });

    observer.observe(document.body, { childList: true, subtree: true });
  }

  isCartForm(form) {
    return form.matches('[data-wtf-ajax]') || 
           form.matches('.drink-builder-form') ||
           form.matches('[data-cart-form]') ||
           form.querySelector('[name="id"]') ||
           form.action.includes('/cart/add');
  }

  async handleQuantityChange(input) {
    const variantId = input.dataset.variantId;
    const quantity = parseInt(input.value);
    
    if (quantity < 1) {
      input.value = 1;
      return;
    }

    try {
      await this.updateCartItem(variantId, quantity);
    } catch (error) {
      console.error('Quantity update error:', error);
      this.showErrorMessage('Failed to update quantity');
      // Reload to restore correct state
      window.location.reload();
    }
  }

  handleQuantityButton(button) {
    const variantId = button.dataset.variantId;
    const input = document.querySelector(`input[data-variant-id="${variantId}"]`);
    const isIncrease = button.classList.contains('quantity-selector__increase');
    
    let newQuantity = parseInt(input.value);
    if (isIncrease) {
      newQuantity++;
    } else {
      newQuantity = Math.max(1, newQuantity - 1);
    }
    
    input.value = newQuantity;
    this.handleQuantityChange(input);
  }

  async handleRemoveItem(variantId) {
    try {
      await this.updateCartItem(variantId, 0);
      this.showSuccessMessage('Item removed from cart');
    } catch (error) {
      console.error('Remove item error:', error);
      this.showErrorMessage('Failed to remove item');
    }
  }

  async updateCartItem(variantId, quantity) {
    const formData = new FormData();
    formData.append('id', variantId);
    formData.append('quantity', quantity);

    const response = await fetch('/cart/change.js', {
      method: 'POST',
      body: formData,
      headers: {
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest'
      },
      credentials: 'same-origin'
    });

    if (!response.ok) {
      throw new Error('Failed to update cart');
    }

    const cart = await response.json();
    this.updateCartDisplay(cart);
    this.dispatchCartEvents(cart);
    
    return cart;
  }

  async getCart() {
    const response = await fetch('/cart.js', {
      headers: {
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest'
      },
      credentials: 'same-origin'
    });

    if (!response.ok) {
      throw new Error('Failed to fetch cart');
    }

    return await response.json();
  }

  updateCartCount(count) {
    const cartCountElements = document.querySelectorAll('[data-cart-count]');
    cartCountElements.forEach(element => {
      const num = parseInt(count || 0, 10);
      element.textContent = num;
      element.style.display = num === 0 ? 'none' : '';
    });
  }

  updateCartDisplay(cart) {
    // Update cart count
    this.updateCartCount(cart.item_count);

    // Update cart total
    const totalElements = document.querySelectorAll('.cart-summary__value');
    if (totalElements.length > 0) {
      const lastTotal = totalElements[totalElements.length - 1];
      lastTotal.textContent = '$' + (cart.total_price / 100).toFixed(2);
    }

    // Update subtotal
    const subtotalElements = document.querySelectorAll('.cart-summary__row:first-child .cart-summary__value');
    subtotalElements.forEach(element => {
      element.textContent = '$' + (cart.total_price / 100).toFixed(2);
    });

    // Update cart title
    const cartTitle = document.querySelector('.cart-title');
    if (cartTitle) {
      const itemText = cart.item_count === 1 ? 'item' : 'items';
      cartTitle.textContent = `Your Cart (${cart.item_count} ${itemText})`;
    }

    // Remove items that are no longer in cart
    const currentItems = document.querySelectorAll('.cart-item');
    currentItems.forEach(itemElement => {
      const variantId = itemElement.dataset.variantId;
      const stillInCart = cart.items.some(item => item.variant.id.toString() === variantId);
      if (!stillInCart) {
        itemElement.remove();
      }
    });

    // If cart is empty, reload page to show empty state
    if (cart.item_count === 0) {
      window.location.reload();
    }
  }

  validateForm(form) {
    // Check for required variant ID
    const variantIdInput = form.querySelector('input[name="id"]');
    if (!variantIdInput || !variantIdInput.value) {
      console.warn('No variant ID found, but allowing submission for testing');
      // For testing purposes, allow submission even without variant ID
      // In production, this should return false
      return true;
    }

    // Check for required base selection in drink builder
    const baseSelection = form.querySelector('input[name="base_drink"]:checked');
    if (form.classList.contains('drink-builder__form') && !baseSelection) {
      console.warn('No base drink selected in drink builder');
      return false;
    }

    return true;
  }

  resetForm(form) {
    // Only reset if it's a drink builder form
    if (form.classList.contains('drink-builder__form')) {
      // Reset flavor pumps
      const flavorInputs = form.querySelectorAll('.flavor-pump__input');
      flavorInputs.forEach(input => {
        input.value = 0;
      });

      // Reset add-ons
      const addonInputs = form.querySelectorAll('input[type="checkbox"]');
      addonInputs.forEach(input => {
        input.checked = false;
      });

      // Keep base and size selections for convenience
    }
  }

  setButtonState(button, text, disabled) {
    if (!button) return;
    button.textContent = text;
    button.disabled = disabled;
  }

  showSuccessMessage(message) {
    this.showMessage(message, 'success');
  }

  showErrorMessage(message) {
    this.showMessage(message, 'error');
  }

  showMessage(message, type) {
    // Remove existing messages
    const existingMessages = document.querySelectorAll('.wtf-cart-message');
    existingMessages.forEach(msg => msg.remove());

    // Create new message
    const messageEl = document.createElement('div');
    messageEl.className = `wtf-cart-message wtf-cart-message--${type}`;
    messageEl.textContent = message;
    
    // Set styles based on type
    const backgroundColor = {
      success: '#28a745',
      error: '#dc3545', 
      info: '#007bff',
      warning: '#ffc107'
    }[type] || '#6c757d';
    
    const textColor = type === 'warning' ? '#212529' : 'white';
    
    messageEl.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 12px 20px;
      border-radius: 4px;
      color: ${textColor};
      font-weight: bold;
      z-index: 10000;
      animation: slideIn 0.3s ease-out;
      background: ${backgroundColor};
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      max-width: 300px;
      word-wrap: break-word;
    `;

    document.body.appendChild(messageEl);

    // Auto-remove after 4 seconds for info messages, 3 for others
    const timeout = type === 'info' ? 4000 : 3000;
    setTimeout(() => {
      messageEl.style.animation = 'slideOut 0.3s ease-in';
      setTimeout(() => messageEl.remove(), 300);
    }, timeout);
  }

  initializeCartDrawer() {
    // Add CSS for animations if not already present
    if (!document.querySelector('#wtf-cart-animations')) {
      const style = document.createElement('style');
      style.id = 'wtf-cart-animations';
      style.textContent = `
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideOut {
          from { transform: translateX(0); opacity: 1; }
          to { transform: translateX(100%); opacity: 0; }
        }
      `;
      document.head.appendChild(style);
    }
  }

  openCartDrawer() {
    // Try to open cart drawer if available
    try {
      if (window.WTF_CART && typeof window.WTF_CART.open === 'function') {
        window.WTF_CART.open();
      }
    } catch (e) {
      console.log('Cart drawer not available');
    }
  }

  dispatchCartEvents(cart, addedItem = null, cartData = null) {
    // Dispatch multiple events for compatibility
    const eventDetail = { 
      cart, 
      last_added: addedItem,
      cart_data: cartData
    };

    const events = [
      new CustomEvent('wtf:cart:update', { detail: eventDetail }),
      new CustomEvent('cart:updated', { detail: cart }),
      new CustomEvent('wtf:cart:open', { detail: eventDetail })
    ];

    if (addedItem) {
      events.push(new CustomEvent('cart:added', { detail: { item: addedItem, cart, cart_data: cartData } }));
    }

    events.forEach(event => {
      document.dispatchEvent(event);
      console.log(`Dispatched event: ${event.type}`, event.detail);
    });
  }
}

// Initialize when DOM is ready - but only if not already initialized
function initializeWTFCart() {
  // Prevent multiple instances
  if (window.WTFCartSystem && window.WTFCartSystem.initialized) {
    console.log('WTF Cart System already initialized');
    return window.WTFCartSystem;
  }
  
  console.log('Initializing WTF Cart System...');
  window.WTFCartSystem = new WTFCart();
  return window.WTFCartSystem;
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeWTFCart);
} else {
  initializeWTFCart();
}

// Export for use in other scripts
window.WTFCart = WTFCart;
window.initializeWTFCart = initializeWTFCart;
