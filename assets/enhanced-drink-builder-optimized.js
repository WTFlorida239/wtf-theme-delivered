/**
 * Enhanced Drink Builder - Optimized Version
 * Lazy loads non-critical functionality and improves accessibility
 */

class EnhancedDrinkBuilder {
  constructor(element) {
    this.builder = element;
    this.form = element.querySelector('form[data-product-form]');
    this.state = {
      basePriceCents: 0,
      extraPumpCostCents: 0,
      selectedFlavors: new Map(),
      selectedStrains: new Set(),
      selectedBoosters: new Set(),
      selectedSweeteners: new Set(),
      selectedCreamers: new Set(),
      selectedThc: null,
      isGallon: false,
    };
    
    this.deferredFeaturesLoaded = false;
    this.init();
  }

  init() {
    if (!this.form) return;
    
    // Load critical functionality immediately
    this.loadCriticalFeatures();
    
    // Lazy load non-critical features
    this.scheduleNonCriticalFeatures();
  }

  loadCriticalFeatures() {
    this.priceEl = this.builder.querySelector('#builder-price');
    this.setupSizeSelection();
    this.setupBasicStrainSelection();
    this.updatePrice();
    
    // Add loading state management
    this.builder.classList.add('enhanced-drink-builder--loading');
    
    // Remove loading state after critical features are ready
    requestAnimationFrame(() => {
      this.builder.classList.remove('enhanced-drink-builder--loading');
    });
  }

  scheduleNonCriticalFeatures() {
    // Use requestIdleCallback if available, otherwise setTimeout
    const scheduleCallback = window.requestIdleCallback || 
      ((callback) => setTimeout(callback, 100));
    
    scheduleCallback(() => {
      this.loadNonCriticalFeatures();
    });
  }

  async loadNonCriticalFeatures() {
    if (this.deferredFeaturesLoaded) return;
    
    // Load deferred CSS
    await this.loadDeferredCSS();
    
    // Setup advanced features
    this.setupFlavorSelection();
    this.setupMixStrainLogic();
    this.setupThcUpgrade();
    this.setupFormSubmission();
    this.setupAccessibilityFeatures();
    
    this.deferredFeaturesLoaded = true;
  }

  loadDeferredCSS() {
    return new Promise((resolve) => {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = '/assets/enhanced-drink-builder-deferred.css';
      link.onload = resolve;
      link.onerror = resolve; // Don't block on CSS load failure
      document.head.appendChild(link);
    });
  }

