/**
 * WTF Low Stock Alert System
 * Displays low stock warnings in the drink builder UI and sends notifications
 */

class WTFLowStockAlerts {
  constructor(options = {}) {
    this.options = {
      checkInterval: options.checkInterval || 30000, // 30 seconds
      lowStockThreshold: options.lowStockThreshold || 10,
      criticalStockThreshold: options.criticalStockThreshold || 5,
      webhookUrl: options.webhookUrl || null,
      slackWebhookUrl: options.slackWebhookUrl || null,
      enableNotifications: options.enableNotifications !== false,
      enableUIAlerts: options.enableUIAlerts !== false,
      ...options
    };
    
    this.stockData = new Map();
    this.alertsShown = new Set();
    this.lastCheck = 0;
    this.isChecking = false;
    
    this.init();
  }

  init() {
    if (this.options.enableUIAlerts) {
      this.setupUIElements();
      this.bindEvents();
    }
    
    if (this.options.enableNotifications) {
      this.startStockMonitoring();
    }
    
    // Initial stock check
    this.checkStockLevels();
  }

  setupUIElements() {
    // Create alert container if it doesn't exist
    if (!document.getElementById('wtf-stock-alerts')) {
      const alertContainer = document.createElement('div');
      alertContainer.id = 'wtf-stock-alerts';
      alertContainer.className = 'wtf-stock-alerts';
      alertContainer.innerHTML = `
        <div class="wtf-stock-alerts__container">
          <div class="wtf-stock-alerts__header">
            <span class="wtf-stock-alerts__icon">⚠️</span>
            <span class="wtf-stock-alerts__title">Stock Alert</span>
            <button class="wtf-stock-alerts__close" aria-label="Close alert">&times;</button>
          </div>
          <div class="wtf-stock-alerts__content"></div>
        </div>
      `;
      
      // Insert at the top of the drink builder
      const drinkBuilder = document.getElementById('enhanced-drink-builder');
      if (drinkBuilder) {
        drinkBuilder.insertBefore(alertContainer, drinkBuilder.firstChild);
      } else {
        document.body.appendChild(alertContainer);
      }
    }
  }

  bindEvents() {
    // Close button
    document.addEventListener('click', (e) => {
      if (e.target.matches('.wtf-stock-alerts__close')) {
        this.hideAlert();
      }
    });

    // Monitor flavor selection changes
    document.addEventListener('change', (e) => {
      if (e.target.matches('[data-flavor]') || e.target.matches('input[name="strain"]')) {
        this.checkSelectedItemsStock();
      }
    });

    // Monitor pump changes
    document.addEventListener('click', (e) => {
      if (e.target.matches('[data-action="plus"], [data-action="minus"]')) {
        setTimeout(() => this.checkSelectedItemsStock(), 100);
      }
    });
  }

  startStockMonitoring() {
    // Check stock levels periodically
    setInterval(() => {
      if (!this.isChecking) {
        this.checkStockLevels();
      }
    }, this.options.checkInterval);
  }

  async checkStockLevels() {
    if (this.isChecking) return;
    
    this.isChecking = true;
    
    try {
      // Get current inventory data
      const inventoryData = await this.fetchInventoryData();
      
      if (inventoryData) {
        this.updateStockData(inventoryData);
        this.processStockAlerts();
      }
    } catch (error) {
      console.error('Error checking stock levels:', error);
    } finally {
      this.isChecking = false;
      this.lastCheck = Date.now();
    }
  }

