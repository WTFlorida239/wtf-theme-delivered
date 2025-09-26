/**
 * WTF Drink Builder - Accessible Version
 * Enhanced with WCAG 2.1 AA compliance, keyboard navigation, and screen reader support
 */

(function() {
  'use strict';

  // Accessibility utilities
  const a11y = {
    // Announce to screen readers
    announce: (message, priority = 'polite') => {
      const announcement = document.createElement('div');
      announcement.setAttribute('aria-live', priority);
      announcement.setAttribute('aria-atomic', 'true');
      announcement.style.position = 'absolute';
      announcement.style.left = '-10000px';
      announcement.style.width = '1px';
      announcement.style.height = '1px';
      announcement.style.overflow = 'hidden';
      announcement.textContent = message;
      
      document.body.appendChild(announcement);
      
      setTimeout(() => {
        if (document.body.contains(announcement)) {
          document.body.removeChild(announcement);
        }
      }, 1000);
    },

    // Manage focus for dynamic content
    manageFocus: (element) => {
      if (!element) return;
      
      // Make element focusable if it isn't already
      if (!element.hasAttribute('tabindex')) {
        element.setAttribute('tabindex', '-1');
      }
      
      element.focus();
    },

    // Trap focus within a container
    trapFocus: (container) => {
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
    },

    // Update ARIA attributes
    updateAria: (element, attributes) => {
      Object.entries(attributes).forEach(([key, value]) => {
        if (value === null) {
          element.removeAttribute(key);
        } else {
          element.setAttribute(key, value);
        }
      });
    }
  };

  // Enhanced Drink Builder with accessibility
  class AccessibleDrinkBuilder {
    constructor(element) {
      this.element = element;
      this.form = element.querySelector('form[data-product-form]');
      
      if (!this.form) {
        console.warn('AccessibleDrinkBuilder: No form found');
        return;
      }

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
        currentStep: 'base'
      };

      this.init();
    }

    init() {
      this.initElements();
      this.initKeyboardNavigation();
      this.initAriaLiveRegions();
      this.initEventHandlers();
      this.initPresetRecipeHandler();
      
      // Announce builder is ready
      a11y.announce('Drink builder is ready. Use tab to navigate through options.');
    }

    initElements() {
      this.priceEl = this.element.querySelector('#builder-price');
      this.addToCartBtn = this.element.querySelector('[data-add-to-cart]');
      this.variantIdInput = this.element.querySelector('[data-variant-id]');
      this.baseOptions = this.element.querySelectorAll('[name="base_drink"]');
      this.steps = this.element.querySelectorAll('[data-step]');
      
      // Create error container for validation messages
      this.errorContainer = document.createElement('div');
      this.errorContainer.id = 'drink-builder-errors';
      this.errorContainer.setAttribute('aria-live', 'assertive');
      this.errorContainer.setAttribute('aria-atomic', 'true');
      this.errorContainer.className = 'drink-builder__errors';
      this.form.insertBefore(this.errorContainer, this.form.firstChild);
    }

    initAriaLiveRegions() {
      // Create live region for price updates
      this.priceRegion = document.createElement('div');
      this.priceRegion.setAttribute('aria-live', 'polite');
      this.priceRegion.setAttribute('aria-atomic', 'true');
      this.priceRegion.className = 'sr-only';
      this.element.appendChild(this.priceRegion);
    }

    initKeyboardNavigation() {
      // Add keyboard support for custom components
      this.element.addEventListener('keydown', (e) => {
        switch (e.key) {
          case 'Escape':
            this.handleEscape(e);
            break;
          case 'Enter':
            this.handleEnter(e);
            break;
          case 'ArrowUp':
          case 'ArrowDown':
            this.handleArrowKeys(e);
            break;
        }
      });

      // Enhance focus indicators
      this.element.addEventListener('focusin', (e) => {
        if (e.target.matches('.drink-option input[type="radio"]')) {
          e.target.closest('.drink-option').classList.add('focused');
        }
      });

      this.element.addEventListener('focusout', (e) => {
        if (e.target.matches('.drink-option input[type="radio"]')) {
          e.target.closest('.drink-option').classList.remove('focused');
        }
      });
    }

    initEventHandlers() {
      // Base drink selection with accessibility enhancements
      this.baseOptions.forEach((option, index) => {
        option.addEventListener('change', (e) => {
          this.handleBaseChange(e);
          
          // Update ARIA attributes for radio group
          this.baseOptions.forEach((opt, i) => {
            a11y.updateAria(opt, {
              'aria-checked': opt.checked ? 'true' : 'false'
            });
          });
          
          // Announce selection
          const selectedProduct = option.closest('.drink-option');
          const productName = selectedProduct.querySelector('.drink-option__name').textContent;
          const productPrice = selectedProduct.querySelector('.drink-option__price').textContent;
          
          a11y.announce(`Selected ${productName} for ${productPrice}. Price updated.`);
        });

        // Add keyboard support for radio buttons
        option.addEventListener('keydown', (e) => {
          if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
            e.preventDefault();
            const prevIndex = index === 0 ? this.baseOptions.length - 1 : index - 1;
            this.baseOptions[prevIndex].focus();
            this.baseOptions[prevIndex].checked = true;
            this.baseOptions[prevIndex].dispatchEvent(new Event('change'));
          } else if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
            e.preventDefault();
            const nextIndex = index === this.baseOptions.length - 1 ? 0 : index + 1;
            this.baseOptions[nextIndex].focus();
            this.baseOptions[nextIndex].checked = true;
            this.baseOptions[nextIndex].dispatchEvent(new Event('change'));
          }
        });
      });

      // Add to cart with validation
      if (this.addToCartBtn) {
        this.addToCartBtn.addEventListener('click', (e) => {
          e.preventDefault();
          this.handleAddToCart();
        });
      }
    }

    initPresetRecipeHandler() {
      // Listen for preset recipe selections
      document.addEventListener('recipe-selected', (e) => {
        this.applyPresetRecipe(e.detail);
      });
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
        this.clearErrors();
      }
    }

    handleAddToCart() {
      // Validate form
      const errors = this.validateForm();
      
      if (errors.length > 0) {
        this.displayErrors(errors);
        return;
      }

      // Collect form data
      const formData = new FormData(this.form);
      
      // Add custom properties
      const customProperties = this.buildCustomProperties();
      customProperties.forEach((value, key) => {
        formData.append(`properties[${key}]`, value);
      });

      // Submit to cart
      this.submitToCart(formData);
    }

    validateForm() {
      const errors = [];
      
      // Check if base drink is selected
      const baseSelected = Array.from(this.baseOptions).some(option => option.checked);
      if (!baseSelected) {
        errors.push('Please select a base drink');
      }

      return errors;
    }

    displayErrors(errors) {
      this.errorContainer.innerHTML = '';
      
      if (errors.length === 0) return;

      const errorList = document.createElement('ul');
      errorList.className = 'drink-builder__error-list';
      
      errors.forEach(error => {
        const errorItem = document.createElement('li');
        errorItem.textContent = error;
        errorItem.className = 'drink-builder__error-item';
        errorList.appendChild(errorItem);
      });

      this.errorContainer.appendChild(errorList);
      
      // Focus the error container
      a11y.manageFocus(this.errorContainer);
      
      // Announce errors
      const errorMessage = errors.length === 1 
        ? `Error: ${errors[0]}` 
        : `${errors.length} errors found: ${errors.join(', ')}`;
      
      a11y.announce(errorMessage, 'assertive');
    }

    clearErrors() {
      this.errorContainer.innerHTML = '';
    }

    buildCustomProperties() {
      const properties = new Map();
      
      // Add selected flavors
      if (this.state.selectedFlavors.size > 0) {
        const flavors = Array.from(this.state.selectedFlavors.entries())
          .map(([flavor, count]) => `${flavor} (${count} pumps)`)
          .join(', ');
        properties.set('Flavors', flavors);
      }

      // Add other selections
      if (this.state.selectedStrains.size > 0) {
        properties.set('Strains', Array.from(this.state.selectedStrains).join(', '));
      }

      if (this.state.selectedBoosters.size > 0) {
        properties.set('Boosters', Array.from(this.state.selectedBoosters).join(', '));
      }

      if (this.state.selectedSweeteners.size > 0) {
        properties.set('Sweeteners', Array.from(this.state.selectedSweeteners).join(', '));
      }

      if (this.state.selectedCreamers.size > 0) {
        properties.set('Creamers', Array.from(this.state.selectedCreamers).join(', '));
      }

      return properties;
    }

    async submitToCart(formData) {
      try {
        this.addToCartBtn.disabled = true;
        this.addToCartBtn.textContent = 'Adding to Cart...';
        
        const response = await fetch('/cart/add.js', {
          method: 'POST',
          body: formData
        });

        if (response.ok) {
          const result = await response.json();
          a11y.announce('Item added to cart successfully!');
          
          // Dispatch cart update event
          document.dispatchEvent(new CustomEvent('cart:updated', {
            detail: result
          }));
          
        } else {
          throw new Error('Failed to add to cart');
        }
        
      } catch (error) {
        console.error('Cart add error:', error);
        this.displayErrors(['Failed to add item to cart. Please try again.']);
        
      } finally {
        this.addToCartBtn.disabled = false;
        this.addToCartBtn.textContent = 'Add to Cart';
      }
    }

    updatePrice() {
      if (!this.priceEl) return;

      const totalCents = this.calculateTotalPrice();
      const formattedPrice = this.formatMoney(totalCents);
      
      this.priceEl.textContent = formattedPrice;
      
      // Update live region for screen readers
      this.priceRegion.textContent = `Total price: ${formattedPrice}`;
    }

    calculateTotalPrice() {
      let total = this.state.basePriceCents;
      
      // Add flavor costs
      this.state.selectedFlavors.forEach((count, flavor) => {
        total += count * this.state.extraPumpCostCents;
      });

      return total;
    }

    formatMoney(cents) {
      if (window.Shopify && typeof window.Shopify.formatMoney === 'function') {
        const format = window.Shopify.money_format || '${{ amount }}';
        return window.Shopify.formatMoney(cents, format);
      }
      const dollars = Number(cents || 0) / 100;
      return `$${dollars.toFixed(2)}`;
    }

    applyPresetRecipe(recipeData) {
      // Apply preset recipe to the builder
      a11y.announce(`Applying ${recipeData.name} recipe to drink builder`);
      
      // This would integrate with the actual form elements
      // Implementation depends on the specific recipe data structure
      
      this.updatePrice();
    }

    // Keyboard event handlers
    handleEscape(e) {
      // Clear current selection or close modals
      if (e.target.matches('input[type="radio"]:checked')) {
        e.target.checked = false;
        e.target.dispatchEvent(new Event('change'));
      }
    }

    handleEnter(e) {
      // Activate buttons and links
      if (e.target.matches('button:not([disabled])')) {
        e.target.click();
      }
    }

    handleArrowKeys(e) {
      // Handle arrow navigation in option groups
      if (e.target.matches('input[type="radio"]')) {
        // Already handled in individual radio button handlers
        return;
      }
    }
  }

  // Auto-initialize when DOM is ready
  document.addEventListener('DOMContentLoaded', () => {
    const builders = document.querySelectorAll('[data-drink-builder]');
    builders.forEach(builder => {
      new AccessibleDrinkBuilder(builder);
    });
  });

  // Export for global access
  window.WTF = window.WTF || {};
  window.WTF.AccessibleDrinkBuilder = AccessibleDrinkBuilder;
  window.WTF.a11y = a11y;

})();
