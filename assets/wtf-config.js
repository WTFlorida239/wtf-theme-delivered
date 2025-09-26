/**
 * WTF Configuration Manager
 * Central configuration for all integrations and system settings
 * Manages Shopify, Lightspeed POS, 2accept, and other service configurations
 */

window.WTF_CONFIG = {
  // Store Information
  store: {
    name: 'WTF - Welcome To Florida',
    phone: '(239) 955-0314',
    email: 'info@wtfswag.com',
    address: {
      street: '1520 SE 46th Ln, Unit B',
      city: 'Cape Coral',
      state: 'FL',
      zip: '33904',
      country: 'US'
    },
    hours: {
      monday: '10:00 AM - 10:00 PM',
      tuesday: '10:00 AM - 10:00 PM',
      wednesday: '10:00 AM - 10:00 PM',
      thursday: '10:00 AM - 10:00 PM',
      friday: '10:00 AM - 11:00 PM',
      saturday: '10:00 AM - 11:00 PM',
      sunday: '12:00 PM - 9:00 PM'
    },
    timezone: 'America/New_York'
  },

  // Shopify Configuration
  shopify: {
    enabled: true,
    domain: 'wtfswag.myshopify.com',
    storefrontAccessToken: process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN,
    adminAccessToken: process.env.SHOPIFY_ADMIN_ACCESS_TOKEN,
    locationId: process.env.SHOPIFY_LOCATION_ID,
    webhookSecret: process.env.SHOPIFY_WEBHOOK_SECRET,
    
    // Product mappings
    products: {
      customKratomTea: 'custom-kratom-tea',
      customKavaDrink: 'custom-kava-drink',
      thcDrinks: 'thc-drinks',
      thcShots: 'thc-shots',
      draftPours: 'draft-pours',
      cannedDrinks: 'canned-drinks',
      takeHomeItems: 'take-home-items'
    },

    // Collection mappings
    collections: {
      kratomTeas: 'kratom-teas',
      kavaDrinks: 'kava-drinks',
      thcProducts: 'thc-products',
      beverages: 'beverages',
      merchandise: 'merchandise'
    }
  },

  // Lightspeed POS Integration
  lightspeed: {
    enabled: true,
    apiUrl: 'https://api.lightspeedapp.com/API',
    accountId: process.env.LIGHTSPEED_ACCOUNT_ID,
    apiKey: process.env.LIGHTSPEED_API_KEY,
    apiSecret: process.env.LIGHTSPEED_API_SECRET,
    
    // Sync settings
    syncInterval: 30000, // 30 seconds
    enableRealTimeSync: true,
    enableInventorySync: true,
    enableCustomerSync: true,
    enableOrderSync: true,
    
    // Store settings
    shopId: 1,
    registerId: 1,
    defaultEmployeeId: 1,
    
    // Product variant mapping (Shopify variant ID -> Lightspeed item ID)
    variantMapping: {
      // Kratom Teas
      '12345678901': '1001', // Green Kratom Medium
      '12345678902': '1002', // Green Kratom Large
      '12345678903': '1003', // Red Kratom Medium
      '12345678904': '1004', // Red Kratom Large
      
      // Kava Drinks
      '12345678905': '1005', // Traditional Kava Medium
      '12345678906': '1006', // Traditional Kava Large
      '12345678907': '1007', // Flavored Kava Medium
      '12345678908': '1008', // Flavored Kava Large
      
      // THC Products
      '12345678909': '1009', // THC Drink Large
      '12345678910': '1010', // THC Drink Gallon
      '12345678911': '1011', // THC Shot 2.5mg
      '12345678912': '1012', // THC Shot 5mg
      '12345678913': '1013', // THC Shot 25mg
      
      // Draft Pours
      '12345678914': '1014', // Draft Pour Small
      '12345678915': '1015', // Draft Pour Large
      
      // Canned Drinks
      '12345678916': '1016', // Energy Drink
      '12345678917': '1017', // Relaxation Drink
      
      // Take Home Items
      '12345678918': '1018', // Kratom Powder
      '12345678919': '1019', // Kava Powder
      '12345678920': '1020'  // Merchandise
    }
  },

  // 2accept Payment Integration
  twoaccept: {
    enabled: true,
    environment: 'production', // 'sandbox' or 'production'
    publicKey: process.env.TWOACCEPT_PUBLIC_KEY,
    secretKey: process.env.TWOACCEPT_SECRET_KEY,
    merchantId: process.env.TWOACCEPT_MERCHANT_ID,
    
    // Payment method settings
    enableSavedCards: true,
    enableApplePay: true,
    enableGooglePay: true,
    enableCashPickup: true,
    
    // Supported payment methods
    supportedMethods: [
      'visa',
      'mastercard',
      'amex',
      'discover',
      'apple_pay',
      'google_pay',
      'cash_pickup'
    ],
    
    // Currency settings
    currency: 'USD',
    country: 'US'
  },

  // Analytics and Tracking
  analytics: {
    googleAnalytics: {
      enabled: true,
      measurementId: process.env.GA4_MEASUREMENT_ID
    },
    facebookPixel: {
      enabled: true,
      pixelId: process.env.FACEBOOK_PIXEL_ID
    },
    tiktokPixel: {
      enabled: true,
      pixelId: process.env.TIKTOK_PIXEL_ID
    }
  },

  // Email and SMS Notifications
  notifications: {
    email: {
      enabled: true,
      provider: 'sendgrid', // or 'mailgun', 'ses'
      apiKey: process.env.SENDGRID_API_KEY,
      fromEmail: 'orders@wtfswag.com',
      fromName: 'WTF - Welcome To Florida'
    },
    sms: {
      enabled: true,
      provider: 'twilio',
      accountSid: process.env.TWILIO_ACCOUNT_SID,
      authToken: process.env.TWILIO_AUTH_TOKEN,
      fromNumber: process.env.TWILIO_PHONE_NUMBER
    }
  },

  // Blog and Content Management
  blog: {
    enabled: true,
    postsPerPage: 6,
    enableComments: false,
    enableSocialSharing: true,
    categories: [
      'Kratom Education',
      'Kava Culture',
      'Cannabis News',
      'Store Updates',
      'Community Events',
      'Health & Wellness'
    ]
  },

  // Inventory Management
  inventory: {
    lowStockThreshold: 5,
    outOfStockThreshold: 0,
    enableLowStockAlerts: true,
    enableBackorders: false,
    reservationTimeout: 900000, // 15 minutes in milliseconds
    
    // Auto-reorder settings
    enableAutoReorder: false,
    reorderThreshold: 10,
    reorderQuantity: 50
  },

  // Customer Management
  customers: {
    enableLoyaltyProgram: true,
    pointsPerDollar: 1,
    enableBirthdayRewards: true,
    enableReferralProgram: true,
    
    // Age verification for THC products
    enableAgeVerification: true,
    minimumAge: 21,
    requiredDocuments: ['drivers_license', 'passport', 'state_id']
  },

  // Ordering and Fulfillment
  ordering: {
    enableOnlineOrdering: true,
    enablePickup: true,
    enableDelivery: false, // Future feature
    
    // Pickup settings
    pickupLocation: {
      name: 'WTF Cape Coral',
      address: '1520 SE 46th Ln, Unit B, Cape Coral, FL 33904',
      phone: '(239) 955-0314',
      instructions: 'Call when you arrive and we\'ll bring your order out!'
    },
    
    // Order timing
    preparationTime: {
      kratom: 5, // minutes
      kava: 7,
      thc: 10,
      draft: 3,
      canned: 1
    },
    
    // Operating hours for online orders
    onlineOrderHours: {
      monday: { open: '10:00', close: '22:00' },
      tuesday: { open: '10:00', close: '22:00' },
      wednesday: { open: '10:00', close: '22:00' },
      thursday: { open: '10:00', close: '22:00' },
      friday: { open: '10:00', close: '23:00' },
      saturday: { open: '10:00', close: '23:00' },
      sunday: { open: '12:00', close: '21:00' }
    }
  },

  // Feature Flags
  features: {
    enableCustomDrinkBuilder: true,
    enableFlavorRotation: true,
    enableSeasonalMenus: true,
    enableEventBooking: false, // Future feature
    enableSubscriptions: false, // Future feature
    enableGiftCards: false, // Future feature
    enableRewards: true,
    enableSocialLogin: false,
    enableGuestCheckout: true,
    enableMultiLocation: false // Future feature
  },

  // API Rate Limits
  rateLimits: {
    lightspeed: {
      requestsPerSecond: 2,
      burstLimit: 10
    },
    twoaccept: {
      requestsPerSecond: 5,
      burstLimit: 20
    },
    shopify: {
      requestsPerSecond: 2,
      burstLimit: 40
    }
  },

  // Error Handling
  errorHandling: {
    enableErrorReporting: true,
    enableUserFriendlyMessages: true,
    fallbackToCache: true,
    retryAttempts: 3,
    retryDelay: 1000 // milliseconds
  },

  // Performance Settings
  performance: {
    enableCaching: true,
    cacheTimeout: 300000, // 5 minutes
    enableLazyLoading: true,
    enableImageOptimization: true,
    enableMinification: true
  },

  // Security Settings
  security: {
    enableCSP: true,
    enableHSTS: true,
    enableXSSProtection: true,
    sessionTimeout: 3600000, // 1 hour
    enableRateLimiting: true
  },

  // Development Settings
  development: {
    enableDebugMode: process.env.NODE_ENV === 'development',
    enableConsoleLogging: process.env.NODE_ENV === 'development',
    enablePerformanceMonitoring: true,
    mockExternalAPIs: false
  }
};

