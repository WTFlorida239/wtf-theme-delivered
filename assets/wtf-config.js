/**
 * WTF Configuration Manager
 * Builds a secure, client-side configuration object sourced from theme settings
 * and storefront-safe metafields. Secrets must be proxied through secure backend endpoints.
 */
(function() {
  const fallbackConfig = {
    store: {
      name: 'WTF - Welcome To Florida',
      phone: '(239) 955-0314',
      email: 'info@wtfswag.com',
      address: {
        line1: '1520 SE 46th Ln',
        line2: 'Unit B',
        city: 'Cape Coral',
        region: 'FL',
        postalCode: '33904',
        country: 'US'
      },
      hours: {
        monday: { open: '08:00', close: '22:00' },
        tuesday: { open: '08:00', close: '22:00' },
        wednesday: { open: '08:00', close: '22:00' },
        thursday: { open: '08:00', close: '22:00' },
        friday: { open: '08:00', close: '23:00' },
        saturday: { open: '08:00', close: '23:00' },
        sunday: { open: '10:00', close: '22:00' }
      },
      timezone: 'America/New_York'
    },
    integrations: {
      shopify: {
        enabled: true,
        domain: null,
        locationId: null,
        endpoints: {
          adminProxy: '/apps/wtf/shopify-admin'
        },
        products: {
          customKratomTea: 'custom-kratom-tea',
          customKavaDrink: 'custom-kava-drink',
          thcDrinks: 'thc-drinks',
          thcShots: 'thc-shots',
          draftPours: 'draft-pours',
          cannedDrinks: 'canned-drinks',
          takeHomeItems: 'take-home-items'
        },
        collections: {
          kratomTeas: 'kratom-teas',
          kavaDrinks: 'kava-drinks',
          thcProducts: 'thc-products',
          beverages: 'beverages',
          merchandise: 'merchandise'
        }
      },
      lightspeed: {
        enabled: false,
        accountId: null,
        syncInterval: 30000,
        variantMapping: {},
        endpoints: {
          base: '/apps/wtf/lightspeed',
          inventory: '/apps/wtf/lightspeed/inventory',
          availability: '/apps/wtf/lightspeed/availability',
          reserve: '/apps/wtf/lightspeed/reserve',
          release: '/apps/wtf/lightspeed/release',
          sync: '/apps/wtf/lightspeed/sync',
          orders: '/apps/wtf/lightspeed/orders'
        }
      },
      twoaccept: {
        enabled: false,
        publicKey: null,
        merchantId: null,
        environment: 'production',
        enableSavedCards: true,
        enableApplePay: true,
        enableGooglePay: true,
        endpoints: {
          base: '/apps/wtf/2accept',
          paymentMethods: '/apps/wtf/2accept/payment-methods',
          payments: '/apps/wtf/2accept/payments',
          orders: '/apps/wtf/2accept/orders',
          savedMethods: '/apps/wtf/2accept/customers',
          merchantValidation: '/apps/wtf/2accept/apple-pay/validate',
          applePay: '/apps/wtf/2accept/apple-pay'
        }
      }
    },
    analytics: {
      google: {
        measurementId: null,
        enabled: false
      },
      googleAds: null,
      metaPixel: null,
      tiktokPixel: null,
      snapchatPixel: null,
      pinterestTag: null,
      clarityProjectId: null,
      hotjarSiteId: null
    },
    notifications: {
      email: {
        enabled: true,
        provider: 'sendgrid',
        apiKey: null,
        fromEmail: 'orders@wtfswag.com',
        fromName: 'WTF - Welcome To Florida'
      },
      sms: {
        enabled: false,
        provider: 'twilio',
        accountSid: null,
        authToken: null,
        fromNumber: null
      }
    },
    customers: {
      enableLoyaltyProgram: true,
      pointsPerDollar: 1,
      enableBirthdayRewards: true,
      enableReferralProgram: true,
      enableAgeVerification: true,
      minimumAge: 21,
      requiredDocuments: ['drivers_license', 'passport', 'state_id']
    },
    ordering: {
      enableOnlineOrdering: true,
      enablePickup: true,
      enableDelivery: false,
      pickupLocation: {
        name: 'WTF Cape Coral',
        address: '1520 SE 46th Ln, Unit B, Cape Coral, FL 33904',
        phone: '(239) 955-0314',
        instructions: 'Call when you arrive and we\'ll bring your order out!'
      },
      preparationTime: {
        kratom: 5,
        kava: 7,
        thc: 10,
        draft: 3,
        canned: 1
      },
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
    features: {
      enableCustomDrinkBuilder: true,
      enableFlavorRotation: true,
      enableSeasonalMenus: true,
      enableEventBooking: false,
      enableSubscriptions: false,
      enableGiftCards: false,
      enableRewards: true,
      enableSocialLogin: false,
      enableGuestCheckout: true,
      enableMultiLocation: false,
      enableOfflineMode: false,
      enableCustomCheckout: false
    },
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
    errorHandling: {
      enableErrorReporting: true,
      enableUserFriendlyMessages: true,
      fallbackToCache: true,
      retryAttempts: 3,
      retryDelay: 1000
    },
    performance: {
      enableCaching: true,
      cacheTimeout: 300000,
      enableLazyLoading: true,
      enableImageOptimization: true,
      enableMinification: true
    },
    security: {
      enableCSP: true,
      enableHSTS: true,
      enableXSSProtection: true,
      sessionTimeout: 3600000,
      enableRateLimiting: true
    },
    development: {
      enableDebugMode: false,
      enableConsoleLogging: false,
      enablePerformanceMonitoring: true,
      mockExternalAPIs: false
    },
    endpoints: {
      proxyBase: '/apps/wtf',
      shopifyAdminProxy: '/apps/wtf/shopify-admin'
    }
  };

  const clone = (value) => JSON.parse(JSON.stringify(value));
  const isPlainObject = (value) => Object.prototype.toString.call(value) === '[object Object]';

  function mergeDeep(target, source) {
    if (!isPlainObject(target) || !isPlainObject(source)) {
      return source;
    }

    Object.keys(source).forEach((key) => {
      const sourceValue = source[key];
      const targetValue = target[key];

      if (Array.isArray(sourceValue)) {
        target[key] = sourceValue.slice();
      } else if (isPlainObject(sourceValue)) {
        target[key] = mergeDeep(isPlainObject(targetValue) ? { ...targetValue } : {}, sourceValue);
      } else if (sourceValue !== undefined) {
        target[key] = sourceValue;
      }
    });

    return target;
  }

  const initialConfig = (window.WTFConfig && typeof window.WTFConfig.get !== 'function'
    ? window.WTFConfig
    : null) || window.WTF_CONFIG_DATA || {};

  const configData = mergeDeep(clone(fallbackConfig), initialConfig);

  if (!configData.integrations) {
    configData.integrations = {};
  }

  if (!configData.integrations.lightspeed && configData.lightspeed) {
    configData.integrations.lightspeed = configData.lightspeed;
  }

  if (!configData.integrations.twoaccept && configData.twoaccept) {
    configData.integrations.twoaccept = configData.twoaccept;
  }

  if (!configData.integrations.shopify && configData.shopify) {
    configData.integrations.shopify = configData.shopify;
  }

  if (!configData.integrations.shopify) {
    configData.integrations.shopify = fallbackConfig.integrations.shopify;
  }

  if (!configData.endpoints) {
    configData.endpoints = fallbackConfig.endpoints;
  }

  if (!configData.integrations.shopify.domain && window.Shopify && window.Shopify.shop) {
    configData.integrations.shopify.domain = window.Shopify.shop;
  }

  configData.shopify = configData.integrations.shopify;
  configData.lightspeed = configData.integrations.lightspeed;
  configData.twoaccept = configData.integrations.twoaccept;

  class WTFConfigManager {
    constructor(config) {
      this.config = config;
      this.listeners = new Map();
    }

    get(path, defaultValue = null) {
      if (!path) return defaultValue;

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

    set(path, value) {
      if (!path) return;

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

      this.notifyListeners(path, value, oldValue);
    }

    isFeatureEnabled(featureName) {
      return this.get(`features.${featureName}`, false);
    }

    getStoreInfo() {
      return this.get('store');
    }

    getIntegrationConfig(integration) {
      return this.get(`integrations.${integration}`, this.get(integration, {}));
    }

    isIntegrationEnabled(integration) {
      return this.get(`integrations.${integration}.enabled`, this.get(`${integration}.enabled`, false));
    }

    addListener(path, callback) {
      if (!this.listeners.has(path)) {
        this.listeners.set(path, []);
      }
      this.listeners.get(path).push(callback);
    }

    removeListener(path, callback) {
      const pathListeners = this.listeners.get(path);
      if (pathListeners) {
        const index = pathListeners.indexOf(callback);
        if (index > -1) {
          pathListeners.splice(index, 1);
        }
      }
    }

    notifyListeners(path, newValue, oldValue) {
      const pathListeners = this.listeners.get(path);
      if (pathListeners) {
        pathListeners.forEach((callback) => {
          try {
            callback(newValue, oldValue, path);
          } catch (error) {
            console.error('WTF Configuration listener error:', error);
          }
        });
      }
    }

    validate() {
      const errors = [];

      if (this.isIntegrationEnabled('shopify')) {
        if (!this.get('integrations.shopify.domain')) {
          errors.push('Shopify domain is required');
        }
      }

      if (this.isIntegrationEnabled('lightspeed')) {
        if (!this.get('integrations.lightspeed.accountId')) {
          errors.push('Lightspeed account ID is required');
        }
      }

      if (this.isIntegrationEnabled('twoaccept')) {
        if (!this.get('integrations.twoaccept.publicKey')) {
          errors.push('2accept public key is required');
        }
        if (!this.get('integrations.twoaccept.merchantId')) {
          errors.push('2accept merchant ID is required');
        }
      }

      return {
        isValid: errors.length === 0,
        errors
      };
    }

    getEnvironmentConfig() {
      const isDevelopment = this.get('development.enableDebugMode', false);
      const twoAcceptEnvironment = this.get('integrations.twoaccept.environment', 'production');

      return {
        isDevelopment,
        isProduction: !isDevelopment,
        integrations: {
          twoaccept: {
            environment: twoAcceptEnvironment
          },
          lightspeed: {
            proxyBase: this.get('integrations.lightspeed.endpoints.base')
          }
        }
      };
    }
  }

  const manager = new WTFConfigManager(configData);
  manager.raw = configData;
  manager.merge = function(partialConfig) {
    if (!isPlainObject(partialConfig)) return;
    mergeDeep(this.raw, partialConfig);
  };

  window.WTFConfig = manager;
  window.WTF_CONFIG_DATA = configData;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { WTFConfigManager, WTFConfig: manager };
  }
})();
