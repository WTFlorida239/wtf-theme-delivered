/**
 * WTF Webhook Handler
 * Handles incoming webhooks from Shopify, Lightspeed, and 2accept
 * Manages order synchronization, inventory updates, and payment notifications
 */

class WTFWebhookHandler {
  constructor(config = {}) {
    this.config = {
      enableLogging: config.enableLogging !== false,
      retryAttempts: config.retryAttempts || 3,
      retryDelay: config.retryDelay || 1000,
      ...config
    };
    
    this.handlers = new Map();
    this.processingQueue = [];
    this.isProcessing = false;
    
    this.init();
  }

  init() {
    // Register default webhook handlers
    this.registerShopifyHandlers();
    this.registerLightspeedHandlers();
    this.register2AcceptHandlers();
    
    // Set up webhook endpoint listener
    this.setupWebhookEndpoint();
    
    // Start processing queue
    this.startProcessingQueue();
  }

  /**
   * Register Shopify webhook handlers
   */
  registerShopifyHandlers() {
    // Order events
    this.register('shopify/orders/create', this.handleOrderCreate.bind(this));
    this.register('shopify/orders/updated', this.handleOrderUpdate.bind(this));
    this.register('shopify/orders/paid', this.handleOrderPaid.bind(this));
    this.register('shopify/orders/cancelled', this.handleOrderCancelled.bind(this));
    this.register('shopify/orders/fulfilled', this.handleOrderFulfilled.bind(this));
    
    // Product and inventory events
    this.register('shopify/products/create', this.handleProductCreate.bind(this));
    this.register('shopify/products/update', this.handleProductUpdate.bind(this));
    this.register('shopify/inventory_levels/update', this.handleInventoryUpdate.bind(this));
    
    // Customer events
    this.register('shopify/customers/create', this.handleCustomerCreate.bind(this));
    this.register('shopify/customers/update', this.handleCustomerUpdate.bind(this));
    
    // Cart events
    this.register('shopify/carts/create', this.handleCartCreate.bind(this));
    this.register('shopify/carts/update', this.handleCartUpdate.bind(this));
    
    // Checkout events
    this.register('shopify/checkouts/create', this.handleCheckoutCreate.bind(this));
    this.register('shopify/checkouts/update', this.handleCheckoutUpdate.bind(this));
  }

  /**
   * Register Lightspeed webhook handlers
   */
  registerLightspeedHandlers() {
    this.register('lightspeed/sale/create', this.handleLightspeedSale.bind(this));
    this.register('lightspeed/inventory/update', this.handleLightspeedInventoryUpdate.bind(this));
    this.register('lightspeed/customer/create', this.handleLightspeedCustomerCreate.bind(this));
    this.register('lightspeed/item/update', this.handleLightspeedItemUpdate.bind(this));
  }

  /**
   * Register 2accept webhook handlers
   */
  register2AcceptHandlers() {
    this.register('2accept/payment/succeeded', this.handlePaymentSucceeded.bind(this));
    this.register('2accept/payment/failed', this.handlePaymentFailed.bind(this));
    this.register('2accept/payment/refunded', this.handlePaymentRefunded.bind(this));
    this.register('2accept/charge/dispute', this.handleChargeDispute.bind(this));
  }

