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
    this.listenersBound = false;
    this.ready = false;

    this.capabilities = {
      availability: Boolean(this.config.endpoints?.availability),
      reservations: Boolean(this.config.endpoints?.reserve && this.config.endpoints?.release),
      orderSync: Boolean(this.config.endpoints?.orders)
    };

    this.boundHandlers = {
      cartAdded: (event) => this.handleCartAdd(event?.detail),
      cartUpdated: (event) => this.handleCartUpdate(event?.detail)
    };

    this.init();
  }

  shouldEnableIntegration() {
    if (!this.config.enabled) {
      console.info('WTF Lightspeed: Integration disabled via theme settings.');
      return false;
    }

    const endpoints = this.config.endpoints || {};
    const requiredEndpoints = ['inventory', 'sync'];
    const missing = requiredEndpoints.filter((key) => !endpoints[key]);

    if (missing.length > 0) {
      console.info(`WTF Lightspeed: Missing required middleware endpoints (${missing.join(', ')}). Integration will remain inactive.`);
      return false;
    }

    if (typeof window.fetch !== 'function') {
      console.warn('WTF Lightspeed: Fetch API not available. Integration disabled.');
      return false;
    }

    return true;
  }

  init() {
    this.ready = this.shouldEnableIntegration();
    if (!this.ready) {
      return;
    }

    if (!this.config.accountId) {
      console.warn('WTF Lightspeed: Missing Lightspeed account ID.');
    }

    if (this.config.enableRealTimeSync) {
      this.startInventorySync();
    }

    this.bindEventListeners();

    if (this.capabilities.orderSync && window.Shopify?.checkout) {
      this.handleCheckoutCompletion(window.Shopify.checkout);
    }
  }

  isActive() {
    return this.ready;
  }

  bindEventListeners() {
    if (this.listenersBound || !this.ready) {
      return;
    }
    document.addEventListener('cart:added', this.boundHandlers.cartAdded);
    document.addEventListener('cart:updated', this.boundHandlers.cartUpdated);
    this.listenersBound = true;
  }

  unbindEventListeners() {
    if (!this.listenersBound) {
      return;
    }
    document.removeEventListener('cart:added', this.boundHandlers.cartAdded);
    document.removeEventListener('cart:updated', this.boundHandlers.cartUpdated);
    this.listenersBound = false;
  }

  disableIntegration(reason) {
    if (reason) {
      console.warn('WTF Lightspeed: Integration disabled.', reason);
    } else {
      console.info('WTF Lightspeed: Integration disabled.');
    }
    this.ready = false;
    this.stopInventorySync();
    this.unbindEventListeners();

    if (typeof window !== 'undefined' && window.WTFLightspeed === this) {
      window.WTFLightspeed = null;
    }
  }

  startInventorySync() {
    if (!this.ready) {
      return;
    }

    const interval = Math.max(15000, Number(this.config.syncInterval) || 30000);

    this.syncInventory();
    this.stopInventorySync();

    this.syncTimer = window.setInterval(() => {
      if (!this.ready) {
        this.stopInventorySync();
        return;
      }
      this.syncInventory();
    }, interval);
  }

  stopInventorySync() {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = null;
    }
  }

  async proxyRequest(endpoint, options = {}) {
    if (!this.ready) {
      throw new Error('Lightspeed integration disabled');
    }

    if (!endpoint) {
      throw new Error('Lightspeed middleware endpoint missing');
    }

    const fetchOptions = { ...options };
    fetchOptions.headers = {
      Accept: 'application/json',
      ...(options.headers || {})
    };

    if (!('credentials' in fetchOptions)) {
      fetchOptions.credentials = 'same-origin';
    }

    try {
      const response = await fetch(endpoint, fetchOptions);

      if (response.status === 404) {
        this.disableIntegration('Middleware endpoint returned 404.');
        throw new Error('Lightspeed middleware unavailable');
      }

      if (!response.ok) {
        throw new Error(`Lightspeed middleware error: ${response.status}`);
      }

      const contentType = response.headers.get('content-type') || '';
      if (response.status === 204 || fetchOptions.method === 'HEAD') {
        return null;
      }

      if (contentType.includes('application/json')) {
        return response.json();
      }

      return response.text();
    } catch (error) {
      throw error;
    }
  }

  async syncInventory() {
    if (!this.ready) {
      return;
    }

    try {
      const items = await this.getLightspeedInventory();
      const updates = [];

      for (const item of items) {
        const shopifyVariantId = this.mapLightspeedToShopify(item.itemID);
        if (!shopifyVariantId) {
          continue;
        }

        const currentStock = this.inventoryCache.get(shopifyVariantId);
        const newStock = Number(item.qtyOnHand ?? item.qoh ?? 0);

        if (currentStock !== newStock) {
          updates.push({
            variantId: shopifyVariantId,
            quantity: newStock,
            lightspeedId: item.itemID
          });
          this.inventoryCache.set(shopifyVariantId, newStock);
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

  async getLightspeedInventory() {
    if (!this.ready) {
      return [];
    }

    try {
      const data = await this.proxyRequest(this.config.endpoints.inventory);

      if (Array.isArray(data)) {
        return data;
      }

      if (Array.isArray(data?.items)) {
        return data.items;
      }

      if (Array.isArray(data?.Item)) {
        return data.Item;
      }

      if (Array.isArray(data?.data?.items)) {
        return data.data.items;
      }

      return [];
    } catch (error) {
      console.error('WTF Lightspeed: Failed to fetch inventory:', error);
      return [];
    }
  }

  async updateShopifyInventory(updates) {
    if (!this.ready || !Array.isArray(updates) || updates.length === 0) {
      return;
    }

    try {
      await this.proxyRequest(this.config.endpoints.sync, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ updates })
      });
    } catch (error) {
      console.error('Failed to update Shopify inventory via middleware:', error);
    }
  }

  async handleCartAdd(detail) {
    if (!this.ready || !detail?.item) {
      return;
    }

    const { item } = detail;

    try {
      const availability = await this.checkItemAvailability(item.variant_id);

      if (!availability.available) {
        await this.removeFromCart(item.key);
        this.showStockAlert(item.title, availability.message);
        return;
      }

      if (this.capabilities.reservations) {
        await this.reserveItem(item.variant_id, item.quantity);
      }
    } catch (error) {
      console.error('WTF Lightspeed: Cart add sync failed:', error);
    }
  }

  async handleCartUpdate(detail) {
    if (!this.ready || !this.capabilities.reservations || !detail?.cart?.items) {
      return;
    }

    for (const item of detail.cart.items) {
      await this.updateItemReservation(item.variant_id, item.quantity);
    }
  }

  async checkItemAvailability(variantId) {
    if (!this.ready) {
      return { available: false, message: 'Integration inactive' };
    }

    const lightspeedId = this.mapShopifyToLightspeed(variantId);
    if (!lightspeedId) {
      return { available: true, message: 'Item not synced with POS' };
    }

    if (!this.capabilities.availability) {
      return { available: true, message: 'Availability service disabled' };
    }

    try {
      const params = new URLSearchParams({
        variant_id: String(variantId),
        lightspeed_id: String(lightspeedId)
      });
      const data = await this.proxyRequest(`${this.config.endpoints.availability}?${params.toString()}`);
      const qtyOnHand = parseInt(data?.quantity ?? data?.qtyOnHand ?? 0, 10);
      const isAvailable = data?.available !== false ? qtyOnHand > 0 : false;

      return {
        available: isAvailable,
        quantity: qtyOnHand,
        message: data?.message || (isAvailable ? `${qtyOnHand} available` : 'Out of stock')
      };
    } catch (error) {
      console.error('WTF Lightspeed: Availability check failed:', error);
      return { available: true, message: 'Could not verify stock' };
    }
  }

  async reserveItem(variantId, quantity) {
    if (!this.ready || !this.capabilities.reservations) {
      return;
    }

    const lightspeedId = this.mapShopifyToLightspeed(variantId);
    if (!lightspeedId) {
      return;
    }

    try {
      const result = await this.proxyRequest(this.config.endpoints.reserve, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          variantId,
          lightspeedId,
          quantity,
          accountId: this.config.accountId,
          expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString()
        })
      });

      if (result?.reservationId) {
        sessionStorage.setItem(`wtf_reservation_${variantId}`, result.reservationId);
      }
    } catch (error) {
      console.error('WTF Lightspeed: Item reservation failed:', error);
    }
  }

  async updateItemReservation(variantId, quantity) {
    if (!this.ready || !this.capabilities.reservations) {
      return;
    }

    const lightspeedId = this.mapShopifyToLightspeed(variantId);
    if (!lightspeedId) {
      return;
    }

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
      const result = await this.proxyRequest(this.config.endpoints.reserve, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          variantId,
          lightspeedId,
          quantity,
          reservationId,
          accountId: this.config.accountId
        })
      });

      if (result?.reservationId) {
        sessionStorage.setItem(`wtf_reservation_${variantId}`, result.reservationId);
      }
    } catch (error) {
      console.error('WTF Lightspeed: Reservation update failed:', error);
    }
  }

  async releaseReservation(variantId, lightspeedId, reservationId) {
    if (!this.ready || !this.capabilities.reservations) {
      return;
    }

    try {
      await this.proxyRequest(this.config.endpoints.release, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          variantId,
          lightspeedId,
          reservationId,
          accountId: this.config.accountId
        })
      });

      sessionStorage.removeItem(`wtf_reservation_${variantId}`);
    } catch (error) {
      console.error('WTF Lightspeed: Reservation release failed:', error);
    }
  }

  async processCompletedOrder(orderData) {
    if (!this.ready || !this.capabilities.orderSync || !orderData) {
      return null;
    }

    const payload = {
      orderNumber: orderData.order_number,
      accountId: this.config.accountId,
      customer: orderData.customer || null,
      cartToken: orderData.cart_token || null,
      lineItems: (orderData.line_items || [])
        .map((item) => ({
          lightspeedId: this.mapShopifyToLightspeed(item.variant_id),
          variantId: item.variant_id,
          quantity: item.quantity,
          price: item.price,
          note: this.buildItemNote(item)
        }))
        .filter((line) => line.lightspeedId)
    };

    if (payload.lineItems.length === 0) {
      return null;
    }

    try {
      const result = await this.proxyRequest(this.config.endpoints.orders, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (result?.saleId || result?.sale?.saleID) {
        console.log(`WTF Lightspeed: Order processed via middleware #${result.saleId || result.sale.saleID}`);
      }

      return result;
    } catch (error) {
      console.error('WTF Lightspeed: Order processing failed:', error);
      return null;
    }
  }

  async handleCheckoutCompletion(checkout) {
    if (!this.ready || !this.capabilities.orderSync || !checkout) {
      return;
    }

    try {
      await this.processCompletedOrder(checkout);
    } catch (error) {
      console.error('WTF Lightspeed: Checkout completion handling failed:', error);
    }
  }

  async removeFromCart(lineKey) {
    if (!lineKey) {
      return;
    }

    try {
      await fetch('/cart/change.js', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json'
        },
        body: JSON.stringify({ id: lineKey, quantity: 0 })
      });
    } catch (error) {
      console.error('WTF Lightspeed: Failed to remove item from cart:', error);
    }
  }

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

  mapShopifyToLightspeed(variantId) {
    const mapping = this.config.variantMapping || {};
    return mapping[variantId] || null;
  }

  mapLightspeedToShopify(itemId) {
    const mapping = this.config.variantMapping || {};
    const reverseMapping = Object.fromEntries(
      Object.entries(mapping).map(([key, value]) => [value, key])
    );
    return reverseMapping[itemId] || null;
  }

  showStockAlert(itemName, message) {
    const alert = document.createElement('div');
    alert.className = 'wtf-stock-alert';
    alert.innerHTML = `
      <div class="wtf-stock-alert__content">
        <strong>Stock Alert:</strong> ${itemName} - ${message}
        <button class="wtf-stock-alert__close" type="button">×</button>
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

    alert.querySelector('.wtf-stock-alert__close')?.addEventListener('click', () => {
      alert.remove();
    });

    document.body.appendChild(alert);

    window.setTimeout(() => {
      if (alert.parentElement) {
        alert.remove();
      }
    }, 5000);
  }

  dispatchInventoryUpdate(updates) {
    if (!this.ready) {
      return;
    }

    document.dispatchEvent(new CustomEvent('wtf:inventory:updated', {
      detail: { updates, timestamp: new Date() }
    }));
  }

  getSyncStatus() {
    return {
      active: this.ready,
      isRunning: !!this.syncTimer,
      lastSync: this.lastSyncTime,
      cacheSize: this.inventoryCache.size,
      capabilities: this.capabilities,
      config: this.config
    };
  }
}

// Initialize Lightspeed integration
document.addEventListener('DOMContentLoaded', () => {
  const lightspeedConfig = window.WTFConfig?.get
    ? window.WTFConfig.getIntegrationConfig('lightspeed')
    : (window.WTF_CONFIG_DATA?.integrations?.lightspeed || null);

  if (!lightspeedConfig || lightspeedConfig.enabled === false) {
    console.info('WTF Lightspeed: Integration disabled by configuration.');
    window.WTFLightspeed = null;
    return;
  }

  const integration = new WTFLightspeedIntegration(lightspeedConfig);
  window.WTFLightspeed = integration.isActive() ? integration : null;
});

// Export for use in other modules
window.WTFLightspeedIntegration = WTFLightspeedIntegration;
