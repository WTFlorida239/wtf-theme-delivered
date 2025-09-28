/**
 * WTF Drink Builder - Core Module
 * Optimized for performance with lazy loading and modular architecture
 */

(function() {
  'use strict';

  // Utility functions
  const utils = {
    onReady: (callback) => {
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', callback, { once: true });
      } else {
        callback();
      }
    },

    formatMoney: (cents) => {
      if (window.Shopify && typeof window.Shopify.formatMoney === 'function') {
        const format = window.Shopify.money_format || '${{ amount }}';
        return window.Shopify.formatMoney(cents, format);
      }
      const dollars = Number(cents || 0) / 100;
      return `$${dollars.toFixed(2)}`;
    },

    debounce: (func, wait) => {
      let timeout;
      return function executedFunction(...args) {
        const later = () => {
          clearTimeout(timeout);
          func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
      };
    },

    escapeSelector: (value) => {
      if (window.CSS && typeof window.CSS.escape === 'function') {
        return window.CSS.escape(value);
      }
      return String(value).replace(/"/g, '\\"');
    }
  };

  // State management
  const createState = () => ({
    basePriceCents: 0,
    extraPumpCostCents: 0,
    selectedFlavors: new Map(),
    selectedStrains: new Set(),
    selectedBoosters: new Set(),
    selectedSweeteners: new Set(),
    selectedCreamers: new Set(),
    selectedThc: null,
    isGallon: false,
    isInitialized: false
  });

  // Core drink builder class
  class DrinkBuilder {
    constructor(element) {
      this.element = element;
      this.form = element.querySelector('form[data-product-form]');
      this.state = createState();
      this.modules = new Map();
      
      if (!this.form) {
        console.warn('DrinkBuilder: No form found');
        return;
      }

      this.init();
    }

    async init() {
      if (this.state.isInitialized) return;

      // Initialize core elements
      this.initElements();
      
      // Lazy load modules based on user interaction
      this.setupLazyLoading();
      
      // Initialize basic functionality
      this.initBasicHandlers();
      
      this.state.isInitialized = true;
    }

    initElements() {
      this.priceEl = this.element.querySelector('#builder-price');
      this.addToCartBtn = this.element.querySelector('[data-add-to-cart]');
      this.variantIdInput = this.element.querySelector('[data-variant-id]');
      this.baseOptions = this.element.querySelectorAll('[name="base_drink"]');
    }

    setupLazyLoading() {
      // Lazy load flavor module when user interacts with flavors
      const flavorSection = this.element.querySelector('[data-step="flavors"]');
      if (flavorSection) {
        const observer = new IntersectionObserver((entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              this.loadModule('flavors');
              observer.unobserve(entry.target);
            }
          });
        }, { threshold: 0.1 });
        observer.observe(flavorSection);
      }

      // Lazy load advanced options
      const advancedSection = this.element.querySelector('[data-step="boosters"], [data-step="sweeteners"], [data-step="creamers"]');
      if (advancedSection) {
        const observer = new IntersectionObserver((entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              this.loadModule('advanced');
              observer.unobserve(entry.target);
            }
          });
        }, { threshold: 0.1 });
        observer.observe(advancedSection);
      }
    }

    async loadModule(moduleName) {
      if (this.modules.has(moduleName)) return this.modules.get(moduleName);

      try {
        let module;
        switch (moduleName) {
          case 'flavors':
            module = await import('./drink-builder-flavors.js');
            break;
          case 'advanced':
            module = await import('./drink-builder-advanced.js');
            break;
          case 'cart':
            module = await import('./drink-builder-cart.js');
            break;
          default:
            console.warn(`Unknown module: ${moduleName}`);
            return null;
        }

        const instance = new module.default(this);
        this.modules.set(moduleName, instance);
        return instance;
      } catch (error) {
        console.error(`Failed to load module ${moduleName}:`, error);
        return null;
      }
    }

    initBasicHandlers() {
      // Base drink selection
      this.baseOptions.forEach(option => {
        option.addEventListener('change', this.handleBaseChange.bind(this));
      });

      // Add to cart with lazy loading
      if (this.addToCartBtn) {
        this.addToCartBtn.addEventListener('click', async (e) => {
          e.preventDefault();
          const cartModule = await this.loadModule('cart');
          if (cartModule) {
            cartModule.addToCart();
          }
        });
      }
    }

    handleBaseChange(event) {
      const option = event.target;
      if (option.checked) {
        this.state.basePriceCents = parseInt(option.dataset.price) || 0;
        this.state.isGallon = option.dataset.size === 'gallon';
        
        if (this.variantIdInput) {
          this.variantIdInput.value = option.dataset.variantId || '';
        }

        this.updatePrice();
      }
    }

    updatePrice() {
      if (!this.priceEl) return;

      const totalCents = this.calculateTotalPrice();
      this.priceEl.textContent = utils.formatMoney(totalCents);
    }

    calculateTotalPrice() {
      let total = this.state.basePriceCents;
      
      // Add flavor costs
      this.state.selectedFlavors.forEach((count, flavor) => {
        total += count * this.state.extraPumpCostCents;
      });

      return total;
    }

    // Public API for modules
    getState() {
      return this.state;
    }

    setState(updates) {
      Object.assign(this.state, updates);
      this.updatePrice();
    }

    getElement() {
      return this.element;
    }

    getForm() {
      return this.form;
    }
  }

  // Auto-initialize when DOM is ready
  utils.onReady(() => {
    const builders = document.querySelectorAll('[data-drink-builder]');
    builders.forEach(builder => {
      new DrinkBuilder(builder);
    });
  });

  // Export for global access
  window.WTF = window.WTF || {};
  window.WTF.DrinkBuilder = DrinkBuilder;
  window.WTF.utils = utils;

})();
