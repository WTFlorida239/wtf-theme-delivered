/**
 * WTF 2accept Payment Integration
 * Handles secure payment processing, tokenization, and transaction management
 * Integrates with Shopify checkout and provides custom payment flows
 */

class WTF2AcceptIntegration {
  constructor(config = {}) {
    const globalConfig = window.WTFConfig?.get
      ? window.WTFConfig.getIntegrationConfig('twoaccept')
      : (window.WTF_CONFIG_DATA?.integrations?.twoaccept || {});

    const baseEndpoint = config.endpoints?.base
      || globalConfig?.endpoints?.base
      || '/apps/wtf/2accept';

    this.config = {
      enabled: typeof config.enabled === 'boolean'
        ? config.enabled
        : (typeof globalConfig.enabled === 'boolean' ? globalConfig.enabled : true),
      publicKey: config.publicKey || globalConfig?.publicKey || null,
      merchantId: config.merchantId || globalConfig?.merchantId || null,
      environment: config.environment || globalConfig?.environment || 'production',
      enableSavedCards: config.enableSavedCards !== undefined
        ? config.enableSavedCards
        : (globalConfig?.enableSavedCards !== undefined ? globalConfig.enableSavedCards : true),
      enableApplePay: config.enableApplePay !== undefined
        ? config.enableApplePay
        : (globalConfig?.enableApplePay !== undefined ? globalConfig.enableApplePay : true),
      enableGooglePay: config.enableGooglePay !== undefined
        ? config.enableGooglePay
        : (globalConfig?.enableGooglePay !== undefined ? globalConfig.enableGooglePay : true),
      endpoints: {
        base: baseEndpoint,
        paymentMethods: config.endpoints?.paymentMethods
          || globalConfig?.endpoints?.paymentMethods
          || `${baseEndpoint}/payment-methods`,
        payments: config.endpoints?.payments
          || globalConfig?.endpoints?.payments
          || `${baseEndpoint}/payments`,
        orders: config.endpoints?.orders
          || globalConfig?.endpoints?.orders
          || `${baseEndpoint}/orders`,
        savedMethods: config.endpoints?.savedMethods
          || globalConfig?.endpoints?.savedMethods
          || `${baseEndpoint}/customers`,
        merchantValidation: config.endpoints?.merchantValidation
          || globalConfig?.endpoints?.merchantValidation
          || `${baseEndpoint}/apple-pay/validate`,
        applePay: config.endpoints?.applePay
          || globalConfig?.endpoints?.applePay
          || `${baseEndpoint}/apple-pay`
      }
    };

    if (config.endpoints) {
      this.config.endpoints = {
        ...this.config.endpoints,
        ...config.endpoints
      };
    }

    this.paymentMethods = new Map();
    this.currentTransaction = null;
    
    this.init();
  }

  async init() {
    if (!this.config.enabled) {
      console.info('WTF 2accept: Integration disabled');
      return;
    }

    if (!this.config.publicKey || !this.config.merchantId) {
      console.warn('WTF 2accept: Missing public credentials');
      return;
    }

    // Load 2accept SDK
    await this.loadSDK();
    
    // Initialize payment methods
    await this.initializePaymentMethods();
    
    // Set up event listeners
    this.setupEventListeners();
    
    // Initialize checkout integration
    this.initializeCheckoutIntegration();
  }