  async fetchInventoryData() {
    try {
      // Try to get inventory from Shopify API
      const response = await fetch('/admin/api/2024-01/inventory_levels.json', {
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        return this.parseShopifyInventory(data);
      }
    } catch (error) {
      console.warn('Could not fetch live inventory data, using mock data for demo');
    }
    
    // Fallback to mock data for demo/development
    return this.getMockInventoryData();
  }

  parseShopifyInventory(data) {
    const inventory = {};
    
    if (data.inventory_levels) {
      data.inventory_levels.forEach(level => {
        if (level.inventory_item_id && level.available !== null) {
          inventory[level.inventory_item_id] = {
            quantity: level.available,
            sku: level.sku || `item_${level.inventory_item_id}`,
            name: level.name || 'Unknown Item'
          };
        }
      });
    }
    
    return inventory;
  }

  getMockInventoryData() {
    // Mock inventory data for demonstration
    return {
      'kratom_green': { quantity: 8, sku: 'KRATOM-GREEN', name: 'Green Kratom' },
      'kratom_red': { quantity: 15, sku: 'KRATOM-RED', name: 'Red Kratom' },
      'kratom_white': { quantity: 3, sku: 'KRATOM-WHITE', name: 'White Kratom' },
      'kratom_yellow': { quantity: 12, sku: 'KRATOM-YELLOW', name: 'Yellow Kratom' },
      'kava_premium': { quantity: 6, sku: 'KAVA-PREMIUM', name: 'Premium Kava' },
      'flavor_caramel_apple': { quantity: 4, sku: 'FLAVOR-CARAMEL-APPLE', name: 'Caramel Apple Butter' },
      'flavor_chocolate': { quantity: 2, sku: 'FLAVOR-CHOCOLATE', name: 'Dark Chocolate' },
      'flavor_coconut_caramel': { quantity: 9, sku: 'FLAVOR-COCONUT', name: 'Coconut Caramel' },
      'thc_10mg': { quantity: 1, sku: 'THC-10MG', name: 'Delta-9 THC 10mg' },
      'thc_20mg': { quantity: 0, sku: 'THC-20MG', name: 'Delta-9 THC 20mg' }
    };
  }

  updateStockData(inventoryData) {
    for (const [itemId, itemData] of Object.entries(inventoryData)) {
      this.stockData.set(itemId, {
        ...itemData,
        lastUpdated: Date.now(),
        isLowStock: itemData.quantity <= this.options.lowStockThreshold,
        isCriticalStock: itemData.quantity <= this.options.criticalStockThreshold,
        isOutOfStock: itemData.quantity === 0
      });
    }
  }

  processStockAlerts() {
    const lowStockItems = [];
    const criticalStockItems = [];
    const outOfStockItems = [];
    
    this.stockData.forEach((item, itemId) => {
      if (item.isOutOfStock) {
        outOfStockItems.push({ id: itemId, ...item });
      } else if (item.isCriticalStock) {
        criticalStockItems.push({ id: itemId, ...item });
      } else if (item.isLowStock) {
        lowStockItems.push({ id: itemId, ...item });
      }
    });
    
    // Send notifications for critical/out of stock items
    if (criticalStockItems.length > 0 || outOfStockItems.length > 0) {
      this.sendStockNotification([...criticalStockItems, ...outOfStockItems], 'critical');
    } else if (lowStockItems.length > 0) {
      this.sendStockNotification(lowStockItems, 'low');
    }
    
    // Update UI alerts
    this.updateUIAlerts([...outOfStockItems, ...criticalStockItems, ...lowStockItems]);
  }

  checkSelectedItemsStock() {
    if (!this.options.enableUIAlerts) return;
    
    const selectedItems = this.getSelectedItems();
    const stockIssues = [];
    
    selectedItems.forEach(item => {
      const stockInfo = this.getStockInfoForItem(item);
      if (stockInfo && (stockInfo.isLowStock || stockInfo.isOutOfStock)) {
        stockIssues.push({
          ...item,
          ...stockInfo
        });
      }
    });
    
    if (stockIssues.length > 0) {
      this.showUIAlert(stockIssues, 'selection');
    }
  }

  getSelectedItems() {
    const selectedItems = [];
    
    // Check selected strains
    const selectedStrain = document.querySelector('input[name="strain"]:checked');
    if (selectedStrain) {
      selectedItems.push({
        type: 'strain',
        value: selectedStrain.value,
        name: selectedStrain.value + ' Kratom'
      });
    }
    
    // Check selected flavors with pumps > 0
    const flavorChips = document.querySelectorAll('.flavor-chip');
    flavorChips.forEach(chip => {
      const pumpCount = parseInt(chip.querySelector('.pump-count')?.textContent || '0');
      if (pumpCount > 0) {
        selectedItems.push({
          type: 'flavor',
          value: chip.dataset.flavor,
          name: chip.dataset.flavor,
          quantity: pumpCount
        });
      }
    });
    
    // Check THC upgrade
    const thcUpgrade = document.querySelector('input[name="thc_upgrade"]:checked');
    if (thcUpgrade) {
      selectedItems.push({
        type: 'thc',
        value: thcUpgrade.value,
        name: `Delta-9 THC ${thcUpgrade.value}`
      });
    }
    
    return selectedItems;
  }

  getStockInfoForItem(item) {
    // Map UI items to stock data keys
    const stockKeyMap = {
      'Green': 'kratom_green',
      'Red': 'kratom_red', 
      'White': 'kratom_white',
      'Yellow': 'kratom_yellow',
      'Caramel Apple Butter': 'flavor_caramel_apple',
      'Dark Chocolate': 'flavor_chocolate',
      'Coconut Caramel (Samoa Cookie)': 'flavor_coconut_caramel',
      '5mg': 'thc_5mg',
      '10mg': 'thc_10mg',
      '20mg': 'thc_20mg'
    };
    
    const stockKey = stockKeyMap[item.value] || stockKeyMap[item.name];
    return stockKey ? this.stockData.get(stockKey) : null;
  }

  showUIAlert(items, type = 'general') {
    if (!this.options.enableUIAlerts) return;
    
    const alertContainer = document.getElementById('wtf-stock-alerts');
    if (!alertContainer) return;
    
    const contentDiv = alertContainer.querySelector('.wtf-stock-alerts__content');
    
    let alertMessage = '';
    let alertClass = 'wtf-stock-alerts--warning';
    
    const outOfStock = items.filter(item => item.isOutOfStock);
    const criticalStock = items.filter(item => item.isCriticalStock && !item.isOutOfStock);
    const lowStock = items.filter(item => item.isLowStock && !item.isCriticalStock && !item.isOutOfStock);
    
    if (outOfStock.length > 0) {
      alertClass = 'wtf-stock-alerts--error';
      alertMessage += `<div class="wtf-stock-alert-section">
        <strong>Out of Stock:</strong>
        <ul>${outOfStock.map(item => `<li>${item.name}</li>`).join('')}</ul>
      </div>`;
    }
    
    if (criticalStock.length > 0) {
      alertClass = 'wtf-stock-alerts--error';
      alertMessage += `<div class="wtf-stock-alert-section">
        <strong>Critical Stock (${this.options.criticalStockThreshold} or less):</strong>
        <ul>${criticalStock.map(item => `<li>${item.name} (${item.quantity} remaining)</li>`).join('')}</ul>
      </div>`;
    }
    
    if (lowStock.length > 0) {
      alertMessage += `<div class="wtf-stock-alert-section">
        <strong>Low Stock:</strong>
        <ul>${lowStock.map(item => `<li>${item.name} (${item.quantity} remaining)</li>`).join('')}</ul>
      </div>`;
    }
    
    if (type === 'selection') {
      alertMessage += `<p><em>Some of your selected items have limited availability. Consider alternative options.</em></p>`;
    }
    
    contentDiv.innerHTML = alertMessage;
    alertContainer.className = `wtf-stock-alerts ${alertClass} wtf-stock-alerts--visible`;
    
    // Auto-hide after 10 seconds for selection alerts
    if (type === 'selection') {
      setTimeout(() => this.hideAlert(), 10000);
    }
  }

  hideAlert() {
    const alertContainer = document.getElementById('wtf-stock-alerts');
    if (alertContainer) {
      alertContainer.classList.remove('wtf-stock-alerts--visible');
    }
  }

  updateUIAlerts(items) {
    if (items.length > 0) {
      this.showUIAlert(items, 'general');
    } else {
      this.hideAlert();
    }
  }

  async sendStockNotification(items, severity = 'low') {
    if (!this.options.enableNotifications) return;
    
    const alertKey = `${severity}_${items.map(i => i.id).join('_')}`;
    
    // Avoid duplicate notifications within 1 hour
    if (this.alertsShown.has(alertKey)) {
      const lastAlert = this.alertsShown.get(alertKey);
      if (Date.now() - lastAlert < 3600000) { // 1 hour
        return;
      }
    }
    
    const notification = this.formatNotification(items, severity);
    
    // Send to Slack if configured
    if (this.options.slackWebhookUrl) {
      await this.sendSlackNotification(notification, severity);
    }
    
    // Send to generic webhook if configured
    if (this.options.webhookUrl) {
      await this.sendWebhookNotification(notification, severity);
    }
    
    this.alertsShown.set(alertKey, Date.now());
  }

  formatNotification(items, severity) {
    const emoji = severity === 'critical' ? '🚨' : '⚠️';
    const title = severity === 'critical' ? 'Critical Stock Alert' : 'Low Stock Alert';
    
    const itemList = items.map(item => {
      if (item.isOutOfStock) {
        return `• ${item.name}: OUT OF STOCK`;
      } else {
        return `• ${item.name}: ${item.quantity} remaining`;
      }
    }).join('\n');
    
    return {
      title: `${emoji} ${title} - WTF Cape Coral`,
      message: `${itemList}\n\nPlease restock these items to avoid customer disappointment.`,
      severity: severity,
      timestamp: new Date().toISOString(),
      items: items
    };
  }

  async sendSlackNotification(notification, severity) {
    try {
      const color = severity === 'critical' ? '#ff0000' : '#ffaa00';
      
      const slackPayload = {
        text: notification.title,
        attachments: [{
          color: color,
          fields: [{
            title: 'Items Affected',
            value: notification.message,
            short: false
          }],
          footer: 'WTF Stock Monitor',
          ts: Math.floor(Date.now() / 1000)
        }]
      };
      
      await fetch(this.options.slackWebhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(slackPayload)
      });
      
      console.log('Slack notification sent successfully');
    } catch (error) {
      console.error('Failed to send Slack notification:', error);
    }
  }