/**
 * Configuration Manager Class
 * Provides methods to safely access and update configuration
 */
class WTFConfigManager {
  constructor(config) {
    this.config = config;
    this.listeners = new Map();
  }

  /**
   * Get configuration value by path
   * @param {string} path - Dot notation path (e.g., 'shopify.products.customKratomTea')
   * @param {*} defaultValue - Default value if path doesn't exist
   */
  get(path, defaultValue = null) {
    const keys = path.split('.');
    let current = this.config;

    for (const key of keys) {
      if (current && typeof current === 'object' && key in current) {
        current = current[key];
      } else {
        return defaultValue;
      }
    }

    return current;
  }

  /**
   * Set configuration value by path
   * @param {string} path - Dot notation path
   * @param {*} value - Value to set
   */
  set(path, value) {
    const keys = path.split('.');
    const lastKey = keys.pop();
    let current = this.config;

    for (const key of keys) {
      if (!(key in current) || typeof current[key] !== 'object') {
        current[key] = {};
      }
      current = current[key];
    }

    const oldValue = current[lastKey];
    current[lastKey] = value;

    // Notify listeners
    this.notifyListeners(path, value, oldValue);
  }

  /**
   * Check if feature is enabled
   * @param {string} featureName - Name of the feature
   */
  isFeatureEnabled(featureName) {
    return this.get(`features.${featureName}`, false);
  }

