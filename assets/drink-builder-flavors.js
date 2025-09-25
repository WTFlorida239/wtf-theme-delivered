/**
 * WTF Drink Builder - Flavors Module
 * Handles flavor selection and pump counting
 */

export default class FlavorModule {
  constructor(drinkBuilder) {
    this.builder = drinkBuilder;
    this.element = drinkBuilder.getElement();
    this.state = drinkBuilder.getState();
    
    this.init();
  }

  init() {
    this.flavorOptions = this.element.querySelectorAll('[data-flavor-option]');
    this.pumpCounters = this.element.querySelectorAll('[data-pump-counter]');
    
    this.initFlavorHandlers();
    this.initPumpCounters();
  }

  initFlavorHandlers() {
    this.flavorOptions.forEach(option => {
      option.addEventListener('change', this.handleFlavorChange.bind(this));
    });
  }

  initPumpCounters() {
    this.pumpCounters.forEach(counter => {
      const plusBtn = counter.querySelector('[data-pump-plus]');
      const minusBtn = counter.querySelector('[data-pump-minus]');
      const input = counter.querySelector('[data-pump-input]');

      if (plusBtn) {
        plusBtn.addEventListener('click', () => this.adjustPumps(counter, 1));
      }
      
      if (minusBtn) {
        minusBtn.addEventListener('click', () => this.adjustPumps(counter, -1));
      }

      if (input) {
        input.addEventListener('change', () => this.handlePumpInputChange(counter));
      }
    });
  }

  handleFlavorChange(event) {
    const checkbox = event.target;
    const flavorName = checkbox.value;
    const counter = checkbox.closest('[data-flavor-item]')?.querySelector('[data-pump-counter]');

    if (checkbox.checked) {
      this.state.selectedFlavors.set(flavorName, 1);
      if (counter) {
        this.showCounter(counter);
        this.updatePumpDisplay(counter, 1);
      }
    } else {
      this.state.selectedFlavors.delete(flavorName);
      if (counter) {
        this.hideCounter(counter);
      }
    }

    this.builder.updatePrice();
  }

  adjustPumps(counter, delta) {
    const input = counter.querySelector('[data-pump-input]');
    const flavorName = counter.dataset.flavorName;
    
    if (!input || !flavorName) return;

    const currentCount = parseInt(input.value) || 0;
    const newCount = Math.max(0, Math.min(12, currentCount + delta)); // Max 12 pumps
    
    this.state.selectedFlavors.set(flavorName, newCount);
    this.updatePumpDisplay(counter, newCount);
    this.builder.updatePrice();
  }

  handlePumpInputChange(counter) {
    const input = counter.querySelector('[data-pump-input]');
    const flavorName = counter.dataset.flavorName;
    
    if (!input || !flavorName) return;

    const count = Math.max(0, Math.min(12, parseInt(input.value) || 0));
    this.state.selectedFlavors.set(flavorName, count);
    this.updatePumpDisplay(counter, count);
    this.builder.updatePrice();
  }

  updatePumpDisplay(counter, count) {
    const input = counter.querySelector('[data-pump-input]');
    const display = counter.querySelector('[data-pump-display]');
    
    if (input) input.value = count;
    if (display) display.textContent = count;

    // Update button states
    const minusBtn = counter.querySelector('[data-pump-minus]');
    const plusBtn = counter.querySelector('[data-pump-plus]');
    
    if (minusBtn) minusBtn.disabled = count <= 0;
    if (plusBtn) plusBtn.disabled = count >= 12;
  }

  showCounter(counter) {
    counter.style.display = 'flex';
    counter.setAttribute('aria-hidden', 'false');
  }

  hideCounter(counter) {
    counter.style.display = 'none';
    counter.setAttribute('aria-hidden', 'true');
  }

  // Public API
  getSelectedFlavors() {
    return new Map(this.state.selectedFlavors);
  }

  setFlavor(flavorName, pumpCount) {
    this.state.selectedFlavors.set(flavorName, pumpCount);
    this.builder.updatePrice();
  }

  removeFlavor(flavorName) {
    this.state.selectedFlavors.delete(flavorName);
    this.builder.updatePrice();
  }
}