  async sendWebhookNotification(notification, severity) {
    try {
      const webhookPayload = {
        event: 'stock_alert',
        severity: severity,
        location: 'WTF Cape Coral',
        ...notification
      };
      
      await fetch(this.options.webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(webhookPayload)
      });
      
      console.log('Webhook notification sent successfully');
    } catch (error) {
      console.error('Failed to send webhook notification:', error);
    }
  }

  // Public API methods
  manualStockCheck() {
    return this.checkStockLevels();
  }

  getStockData() {
    return Object.fromEntries(this.stockData);
  }

  updateThresholds(lowStock, criticalStock) {
    this.options.lowStockThreshold = lowStock;
    this.options.criticalStockThreshold = criticalStock;
    this.processStockAlerts();
  }
}

// CSS Styles
const stockAlertStyles = `
.wtf-stock-alerts {
  position: relative;
  margin-bottom: 1rem;
  opacity: 0;
  max-height: 0;
  overflow: hidden;
  transition: all 0.3s ease;
}

.wtf-stock-alerts--visible {
  opacity: 1;
  max-height: 500px;
}

.wtf-stock-alerts__container {
  background: #fff3cd;
  border: 1px solid #ffeaa7;
  border-radius: 0.5rem;
  padding: 1rem;
  position: relative;
}

.wtf-stock-alerts--error .wtf-stock-alerts__container {
  background: #f8d7da;
  border-color: #f5c6cb;
}

.wtf-stock-alerts__header {
  display: flex;
  align-items: center;
  margin-bottom: 0.75rem;
}

.wtf-stock-alerts__icon {
  font-size: 1.25rem;
  margin-right: 0.5rem;
}

.wtf-stock-alerts__title {
  font-weight: 600;
  color: #856404;
  flex: 1;
}

.wtf-stock-alerts--error .wtf-stock-alerts__title {
  color: #721c24;
}

.wtf-stock-alerts__close {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #856404;
  padding: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.wtf-stock-alerts--error .wtf-stock-alerts__close {
  color: #721c24;
}

.wtf-stock-alerts__content {
  color: #856404;
  line-height: 1.5;
}

.wtf-stock-alerts--error .wtf-stock-alerts__content {
  color: #721c24;
}

.wtf-stock-alert-section {
  margin-bottom: 1rem;
}

.wtf-stock-alert-section:last-child {
  margin-bottom: 0;
}

.wtf-stock-alert-section ul {
  margin: 0.5rem 0 0 1.5rem;
  padding: 0;
}

.wtf-stock-alert-section li {
  margin-bottom: 0.25rem;
}

@media (max-width: 640px) {
  .wtf-stock-alerts__container {
    padding: 0.75rem;
  }
  
  .wtf-stock-alerts__header {
    margin-bottom: 0.5rem;
  }
}
`;

// Inject styles
if (!document.getElementById('wtf-stock-alert-styles')) {
  const styleSheet = document.createElement('style');
  styleSheet.id = 'wtf-stock-alert-styles';
  styleSheet.textContent = stockAlertStyles;
  document.head.appendChild(styleSheet);
}

// Initialize the stock alert system
document.addEventListener('DOMContentLoaded', () => {
  // Get configuration from meta tags or data attributes
  const config = {
    checkInterval: parseInt(document.querySelector('meta[name="wtf-stock-check-interval"]')?.content) || 30000,
    lowStockThreshold: parseInt(document.querySelector('meta[name="wtf-low-stock-threshold"]')?.content) || 10,
    criticalStockThreshold: parseInt(document.querySelector('meta[name="wtf-critical-stock-threshold"]')?.content) || 5,
    slackWebhookUrl: document.querySelector('meta[name="wtf-slack-webhook"]')?.content || null,
    webhookUrl: document.querySelector('meta[name="wtf-stock-webhook"]')?.content || null
  };
  
  // Initialize only if we're on a page with the drink builder
  if (document.getElementById('enhanced-drink-builder')) {
    window.wtfStockAlerts = new WTFLowStockAlerts(config);
  }
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = WTFLowStockAlerts;
}
