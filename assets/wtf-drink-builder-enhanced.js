/* WTF Enhanced Drink Builder JavaScript
   - Enhanced version that works with the new cart system
   - Handles custom drink building with proper variant selection
   - Manages line item properties for custom drinks
   - Provides real-time price calculation and validation
*/

class WTFDrinkBuilderEnhanced {
  constructor(formSelector = '.drink-builder__form') {
    this.form = document.querySelector(formSelector);
    if (!this.form) return;

    this.basePrice = 0;
    this.currentTotal = 0;
    this.selectedVariantId = null;
    this.selectedProduct = null;
    this.pumpLimits = {
      'Small': 3,
      'Medium': 4,
      'Large': 6,
      'Gallon': 12
    };

    this.init();
  }

  init() {
    this.setupVariantMapping();
    this.attachEventListeners();
    this.updatePriceDisplay();
    this.validateForm();
    this.addRequiredStyles();
  }

  setupVariantMapping() {
    // This will be populated by the Liquid template or from data attributes
    this.variantMapping = window.drinkBuilderVariants || {};
  }

  attachEventListeners() {
    // Base drink selection
    this.form.addEventListener('change', (e) => {
      if (e.target.name === 'base_drink') {
        this.handleBaseSelection(e.target);
      }
    });

    // Size selection
    this.form.addEventListener('change', (e) => {
      if (e.target.name === 'size') {
        this.handleSizeSelection(e.target);
      }
    });

    // Flavor pump controls
    this.form.addEventListener('click', (e) => {
      if (e.target.classList.contains('flavor-pump__decrease')) {
        e.preventDefault();
        this.handleFlavorDecrease(e.target);
      } else if (e.target.classList.contains('flavor-pump__increase')) {
        e.preventDefault();
        this.handleFlavorIncrease(e.target);
      }
    });

    // Flavor pump input changes
    this.form.addEventListener('input', (e) => {
      if (e.target.classList.contains('flavor-pump__input')) {
        this.handleFlavorInput(e.target);
      }
    });

    // Add-on selection
    this.form.addEventListener('change', (e) => {
      if (e.target.type === 'checkbox' && e.target.name.startsWith('addon_')) {
        this.handleAddonSelection(e.target);
      }
    });

    // Prevent default form submission - let the cart system handle it
    this.form.addEventListener('submit', (e) => {
      e.preventDefault();
      this.prepareFormForSubmission();
    });
  }

  handleBaseSelection(input) {
    const productOption = input.closest('.drink-option');
    const productId = productOption.dataset.productId;
    const price = parseFloat(input.dataset.price) / 100;
    const variantId = input.dataset.variantId;
    const productTitle = productOption.querySelector('.drink-option__name').textContent;

    this.basePrice = price;
    this.selectedVariantId = variantId;
    this.selectedProduct = {
      id: productId,
      title: productTitle,
      handle: input.value
    };

    // Update hidden variant ID input
    const variantIdInput = this.form.querySelector('input[name="id"]');
    if (variantIdInput) {
      variantIdInput.value = variantId;
    }

    // Update line item properties
    this.updateLineItemProperty('Base Drink', productTitle);
    this.updateLineItemProperty('Product Handle', input.value);

    this.updatePriceDisplay();
    this.validateForm();
    this.updateOrderSummary();
  }

  handleSizeSelection(input) {
    const size = input.value;
    const priceModifier = parseFloat(input.dataset.priceModifier) / 100;

    // If we have a selected product, try to find the variant for this size
    if (this.selectedProduct && this.variantMapping[this.selectedProduct.handle]) {
      const productVariants = this.variantMapping[this.selectedProduct.handle];
      if (productVariants[size]) {
        this.selectedVariantId = productVariants[size];
        const variantIdInput = this.form.querySelector('input[name="id"]');
        if (variantIdInput) {
          variantIdInput.value = this.selectedVariantId;
        }
      }
    }

    this.updateLineItemProperty('Size', size);
    this.updatePumpLimitDisplay(size);
    this.validateFlavorPumps();
    this.updatePriceDisplay();
    this.validateForm();
    this.updateOrderSummary();
  }

  handleFlavorDecrease(button) {
    const flavor = button.dataset.flavor;
    const input = this.form.querySelector(`input[name="flavor_${flavor}"]`);
    const currentValue = parseInt(input.value);
    
    if (currentValue > 0) {
      input.value = currentValue - 1;
      input.dataset.previousValue = input.value;
      this.updateFlavorProperties();
      this.updatePriceDisplay();
      this.validateFlavorPumps();
      this.updateOrderSummary();
    }
  }

