/**
 * WTF Lightspeed POS Integration
 * Handles real-time inventory sync, order processing, and customer data
 * Integrates Shopify online orders with Lightspeed Retail POS system
 */

class WTFLightspeedIntegration {
  constructor(config = {}) {
    this.config = {
      apiUrl: config.apiUrl || 'https://api.lightspeedapp.com/API',
      accountId: config.accountId || window.WTF_CONFIG?.lightspeed?.accountId,
      apiKey: config.apiKey || window.WTF_CONFIG?.lightspeed?.apiKey,
      syncInterval: config.syncInterval || 30000, // 30 seconds
      enableRealTimeSync: config.enableRealTimeSync !== false,
      ...config
    };
    
    this.syncTimer = null;
    this.lastSyncTime = null;
    this.inventoryCache = new Map();
    
    this.init();
  }

  async init() {
    if (!this.config.accountId || !this.config.apiKey) {
      console.warn('WTF Lightspeed: Missing API credentials');
      return;
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
    const response = await fetch(`${this.config.apiUrl}/Account/${this.config.accountId}/Item.json`, {
      headers: {
        'Authorization': `Basic ${btoa(this.config.apiKey + ':')}`
      }
    });

    if (!response.ok) {
      throw new Error(`Lightspeed API error: ${response.status}`);
    }

    const data = await response.json();
    return data.Item || [];
  }

  /**
   * Update Shopify inventory levels
   */
  async updateShopifyInventory(updates) {
    for (const update of updates) {
      try {
        await fetch('/admin/api/2023-10/inventory_levels/set.json', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Shopify-Access-Token': window.WTF_CONFIG?.shopify?.accessToken
          },
          body: JSON.stringify({
            location_id: window.WTF_CONFIG?.shopify?.locationId,
            inventory_item_id: update.variantId,
            available: update.quantity
          })
        });
      } catch (error) {
        console.error(`Failed to update inventory for variant ${update.variantId}:`, error);
      }
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
      const response = await fetch(`${this.config.apiUrl}/Account/${this.config.accountId}/Item/${lightspeedId}.json`, {
        headers: {
          'Authorization': `Basic ${btoa(this.config.apiKey + ':')}`
        }
      });

      const data = await response.json();
      const item = data.Item;
      const qtyOnHand = parseInt(item.qtyOnHand || 0);

      return {
        available: qtyOnHand > 0,
        quantity: qtyOnHand,
        message: qtyOnHand === 0 ? 'Out of stock' : `${qtyOnHand} available`
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

    // Create a temporary sale in Lightspeed to reserve inventory
    const saleData = {
      Sale: {
        customerID: 0, // Anonymous customer
        shopID: 1,
        registerID: 1,
        employeeID: 1,
        SaleLines: {
          SaleLine: [{
            itemID: lightspeedId,
            unitQuantity: quantity,
            unitPrice: 0, // Reservation, no charge
            note: `Shopify reservation - expires ${new Date(Date.now() + 15 * 60 * 1000).toISOString()}`
          }]
        }
      }
    };

    try {
      const response = await fetch(`${this.config.apiUrl}/Account/${this.config.accountId}/Sale.json`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${btoa(this.config.apiKey + ':')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(saleData)
      });

      if (response.ok) {
        const result = await response.json();
        // Store reservation ID for later cleanup
        sessionStorage.setItem(`wtf_reservation_${variantId}`, result.Sale.saleID);
      }
    } catch (error) {
      console.error('WTF Lightspeed: Item reservation failed:', error);
    }
  }

  /**
   * Process completed order in Lightspeed POS
   */
  async processCompletedOrder(orderData) {
    const saleData = {
      Sale: {
        customerID: await this.getOrCreateCustomer(orderData.customer),
        shopID: 1,
        registerID: 1,
        employeeID: 1,
        note: `Shopify Order #${orderData.order_number}`,
        SaleLines: {
          SaleLine: orderData.line_items.map(item => ({
            itemID: this.mapShopifyToLightspeed(item.variant_id),
            unitQuantity: item.quantity,
            unitPrice: item.price,
            note: this.buildItemNote(item)
          })).filter(line => line.itemID) // Only include mapped items
        }
      }
    };

    try {
      const response = await fetch(`${this.config.apiUrl}/Account/${this.config.accountId}/Sale.json`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${btoa(this.config.apiKey + ':')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(saleData)
      });

      if (response.ok) {
        const result = await response.json();
        console.log(`WTF Lightspeed: Order processed as Sale #${result.Sale.saleID}`);
        return result.Sale.saleID;
      }
    } catch (error) {
      console.error('WTF Lightspeed: Order processing failed:', error);
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
   * Get or create customer in Lightspeed
   */
  async getOrCreateCustomer(customerData) {
    if (!customerData || !customerData.email) return 0;

    try {
      // Search for existing customer
      const searchResponse = await fetch(
        `${this.config.apiUrl}/Account/${this.config.accountId}/Customer.json?email=${encodeURIComponent(customerData.email)}`,
        {
          headers: {
            'Authorization': `Basic ${btoa(this.config.apiKey + ':')}`
          }
        }
      );

      const searchData = await searchResponse.json();
      
      if (searchData.Customer && searchData.Customer.length > 0) {
        return searchData.Customer[0].customerID;
      }

      // Create new customer
      const customerPayload = {
        Customer: {
          firstName: customerData.first_name || '',
          lastName: customerData.last_name || '',
          email: customerData.email,
          phone: customerData.phone || '',
          Contact: {
            Addresses: {
              ContactAddress: customerData.default_address ? [{
                address1: customerData.default_address.address1 || '',
                address2: customerData.default_address.address2 || '',
                city: customerData.default_address.city || '',
                state: customerData.default_address.province || '',
                zip: customerData.default_address.zip || '',
                country: customerData.default_address.country || ''
              }] : []
            }
          }
        }
      };

      const createResponse = await fetch(`${this.config.apiUrl}/Account/${this.config.accountId}/Customer.json`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${btoa(this.config.apiKey + ':')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(customerPayload)
      });

      if (createResponse.ok) {
        const result = await createResponse.json();
        return result.Customer.customerID;
      }
    } catch (error) {
      console.error('WTF Lightspeed: Customer sync failed:', error);
    }

    return 0; // Default to anonymous customer
  }

  /**
   * Map Shopify variant ID to Lightspeed item ID
   */
  mapShopifyToLightspeed(variantId) {
    // This mapping should be stored in your database or configuration
    const mapping = window.WTF_CONFIG?.lightspeed?.variantMapping || {};
    return mapping[variantId] || null;
  }

  /**
   * Map Lightspeed item ID to Shopify variant ID
   */
  mapLightspeedToShopify(itemId) {
    const mapping = window.WTF_CONFIG?.lightspeed?.variantMapping || {};
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
  if (window.WTF_CONFIG?.lightspeed?.enabled) {
    window.WTFLightspeed = new WTFLightspeedIntegration(window.WTF_CONFIG.lightspeed);
  }
});

// Export for use in other modules
window.WTFLightspeedIntegration = WTFLightspeedIntegration;
