/**
 * WTF Lightspeed POS Integration
 * Handles real-time inventory sync, order processing, and customer data
 * Integrates Shopify online orders with Lightspeed Retail POS system
 */

class WTFLightspeedIntegration {
  constructor(config = {}) {
    const globalConfig = window.WTFConfig?.get
      ? window.WTFConfig.getIntegrationConfig('lightspeed')
      : (window.WTF_CONFIG_DATA?.integrations?.lightspeed || {});

    const baseEndpoint = config.endpoints?.base
      || globalConfig?.endpoints?.base
      || '/apps/wtf/lightspeed';

    this.config = {
      enabled: typeof config.enabled === 'boolean'
        ? config.enabled
        : (typeof globalConfig.enabled === 'boolean' ? globalConfig.enabled : true),
      accountId: config.accountId || globalConfig?.accountId || null,
      syncInterval: config.syncInterval || globalConfig?.syncInterval || 30000,
      enableRealTimeSync: config.enableRealTimeSync !== undefined
        ? config.enableRealTimeSync
        : (globalConfig?.enableRealTimeSync !== undefined ? globalConfig.enableRealTimeSync : true),
      variantMapping: config.variantMapping || globalConfig?.variantMapping || {},
      endpoints: {
        base: baseEndpoint,
        inventory: config.endpoints?.inventory
          || globalConfig?.endpoints?.inventory
          || `${baseEndpoint}/inventory`,
        availability: config.endpoints?.availability
          || globalConfig?.endpoints?.availability
          || `${baseEndpoint}/availability`,
        reserve: config.endpoints?.reserve
          || globalConfig?.endpoints?.reserve
          || `${baseEndpoint}/reserve`,
        release: config.endpoints?.release
          || globalConfig?.endpoints?.release
          || `${baseEndpoint}/release`,
        sync: config.endpoints?.sync
          || globalConfig?.endpoints?.sync
          || `${baseEndpoint}/sync`,
        orders: config.endpoints?.orders
          || globalConfig?.endpoints?.orders
          || `${baseEndpoint}/orders`
      }
    };

    this.config.variantMapping = {
      ...(globalConfig?.variantMapping || {}),
      ...(config.variantMapping || {})
    };

    if (config.endpoints) {
      this.config.endpoints = {
        ...this.config.endpoints,
        ...config.endpoints
      };
    }
    
    this.syncTimer = null;
    this.lastSyncTime = null;
    this.inventoryCache = new Map();
    
    this.init();
  }

  async init() {
    if (!this.config.enabled) {
      console.info('WTF Lightspeed: Integration disabled');
      return;
    }

    if (!this.config.accountId) {
      console.warn('WTF Lightspeed: Missing account ID');
    }

    // Start inventory sync
    if (this.config.enableRealTimeSync) {
      this.startInventorySync();
    }

    // Listen for Shopify cart events to sync with POS
    document.addEventListener('cart:added', (event) => {
      this.handleCartAdd(event.detail);
    });

    document.addEventListener('cart:updated', (event) => {
      this.handleCartUpdate(event.detail);
    });

    // Listen for checkout completion
    if (window.Shopify && window.Shopify.checkout) {
      this.handleCheckoutCompletion(window.Shopify.checkout);
    }
  }

  /**
   * Start real-time inventory synchronization
   */
  startInventorySync() {
    this.syncInventory();
    this.syncTimer = setInterval(() => {
      this.syncInventory();
    }, this.config.syncInterval);
  }