  handleFlavorIncrease(button) {
    const flavor = button.dataset.flavor;
    const input = this.form.querySelector(`input[name="flavor_${flavor}"]`);
    const currentValue = parseInt(input.value);
    const maxPumps = parseInt(input.max);
    
    if (currentValue < maxPumps && this.canAddMorePumps()) {
      input.value = currentValue + 1;
      input.dataset.previousValue = input.value;
      this.updateFlavorProperties();
      this.updatePriceDisplay();
      this.validateFlavorPumps();
      this.updateOrderSummary();
    } else if (!this.canAddMorePumps()) {
      this.showPumpLimitMessage();
    }
  }

  handleFlavorInput(input) {
    const value = parseInt(input.value) || 0;
    const max = parseInt(input.max);
    const previousValue = parseInt(input.dataset.previousValue) || 0;
    
    // Validate input
    if (value < 0) {
      input.value = 0;
    } else if (value > max) {
      input.value = max;
    } else if (!this.canAddMorePumps() && value > previousValue) {
      input.value = previousValue;
      this.showPumpLimitMessage();
      return;
    }

    input.dataset.previousValue = input.value;
    this.updateFlavorProperties();
    this.updatePriceDisplay();
    this.validateFlavorPumps();
    this.updateOrderSummary();
  }

  handleAddonSelection(input) {
    this.updateAddonProperties();
    this.updatePriceDisplay();
    this.updateOrderSummary();
  }

  canAddMorePumps() {
    const selectedSize = this.form.querySelector('input[name="size"]:checked');
    if (!selectedSize) return false;

    const limit = this.pumpLimits[selectedSize.value] || 4;
    const currentTotal = this.getTotalPumps();
    
    return currentTotal < limit;
  }

  getTotalPumps() {
    const flavorInputs = this.form.querySelectorAll('.flavor-pump__input');
    let total = 0;
    flavorInputs.forEach(input => {
      total += parseInt(input.value) || 0;
    });
    return total;
  }

  updateFlavorProperties() {
    const flavorInputs = this.form.querySelectorAll('.flavor-pump__input');
    const flavors = [];
    
    flavorInputs.forEach(input => {
      const value = parseInt(input.value);
      if (value > 0) {
        const flavorName = input.name.replace('flavor_', '').replace('_', ' ');
        const displayName = flavorName.charAt(0).toUpperCase() + flavorName.slice(1);
        flavors.push(`${displayName}: ${value}`);
      }
    });

    this.updateLineItemProperty('Flavors & Pumps', flavors.join(' | '));
    this.updateLineItemProperty('Total Pumps', this.getTotalPumps().toString());
  }

  updateAddonProperties() {
    const addonInputs = this.form.querySelectorAll('input[type="checkbox"]:checked');
    const addons = [];
    
    addonInputs.forEach(input => {
      addons.push(input.value);
    });

    this.updateLineItemProperty('Add-ons', addons.join(', '));
  }

  updateLineItemProperty(name, value) {
    let input = this.form.querySelector(`input[name="properties[${name}]"]`);
    
    if (!input) {
      input = document.createElement('input');
      input.type = 'hidden';
      input.name = `properties[${name}]`;
      this.form.appendChild(input);
    }
    
    input.value = value || '';
  }

  updatePumpLimitDisplay(size) {
    const limit = this.pumpLimits[size] || 4;
    
    // Create or update pump counter
    let pumpCounter = this.form.querySelector('.pump-counter');
    if (!pumpCounter) {
      pumpCounter = document.createElement('div');
      pumpCounter.className = 'pump-counter';
      const flavorSection = this.form.querySelector('.drink-builder__step[data-step="flavors"]');
      if (flavorSection) {
        const title = flavorSection.querySelector('.drink-builder__step-title');
        if (title) {
          title.appendChild(pumpCounter);
        }
      }
    }

    // Update max attributes on flavor inputs
    const flavorInputs = this.form.querySelectorAll('.flavor-pump__input');
    flavorInputs.forEach(input => {
      input.max = limit;
      input.dataset.previousValue = input.value;
    });

    this.validateFlavorPumps();
  }

