/**
 * Persistent Cart Management for WTF | Welcome To Florida
 * Ensures cart persistence across browser sessions using localStorage
 */

class PersistentCart {
  constructor() {
    this.storageKey = 'wtf-persistent-cart';
    this.cartData = this.loadCart();
    this.init();
  }

  init() {
    // Initialize cart on page load
    this.restoreCart();
    
    // Listen for cart changes
    this.bindEvents();
    
    // Sync cart periodically
    setInterval(() => this.syncCart(), 30000); // Every 30 seconds
  }

  bindEvents() {
    // Listen for successful add to cart events
    document.addEventListener('kratom:added', (e) => this.handleItemAdded(e.detail));
    document.addEventListener('kava:added', (e) => this.handleItemAdded(e.detail));
    document.addEventListener('thc-drinks:added', (e) => this.handleItemAdded(e.detail));
    document.addEventListener('thc-shots:added', (e) => this.handleItemAdded(e.detail));
    document.addEventListener('draft:added', (e) => this.handleItemAdded(e.detail));
    document.addEventListener('canned:added', (e) => this.handleItemAdded(e.detail));

    // Listen for cart updates from Shopify
    document.addEventListener('cart:updated', () => this.syncCart());
    
    // Save cart before page unload
    window.addEventListener('beforeunload', () => this.saveCart());
  }

  loadCart() {
    try {
      const stored = localStorage.getItem(this.storageKey);
      return stored ? JSON.parse(stored) : { items: [], timestamp: Date.now() };
    } catch (error) {
      console.warn('Failed to load persistent cart:', error);
      return { items: [], timestamp: Date.now() };
    }
  }

  saveCart() {
    try {
      this.cartData.timestamp = Date.now();
      localStorage.setItem(this.storageKey, JSON.stringify(this.cartData));
    } catch (error) {
      console.warn('Failed to save persistent cart:', error);
    }
  }

  async restoreCart() {
    // Only restore if cart data is recent (within 7 days)
    const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
    const age = Date.now() - this.cartData.timestamp;
    
    if (age > maxAge) {
      this.clearCart();
      return;
    }

    // Check if Shopify cart is empty and we have items to restore
    try {
      const shopifyCart = await this.getShopifyCart();
      
      if (shopifyCart.item_count === 0 && this.cartData.items.length > 0) {
        await this.restoreItemsToShopify();
      }
    } catch (error) {
      console.warn('Failed to restore cart:', error);
    }
  }

  async restoreItemsToShopify() {
    for (const item of this.cartData.items) {
      try {
        await this.addItemToShopify(item);
        await new Promise(resolve => setTimeout(resolve, 100)); // Rate limiting
      } catch (error) {
        console.warn('Failed to restore item:', item, error);
      }
    }
    
    // Clear restored items
    this.cartData.items = [];
    this.saveCart();
    
    // Update cart count display
    this.updateCartCount();
  }

  async addItemToShopify(item) {
    const body = new URLSearchParams();
    body.set('id', String(item.variantId));
    body.set('quantity', String(item.quantity));
    
    // Add line item properties
    if (item.properties) {
      for (const [key, value] of Object.entries(item.properties)) {
        body.set(`properties[${key}]`, String(value));
      }
    }

    const response = await fetch('/cart/add.js', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'Accept': 'application/json',
      },
      credentials: 'same-origin',
      body,
    });

    if (!response.ok) {
      throw new Error(`Failed to add item: ${response.statusText}`);
    }

    return response.json();
  }

  async getShopifyCart() {
    const response = await fetch('/cart.js');
    if (!response.ok) {
      throw new Error(`Failed to get cart: ${response.statusText}`);
    }
    return response.json();
  }

  handleItemAdded(detail) {
    // Store item details for persistence
    const item = {
      id: `${detail.product || 'unknown'}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      variantId: detail.variantId,
      quantity: detail.quantity,
      properties: { ...detail },
      timestamp: Date.now()
    };

    // Remove variantId and quantity from properties to avoid duplication
    delete item.properties.variantId;
    delete item.properties.quantity;

    this.cartData.items.push(item);
    this.saveCart();
  }

  async syncCart() {
    try {
      const shopifyCart = await this.getShopifyCart();
      
      // If Shopify cart has items, clear our persistent storage
      // (items are now safely in Shopify's cart)
      if (shopifyCart.item_count > 0) {
        this.cartData.items = [];
        this.saveCart();
      }
      
      this.updateCartCount(shopifyCart.item_count);
    } catch (error) {
      console.warn('Failed to sync cart:', error);
    }
  }

  updateCartCount(count = null) {
    const cartCountElements = document.querySelectorAll('#cart-count, .cart-count');
    
    if (count !== null) {
      cartCountElements.forEach(el => {
        if (el) el.textContent = count;
      });
    } else {
      // Fetch current count if not provided
      this.getShopifyCart().then(cart => {
        cartCountElements.forEach(el => {
          if (el) el.textContent = cart.item_count;
        });
      }).catch(error => {
        console.warn('Failed to update cart count:', error);
      });
    }
  }

  clearCart() {
    this.cartData = { items: [], timestamp: Date.now() };
    this.saveCart();
  }

  // Public method to manually trigger cart restoration
  async forceRestore() {
    await this.restoreCart();
  }

  // Get cart summary for debugging
  getCartSummary() {
    return {
      itemCount: this.cartData.items.length,
      items: this.cartData.items.map(item => ({
        id: item.id,
        properties: item.properties,
        quantity: item.quantity,
        age: Date.now() - item.timestamp
      })),
      age: Date.now() - this.cartData.timestamp
    };
  }
}

// Initialize persistent cart when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.persistentCart = new PersistentCart();
  
  // Expose for debugging
  window.debugCart = () => {
    console.log('Persistent Cart Summary:', window.persistentCart.getCartSummary());
  };
});

// Handle page visibility changes to sync cart
document.addEventListener('visibilitychange', () => {
  if (!document.hidden && window.persistentCart) {
    window.persistentCart.syncCart();
  }
});
