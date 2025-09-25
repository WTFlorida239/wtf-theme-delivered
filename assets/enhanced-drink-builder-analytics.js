/**
 * Enhanced Drink Builder Analytics Integration
 * Comprehensive event tracking for GA4, Meta Pixel, and TikTok Pixel
 */

class DrinkBuilderAnalytics {
  constructor() {
    this.events = {
      BUILDER_STARTED: 'drink_builder_started',
      STRAIN_SELECTED: 'strain_selected',
      FLAVOR_ADDED: 'flavor_added',
      FLAVOR_REMOVED: 'flavor_removed',
      THC_UPGRADE_SELECTED: 'thc_upgrade_selected',
      PRESET_SELECTED: 'preset_recipe_selected',
      DRINK_CUSTOMIZED: 'drink_customized',
      ADD_TO_CART: 'add_to_cart',
      CART_OPENED: 'cart_drawer_opened',
      CHECKOUT_INITIATED: 'checkout_initiated'
    };
    
    this.sessionData = {
      builderStartTime: null,
      totalInteractions: 0,
      customizations: []
    };
    
    this.init();
  }

  init() {
    this.trackBuilderStart();
    this.bindEventListeners();
    this.trackSessionMetrics();
  }

  trackBuilderStart() {
    this.sessionData.builderStartTime = Date.now();
    
    this.trackEvent(this.events.BUILDER_STARTED, {
      drink_type: 'custom',
      page_location: window.location.href,
      timestamp: new Date().toISOString()
    });
  }

  bindEventListeners() {
    const drinkBuilder = document.getElementById('enhanced-drink-builder');
    if (!drinkBuilder) return;

    // Track strain selection
    this.bindStrainEvents(drinkBuilder);
    
    // Track flavor modifications
    this.bindFlavorEvents(drinkBuilder);
    
    // Track THC upgrades
    this.bindTHCEvents(drinkBuilder);
    
    // Track preset selections
    this.bindPresetEvents(drinkBuilder);
    
    // Track add to cart
    this.bindCartEvents(drinkBuilder);
    
    // Track general interactions
    this.bindInteractionEvents(drinkBuilder);
  }

  bindStrainEvents(container) {
    const strainInputs = container.querySelectorAll('input[name="strain"]');
    
    strainInputs.forEach(input => {
      input.addEventListener('change', (e) => {
        if (e.target.checked) {
          this.sessionData.totalInteractions++;
          this.sessionData.customizations.push({
            type: 'strain',
            value: e.target.value,
            timestamp: Date.now()
          });
          
          this.trackEvent(this.events.STRAIN_SELECTED, {
            strain_type: e.target.value,
            drink_type: 'kratom',
            interaction_count: this.sessionData.totalInteractions
          });
        }
      });
    });
  }

  bindFlavorEvents(container) {
    const flavorChips = container.querySelectorAll('.flavor-chip');
    
    flavorChips.forEach(chip => {
      const plusButton = chip.querySelector('[data-action="plus"]');
      const minusButton = chip.querySelector('[data-action="minus"]');
      const flavorName = chip.dataset.flavor;
      
      if (plusButton) {
        plusButton.addEventListener('click', () => {
          const pumpCount = parseInt(chip.querySelector('.pump-count')?.textContent || '0') + 1;
          
          this.sessionData.totalInteractions++;
          this.sessionData.customizations.push({
            type: 'flavor_add',
            flavor: flavorName,
            count: pumpCount,
            timestamp: Date.now()
          });
          
          this.trackEvent(this.events.FLAVOR_ADDED, {
            flavor_name: flavorName,
            pump_count: pumpCount,
            flavor_count: pumpCount,
            interaction_count: this.sessionData.totalInteractions
          });
        });
      }
      
      if (minusButton) {
        minusButton.addEventListener('click', () => {
          const currentCount = parseInt(chip.querySelector('.pump-count')?.textContent || '0');
          
          if (currentCount > 0) {
            this.sessionData.totalInteractions++;
            this.sessionData.customizations.push({
              type: 'flavor_remove',
              flavor: flavorName,
              count: currentCount - 1,
              timestamp: Date.now()
            });
            
            this.trackEvent(this.events.FLAVOR_REMOVED, {
              flavor_name: flavorName,
              pump_count: currentCount - 1,
              flavor_count: currentCount - 1,
              interaction_count: this.sessionData.totalInteractions
            });
          }
        });
      }
    });
  }

  bindTHCEvents(container) {
    const thcInputs = container.querySelectorAll('input[name="thc_upgrade"]');
    
    thcInputs.forEach(input => {
      input.addEventListener('change', (e) => {
        if (e.target.checked) {
          this.sessionData.totalInteractions++;
          this.sessionData.customizations.push({
            type: 'thc_upgrade',
            amount: e.target.value,
            timestamp: Date.now()
          });
          
          this.trackEvent(this.events.THC_UPGRADE_SELECTED, {
            thc_amount: e.target.value,
            upgrade_type: 'delta9_thc',
            interaction_count: this.sessionData.totalInteractions
          });
        }
      });
    });
  }