  validateFlavorPumps() {
    const selectedSize = this.form.querySelector('input[name="size"]:checked');
    if (!selectedSize) return;

    const limit = this.pumpLimits[selectedSize.value] || 4;
    const currentTotal = this.getTotalPumps();
    
    // Update pump counter display
    const pumpCounter = this.form.querySelector('.pump-counter');
    if (pumpCounter) {
      pumpCounter.textContent = ` (${currentTotal}/${limit} pumps)`;
      pumpCounter.className = `pump-counter ${currentTotal > limit ? 'over-limit' : ''}`;
    }

    // Disable/enable pump buttons based on limit
    const increaseButtons = this.form.querySelectorAll('.flavor-pump__increase');
    increaseButtons.forEach(button => {
      button.disabled = currentTotal >= limit;
    });
  }

  showPumpLimitMessage() {
    const selectedSize = this.form.querySelector('input[name="size"]:checked');
    const limit = this.pumpLimits[selectedSize?.value] || 4;
    
    // Remove existing message
    const existingMessage = this.form.querySelector('.pump-limit-message');
    if (existingMessage) {
      existingMessage.remove();
    }
    
    // Show temporary message
    const message = document.createElement('div');
    message.className = 'pump-limit-message';
    message.textContent = `Maximum ${limit} pumps allowed for ${selectedSize.value} size`;

    const flavorSection = this.form.querySelector('.drink-builder__step[data-step="flavors"]');
    if (flavorSection) {
      flavorSection.appendChild(message);
      
      setTimeout(() => {
        if (message.parentNode) {
          message.remove();
        }
      }, 3000);
    }
  }

  updatePriceDisplay() {
    let total = this.basePrice;

    // Add size modifier
    const selectedSize = this.form.querySelector('input[name="size"]:checked');
    if (selectedSize) {
      total += parseFloat(selectedSize.dataset.priceModifier) / 100;
    }

    // Add flavor pumps
    const flavorInputs = this.form.querySelectorAll('.flavor-pump__input');
    flavorInputs.forEach(input => {
      const pumps = parseInt(input.value) || 0;
      const pricePerPump = parseFloat(input.dataset.pricePerPump) / 100;
      total += pumps * pricePerPump;
    });

    // Add add-ons
    const addonInputs = this.form.querySelectorAll('input[type="checkbox"]:checked');
    addonInputs.forEach(input => {
      total += parseFloat(input.dataset.price) / 100;
    });

    this.currentTotal = total;

    // Update price display
    const priceDisplay = this.form.querySelector('[data-total-price]');
    if (priceDisplay) {
      priceDisplay.textContent = `$${total.toFixed(2)}`;
    }

    // Update line item property for total
    this.updateLineItemProperty('Custom Total', `$${total.toFixed(2)}`);
  }

  updateOrderSummary() {
    const summaryDetails = this.form.querySelector('[data-order-details]');
    if (!summaryDetails) return;

    const selectedBase = this.form.querySelector('input[name="base_drink"]:checked');
    const selectedSize = this.form.querySelector('input[name="size"]:checked');

    if (!selectedBase) {
      summaryDetails.innerHTML = '<p class="order-summary__placeholder">Select a base drink to get started</p>';
      return;
    }

    let summary = `<div class="order-summary__item">
      <strong>${selectedBase.closest('.drink-option').querySelector('.drink-option__name').textContent}</strong>
    </div>`;

    if (selectedSize) {
      summary += `<div class="order-summary__item">Size: ${selectedSize.value}</div>`;
    }

    // Add flavors
    const flavorInputs = this.form.querySelectorAll('.flavor-pump__input');
    const flavors = [];
    flavorInputs.forEach(input => {
      const value = parseInt(input.value);
      if (value > 0) {
        const flavorName = input.name.replace('flavor_', '').replace('_', ' ');
        const displayName = flavorName.charAt(0).toUpperCase() + flavorName.slice(1);
        flavors.push(`${displayName} (${value})`);
      }
    });

    if (flavors.length > 0) {
      summary += `<div class="order-summary__item">Flavors: ${flavors.join(', ')}</div>`;
    }

    // Add add-ons
    const addonInputs = this.form.querySelectorAll('input[type="checkbox"]:checked');
    if (addonInputs.length > 0) {
      const addons = Array.from(addonInputs).map(input => input.value);
      summary += `<div class="order-summary__item">Add-ons: ${addons.join(', ')}</div>`;
    }

    summaryDetails.innerHTML = summary;
  }

