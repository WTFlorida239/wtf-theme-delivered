/**
 * WTF Comprehensive Monitoring & Alerting System
 * Real-time monitoring for launch readiness and ongoing operations
 */

(function() {
  'use strict';

  const MONITORING_CONFIG = {
    // Slack webhook for alerts
    slackWebhook: 'https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK',
    
    // Monitoring intervals (in milliseconds)
    intervals: {
      performance: 30000,    // 30 seconds
      business: 60000,       // 1 minute
      inventory: 300000,     // 5 minutes
      analytics: 900000      // 15 minutes
    },

    // Alert thresholds
    thresholds: {
      uptime: 99.5,
      responseTime: 3000,
      errorRate: 1,
      conversionDrop: 15,
      supportTickets: 20,
      inventoryLow: 10,
      paymentFailure: 5
    },

    // Data collection endpoints
    endpoints: {
      googleSheets: '/api/sheets-webhook',
      analytics: '/api/analytics-collect',
      performance: '/api/performance-metrics'
    }
  };

  class WTFMonitoringSystem {
    constructor() {
      this.metrics = {
        performance: {},
        business: {},
        inventory: {},
        analytics: {},
        alerts: []
      };
      
      this.isMonitoring = false;
      this.intervals = {};
      this.baselineMetrics = null;
      
      this.init();
    }

    init() {
      console.log('🔍 WTF Monitoring System initializing...');
      
      // Load baseline metrics
      this.loadBaselineMetrics();
      
      // Start monitoring if in production
      if (this.isProductionEnvironment()) {
        this.startMonitoring();
      }
      
      // Set up event listeners
      this.setupEventListeners();
      
      // Initialize data collection
      this.initializeDataCollection();
    }

    isProductionEnvironment() {
      return window.location.hostname.includes('wtfswag.com') || 
             window.location.hostname.includes('myshopify.com');
    }

    loadBaselineMetrics() {
      // Load from localStorage or set defaults
      const stored = localStorage.getItem('wtf_baseline_metrics');
      this.baselineMetrics = stored ? JSON.parse(stored) : {
        conversionRate: 2.5,
        averageOrderValue: 25.00,
        bounceRate: 45,
        pageLoadTime: 2.1,
        cartAbandonmentRate: 68
      };
    }

    startMonitoring() {
      console.log('📊 Starting comprehensive monitoring...');
      this.isMonitoring = true;

      // Performance monitoring
      this.intervals.performance = setInterval(() => {
        this.collectPerformanceMetrics();
      }, MONITORING_CONFIG.intervals.performance);

      // Business metrics monitoring
      this.intervals.business = setInterval(() => {
        this.collectBusinessMetrics();
      }, MONITORING_CONFIG.intervals.business);

      // Inventory monitoring
      this.intervals.inventory = setInterval(() => {
        this.collectInventoryMetrics();
      }, MONITORING_CONFIG.intervals.inventory);

      // Analytics monitoring
      this.intervals.analytics = setInterval(() => {
        this.collectAnalyticsMetrics();
      }, MONITORING_CONFIG.intervals.analytics);

      // Send initial status
      this.sendAlert('info', 'WTF Monitoring System Started', {
        timestamp: new Date().toISOString(),
        environment: window.location.hostname,
        monitoring_active: true
      });
    }

    stopMonitoring() {
      console.log('⏹️ Stopping monitoring...');
      this.isMonitoring = false;
      
      Object.values(this.intervals).forEach(interval => {
        clearInterval(interval);
      });
      
      this.intervals = {};
    }

    async collectPerformanceMetrics() {
      try {
        const metrics = {
          timestamp: new Date().toISOString(),
          
          // Core Web Vitals
          lcp: await this.getLargestContentfulPaint(),
          fid: await this.getFirstInputDelay(),
          cls: await this.getCumulativeLayoutShift(),
          
          // Page performance
          loadTime: performance.timing.loadEventEnd - performance.timing.navigationStart,
          domContentLoaded: performance.timing.domContentLoadedEventEnd - performance.timing.navigationStart,
          firstByte: performance.timing.responseStart - performance.timing.navigationStart,
          
          // Resource metrics
          resourceCount: performance.getEntriesByType('resource').length,
          jsErrors: this.getJavaScriptErrors(),
          
          // Network
          connectionType: navigator.connection ? navigator.connection.effectiveType : 'unknown',
          
          // Memory (if available)
          memoryUsage: performance.memory ? {
            used: performance.memory.usedJSHeapSize,
            total: performance.memory.totalJSHeapSize,
            limit: performance.memory.jsHeapSizeLimit
          } : null
        };

        this.metrics.performance = metrics;
        
        // Check thresholds
        this.checkPerformanceThresholds(metrics);
        
        // Send to data collection
        this.sendToDataCollection('performance', metrics);
        
      } catch (error) {
        console.error('Performance metrics collection error:', error);
        this.sendAlert('error', 'Performance Monitoring Error', { error: error.message });
      }
    }

    async collectBusinessMetrics() {
      try {
        const metrics = {
          timestamp: new Date().toISOString(),
          
          // E-commerce metrics
          cartValue: this.getCurrentCartValue(),
          cartItemCount: this.getCurrentCartItemCount(),
          sessionDuration: this.getSessionDuration(),
          pageViews: this.getPageViewCount(),
          
          // User behavior
          scrollDepth: this.getMaxScrollDepth(),
          clickEvents: this.getClickEventCount(),
          formInteractions: this.getFormInteractionCount(),
          
          // Drink builder specific
          drinkBuilderStarts: this.getDrinkBuilderStarts(),
          drinkBuilderCompletions: this.getDrinkBuilderCompletions(),
          drinkBuilderAbandonments: this.getDrinkBuilderAbandonments(),
          
          // Conversion funnel
          productViews: this.getProductViews(),
          addToCarts: this.getAddToCartEvents(),
          checkoutStarts: this.getCheckoutStarts(),
          purchases: this.getPurchaseEvents()
        };

        this.metrics.business = metrics;
        
        // Calculate conversion rates
        const conversionRate = metrics.purchases / metrics.productViews * 100;
        const cartAbandonmentRate = (metrics.addToCarts - metrics.purchases) / metrics.addToCarts * 100;
        
        metrics.conversionRate = conversionRate;
        metrics.cartAbandonmentRate = cartAbandonmentRate;
        
        // Check business thresholds
        this.checkBusinessThresholds(metrics);
        
        // Send to data collection
        this.sendToDataCollection('business', metrics);
        
      } catch (error) {
        console.error('Business metrics collection error:', error);
        this.sendAlert('error', 'Business Monitoring Error', { error: error.message });
      }
    }

    async collectInventoryMetrics() {
      try {
        // This would integrate with your inventory system
        const inventoryData = await this.fetchInventoryData();
        
        const metrics = {
          timestamp: new Date().toISOString(),
          lowStockItems: inventoryData.filter(item => item.quantity <= MONITORING_CONFIG.thresholds.inventoryLow),
          outOfStockItems: inventoryData.filter(item => item.quantity <= 0),
          totalProducts: inventoryData.length,
          averageStockLevel: inventoryData.reduce((sum, item) => sum + item.quantity, 0) / inventoryData.length,
          
          // Critical items (popular products)
          criticalLowStock: inventoryData.filter(item => 
            item.quantity <= MONITORING_CONFIG.thresholds.inventoryLow && 
            item.isPopular
          )
        };

        this.metrics.inventory = metrics;
        
        // Check inventory alerts
        this.checkInventoryThresholds(metrics);
        
        // Send to data collection
        this.sendToDataCollection('inventory', metrics);
        
      } catch (error) {
        console.error('Inventory metrics collection error:', error);
        this.sendAlert('error', 'Inventory Monitoring Error', { error: error.message });
      }
    }

    async collectAnalyticsMetrics() {
      try {
        const metrics = {
          timestamp: new Date().toISOString(),
          
          // Traffic sources
          organicTraffic: this.getOrganicTrafficCount(),
          directTraffic: this.getDirectTrafficCount(),
          socialTraffic: this.getSocialTrafficCount(),
          referralTraffic: this.getReferralTrafficCount(),
          
          // Geographic data
          topLocations: this.getTopLocations(),
          localTraffic: this.getLocalTrafficPercentage(),
          
          // Device data
          mobileTraffic: this.getMobileTrafficPercentage(),
          desktopTraffic: this.getDesktopTrafficPercentage(),
          
          // Engagement
          bounceRate: this.getBounceRate(),
          pagesPerSession: this.getPagesPerSession(),
          avgSessionDuration: this.getAverageSessionDuration(),
          
          // Goals and conversions
          goalCompletions: this.getGoalCompletions(),
          ecommerceRevenue: this.getEcommerceRevenue(),
          
          // Competitor analysis
          competitorTrafficShare: this.getCompetitorTrafficShare(),
          brandSearches: this.getBrandSearchVolume()
        };

        this.metrics.analytics = metrics;
        
        // Check analytics thresholds
        this.checkAnalyticsThresholds(metrics);
        
        // Send to data collection
        this.sendToDataCollection('analytics', metrics);
        
      } catch (error) {
        console.error('Analytics metrics collection error:', error);
        this.sendAlert('error', 'Analytics Monitoring Error', { error: error.message });
      }
    }

    checkPerformanceThresholds(metrics) {
      const alerts = [];
      
      if (metrics.loadTime > MONITORING_CONFIG.thresholds.responseTime) {
        alerts.push({
          type: 'warning',
          message: 'Page load time exceeds threshold',
          value: metrics.loadTime,
          threshold: MONITORING_CONFIG.thresholds.responseTime
        });
      }
      
      if (metrics.lcp > 2500) {
        alerts.push({
          type: 'warning',
          message: 'Largest Contentful Paint exceeds 2.5s',
          value: metrics.lcp,
          threshold: 2500
        });
      }
      
      if (metrics.cls > 0.1) {
        alerts.push({
          type: 'warning',
          message: 'Cumulative Layout Shift exceeds 0.1',
          value: metrics.cls,
          threshold: 0.1
        });
      }
      
      if (metrics.jsErrors.length > 0) {
        alerts.push({
          type: 'error',
          message: 'JavaScript errors detected',
          value: metrics.jsErrors.length,
          errors: metrics.jsErrors
        });
      }
      
      alerts.forEach(alert => {
        this.sendAlert(alert.type, alert.message, alert);
      });
    }

    checkBusinessThresholds(metrics) {
      const alerts = [];
      
      if (this.baselineMetrics && metrics.conversionRate) {
        const conversionDrop = ((this.baselineMetrics.conversionRate - metrics.conversionRate) / this.baselineMetrics.conversionRate) * 100;
        
        if (conversionDrop > MONITORING_CONFIG.thresholds.conversionDrop) {
          alerts.push({
            type: 'critical',
            message: 'Conversion rate dropped significantly',
            current: metrics.conversionRate,
            baseline: this.baselineMetrics.conversionRate,
            drop: conversionDrop
          });
        }
      }
      
      if (metrics.drinkBuilderAbandonments > metrics.drinkBuilderCompletions * 2) {
        alerts.push({
          type: 'warning',
          message: 'High drink builder abandonment rate',
          abandonments: metrics.drinkBuilderAbandonments,
          completions: metrics.drinkBuilderCompletions
        });
      }
      
      alerts.forEach(alert => {
        this.sendAlert(alert.type, alert.message, alert);
      });
    }

    checkInventoryThresholds(metrics) {
      const alerts = [];
      
      if (metrics.criticalLowStock.length > 0) {
        alerts.push({
          type: 'critical',
          message: 'Critical products low in stock',
          items: metrics.criticalLowStock.map(item => ({
            name: item.name,
            quantity: item.quantity,
            sku: item.sku
          }))
        });
      }
      
      if (metrics.outOfStockItems.length > 0) {
        alerts.push({
          type: 'error',
          message: 'Products out of stock',
          count: metrics.outOfStockItems.length,
          items: metrics.outOfStockItems.map(item => item.name)
        });
      }
      
      alerts.forEach(alert => {
        this.sendAlert(alert.type, alert.message, alert);
      });
    }

    async sendAlert(type, message, data = {}) {
      const alert = {
        timestamp: new Date().toISOString(),
        type: type,
        message: message,
        data: data,
        environment: window.location.hostname,
        userAgent: navigator.userAgent.substring(0, 100)
      };
      
      this.metrics.alerts.push(alert);
      
      // Send to Slack
      try {
        const slackPayload = this.formatSlackAlert(alert);
        await fetch(MONITORING_CONFIG.slackWebhook, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(slackPayload)
        });
      } catch (error) {
        console.error('Failed to send Slack alert:', error);
      }
      
      // Log to console
      const logMethod = type === 'error' || type === 'critical' ? 'error' : 
                       type === 'warning' ? 'warn' : 'log';
      console[logMethod](`🚨 WTF Alert [${type.toUpperCase()}]: ${message}`, data);
      
      // Store locally for debugging
      const storedAlerts = JSON.parse(localStorage.getItem('wtf_alerts') || '[]');
      storedAlerts.push(alert);
      if (storedAlerts.length > 100) storedAlerts.splice(0, 50); // Keep last 100
      localStorage.setItem('wtf_alerts', JSON.stringify(storedAlerts));
    }

    formatSlackAlert(alert) {
      const colors = {
        info: '#36a64f',
        warning: '#ff9500',
        error: '#ff0000',
        critical: '#8b0000'
      };
      
      const emoji = {
        info: '✅',
        warning: '⚠️',
        error: '❌',
        critical: '🚨'
      };
      
      return {
        username: 'WTF Monitoring Bot',
        icon_emoji: ':chart_with_upwards_trend:',
        attachments: [{
          color: colors[alert.type] || '#cccccc',
          title: `${emoji[alert.type]} ${alert.type.toUpperCase()}: ${alert.message}`,
          fields: [
            {
              title: 'Environment',
              value: alert.environment,
              short: true
            },
            {
              title: 'Timestamp',
              value: alert.timestamp,
              short: true
            },
            ...Object.entries(alert.data).map(([key, value]) => ({
              title: key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
              value: typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value),
              short: String(value).length < 50
            }))
          ],
          footer: 'WTF Monitoring System',
          ts: Math.floor(Date.now() / 1000)
        }]
      };
    }

    async sendToDataCollection(type, data) {
      const payload = {
        type: type,
        data: data,
        timestamp: new Date().toISOString(),
        environment: window.location.hostname
      };
      
      try {
        // Send to Google Sheets
        await fetch(MONITORING_CONFIG.endpoints.googleSheets, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        
        // Send to analytics endpoint
        await fetch(MONITORING_CONFIG.endpoints.analytics, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        
      } catch (error) {
        console.error('Data collection error:', error);
        
        // Store locally as fallback
        const queueKey = `wtf_data_queue_${type}`;
        const queue = JSON.parse(localStorage.getItem(queueKey) || '[]');
        queue.push(payload);
        if (queue.length > 50) queue.splice(0, 25); // Keep manageable size
        localStorage.setItem(queueKey, JSON.stringify(queue));
      }
    }

    // Utility methods for metric collection
    getCurrentCartValue() {
      // This would integrate with Shopify cart
      return window.cart ? window.cart.total_price / 100 : 0;
    }

    getCurrentCartItemCount() {
      return window.cart ? window.cart.item_count : 0;
    }

    getSessionDuration() {
      const sessionStart = sessionStorage.getItem('wtf_session_start');
      if (!sessionStart) {
        sessionStorage.setItem('wtf_session_start', Date.now().toString());
        return 0;
      }
      return Date.now() - parseInt(sessionStart);
    }

    getMaxScrollDepth() {
      const scrollDepth = sessionStorage.getItem('wtf_max_scroll') || '0';
      return parseInt(scrollDepth);
    }

    async getLargestContentfulPaint() {
      return new Promise((resolve) => {
        new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          resolve(lastEntry.startTime);
        }).observe({ entryTypes: ['largest-contentful-paint'] });
        
        // Fallback timeout
        setTimeout(() => resolve(0), 1000);
      });
    }

    async getFirstInputDelay() {
      return new Promise((resolve) => {
        new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const firstEntry = entries[0];
          resolve(firstEntry.processingStart - firstEntry.startTime);
        }).observe({ entryTypes: ['first-input'] });
        
        // Fallback timeout
        setTimeout(() => resolve(0), 1000);
      });
    }

    async getCumulativeLayoutShift() {
      return new Promise((resolve) => {
        let clsValue = 0;
        new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (!entry.hadRecentInput) {
              clsValue += entry.value;
            }
          }
          resolve(clsValue);
        }).observe({ entryTypes: ['layout-shift'] });
        
        // Fallback timeout
        setTimeout(() => resolve(clsValue), 1000);
      });
    }

    getJavaScriptErrors() {
      return window.wtfErrors || [];
    }

    // Public API methods
    getMetrics() {
      return this.metrics;
    }

    getAlerts() {
      return this.metrics.alerts;
    }

    clearAlerts() {
      this.metrics.alerts = [];
      localStorage.removeItem('wtf_alerts');
    }

    exportMetrics() {
      const exportData = {
        timestamp: new Date().toISOString(),
        metrics: this.metrics,
        baseline: this.baselineMetrics,
        config: MONITORING_CONFIG
      };
      
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `wtf-metrics-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
    }

    setupEventListeners() {
      // Track JavaScript errors
      window.addEventListener('error', (event) => {
        window.wtfErrors = window.wtfErrors || [];
        window.wtfErrors.push({
          message: event.message,
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
          timestamp: new Date().toISOString()
        });
      });

      // Track scroll depth
      let maxScroll = 0;
      window.addEventListener('scroll', () => {
        const scrollPercent = Math.round(
          (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100
        );
        if (scrollPercent > maxScroll) {
          maxScroll = scrollPercent;
          sessionStorage.setItem('wtf_max_scroll', maxScroll.toString());
        }
      });

      // Track page visibility changes
      document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
          this.sendToDataCollection('engagement', {
            event: 'page_hidden',
            timestamp: new Date().toISOString(),
            session_duration: this.getSessionDuration()
          });
        }
      });
    }

    initializeDataCollection() {
      // Send initial page load data
      this.sendToDataCollection('pageload', {
        url: window.location.href,
        referrer: document.referrer,
        timestamp: new Date().toISOString(),
        user_agent: navigator.userAgent,
        screen_resolution: `${screen.width}x${screen.height}`,
        viewport_size: `${window.innerWidth}x${window.innerHeight}`
      });
    }

    // Placeholder methods for business metrics (to be implemented based on actual data sources)
    getPageViewCount() { return parseInt(sessionStorage.getItem('wtf_page_views') || '1'); }
    getClickEventCount() { return parseInt(sessionStorage.getItem('wtf_click_events') || '0'); }
    getFormInteractionCount() { return parseInt(sessionStorage.getItem('wtf_form_interactions') || '0'); }
    getDrinkBuilderStarts() { return parseInt(sessionStorage.getItem('wtf_builder_starts') || '0'); }
    getDrinkBuilderCompletions() { return parseInt(sessionStorage.getItem('wtf_builder_completions') || '0'); }
    getDrinkBuilderAbandonments() { return parseInt(sessionStorage.getItem('wtf_builder_abandonments') || '0'); }
    getProductViews() { return parseInt(sessionStorage.getItem('wtf_product_views') || '0'); }
    getAddToCartEvents() { return parseInt(sessionStorage.getItem('wtf_add_to_cart') || '0'); }
    getCheckoutStarts() { return parseInt(sessionStorage.getItem('wtf_checkout_starts') || '0'); }
    getPurchaseEvents() { return parseInt(sessionStorage.getItem('wtf_purchases') || '0'); }
    
    async fetchInventoryData() {
      // This would integrate with your actual inventory system
      return [];
    }
    
    // Analytics placeholder methods
    getOrganicTrafficCount() { return 0; }
    getDirectTrafficCount() { return 0; }
    getSocialTrafficCount() { return 0; }
    getReferralTrafficCount() { return 0; }
    getTopLocations() { return []; }
    getLocalTrafficPercentage() { return 0; }
    getMobileTrafficPercentage() { return 0; }
    getDesktopTrafficPercentage() { return 0; }
    getBounceRate() { return 0; }
    getPagesPerSession() { return 0; }
    getAverageSessionDuration() { return 0; }
    getGoalCompletions() { return 0; }
    getEcommerceRevenue() { return 0; }
    getCompetitorTrafficShare() { return 0; }
    getBrandSearchVolume() { return 0; }
  }

  // Initialize monitoring system
  const wtfMonitoring = new WTFMonitoringSystem();
  
  // Expose to global scope
  window.WTFMonitoring = wtfMonitoring;
  
  // Auto-start monitoring in production
  if (wtfMonitoring.isProductionEnvironment()) {
    console.log('🚀 WTF Monitoring System active in production mode');
  } else {
    console.log('🔧 WTF Monitoring System loaded in development mode');
  }

})();