  bindPresetEvents(container) {
    const presetButtons = container.querySelectorAll('[data-preset-recipe]');
    
    presetButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        const recipeName = e.target.dataset.presetRecipe;
        
        this.sessionData.totalInteractions++;
        this.sessionData.customizations.push({
          type: 'preset_selected',
          recipe: recipeName,
          timestamp: Date.now()
        });
        
        this.trackEvent(this.events.PRESET_SELECTED, {
          recipe_name: recipeName,
          drink_type: 'preset',
          interaction_count: this.sessionData.totalInteractions
        });
      });
    });
  }

  bindCartEvents(container) {
    const addToCartButton = container.querySelector('button[type="submit"]');
    
    if (addToCartButton) {
      addToCartButton.addEventListener('click', (e) => {
        const drinkConfig = this.getCurrentDrinkConfiguration(container);
        const sessionDuration = Date.now() - this.sessionData.builderStartTime;
        
        this.trackEvent(this.events.ADD_TO_CART, {
          ...drinkConfig,
          session_duration: Math.round(sessionDuration / 1000),
          total_interactions: this.sessionData.totalInteractions,
          customization_count: this.sessionData.customizations.length
        });
        
        // Track comprehensive drink customization event
        this.trackEvent(this.events.DRINK_CUSTOMIZED, {
          ...drinkConfig,
          customizations: this.sessionData.customizations,
          session_metrics: {
            duration: sessionDuration,
            interactions: this.sessionData.totalInteractions
          }
        });
      });
    }
  }

  bindInteractionEvents(container) {
    // Track cart drawer opening
    document.addEventListener('click', (e) => {
      if (e.target.matches('[data-cart-drawer-toggle]') || e.target.closest('[data-cart-drawer-toggle]')) {
        this.trackEvent(this.events.CART_OPENED, {
          event_category: 'Cart',
          trigger: 'drawer_toggle'
        });
      }
      
      if (e.target.matches('button[name="checkout"]') || e.target.closest('button[name="checkout"]')) {
        this.trackEvent(this.events.CHECKOUT_INITIATED, {
          event_category: 'Cart',
          source: 'cart_drawer'
        });
      }
    });
  }

  getCurrentDrinkConfiguration(container) {
    const selectedStrain = container.querySelector('input[name="strain"]:checked')?.value || 'none';
    const flavorCount = Array.from(container.querySelectorAll('.pump-count'))
      .reduce((total, counter) => total + parseInt(counter.textContent || '0'), 0);
    const thcUpgrade = container.querySelector('input[name="thc_upgrade"]:checked')?.value || 'none';
    
    // Get individual flavor details
    const flavors = [];
    container.querySelectorAll('.flavor-chip').forEach(chip => {
      const pumpCount = parseInt(chip.querySelector('.pump-count')?.textContent || '0');
      if (pumpCount > 0) {
        flavors.push({
          name: chip.dataset.flavor,
          pumps: pumpCount
        });
      }
    });
    
    return {
      strain_type: selectedStrain,
      flavor_count: flavorCount,
      flavors: flavors,
      thc_upgrade: thcUpgrade,
      drink_type: selectedStrain !== 'none' ? 'custom_kratom' : 'custom_kava'
    };
  }

  trackSessionMetrics() {
    // Track session metrics every 30 seconds
    setInterval(() => {
      if (this.sessionData.totalInteractions > 0) {
        const sessionDuration = Date.now() - this.sessionData.builderStartTime;
        
        this.trackEvent('session_metrics', {
          event_category: 'Engagement',
          session_duration: Math.round(sessionDuration / 1000),
          total_interactions: this.sessionData.totalInteractions,
          interactions_per_minute: Math.round((this.sessionData.totalInteractions / (sessionDuration / 60000)) * 100) / 100
        });
      }
    }, 30000);
  }

  trackEvent(eventName, eventData = {}) {
    // Use the global WTFAnalytics if available, otherwise implement basic tracking
    if (window.WTFAnalytics && typeof window.WTFAnalytics.trackDrinkBuilderEvent === 'function') {
      window.WTFAnalytics.trackDrinkBuilderEvent(eventName, eventData);
    } else {
      // Fallback tracking
      this.fallbackTracking(eventName, eventData);
    }
  }

  fallbackTracking(eventName, eventData) {
    const baseData = {
      event_category: 'Drink Builder',
      event_action: eventName,
      ...eventData
    };
    
    // Google Analytics 4
    if (typeof gtag !== 'undefined') {
      gtag('event', eventName, baseData);
    }
    
    // Meta Pixel
    if (typeof fbq !== 'undefined') {
      if (eventName === 'add_to_cart') {
        fbq('track', 'AddToCart', {
          content_category: 'Drink Builder',
          content_name: eventName,
          value: eventData.value || 0,
          currency: 'USD'
        });
      } else {
        fbq('trackCustom', eventName, baseData);
      }
    }
    
    // TikTok Pixel
    if (typeof ttq !== 'undefined') {
      if (eventName === 'add_to_cart') {
        ttq.track('AddToCart', {
          content_category: 'Drink Builder',
          value: eventData.value || 0,
          currency: 'USD'
        });
      } else {
        ttq.track(eventName, baseData);
      }
    }
    
    // Debug logging
    if (window.location.hostname === 'localhost' || window.location.search.includes('debug=true')) {
      console.log('Drink Builder Analytics Event:', eventName, baseData);
    }
  }

  // Public API methods
  getSessionData() {
    return {
      ...this.sessionData,
      sessionDuration: Date.now() - this.sessionData.builderStartTime
    };
  }

  resetSession() {
    this.sessionData = {
      builderStartTime: Date.now(),
      totalInteractions: 0,
      customizations: []
    };
  }
}

// Initialize analytics when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('enhanced-drink-builder')) {
    window.drinkBuilderAnalytics = new DrinkBuilderAnalytics();
  }
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = DrinkBuilderAnalytics;
}