  /**
   * Load 2accept SDK
   */
  async loadSDK() {
    return new Promise((resolve, reject) => {
      if (window.TwoAccept) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = this.config.environment === 'sandbox' 
        ? 'https://sandbox-api.2accept.com/js/v1/2accept.js'
        : 'https://api.2accept.com/js/v1/2accept.js';
      
      script.onload = () => {
        window.TwoAccept.configure({
          publicKey: this.config.publicKey,
          environment: this.config.environment
        });
        resolve();
      };
      
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  /**
   * Initialize available payment methods
   */
  async initializePaymentMethods() {
    try {
      const response = await fetch(this.config.endpoints.paymentMethods, {
        credentials: 'include'
      });

      const data = await response.json();
      
      if (data.payment_methods) {
        data.payment_methods.forEach(method => {
          this.paymentMethods.set(method.type, method);
        });
      }

      // Initialize specific payment methods
      if (this.config.enableApplePay && this.paymentMethods.has('apple_pay')) {
        this.initializeApplePay();
      }

      if (this.config.enableGooglePay && this.paymentMethods.has('google_pay')) {
        this.initializeGooglePay();
      }

    } catch (error) {
      console.error('WTF 2accept: Failed to initialize payment methods:', error);
    }
  }

  /**
   * Initialize Apple Pay
   */
  async initializeApplePay() {
    if (!window.ApplePaySession || !ApplePaySession.canMakePayments()) {
      return;
    }

    // Add Apple Pay button to checkout
    const applePayButton = document.createElement('button');
    applePayButton.className = 'wtf-apple-pay-button';
    applePayButton.innerHTML = '🍎 Pay with Apple Pay';
    applePayButton.onclick = () => this.processApplePay();

    const checkoutButtons = document.querySelector('.wtf-checkout-buttons');
    if (checkoutButtons) {
      checkoutButtons.appendChild(applePayButton);
    }
  }

  /**
   * Initialize Google Pay
   */
  async initializeGooglePay() {
    if (!window.google || !window.google.payments) {
      // Load Google Pay API
      const script = document.createElement('script');
      script.src = 'https://pay.google.com/gp/p/js/pay.js';
      script.onload = () => this.setupGooglePay();
      document.head.appendChild(script);
    } else {
      this.setupGooglePay();
    }
  }

  /**
   * Set up Google Pay
   */
  setupGooglePay() {
    const paymentsClient = new google.payments.api.PaymentsClient({
      environment: this.config.environment === 'sandbox' ? 'TEST' : 'PRODUCTION'
    });

    const googlePayButton = paymentsClient.createButton({
      onClick: () => this.processGooglePay(paymentsClient)
    });

    const checkoutButtons = document.querySelector('.wtf-checkout-buttons');
    if (checkoutButtons) {
      checkoutButtons.appendChild(googlePayButton);
    }
  }

  /**
   * Set up event listeners
   */
  setupEventListeners() {
    // Listen for checkout events
    document.addEventListener('wtf:checkout:start', (event) => {
      this.handleCheckoutStart(event.detail);
    });

    document.addEventListener('wtf:payment:process', (event) => {
      this.processPayment(event.detail);
    });

    // Listen for cart updates to update payment amounts
    document.addEventListener('cart:updated', (event) => {
      this.updatePaymentAmount(event.detail.total_price);
    });
  }

  /**
   * Initialize checkout integration
   */
  initializeCheckoutIntegration() {
    // Create custom checkout form if not using Shopify's default
    this.createCustomCheckoutForm();
    
    // Integrate with existing checkout buttons
    this.integrateWithCheckoutButtons();
  }

  /**
   * Create custom checkout form
   */
  createCustomCheckoutForm() {
    const checkoutContainer = document.querySelector('.wtf-custom-checkout');
    if (!checkoutContainer) return;

    const form = document.createElement('form');
    form.className = 'wtf-payment-form';
    form.innerHTML = `
      <div class="wtf-payment-methods">
        <h3>Payment Method</h3>
        
        <div class="wtf-payment-option">
          <input type="radio" id="credit-card" name="payment-method" value="credit_card" checked>
          <label for="credit-card">Credit/Debit Card</label>
        </div>

        ${this.config.enableSavedCards ? `
        <div class="wtf-payment-option">
          <input type="radio" id="saved-card" name="payment-method" value="saved_card">
          <label for="saved-card">Saved Card</label>
        </div>
        ` : ''}

        <div class="wtf-payment-option">
          <input type="radio" id="cash-pickup" name="payment-method" value="cash_pickup">
          <label for="cash-pickup">Cash (In-Store Pickup)</label>
        </div>
      </div>

      <div id="credit-card-form" class="wtf-card-form">
        <div class="wtf-form-row">
          <div class="wtf-form-field">
            <label>Card Number</label>
            <div id="card-number-element" class="wtf-card-element"></div>
          </div>
        </div>
        
        <div class="wtf-form-row">
          <div class="wtf-form-field">
            <label>Expiry Date</label>
            <div id="card-expiry-element" class="wtf-card-element"></div>
          </div>
          
          <div class="wtf-form-field">
            <label>CVC</label>
            <div id="card-cvc-element" class="wtf-card-element"></div>
          </div>
        </div>

        <div class="wtf-form-row">
          <div class="wtf-form-field">
            <label>Cardholder Name</label>
            <input type="text" id="cardholder-name" placeholder="Name on card">
          </div>
        </div>

        <div class="wtf-form-row">
          <label>
            <input type="checkbox" id="save-card"> Save card for future purchases
          </label>
        </div>
      </div>

      <div id="saved-card-form" class="wtf-saved-cards" style="display: none;">
        <div id="saved-cards-list"></div>
      </div>

      <div id="cash-pickup-form" class="wtf-cash-pickup" style="display: none;">
        <p>Pay with cash when you pick up your order at our Cape Coral location.</p>
        <p><strong>1520 SE 46th Ln, Unit B, Cape Coral, FL 33904</strong></p>
        <p>We'll call you when your order is ready!</p>
      </div>

      <button type="submit" class="wtf-pay-button">
        Complete Payment
      </button>

      <div id="payment-errors" class="wtf-payment-errors"></div>
    `;

    checkoutContainer.appendChild(form);

    // Initialize card elements
    this.initializeCardElements();
    
    // Set up form event listeners
    this.setupFormEventListeners(form);
  }

  /**
   * Initialize secure card input elements
   */
  initializeCardElements() {
    if (!window.TwoAccept) return;

    const elements = window.TwoAccept.elements();
    
    this.cardNumber = elements.create('cardNumber', {
      style: {
        base: {
          fontSize: '16px',
          color: '#424770',
          '::placeholder': {
            color: '#aab7c4',
          },
        },
      },
    });

    this.cardExpiry = elements.create('cardExpiry', {
      style: {
        base: {
          fontSize: '16px',
          color: '#424770',
          '::placeholder': {
            color: '#aab7c4',
          },
        },
      },
    });

    this.cardCvc = elements.create('cardCvc', {
      style: {
        base: {
          fontSize: '16px',
          color: '#424770',
          '::placeholder': {
            color: '#aab7c4',
          },
        },
      },
    });

    this.cardNumber.mount('#card-number-element');
    this.cardExpiry.mount('#card-expiry-element');
    this.cardCvc.mount('#card-cvc-element');

    // Handle real-time validation
    this.cardNumber.on('change', this.handleCardChange.bind(this));
    this.cardExpiry.on('change', this.handleCardChange.bind(this));
    this.cardCvc.on('change', this.handleCardChange.bind(this));
  }

  /**
   * Set up form event listeners
   */
  setupFormEventListeners(form) {
    // Payment method selection
    form.addEventListener('change', (event) => {
      if (event.target.name === 'payment-method') {
        this.handlePaymentMethodChange(event.target.value);
      }
    });

    // Form submission
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      this.handleFormSubmit(form);
    });
  }

  /**
   * Handle payment method change
   */
  handlePaymentMethodChange(method) {
    const forms = {
      'credit_card': document.getElementById('credit-card-form'),
      'saved_card': document.getElementById('saved-card-form'),
      'cash_pickup': document.getElementById('cash-pickup-form')
    };

    // Hide all forms
    Object.values(forms).forEach(form => {
      if (form) form.style.display = 'none';
    });

    // Show selected form
    if (forms[method]) {
      forms[method].style.display = 'block';
    }

    // Load saved cards if needed
    if (method === 'saved_card') {
      this.loadSavedCards();
    }
  }

  /**
   * Handle card input changes
   */
  handleCardChange(event) {
    const displayError = document.getElementById('payment-errors');
    if (event.error) {
      displayError.textContent = event.error.message;
    } else {
      displayError.textContent = '';
    }
  }

  /**
   * Handle form submission
   */
  async handleFormSubmit(form) {
    const submitButton = form.querySelector('.wtf-pay-button');
    const originalText = submitButton.textContent;
    
    submitButton.disabled = true;
    submitButton.textContent = 'Processing...';

    try {
      const paymentMethod = form.querySelector('input[name="payment-method"]:checked').value;
      
      switch (paymentMethod) {
        case 'credit_card':
          await this.processCreditCardPayment(form);
          break;
        case 'saved_card':
          await this.processSavedCardPayment(form);
          break;
        case 'cash_pickup':
          await this.processCashPickupOrder(form);
          break;
      }
    } catch (error) {
      this.displayError(error.message);
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = originalText;
    }
  }

  /**
   * Process credit card payment
   */
  async processCreditCardPayment(form) {
    const cardholderName = form.querySelector('#cardholder-name').value;
    const saveCard = form.querySelector('#save-card').checked;

    // Create payment method
    const { paymentMethod, error } = await window.TwoAccept.createPaymentMethod({
      type: 'card',
      card: this.cardNumber,
      billing_details: {
        name: cardholderName,
      },
    });

    if (error) {
      throw new Error(error.message);
    }

    // Process payment
    const paymentResult = await this.processPaymentWithMethod(paymentMethod, {
      save_payment_method: saveCard
    });

    if (paymentResult.success) {
      this.handlePaymentSuccess(paymentResult);
    } else {
      throw new Error(paymentResult.error || 'Payment failed');
    }
  }

  /**
   * Process payment with payment method
   */
  async processPaymentWithMethod(paymentMethod, options = {}) {
    const cart = await this.getCart();
    
    const paymentData = {
      payment_method: paymentMethod.id,
      amount: cart.total_price,
      currency: 'USD',
      description: `WTF Order - ${cart.item_count} items`,
      metadata: {
        cart_token: cart.token,
        customer_email: this.getCustomerEmail(),
        order_source: 'shopify_online'
      },
      ...options
    };

    try {
      const response = await fetch(this.config.endpoints.payments, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(paymentData)
      });

      const result = await response.json();
      
      if (response.ok) {
        return { success: true, payment: result };
      } else {
        return { success: false, error: result.error || 'Payment processing failed' };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Process cash pickup order
   */
  async processCashPickupOrder(form) {
    const cart = await this.getCart();
    
    // Create order with cash payment method
    const orderData = {
      payment_method: 'cash_pickup',
      amount: cart.total_price,
      currency: 'USD',
      status: 'pending_pickup',
      description: `WTF Cash Pickup Order - ${cart.item_count} items`,
      metadata: {
        cart_token: cart.token,
        customer_email: this.getCustomerEmail(),
        pickup_location: '1520 SE 46th Ln, Unit B, Cape Coral, FL 33904',
        order_source: 'shopify_online'
      }
    };

    try {
      const response = await fetch(this.config.endpoints.orders, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(orderData)
      });

      const result = await response.json();
      
      if (response.ok) {
        this.handleCashPickupSuccess(result);
      } else {
        throw new Error(result.error || 'Order creation failed');
      }
    } catch (error) {
      throw new Error(error.message);
    }
  }

  /**
   * Handle payment success
   */
  handlePaymentSuccess(paymentResult) {
    // Clear cart
    this.clearCart();
    
    // Show success message
    this.showSuccessMessage('Payment successful! Your order has been placed.');
    
    // Redirect to thank you page
    setTimeout(() => {
      window.location.href = `/pages/thank-you?payment_id=${paymentResult.payment.id}`;
    }, 2000);

    // Dispatch success event
    document.dispatchEvent(new CustomEvent('wtf:payment:success', {
      detail: paymentResult
    }));
  }

  /**
   * Handle cash pickup success
   */
  handleCashPickupSuccess(orderResult) {
    // Clear cart
    this.clearCart();
    
    // Show pickup instructions
    this.showSuccessMessage(`
      Order confirmed! We'll call you when it's ready for pickup.
      <br><strong>Pickup Location:</strong> 1520 SE 46th Ln, Unit B, Cape Coral, FL 33904
      <br><strong>Order #:</strong> ${orderResult.order_number}
    `);
    
    // Send confirmation email/SMS
    this.sendPickupConfirmation(orderResult);
    
    // Redirect to pickup confirmation page
    setTimeout(() => {
      window.location.href = `/pages/pickup-confirmation?order_id=${orderResult.id}`;
    }, 3000);
  }

  /**
   * Load saved cards for customer
   */
  async loadSavedCards() {
    const customerEmail = this.getCustomerEmail();
    if (!customerEmail) return;

    try {
      const response = await fetch(`${this.config.endpoints.savedMethods}/${encodeURIComponent(customerEmail)}/payment-methods`, {
        credentials: 'include'
      });

      const data = await response.json();
      const savedCardsList = document.getElementById('saved-cards-list');
      
      if (data.payment_methods && data.payment_methods.length > 0) {
        savedCardsList.innerHTML = data.payment_methods.map(method => `
          <div class="wtf-saved-card">
            <input type="radio" id="card-${method.id}" name="saved-card" value="${method.id}">
            <label for="card-${method.id}">
              **** **** **** ${method.card.last4} (${method.card.brand.toUpperCase()})
              <span class="expiry">${method.card.exp_month}/${method.card.exp_year}</span>
            </label>
          </div>
        `).join('');
      } else {
        savedCardsList.innerHTML = '<p>No saved cards found.</p>';
      }
    } catch (error) {
      console.error('Failed to load saved cards:', error);
    }
  }

  /**
   * Get current cart
   */
  async getCart() {
    const response = await fetch('/cart.js');
    return response.json();
  }

  /**
   * Get customer email
   */
  getCustomerEmail() {
    // Try to get from Shopify customer object
    if (window.Shopify && window.Shopify.customer) {
      return window.Shopify.customer.email;
    }
    
    // Try to get from form
    const emailInput = document.querySelector('input[type="email"]');
    return emailInput ? emailInput.value : null;
  }

  /**
   * Clear cart after successful payment
   */
  async clearCart() {
    await fetch('/cart/clear.js', { method: 'POST' });
    document.dispatchEvent(new CustomEvent('cart:cleared'));
  }

  /**
   * Show success message
   */
  showSuccessMessage(message) {
    const successDiv = document.createElement('div');
    successDiv.className = 'wtf-payment-success';
    successDiv.innerHTML = `
      <div class="wtf-success-content">
        <div class="wtf-success-icon">✅</div>
        <div class="wtf-success-message">${message}</div>
      </div>
    `;
    
    successDiv.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0,0,0,0.8);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
    `;

    document.body.appendChild(successDiv);
  }

  /**
   * Display error message
   */
  displayError(message) {
    const errorDiv = document.getElementById('payment-errors');
    if (errorDiv) {
      errorDiv.textContent = message;
      errorDiv.style.display = 'block';
    }
  }

  /**
   * Send pickup confirmation
   */
  async sendPickupConfirmation(orderResult) {
    // This would integrate with your notification system
    // Could send SMS via Twilio, email via SendGrid, etc.
    console.log('Sending pickup confirmation for order:', orderResult.order_number);
  }

  /**
   * Process Apple Pay
   */
  async processApplePay() {
    const cart = await this.getCart();
    
    const paymentRequest = {
      countryCode: 'US',
      currencyCode: 'USD',
      supportedNetworks: ['visa', 'masterCard', 'amex', 'discover'],
      merchantCapabilities: ['supports3DS'],
      total: {
        label: 'WTF Total',
        amount: (cart.total_price / 100).toFixed(2)
      }
    };

    const session = new ApplePaySession(3, paymentRequest);
    
    session.onvalidatemerchant = async (event) => {
      // Validate merchant with 2accept
      const validation = await this.validateApplePayMerchant(event.validationURL);
      session.completeMerchantValidation(validation);
    };

    session.onpaymentauthorized = async (event) => {
      const payment = event.payment;
      const result = await this.processApplePayPayment(payment);
      
      if (result.success) {
        session.completePayment(ApplePaySession.STATUS_SUCCESS);
        this.handlePaymentSuccess(result);
      } else {
        session.completePayment(ApplePaySession.STATUS_FAILURE);
        this.displayError(result.error);
      }
    };

    session.begin();
  }

  /**
   * Validate Apple Pay merchant
   */
  async validateApplePayMerchant(validationURL) {
    const response = await fetch(this.config.endpoints.merchantValidation, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({ validation_url: validationURL })
    });

    return response.json();
  }

  /**
   * Process Apple Pay payment
   */
  async processApplePayPayment(payment) {
    const cart = await this.getCart();

    try {
      const response = await fetch(this.config.endpoints.applePay, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          payment,
          cart
        })
      });

      const result = await response.json();

      if (response.ok) {
        return { success: true, payment: result };
      }

      return { success: false, error: result.error || 'Apple Pay processing failed' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

// Initialize 2accept integration
document.addEventListener('DOMContentLoaded', function() {
  const twoAcceptConfig = window.WTFConfig?.get
    ? window.WTFConfig.getIntegrationConfig('twoaccept')
    : (window.WTF_CONFIG_DATA?.integrations?.twoaccept || null);

  if (twoAcceptConfig && (twoAcceptConfig.enabled !== false)) {
    window.WTF2Accept = new WTF2AcceptIntegration(twoAcceptConfig);
  }
});

// Export for use in other modules
window.WTF2AcceptIntegration = WTF2AcceptIntegration;