  /**
   * Get store information
   */
  getStoreInfo() {
    return this.get('store');
  }

  /**
   * Get integration configuration
   * @param {string} integration - Integration name (shopify, lightspeed, twoaccept)
   */
  getIntegrationConfig(integration) {
    return this.get(integration, {});
  }

  /**
   * Check if integration is enabled
   * @param {string} integration - Integration name
   */
  isIntegrationEnabled(integration) {
    return this.get(`${integration}.enabled`, false);
  }

  /**
   * Add configuration change listener
   * @param {string} path - Path to watch
   * @param {function} callback - Callback function
   */
  addListener(path, callback) {
    if (!this.listeners.has(path)) {
      this.listeners.set(path, []);
    }
    this.listeners.get(path).push(callback);
  }

  /**
   * Remove configuration change listener
   * @param {string} path - Path to stop watching
   * @param {function} callback - Callback function to remove
   */
  removeListener(path, callback) {
    const pathListeners = this.listeners.get(path);
    if (pathListeners) {
      const index = pathListeners.indexOf(callback);
      if (index > -1) {
        pathListeners.splice(index, 1);
      }
    }
  }

  /**
   * Notify listeners of configuration changes
   * @private
   */
  notifyListeners(path, newValue, oldValue) {
    const pathListeners = this.listeners.get(path);
    if (pathListeners) {
      pathListeners.forEach(callback => {
        try {
          callback(newValue, oldValue, path);
        } catch (error) {
          console.error('Configuration listener error:', error);
        }
      });
    }
  }

  /**
   * Validate configuration
   */
  validate() {
    const errors = [];

    // Check required Shopify settings
    if (this.isIntegrationEnabled('shopify')) {
      if (!this.get('shopify.domain')) {
        errors.push('Shopify domain is required');
      }
      if (!this.get('shopify.storefrontAccessToken')) {
        errors.push('Shopify storefront access token is required');
      }
    }

    // Check required Lightspeed settings
    if (this.isIntegrationEnabled('lightspeed')) {
      if (!this.get('lightspeed.accountId')) {
        errors.push('Lightspeed account ID is required');
      }
      if (!this.get('lightspeed.apiKey')) {
        errors.push('Lightspeed API key is required');
      }
    }

    // Check required 2accept settings
    if (this.isIntegrationEnabled('twoaccept')) {
      if (!this.get('twoaccept.publicKey')) {
        errors.push('2accept public key is required');
      }
      if (!this.get('twoaccept.merchantId')) {
        errors.push('2accept merchant ID is required');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Get environment-specific configuration
   */
  getEnvironmentConfig() {
    const isDevelopment = this.get('development.enableDebugMode', false);
    
    return {
      isDevelopment,
      isProduction: !isDevelopment,
      apiUrls: {
        lightspeed: isDevelopment 
          ? 'https://api.lightspeedapp.com/API' 
          : 'https://api.lightspeedapp.com/API',
        twoaccept: isDevelopment
          ? 'https://sandbox-api.2accept.com/v1'
          : 'https://api.2accept.com/v1'
      }
    };
  }
}

// Create global configuration manager instance
window.WTFConfig = new WTFConfigManager(window.WTF_CONFIG);

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { WTF_CONFIG: window.WTF_CONFIG, WTFConfigManager };
}