  validateForm() {
    const selectedBase = this.form.querySelector('input[name="base_drink"]:checked');
    const selectedSize = this.form.querySelector('input[name="size"]:checked');
    const submitButton = this.form.querySelector('[type="submit"]');

    const isValid = selectedBase && selectedSize && this.selectedVariantId;

    if (submitButton) {
      submitButton.disabled = !isValid;
    }

    return isValid;
  }

  prepareFormForSubmission() {
    if (!this.validateForm()) {
      this.showMessage('Please select a base drink and size before adding to cart.', 'error');
      return false;
    }

    // Final validation for pump limits
    const selectedSize = this.form.querySelector('input[name="size"]:checked');
    const limit = this.pumpLimits[selectedSize.value] || 4;
    const currentTotal = this.getTotalPumps();

    if (currentTotal > limit) {
      this.showMessage(`Too many flavor pumps! Maximum ${limit} pumps allowed for ${selectedSize.value} size.`, 'error');
      return false;
    }

    // Update all line item properties before submission
    this.updateFlavorProperties();
    this.updateAddonProperties();

    // Ensure the form has the data-wtf-ajax attribute for the cart system
    this.form.setAttribute('data-wtf-ajax', '');

    // Trigger the enhanced cart system
    if (window.WTFCartSystem) {
      window.WTFCartSystem.handleAddToCart(this.form);
    } else {
      // Fallback to regular form submission
      this.form.submit();
    }

    return true;
  }

  showMessage(message, type = 'info') {
    // Create or update message display
    let messageEl = this.form.querySelector('.drink-builder-message');
    if (!messageEl) {
      messageEl = document.createElement('div');
      messageEl.className = 'drink-builder-message';
      const summary = this.form.querySelector('.drink-builder__summary');
      if (summary) {
        summary.insertBefore(messageEl, summary.firstChild);
      }
    }

    messageEl.textContent = message;
    messageEl.className = `drink-builder-message drink-builder-message--${type}`;

    // Auto-remove after 5 seconds
    setTimeout(() => {
      if (messageEl.parentNode) {
        messageEl.remove();
      }
    }, 5000);
  }

  addRequiredStyles() {
    if (document.querySelector('#wtf-drink-builder-enhanced-styles')) return;

    const style = document.createElement('style');
    style.id = 'wtf-drink-builder-enhanced-styles';
    style.textContent = `
      .pump-counter {
        font-size: 0.9rem;
        font-weight: normal;
        color: #666;
        margin-left: 0.5rem;
      }
      
      .pump-counter.over-limit {
        color: #dc3545;
        font-weight: bold;
      }
      
      .flavor-pump__increase:disabled {
        opacity: 0.5;
        cursor: not-allowed;
        background: #f5f5f5;
      }
      
      .order-summary__item {
        margin-bottom: 0.5rem;
        padding: 0.25rem 0;
        border-bottom: 1px solid #eee;
        font-size: 0.9rem;
      }
      
      .order-summary__item:last-child {
        border-bottom: none;
      }
      
      .pump-limit-message {
        position: absolute;
        top: 100%;
        left: 0;
        right: 0;
        background: #ff6600;
        color: white;
        padding: 8px 12px;
        border-radius: 4px;
        font-size: 0.9rem;
        z-index: 1000;
        margin-top: 0.5rem;
        animation: fadeInOut 3s ease-in-out;
      }
      
      .drink-builder-message {
        padding: 1rem;
        border-radius: 4px;
        margin-bottom: 1rem;
        font-weight: bold;
      }
      
      .drink-builder-message--error {
        background: #f8d7da;
        color: #721c24;
        border: 1px solid #f5c6cb;
      }
      
      .drink-builder-message--success {
        background: #d4edda;
        color: #155724;
        border: 1px solid #c3e6cb;
      }
      
      .drink-builder-message--info {
        background: #d1ecf1;
        color: #0c5460;
        border: 1px solid #bee5eb;
      }
      
      @keyframes fadeInOut {
        0% { opacity: 0; transform: translateY(-10px); }
        20%, 80% { opacity: 1; transform: translateY(0); }
        100% { opacity: 0; transform: translateY(-10px); }
      }
      
      .drink-builder__step[data-step="flavors"] {
        position: relative;
      }
    `;
    document.head.appendChild(style);
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  // Only initialize if we have a drink builder form
  if (document.querySelector('.drink-builder__form')) {
    window.WTFDrinkBuilderEnhanced = new WTFDrinkBuilderEnhanced();
  }
});

// Export for external use
window.WTFDrinkBuilderEnhanced = WTFDrinkBuilderEnhanced;