  /**
   * Stop inventory sync
   */
  stopInventorySync() {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = null;
    }
  }

  /**
   * Sync inventory levels between Lightspeed and Shopify
   */
  async syncInventory() {
    try {
      const items = await this.getLightspeedInventory();
      const updates = [];

      for (const item of items) {
        const shopifyVariantId = this.mapLightspeedToShopify(item.itemID);
        if (shopifyVariantId) {
          const currentStock = this.inventoryCache.get(shopifyVariantId);
          const newStock = parseInt(item.qtyOnHand || 0);

          if (currentStock !== newStock) {
            updates.push({
              variantId: shopifyVariantId,
              quantity: newStock,
              lightspeedId: item.itemID
            });
            this.inventoryCache.set(shopifyVariantId, newStock);
          }
        }
      }

      if (updates.length > 0) {
        await this.updateShopifyInventory(updates);
        this.dispatchInventoryUpdate(updates);
      }

      this.lastSyncTime = new Date();
    } catch (error) {
      console.error('WTF Lightspeed: Inventory sync failed:', error);
    }
  }

  /**
   * Get inventory from Lightspeed POS
   */
  async getLightspeedInventory() {
    const response = await fetch(this.config.endpoints.inventory, {
      credentials: 'include'
    });

    if (!response.ok) {
      throw new Error(`Lightspeed inventory proxy error: ${response.status}`);
    }

    const data = await response.json();
    if (Array.isArray(data)) {
      return data;
    }
    if (Array.isArray(data.items)) {
      return data.items;
    }
    if (Array.isArray(data.Item)) {
      return data.Item;
    }

    return [];
  }

  /**
   * Update Shopify inventory levels
   */
  async updateShopifyInventory(updates) {
    if (!updates || updates.length === 0) {
      return;
    }

    try {
      const response = await fetch(this.config.endpoints.sync, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ updates })
      });

      if (!response.ok) {
        throw new Error(`Inventory sync proxy error: ${response.status}`);
      }
    } catch (error) {
      console.error('Failed to update Shopify inventory via proxy:', error);
    }
  }

  /**
   * Handle cart additions - sync with POS for real-time availability
   */
  async handleCartAdd(detail) {
    const { item, cart } = detail;
    
    try {
      // Check real-time availability in Lightspeed
      const availability = await this.checkItemAvailability(item.variant_id);
      
      if (!availability.available) {
        // Item out of stock, remove from cart and notify user
        await this.removeFromCart(item.key);
        this.showStockAlert(item.title, availability.message);
        return;
      }

      // Reserve item in POS system for 15 minutes
      await this.reserveItem(item.variant_id, item.quantity);
      
    } catch (error) {
      console.error('WTF Lightspeed: Cart add sync failed:', error);
    }
  }

  /**
   * Handle cart updates
   */
  async handleCartUpdate(detail) {
    const { cart } = detail;
    
    // Sync cart contents with POS reservations
    for (const item of cart.items) {
      await this.updateItemReservation(item.variant_id, item.quantity);
    }
  }

  /**
   * Check item availability in real-time
   */
  async checkItemAvailability(variantId) {
    const lightspeedId = this.mapShopifyToLightspeed(variantId);
    if (!lightspeedId) {
      return { available: true, message: 'Item not synced with POS' };
    }

    try {
      const params = new URLSearchParams({
        variant_id: String(variantId),
        lightspeed_id: String(lightspeedId)
      });
      const response = await fetch(`${this.config.endpoints.availability}?${params.toString()}`, {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`Availability proxy error: ${response.status}`);
      }

      const data = await response.json();
      const qtyOnHand = parseInt(data.quantity ?? data.qtyOnHand ?? 0, 10);
      const isAvailable = data.available !== false ? qtyOnHand > 0 : false;

      return {
        available: isAvailable,
        quantity: qtyOnHand,
        message: data.message || (isAvailable ? `${qtyOnHand} available` : 'Out of stock')
      };
    } catch (error) {
      console.error('WTF Lightspeed: Availability check failed:', error);
      return { available: true, message: 'Could not verify stock' };
    }
  }

  /**
   * Reserve item in POS system
   */
  async reserveItem(variantId, quantity) {
    const lightspeedId = this.mapShopifyToLightspeed(variantId);
    if (!lightspeedId) return;

    try {
      const response = await fetch(this.config.endpoints.reserve, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          variantId,
          lightspeedId,
          quantity,
          accountId: this.config.accountId,
          expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString()
        })
      });

      if (response.ok) {
        const result = await response.json();
        if (result.reservationId) {
          sessionStorage.setItem(`wtf_reservation_${variantId}`, result.reservationId);
        }
      } else {
        throw new Error(`Reservation proxy error: ${response.status}`);
      }
    } catch (error) {
      console.error('WTF Lightspeed: Item reservation failed:', error);
    }
  }

  async updateItemReservation(variantId, quantity) {
    const lightspeedId = this.mapShopifyToLightspeed(variantId);
    if (!lightspeedId) return;

    const reservationId = sessionStorage.getItem(`wtf_reservation_${variantId}`);

    if (!reservationId) {
      await this.reserveItem(variantId, quantity);
      return;
    }

    if (quantity <= 0) {
      await this.releaseReservation(variantId, lightspeedId, reservationId);
      return;
    }

    try {
      const response = await fetch(this.config.endpoints.reserve, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          variantId,
          lightspeedId,
          quantity,
          reservationId,
          accountId: this.config.accountId
        })
      });

      if (!response.ok) {
        throw new Error(`Reservation update error: ${response.status}`);
      }

      const result = await response.json();
      if (result && result.reservationId) {
        sessionStorage.setItem(`wtf_reservation_${variantId}`, result.reservationId);
      }
    } catch (error) {
      console.error('WTF Lightspeed: Reservation update failed:', error);
    }
  }

  async releaseReservation(variantId, lightspeedId, reservationId) {
    try {
      const response = await fetch(this.config.endpoints.release, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          variantId,
          lightspeedId,
          reservationId,
          accountId: this.config.accountId
        })
      });

      if (!response.ok) {
        throw new Error(`Reservation release error: ${response.status}`);
      }

      sessionStorage.removeItem(`wtf_reservation_${variantId}`);
    } catch (error) {
      console.error('WTF Lightspeed: Reservation release failed:', error);
    }
  }

  /**
   * Process completed order in Lightspeed POS
   */
  async processCompletedOrder(orderData) {
    if (!orderData) return null;

    const payload = {
      orderNumber: orderData.order_number,
      accountId: this.config.accountId,
      customer: orderData.customer || null,
      cartToken: orderData.cart_token || null,
      lineItems: orderData.line_items
        .map((item) => ({
          lightspeedId: this.mapShopifyToLightspeed(item.variant_id),
          variantId: item.variant_id,
          quantity: item.quantity,
          price: item.price,
          note: this.buildItemNote(item)
        }))
        .filter((line) => line.lightspeedId)
    };

    try {
      const response = await fetch(this.config.endpoints.orders, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`Lightspeed order proxy error: ${response.status}`);
      }

      const result = await response.json();
      if (result && result.saleId) {
        console.log(`WTF Lightspeed: Order processed via proxy #${result.saleId}`);
      }
      return result;
    } catch (error) {
      console.error('WTF Lightspeed: Order processing failed:', error);
      return null;
    }
  }

  /**
   * Build item note from Shopify line item properties
   */
  buildItemNote(item) {
    const notes = [];
    
    if (item.properties) {
      Object.entries(item.properties).forEach(([key, value]) => {
        if (value && value !== '') {
          notes.push(`${key}: ${value}`);
        }
      });
    }

    return notes.join(', ');
  }

  /**
   * Map Shopify variant ID to Lightspeed item ID
   */
  mapShopifyToLightspeed(variantId) {
    const mapping = this.config.variantMapping || {};
    return mapping[variantId] || null;
  }

  /**
   * Map Lightspeed item ID to Shopify variant ID
   */
  mapLightspeedToShopify(itemId) {
    const mapping = this.config.variantMapping || {};
    const reverseMapping = Object.fromEntries(
      Object.entries(mapping).map(([k, v]) => [v, k])
    );
    return reverseMapping[itemId] || null;
  }

  /**
   * Show stock alert to user
   */
  showStockAlert(itemName, message) {
    const alert = document.createElement('div');
    alert.className = 'wtf-stock-alert';
    alert.innerHTML = `
      <div class="wtf-stock-alert__content">
        <strong>Stock Alert:</strong> ${itemName} - ${message}
        <button class="wtf-stock-alert__close" onclick="this.parentElement.parentElement.remove()">×</button>
      </div>
    `;
    
    alert.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #ff6b6b;
      color: white;
      padding: 15px;
      border-radius: 8px;
      z-index: 10000;
      max-width: 300px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    `;

    document.body.appendChild(alert);
    
    setTimeout(() => {
      if (alert.parentElement) {
        alert.remove();
      }
    }, 5000);
  }

  /**
   * Dispatch inventory update event
   */
  dispatchInventoryUpdate(updates) {
    document.dispatchEvent(new CustomEvent('wtf:inventory:updated', {
      detail: { updates, timestamp: new Date() }
    }));
  }

  /**
   * Get sync status
   */
  getSyncStatus() {
    return {
      isRunning: !!this.syncTimer,
      lastSync: this.lastSyncTime,
      cacheSize: this.inventoryCache.size,
      config: this.config
    };
  }
}

// Initialize Lightspeed integration
document.addEventListener('DOMContentLoaded', function() {
  const lightspeedConfig = window.WTFConfig?.get
    ? window.WTFConfig.getIntegrationConfig('lightspeed')
    : (window.WTF_CONFIG_DATA?.integrations?.lightspeed || null);

  if (lightspeedConfig && (lightspeedConfig.enabled !== false)) {
    window.WTFLightspeed = new WTFLightspeedIntegration(lightspeedConfig);
  }
});

// Export for use in other modules
window.WTFLightspeedIntegration = WTFLightspeedIntegration;