  /**
   * Register a webhook handler
   * @param {string} event - Event name (e.g., 'shopify/orders/create')
   * @param {function} handler - Handler function
   */
  register(event, handler) {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, []);
    }
    this.handlers.get(event).push(handler);
    
    if (this.config.enableLogging) {
      console.log(`WTF Webhook: Registered handler for ${event}`);
    }
  }

  /**
   * Set up webhook endpoint listener
   */
  setupWebhookEndpoint() {
    // This would typically be handled by your server
    // For client-side, we listen for custom events
    document.addEventListener('wtf:webhook:received', (event) => {
      this.processWebhook(event.detail);
    });
  }

  /**
   * Process incoming webhook
   * @param {object} webhook - Webhook data
   */
  async processWebhook(webhook) {
    const { event, data, source, timestamp } = webhook;
    
    if (this.config.enableLogging) {
      console.log(`WTF Webhook: Processing ${event} from ${source}`, data);
    }

    // Add to processing queue
    this.processingQueue.push({
      id: this.generateId(),
      event,
      data,
      source,
      timestamp: timestamp || new Date().toISOString(),
      attempts: 0,
      maxAttempts: this.config.retryAttempts
    });

    // Start processing if not already running
    if (!this.isProcessing) {
      this.processQueue();
    }
  }

  /**
   * Start processing queue
   */
  startProcessingQueue() {
    setInterval(() => {
      if (!this.isProcessing && this.processingQueue.length > 0) {
        this.processQueue();
      }
    }, 1000);
  }

  /**
   * Process webhook queue
   */
  async processQueue() {
    if (this.isProcessing || this.processingQueue.length === 0) {
      return;
    }

    this.isProcessing = true;

    while (this.processingQueue.length > 0) {
      const webhook = this.processingQueue.shift();
      
      try {
        await this.executeHandlers(webhook);
        
        if (this.config.enableLogging) {
          console.log(`WTF Webhook: Successfully processed ${webhook.event}`);
        }
      } catch (error) {
        webhook.attempts++;
        
        if (webhook.attempts < webhook.maxAttempts) {
          // Retry with exponential backoff
          setTimeout(() => {
            this.processingQueue.unshift(webhook);
          }, this.config.retryDelay * Math.pow(2, webhook.attempts - 1));
          
          if (this.config.enableLogging) {
            console.warn(`WTF Webhook: Retrying ${webhook.event} (attempt ${webhook.attempts})`);
          }
        } else {
          console.error(`WTF Webhook: Failed to process ${webhook.event} after ${webhook.maxAttempts} attempts:`, error);
          
          // Send to dead letter queue or error handler
          this.handleWebhookError(webhook, error);
        }
      }
    }

    this.isProcessing = false;
  }

  /**
   * Execute handlers for a webhook event
   * @param {object} webhook - Webhook data
   */
  async executeHandlers(webhook) {
    const handlers = this.handlers.get(webhook.event) || [];
    
    if (handlers.length === 0) {
      if (this.config.enableLogging) {
        console.warn(`WTF Webhook: No handlers registered for ${webhook.event}`);
      }
      return;
    }

    // Execute all handlers in parallel
    const promises = handlers.map(handler => 
      handler(webhook.data, webhook).catch(error => {
        console.error(`WTF Webhook: Handler error for ${webhook.event}:`, error);
        throw error;
      })
    );

    await Promise.all(promises);
  }

  /**
   * Handle Shopify order creation
   */
  async handleOrderCreate(orderData) {
    try {
      // Sync order to Lightspeed POS
      if (window.WTFLightspeed) {
        await window.WTFLightspeed.processCompletedOrder(orderData);
      }

      // Send order confirmation notifications
      await this.sendOrderConfirmation(orderData);

      // Update inventory reservations
      await this.updateInventoryReservations(orderData);

      // Trigger analytics events
      this.trackOrderEvent('order_created', orderData);

    } catch (error) {
      console.error('Failed to handle order creation:', error);
      throw error;
    }
  }

  /**
   * Handle Shopify order updates
   */
  async handleOrderUpdate(orderData) {
    try {
      // Sync order changes to Lightspeed
      if (window.WTFLightspeed) {
        await window.WTFLightspeed.updateOrder(orderData);
      }

      // Send update notifications if needed
      if (this.shouldNotifyCustomer(orderData)) {
        await this.sendOrderUpdateNotification(orderData);
      }

      // Track analytics
      this.trackOrderEvent('order_updated', orderData);

    } catch (error) {
      console.error('Failed to handle order update:', error);
      throw error;
    }
  }

  /**
   * Handle order payment
   */
  async handleOrderPaid(orderData) {
    try {
      // Process payment in Lightspeed
      if (window.WTFLightspeed) {
        await window.WTFLightspeed.recordPayment(orderData);
      }

      // Send payment confirmation
      await this.sendPaymentConfirmation(orderData);

      // Start order preparation
      await this.startOrderPreparation(orderData);

      // Track analytics
      this.trackOrderEvent('order_paid', orderData);

    } catch (error) {
      console.error('Failed to handle order payment:', error);
      throw error;
    }
  }

  /**
   * Handle order cancellation
   */
  async handleOrderCancelled(orderData) {
    try {
      // Cancel order in Lightspeed
      if (window.WTFLightspeed) {
        await window.WTFLightspeed.cancelOrder(orderData);
      }

      // Process refund if needed
      if (orderData.financial_status === 'refunded') {
        await this.processRefund(orderData);
      }

      // Send cancellation notification
      await this.sendCancellationNotification(orderData);

      // Release inventory reservations
      await this.releaseInventoryReservations(orderData);

      // Track analytics
      this.trackOrderEvent('order_cancelled', orderData);

    } catch (error) {
      console.error('Failed to handle order cancellation:', error);
      throw error;
    }
  }

  /**
   * Handle order fulfillment
   */
  async handleOrderFulfilled(orderData) {
    try {
      // Mark as fulfilled in Lightspeed
      if (window.WTFLightspeed) {
        await window.WTFLightspeed.fulfillOrder(orderData);
      }

      // Send pickup/delivery notification
      await this.sendFulfillmentNotification(orderData);

      // Track analytics
      this.trackOrderEvent('order_fulfilled', orderData);

    } catch (error) {
      console.error('Failed to handle order fulfillment:', error);
      throw error;
    }
  }

  /**
   * Handle inventory updates
   */
  async handleInventoryUpdate(inventoryData) {
    try {
      // Update Lightspeed inventory if needed
      if (window.WTFLightspeed) {
        await window.WTFLightspeed.syncInventoryFromShopify(inventoryData);
      }

      // Update real-time inventory display
      this.updateInventoryDisplay(inventoryData);

      // Check for low stock alerts
      await this.checkLowStockAlerts(inventoryData);

    } catch (error) {
      console.error('Failed to handle inventory update:', error);
      throw error;
    }
  }

  /**
   * Handle Lightspeed sale creation
   */
  async handleLightspeedSale(saleData) {
    try {
      // Check if this sale originated from Shopify
      if (saleData.note && saleData.note.includes('Shopify Order')) {
        // Skip processing to avoid duplicate
        return;
      }

      // Create corresponding order in Shopify if needed
      await this.createShopifyOrderFromPOS(saleData);

      // Update inventory levels
      await this.syncInventoryFromLightspeed(saleData);

    } catch (error) {
      console.error('Failed to handle Lightspeed sale:', error);
      throw error;
    }
  }

  /**
   * Handle payment success from 2accept
   */
  async handlePaymentSucceeded(paymentData) {
    try {
      // Update order status in Shopify
      await this.updateShopifyOrderPaymentStatus(paymentData, 'paid');

      // Send payment confirmation
      await this.sendPaymentSuccessNotification(paymentData);

      // Track conversion
      this.trackConversionEvent(paymentData);

    } catch (error) {
      console.error('Failed to handle payment success:', error);
      throw error;
    }
  }

  /**
   * Handle payment failure from 2accept
   */
  async handlePaymentFailed(paymentData) {
    try {
      // Update order status in Shopify
      await this.updateShopifyOrderPaymentStatus(paymentData, 'pending');

      // Send payment failure notification
      await this.sendPaymentFailureNotification(paymentData);

      // Release inventory reservations
      await this.releaseInventoryForFailedPayment(paymentData);

    } catch (error) {
      console.error('Failed to handle payment failure:', error);
      throw error;
    }
  }

  /**
   * Send order confirmation notifications
   */
  async sendOrderConfirmation(orderData) {
    const customer = orderData.customer;
    if (!customer) return;

    // Send email confirmation
    if (customer.email) {
      await this.sendEmail({
        to: customer.email,
        subject: `Order Confirmation #${orderData.order_number} - WTF`,
        template: 'order_confirmation',
        data: orderData
      });
    }

    // Send SMS confirmation if phone number available
    if (customer.phone) {
      await this.sendSMS({
        to: customer.phone,
        message: `Thanks for your order #${orderData.order_number}! We'll text you when it's ready for pickup. WTF Cape Coral`
      });
    }
  }

  /**
   * Send order update notifications
   */
  async sendOrderUpdateNotification(orderData) {
    const customer = orderData.customer;
    if (!customer) return;

    let message = '';
    
    switch (orderData.fulfillment_status) {
      case 'fulfilled':
        message = `Your order #${orderData.order_number} is ready for pickup! 1520 SE 46th Ln, Unit B, Cape Coral. Call (239) 955-0314 when you arrive.`;
        break;
      case 'partial':
        message = `Part of your order #${orderData.order_number} is ready. We'll notify you when the rest is complete.`;
        break;
      default:
        message = `Your order #${orderData.order_number} status has been updated. Check your email for details.`;
    }

    // Send SMS update
    if (customer.phone && message) {
      await this.sendSMS({
        to: customer.phone,
        message: message
      });
    }
  }

  /**
   * Start order preparation process
   */
  async startOrderPreparation(orderData) {
    // Calculate estimated preparation time
    const estimatedTime = this.calculatePreparationTime(orderData.line_items);
    
    // Notify staff about new order
    await this.notifyStaff({
      type: 'new_order',
      order: orderData,
      estimatedTime: estimatedTime
    });

    // Set up preparation tracking
    this.trackOrderPreparation(orderData.id, estimatedTime);
  }

  /**
   * Calculate preparation time based on order items
   */
  calculatePreparationTime(lineItems) {
    let totalTime = 0;
    
    lineItems.forEach(item => {
      const productType = this.getProductType(item.product_id);
      const preparationTimes = window.WTFConfig.get('ordering.preparationTime', {});
      const itemTime = preparationTimes[productType] || 5; // Default 5 minutes
      
      totalTime += itemTime * item.quantity;
    });

    return Math.max(totalTime, 5); // Minimum 5 minutes
  }

  /**
   * Get product type for preparation time calculation
   */
  getProductType(productId) {
    // Map product IDs to types based on your product catalog
    const productMappings = window.WTFConfig.get('shopify.products', {});
    
    for (const [type, id] of Object.entries(productMappings)) {
      if (id === productId) {
        return type.replace('custom', '').toLowerCase();
      }
    }
    
    return 'default';
  }

  /**
   * Send email notification
   */
  async sendEmail(emailData) {
    if (!window.WTFConfig.get('notifications.email.enabled')) {
      return;
    }

    try {
      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(emailData)
      });

      if (!response.ok) {
        throw new Error(`Email send failed: ${response.status}`);
      }
    } catch (error) {
      console.error('Failed to send email:', error);
    }
  }

  /**
   * Send SMS notification
   */
  async sendSMS(smsData) {
    if (!window.WTFConfig.get('notifications.sms.enabled')) {
      return;
    }

    try {
      const response = await fetch('/api/send-sms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(smsData)
      });

      if (!response.ok) {
        throw new Error(`SMS send failed: ${response.status}`);
      }
    } catch (error) {
      console.error('Failed to send SMS:', error);
    }
  }

  /**
   * Track analytics events
   */
  trackOrderEvent(eventName, orderData) {
    // Google Analytics 4
    if (typeof gtag !== 'undefined') {
      gtag('event', eventName, {
        transaction_id: orderData.order_number,
        value: parseFloat(orderData.total_price),
        currency: orderData.currency,
        items: orderData.line_items.map(item => ({
          item_id: item.sku || item.variant_id,
          item_name: item.name,
          category: item.product_type,
          quantity: item.quantity,
          price: parseFloat(item.price)
        }))
      });
    }

    // Facebook Pixel
    if (typeof fbq !== 'undefined') {
      if (eventName === 'order_created') {
        fbq('track', 'Purchase', {
          value: parseFloat(orderData.total_price),
          currency: orderData.currency
        });
      }
    }

    // Custom analytics
    document.dispatchEvent(new CustomEvent('wtf:analytics:track', {
      detail: {
        event: eventName,
        data: orderData
      }
    }));
  }

  /**
   * Handle webhook processing errors
   */
  handleWebhookError(webhook, error) {
    console.error(`WTF Webhook: Permanent failure for ${webhook.event}:`, error);
    
    // Log to error tracking service
    if (window.WTFConfig.get('errorHandling.enableErrorReporting')) {
      this.reportError(webhook, error);
    }

    // Notify administrators
    this.notifyAdmins({
      type: 'webhook_failure',
      webhook: webhook,
      error: error.message
    });
  }

  /**
   * Generate unique ID for webhook processing
   */
  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  /**
   * Check if customer should be notified of order update
   */
  shouldNotifyCustomer(orderData) {
    // Notify on status changes that matter to customers
    const notifyStatuses = [
      'fulfilled',
      'partial',
      'cancelled',
      'refunded'
    ];
    
    return notifyStatuses.includes(orderData.fulfillment_status) ||
           notifyStatuses.includes(orderData.financial_status);
  }

  /**
   * Update real-time inventory display
   */
  updateInventoryDisplay(inventoryData) {
    document.dispatchEvent(new CustomEvent('wtf:inventory:updated', {
      detail: inventoryData
    }));
  }

  /**
   * Notify staff about important events
   */
  async notifyStaff(notification) {
    // This could integrate with Slack, Discord, or internal notification system
    console.log('Staff notification:', notification);
    
    // Dispatch event for staff notification UI
    document.dispatchEvent(new CustomEvent('wtf:staff:notify', {
      detail: notification
    }));
  }

  /**
   * Report error to tracking service
   */
  reportError(webhook, error) {
    // This would integrate with error tracking services like Sentry, Bugsnag, etc.
    console.error('Webhook error reported:', { webhook, error });
  }

  /**
   * Notify administrators of critical issues
   */
  async notifyAdmins(notification) {
    // Send critical notifications to administrators
    console.warn('Admin notification:', notification);
  }
}

// Initialize webhook handler
document.addEventListener('DOMContentLoaded', function() {
  window.WTFWebhooks = new WTFWebhookHandler({
    enableLogging: window.WTFConfig.get('development.enableConsoleLogging', false)
  });
});

// Export for use in other modules
window.WTFWebhookHandler = WTFWebhookHandler;