  setupSizeSelection() {
    const sizeChips = this.builder.querySelectorAll('[data-option="Size"] .chip');
    sizeChips.forEach(chip => {
      chip.addEventListener('click', (e) => {
        this.handleSizeSelection(e);
      });
      
      // Keyboard support
      chip.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          this.handleSizeSelection(e);
        }
      });
    });
  }

  handleSizeSelection(e) {
    const chip = e.currentTarget;
    const input = chip.querySelector('input[type="radio"]');
    const sizeValue = input.value;
    
    // Update variant ID and price
    const variantData = this.getVariantData();
    if (variantData[sizeValue]) {
      const hiddenIdInput = this.form.querySelector('input[name="id"]');
      if (hiddenIdInput) {
        hiddenIdInput.value = variantData[sizeValue].id;
      }
      
      this.state.basePriceCents = variantData[sizeValue].price;
      this.state.isGallon = sizeValue.toLowerCase() === 'gallon';
      this.updatePrice();
    }
    
    // Update UI
    this.updateSizeChips(sizeValue);
    
    // Announce change for screen readers
    this.announceChange(`Size changed to ${sizeValue}`);
  }

  setupBasicStrainSelection() {
    const strainChips = this.builder.querySelectorAll('[data-strain-type] .chip');
    strainChips.forEach(chip => {
      chip.addEventListener('click', (e) => {
        this.handleStrainSelection(e);
      });
      
      // Keyboard support
      chip.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          this.handleStrainSelection(e);
        }
      });
    });
  }

  handleStrainSelection(e) {
    const chip = e.currentTarget;
    const input = chip.querySelector('input');
    const strainValue = input.value;
    
    if (strainValue === 'Mix') {
      this.state.selectedStrains.clear();
      this.state.selectedStrains.add('Mix');
      this.showMixInterface();
    } else {
      this.state.selectedStrains.clear();
      this.state.selectedStrains.add(strainValue);
      this.hideMixInterface();
    }
    
    this.updateStrainProperties();
    this.announceChange(`Strain changed to ${strainValue}`);
  }

  setupFlavorSelection() {
    // This will be loaded as part of non-critical features
    const flavorGrid = this.builder.querySelector('.flavor-grid');
    if (!flavorGrid) return;
    
    const flavorChips = flavorGrid.querySelectorAll('.flavor-chip');
    flavorChips.forEach(chip => {
      const minusBtn = chip.querySelector('[data-action="minus"]');
      const plusBtn = chip.querySelector('[data-action="plus"]');
      const flavorName = chip.dataset.flavor;
      
      if (minusBtn) {
        minusBtn.addEventListener('click', () => {
          this.adjustFlavorPumps(flavorName, -1);
        });
      }
      
      if (plusBtn) {
        plusBtn.addEventListener('click', () => {
          this.adjustFlavorPumps(flavorName, 1);
        });
      }
    });
  }

  adjustFlavorPumps(flavorName, delta) {
    const currentPumps = this.state.selectedFlavors.get(flavorName) || 0;
    const newPumps = Math.max(0, currentPumps + delta);
    
    if (newPumps === 0) {
      this.state.selectedFlavors.delete(flavorName);
    } else {
      this.state.selectedFlavors.set(flavorName, newPumps);
    }
    
    this.updateFlavorDisplay(flavorName, newPumps);
    this.updateFlavorProperties();
    this.updatePrice();
    this.updatePumpSummary();
    
    this.announceChange(`${flavorName} pumps: ${newPumps}`);
  }

  setupMixStrainLogic() {
    // Advanced strain mixing logic loaded on demand
    const mixContainer = this.builder.querySelector('.strain-mix-container');
    if (!mixContainer) return;
    
    const strainASelect = mixContainer.querySelector('[name="strain_a"]');
    const strainBSelect = mixContainer.querySelector('[name="strain_b"]');
    
    [strainASelect, strainBSelect].forEach(select => {
      if (select) {
        select.addEventListener('change', () => {
          this.updateMixStrainProperties();
        });
      }
    });
  }

  setupAccessibilityFeatures() {
    // Add ARIA live region for announcements
    if (!document.getElementById('drink-builder-announcements')) {
      const announcements = document.createElement('div');
      announcements.id = 'drink-builder-announcements';
      announcements.setAttribute('aria-live', 'polite');
      announcements.setAttribute('aria-atomic', 'true');
      announcements.style.position = 'absolute';
      announcements.style.left = '-10000px';
      announcements.style.width = '1px';
      announcements.style.height = '1px';
      announcements.style.overflow = 'hidden';
      document.body.appendChild(announcements);
    }
    
    // Add proper ARIA labels and roles
    this.enhanceAccessibility();
  }

  enhanceAccessibility() {
    // Add role="group" to fieldsets
    const fieldsets = this.builder.querySelectorAll('fieldset');
    fieldsets.forEach(fieldset => {
      fieldset.setAttribute('role', 'group');
    });
    
    // Add aria-pressed to chips
    const chips = this.builder.querySelectorAll('.chip');
    chips.forEach(chip => {
      chip.setAttribute('role', 'button');
      chip.setAttribute('tabindex', '0');
      
      const input = chip.querySelector('input');
      if (input) {
        chip.setAttribute('aria-pressed', input.checked ? 'true' : 'false');
        
        // Update aria-pressed when input changes
        input.addEventListener('change', () => {
          chip.setAttribute('aria-pressed', input.checked ? 'true' : 'false');
        });
      }
    });
    
    // Add proper labels to pump controls
    const pumpButtons = this.builder.querySelectorAll('.pump-controls button');
    pumpButtons.forEach(button => {
      const action = button.dataset.action;
      const flavorChip = button.closest('.flavor-chip');
      const flavorName = flavorChip?.dataset.flavor;
      
      if (action && flavorName) {
        button.setAttribute('aria-label', 
          `${action === 'plus' ? 'Add' : 'Remove'} ${flavorName} pump`);
      }
    });
  }

  announceChange(message) {
    const announcements = document.getElementById('drink-builder-announcements');
    if (announcements) {
      announcements.textContent = message;
    }
  }

  updatePrice() {
    if (!this.priceEl) return;
    
    let totalCents = this.state.basePriceCents;
    
    // Add extra pump costs
    const totalExtraPumps = Math.max(0, this.getTotalPumps() - this.getIncludedPumps());
    totalCents += totalExtraPumps * this.state.extraPumpCostCents;
    
    this.priceEl.textContent = this.formatMoney(totalCents);
  }

  getTotalPumps() {
    return Array.from(this.state.selectedFlavors.values()).reduce((sum, pumps) => sum + pumps, 0);
  }

  getIncludedPumps() {
    // Get from product metafields or default
    return parseInt(this.builder.dataset.includedPumps) || 4;
  }

  formatMoney(cents) {
    if (window.Shopify && typeof window.Shopify.formatMoney === 'function') {
      const format = window.Shopify.money_format || '${{ amount }}';
      return window.Shopify.formatMoney(cents, format);
    }
    const dollars = Number(cents || 0) / 100;
    return `$${dollars.toFixed(2)}`;
  }

  getVariantData() {
    // This would be populated from Liquid template
    return window.drinkBuilderVariants || {};
  }

  updateSizeChips(selectedSize) {
    const sizeChips = this.builder.querySelectorAll('[data-option="Size"] .chip');
    sizeChips.forEach(chip => {
      const input = chip.querySelector('input[type="radio"]');
      const isSelected = input.value === selectedSize;
      chip.setAttribute('aria-pressed', isSelected ? 'true' : 'false');
    });
  }

  updateFlavorDisplay(flavorName, pumps) {
    const flavorChip = this.builder.querySelector(`[data-flavor="${flavorName}"]`);
    if (!flavorChip) return;
    
    const pumpCount = flavorChip.querySelector('.pump-count');
    if (pumpCount) {
      pumpCount.textContent = pumps;
    }
    
    const minusBtn = flavorChip.querySelector('[data-action="minus"]');
    if (minusBtn) {
      minusBtn.disabled = pumps === 0;
    }
  }

  updatePumpSummary() {
    const summary = this.builder.querySelector('.pump-summary');
    if (!summary) return;
    
    const totalPumps = this.getTotalPumps();
    const includedPumps = this.getIncludedPumps();
    const maxPumps = this.getMaxPumps();
    
    const summaryText = summary.querySelector('.pump-summary-text');
    const summaryCount = summary.querySelector('.pump-summary-count');
    
    if (summaryText && summaryCount) {
      summaryCount.textContent = `${totalPumps}/${maxPumps}`;
      
      if (totalPumps > maxPumps) {
        summary.classList.add('over-limit');
        summaryText.textContent = 'Too many pumps selected';
      } else {
        summary.classList.remove('over-limit');
        const extraPumps = Math.max(0, totalPumps - includedPumps);
        summaryText.textContent = extraPumps > 0 ? 
          `${extraPumps} extra pump${extraPumps !== 1 ? 's' : ''}` : 
          'Within included pumps';
      }
    }
  }

  getMaxPumps() {
    // Get from product metafields or default based on size
    if (this.state.isGallon) return 12;
    return parseInt(this.builder.dataset.maxPumps) || 6;
  }

  showMixInterface() {
    const mixContainer = this.builder.querySelector('.strain-mix-container');
    if (mixContainer) {
      mixContainer.classList.add('active');
    }
  }

  hideMixInterface() {
    const mixContainer = this.builder.querySelector('.strain-mix-container');
    if (mixContainer) {
      mixContainer.classList.remove('active');
    }
  }

  updateStrainProperties() {
    const strainInput = this.form.querySelector('input[name="properties[Strain]"]');
    const mixInput = this.form.querySelector('input[name="properties[Mix]"]');
    
    if (this.state.selectedStrains.has('Mix')) {
      if (mixInput) mixInput.value = 'Yes';
      if (strainInput) strainInput.value = '';
    } else {
      if (mixInput) mixInput.value = 'No';
      if (strainInput) strainInput.value = Array.from(this.state.selectedStrains).join(', ');
    }
  }

  updateMixStrainProperties() {
    const strainASelect = this.builder.querySelector('[name="strain_a"]');
    const strainBSelect = this.builder.querySelector('[name="strain_b"]');
    const strainAInput = this.form.querySelector('input[name="properties[Strain A]"]');
    const strainBInput = this.form.querySelector('input[name="properties[Strain B]"]');
    
    if (strainAInput && strainASelect) {
      strainAInput.value = strainASelect.value;
    }
    if (strainBInput && strainBSelect) {
      strainBInput.value = strainBSelect.value;
    }
  }

  updateFlavorProperties() {
    const flavorInput = this.form.querySelector('input[name="properties[Flavors & Pumps]"]');
    if (!flavorInput) return;
    
    const flavorStrings = [];
    for (const [flavor, pumps] of this.state.selectedFlavors) {
      flavorStrings.push(`${flavor}:${pumps}`);
    }
    
    flavorInput.value = flavorStrings.join(' | ');
  }

  setupFormSubmission() {
    const submitBtn = this.form.querySelector('[type="submit"]');
    if (!submitBtn) return;
    
    this.form.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleFormSubmit();
    });
  }

  async handleFormSubmit() {
    const submitBtn = this.form.querySelector('[type="submit"]');
    if (!submitBtn) return;
    
    // Validate form
    if (!this.validateForm()) {
      return;
    }
    
    // Update all properties before submission
    this.updateAllProperties();
    
    // Show loading state
    submitBtn.disabled = true;
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Adding to Cart...';
    
    try {
      const formData = new FormData(this.form);
      const response = await fetch('/cart/add.js', {
        method: 'POST',
        body: formData
      });
      
      if (response.ok) {
        const result = await response.json();
        this.handleAddToCartSuccess(result);
      } else {
        throw new Error('Failed to add to cart');
      }
    } catch (error) {
      this.handleAddToCartError(error);
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
    }
  }

  validateForm() {
    // Check if size is selected
    const sizeSelected = this.form.querySelector('input[name="id"]')?.value;
    if (!sizeSelected) {
      this.announceChange('Please select a size');
      return false;
    }
    
    // Check if strain is selected
    if (this.state.selectedStrains.size === 0) {
      this.announceChange('Please select a strain');
      return false;
    }
    
    // Check pump limits
    const totalPumps = this.getTotalPumps();
    const maxPumps = this.getMaxPumps();
    if (totalPumps > maxPumps) {
      this.announceChange(`Too many pumps selected. Maximum is ${maxPumps}`);
      return false;
    }
    
    return true;
  }

  updateAllProperties() {
    this.updateStrainProperties();
    this.updateMixStrainProperties();
    this.updateFlavorProperties();
  }

  handleAddToCartSuccess(result) {
    this.announceChange('Item added to cart successfully');
    
    // Update cart count if element exists
    const cartCount = document.querySelector('[data-cart-count]');
    if (cartCount && window.cartData) {
      window.cartData.item_count += 1;
      cartCount.textContent = window.cartData.item_count;
    }
    
    // Optionally open cart drawer
    if (window.openCartDrawer) {
      window.openCartDrawer();
    }
  }

  handleAddToCartError(error) {
    console.error('Add to cart error:', error);
    this.announceChange('Failed to add item to cart. Please try again.');
  }

  setupThcUpgrade() {
    // THC upgrade logic - loaded on demand
    const thcSection = this.builder.querySelector('.thc-upgrade-section');
    if (!thcSection) return;
    
    const thcChips = thcSection.querySelectorAll('.chip');
    thcChips.forEach(chip => {
      chip.addEventListener('click', (e) => {
        this.handleThcSelection(e);
      });
    });
  }

  handleThcSelection(e) {
    const chip = e.currentTarget;
    const input = chip.querySelector('input');
    
    if (input.checked) {
      this.state.selectedThc = input.value;
      // Update variant ID to THC version
      const thcVariantId = this.builder.dataset.thcVariantId;
      if (thcVariantId) {
        const hiddenIdInput = this.form.querySelector('input[name="id"]');
        if (hiddenIdInput) {
          hiddenIdInput.value = thcVariantId;
        }
      }
    } else {
      this.state.selectedThc = null;
      // Revert to regular variant
      this.handleSizeSelection({ currentTarget: this.getSelectedSizeChip() });
    }
    
    this.updatePrice();
  }

  getSelectedSizeChip() {
    return this.builder.querySelector('[data-option="Size"] .chip input:checked')?.closest('.chip');
  }
}

// Initialize when DOM is ready
const initEnhancedDrinkBuilder = () => {
  const builders = document.querySelectorAll('#enhanced-drink-builder');
  builders.forEach(builder => {
    new EnhancedDrinkBuilder(builder);
  });
};

// Use modern loading approach
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initEnhancedDrinkBuilder, { once: true });
} else {
  initEnhancedDrinkBuilder();
}

// Export for potential external use
window.EnhancedDrinkBuilder = EnhancedDrinkBuilder;
