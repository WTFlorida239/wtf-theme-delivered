/**
 * WTF Inventory Alerts System
 * Integrates with Slack webhooks for real-time inventory monitoring
 */

(function() {
  'use strict';

  const SLACK_WEBHOOK_URL = 'https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK'; // Replace with actual webhook
  const ALERT_COOLDOWN = 5 * 60 * 1000; // 5 minutes cooldown between alerts for same product
  
  class InventoryAlerts {
    constructor() {
      this.alertHistory = new Map();
      this.init();
    }

    init() {
      // Process any queued alerts
      if (window.WTF && window.WTF.stockAlertQueue) {
        window.WTF.stockAlertQueue.forEach(alert => {
          this.sendStockAlert(alert);
        });
        window.WTF.stockAlertQueue = [];
      }

      // Set up periodic inventory checks
      this.setupPeriodicChecks();
    }

    async sendStockAlert(alertData) {
      const alertKey = `${alertData.product_id}-${alertData.variant_id}`;
      const now = Date.now();
      
      // Check cooldown
      if (this.alertHistory.has(alertKey)) {
        const lastAlert = this.alertHistory.get(alertKey);
        if (now - lastAlert < ALERT_COOLDOWN) {
          console.log('Alert cooldown active for', alertKey);
          return;
        }
      }

      try {
        const slackMessage = this.formatSlackMessage(alertData);
        
        const response = await fetch(SLACK_WEBHOOK_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(slackMessage)
        });

        if (response.ok) {
          this.alertHistory.set(alertKey, now);
          console.log('Stock alert sent successfully:', alertData);
        } else {
          console.error('Failed to send stock alert:', response.statusText);
        }
        
      } catch (error) {
        console.error('Error sending stock alert:', error);
        
        // Fallback: log to console or send to alternative endpoint
        this.logAlertFallback(alertData);
      }
    }

    formatSlackMessage(alertData) {
      const { product_title, variant_title, inventory_quantity, stock_status, shop_domain } = alertData;
      
      let color = '#36a64f'; // Green for in stock
      let emoji = '✅';
      let urgency = 'Info';
      
      if (stock_status === 'low_stock') {
        color = '#ff9500'; // Orange for low stock
        emoji = '⚠️';
        urgency = 'Warning';
      } else if (stock_status === 'out_of_stock') {
        color = '#ff0000'; // Red for out of stock
        emoji = '🚨';
        urgency = 'Critical';
      }

      const productName = variant_title && variant_title !== 'Default Title' 
        ? `${product_title} - ${variant_title}`
        : product_title;

      return {
        username: 'WTF Inventory Bot',
        icon_emoji: ':package:',
        attachments: [
          {
            color: color,
            title: `${emoji} ${urgency}: Inventory Alert`,
            fields: [
              {
                title: 'Product',
                value: productName,
                short: true
              },
              {
                title: 'Stock Level',
                value: `${inventory_quantity} remaining`,
                short: true
              },
              {
                title: 'Status',
                value: stock_status.replace('_', ' ').toUpperCase(),
                short: true
              },
              {
                title: 'Store',
                value: shop_domain,
                short: true
              }
            ],
            footer: 'WTF Inventory System',
            ts: Math.floor(Date.now() / 1000),
            actions: stock_status === 'out_of_stock' ? [
              {
                type: 'button',
                text: 'Restock Now',
                style: 'primary',
                url: `https://${shop_domain}/admin/products/${alertData.product_id}`
              },
              {
                type: 'button',
                text: 'View Analytics',
                url: `https://${shop_domain}/admin/analytics/reports/inventory`
              }
            ] : []
          }
        ]
      };
    }

    logAlertFallback(alertData) {
      // Fallback logging when Slack webhook fails
      const logEntry = {
        timestamp: new Date().toISOString(),
        type: 'inventory_alert',
        data: alertData,
        source: 'wtf_theme'
      };

      // Store in localStorage for debugging
      const logs = JSON.parse(localStorage.getItem('wtf_inventory_logs') || '[]');
      logs.push(logEntry);
      
      // Keep only last 50 logs
      if (logs.length > 50) {
        logs.splice(0, logs.length - 50);
      }
      
      localStorage.setItem('wtf_inventory_logs', JSON.stringify(logs));

      // Also send to console for immediate visibility
      console.warn('INVENTORY ALERT (Slack failed):', alertData);
    }

    setupPeriodicChecks() {
      // Check inventory levels every 30 minutes
      setInterval(() => {
        this.performInventoryCheck();
      }, 30 * 60 * 1000);
    }

    async performInventoryCheck() {
      try {
        // Get current cart items to check their inventory
        const response = await fetch('/cart.js');
        const cart = await response.json();
        
        for (const item of cart.items) {
          // Check if any cart items are now low/out of stock
          const productResponse = await fetch(`/products/${item.handle}.js`);
          const product = await productResponse.json();
          
          const variant = product.variants.find(v => v.id === item.variant_id);
          if (variant && variant.inventory_management === 'shopify') {
            const quantity = variant.inventory_quantity;
            
            if (quantity <= 0) {
              this.sendStockAlert({
                product_id: product.id,
                variant_id: variant.id,
                product_title: product.title,
                variant_title: variant.title,
                inventory_quantity: quantity,
                stock_status: 'out_of_stock',
                shop_domain: window.location.hostname,
                timestamp: new Date().toISOString(),
                context: 'periodic_check'
              });
            } else if (quantity <= 10) {
              this.sendStockAlert({
                product_id: product.id,
                variant_id: variant.id,
                product_title: product.title,
                variant_title: variant.title,
                inventory_quantity: quantity,
                stock_status: 'low_stock',
                shop_domain: window.location.hostname,
                timestamp: new Date().toISOString(),
                context: 'periodic_check'
              });
            }
          }
        }
      } catch (error) {
        console.error('Error during periodic inventory check:', error);
      }
    }

    // Public API for restock notifications
    showRestockNotification(productId, variantId) {
      const modal = this.createRestockModal(productId, variantId);
      document.body.appendChild(modal);
      
      // Focus management
      const emailInput = modal.querySelector('input[type="email"]');
      if (emailInput) {
        emailInput.focus();
      }
      
      // Trap focus within modal
      this.trapFocus(modal);
    }

    createRestockModal(productId, variantId) {
      const modal = document.createElement('div');
      modal.className = 'restock-modal';
      modal.setAttribute('role', 'dialog');
      modal.setAttribute('aria-labelledby', 'restock-modal-title');
      modal.setAttribute('aria-modal', 'true');
      
      modal.innerHTML = `
        <div class="restock-modal__backdrop" data-modal-close></div>
        <div class="restock-modal__content">
          <div class="restock-modal__header">
            <h2 id="restock-modal-title">Get Notified When Available</h2>
            <button type="button" class="restock-modal__close" data-modal-close aria-label="Close modal">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
          <form class="restock-modal__form" data-restock-form>
            <div class="restock-modal__field">
              <label for="restock-email">Email Address</label>
              <input type="email" 
                     id="restock-email" 
                     name="email" 
                     required 
                     placeholder="your@email.com"
                     aria-describedby="restock-email-help">
              <div id="restock-email-help" class="restock-modal__help">
                We'll send you one email when this item is back in stock.
              </div>
            </div>
            <div class="restock-modal__actions">
              <button type="button" class="restock-modal__cancel" data-modal-close>
                Cancel
              </button>
              <button type="submit" class="restock-modal__submit">
                Notify Me
              </button>
            </div>
          </form>
        </div>
      `;

      // Event listeners
      modal.addEventListener('click', (e) => {
        if (e.target.matches('[data-modal-close]')) {
          this.closeRestockModal(modal);
        }
      });

      modal.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          this.closeRestockModal(modal);
        }
      });

      const form = modal.querySelector('[data-restock-form]');
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleRestockSubmission(form, productId, variantId, modal);
      });

      return modal;
    }

    closeRestockModal(modal) {
      modal.remove();
      
      // Return focus to trigger element if possible
      const triggerButton = document.querySelector(`[data-product-id="${modal.dataset.productId}"] [data-notify-restock]`);
      if (triggerButton) {
        triggerButton.focus();
      }
    }

    async handleRestockSubmission(form, productId, variantId, modal) {
      const formData = new FormData(form);
      const email = formData.get('email');
      
      const submitButton = form.querySelector('.restock-modal__submit');
      const originalText = submitButton.textContent;
      
      submitButton.textContent = 'Submitting...';
      submitButton.disabled = true;

      try {
        // Send restock notification request
        const response = await fetch('/contact', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            'form_type': 'contact',
            'utf8': '✓',
            'contact[email]': email,
            'contact[subject]': 'Restock Notification Request',
            'contact[body]': `Please notify me when product ${productId} (variant ${variantId}) is back in stock.`,
            'contact[tags]': 'restock-notification'
          })
        });

        if (response.ok) {
          // Success
          modal.querySelector('.restock-modal__content').innerHTML = `
            <div class="restock-modal__success">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22,4 12,14.01 9,11.01"></polyline>
              </svg>
              <h2>You're All Set!</h2>
              <p>We'll email you at <strong>${email}</strong> when this item is back in stock.</p>
              <button type="button" class="restock-modal__close-success" data-modal-close>
                Close
              </button>
            </div>
          `;
          
          // Auto-close after 3 seconds
          setTimeout(() => {
            this.closeRestockModal(modal);
          }, 3000);
          
        } else {
          throw new Error('Failed to submit notification request');
        }
        
      } catch (error) {
        console.error('Error submitting restock notification:', error);
        
        // Show error message
        const errorDiv = document.createElement('div');
        errorDiv.className = 'restock-modal__error';
        errorDiv.textContent = 'Sorry, there was an error. Please try again or contact us directly.';
        form.insertBefore(errorDiv, form.firstChild);
        
      } finally {
        submitButton.textContent = originalText;
        submitButton.disabled = false;
      }
    }

    trapFocus(container) {
      const focusableElements = container.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      
      if (focusableElements.length === 0) return;
      
      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];
      
      container.addEventListener('keydown', (e) => {
        if (e.key === 'Tab') {
          if (e.shiftKey) {
            if (document.activeElement === firstElement) {
              e.preventDefault();
              lastElement.focus();
            }
          } else {
            if (document.activeElement === lastElement) {
              e.preventDefault();
              firstElement.focus();
            }
          }
        }
      });
    }
  }

  // Initialize when DOM is ready
  document.addEventListener('DOMContentLoaded', () => {
    const inventoryAlerts = new InventoryAlerts();
    
    // Expose to global WTF namespace
    window.WTF = window.WTF || {};
    window.WTF.sendStockAlert = inventoryAlerts.sendStockAlert.bind(inventoryAlerts);
    window.WTF.showRestockNotification = inventoryAlerts.showRestockNotification.bind(inventoryAlerts);
  });

})();
