(() => {
  const onReady = (callback) => {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', callback, { once: true });
    } else {
      callback();
    }
  };

  const formatMoney = (cents) => {
    if (window.Shopify && typeof window.Shopify.formatMoney === 'function') {
      const format =
        window.Shopify.money_format ||
        window.Shopify.currency_format ||
        (window.theme && window.theme.moneyFormat) ||
        '${{ amount }}';
      return window.Shopify.formatMoney(cents, format);
    }
    const dollars = Number(cents || 0) / 100;
    return `$${dollars.toFixed(2)}`;
  };

  onReady(() => {
    const builder = document.getElementById('enhanced-drink-builder');
    if (!builder) return;

    const form = builder.querySelector('form[data-product-form]');
    if (!form) return;

    const escapeSelector = (value) => {
      if (window.CSS && typeof window.CSS.escape === 'function') {
        return window.CSS.escape(value);
      }
      return String(value).replace(/"/g, '\\"');
    };

    const state = {
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

    // DOM Elements
    const priceEl = builder.querySelector('#builder-price');
    const variantIdInput = builder.querySelector('#builder-variant-id');
    const sizeRadios = builder.querySelectorAll('input[name="size"]');
    const strainCheckboxes = builder.querySelectorAll('input[name="strain"]');
    const pumpMeta = builder.querySelector('#pump-meta');
    const includedPumps = pumpMeta ? parseInt(pumpMeta.dataset.included, 10) : 0;
    const extraPumpPriceCents = pumpMeta ? parseInt(pumpMeta.dataset.extraPriceCents, 10) : 0;
    const maxFlavors = pumpMeta ? parseInt(pumpMeta.dataset.maxFlavors, 10) : 0;
    const maxFlavorSelections = maxFlavors > 0 ? maxFlavors : Number.POSITIVE_INFINITY;
    const pumpCountSummary = builder.querySelector('#pump-count-summary');
    const gallonNote = builder.querySelector('#gallon-note');
    const flavorsFieldset = builder.querySelector('#flavors-fieldset');
    const thcFieldset = builder.querySelector('#thc-fieldset');
    const thcRadios = builder.querySelectorAll('input[name="thc"]');
    const strainsFieldset = builder.querySelector('#strains-fieldset');

    // Property Inputs
    const propSize = builder.querySelector('#prop-size');
    const propStrain = builder.querySelector('#prop-strain');
    const propFlavors = builder.querySelector('#prop-flavors');
    const propBoosters = builder.querySelector('#prop-boosters');
    const propSweeteners = builder.querySelector('#prop-sweeteners');
    const propCreamers = builder.querySelector('#prop-creamers');
    const propThc = builder.querySelector('#prop-thc');

    const updatePrice = () => {
      state.extraPumpCostCents = 0;
      const totalPumps = Array.from(state.selectedFlavors.values()).reduce(
        (sum, count) => sum + count,
        0,
      );

      if (totalPumps > includedPumps) {
        state.extraPumpCostCents = (totalPumps - includedPumps) * extraPumpPriceCents;
      }

      const totalPriceCents = state.basePriceCents + state.extraPumpCostCents;
      if (priceEl) {
        priceEl.textContent = formatMoney(totalPriceCents);
      }
      if (pumpCountSummary) {
        pumpCountSummary.textContent = `Total pumps: ${totalPumps}`;
      }
    };

    const updateProperties = () => {
      const selectedSizeRadio = builder.querySelector('input[name="size"]:checked');
      if (propSize) {
        propSize.value = selectedSizeRadio ? selectedSizeRadio.value : '';
      }

      const strainsArray = Array.from(state.selectedStrains);
      if (propStrain) {
        if (strainsArray.length === 2) {
          propStrain.value = `½ ${strainsArray[0]} / ½ ${strainsArray[1]}`;
        } else {
          propStrain.value = strainsArray.join(', ');
        }
      }

      const flavorDetails = [];
      state.selectedFlavors.forEach((count, name) => {
        if (count > 0) {
          flavorDetails.push(`${name} (${count} pump${count > 1 ? 's' : ''})`);
        }
      });
      if (propFlavors) {
        propFlavors.value = flavorDetails.join(', ') || 'None';
      }

      if (propThc) {
        propThc.value = state.selectedThc || 'None';
      }

      if (propBoosters) {
        propBoosters.value = Array.from(state.selectedBoosters).join(', ') || 'None';
      }
      if (propSweeteners) {
        propSweeteners.value = Array.from(state.selectedSweeteners).join(', ') || 'None';
      }
      if (propCreamers) {
        propCreamers.value = Array.from(state.selectedCreamers).join(', ') || 'None';
      }
    };

    const handleSizeChange = (event) => {
      const radio = event.target;
      if (!radio || !radio.checked) return;

      if (variantIdInput) {
        variantIdInput.value = radio.dataset.variantId || '';
      }
      const priceCents = parseInt(radio.dataset.priceCents || '0', 10);
      state.basePriceCents = Number.isNaN(priceCents) ? 0 : priceCents;
      state.isGallon = radio.value.toLowerCase().includes('gallon');

      if (gallonNote) {
        gallonNote.hidden = !state.isGallon;
      }
      if (flavorsFieldset) {
        flavorsFieldset.hidden = state.isGallon;
      }
      if (strainsFieldset) {
        strainsFieldset.hidden = state.isGallon;
      }
      if (thcFieldset) {
        thcFieldset.hidden = !state.isGallon;
      }

      if (state.isGallon) {
        state.selectedFlavors.clear();
        state.selectedStrains.clear();
        builder.querySelectorAll('.flavor-chip .pump-count').forEach((el) => {
          el.textContent = '0';
        });
        strainCheckboxes.forEach((cb) => {
          cb.checked = false;
        });
      } else {
        state.selectedThc = null;
        thcRadios.forEach((radioThc) => {
          radioThc.checked = false;
        });
      }

      updatePrice();
      updateProperties();
    };

    const handleStrainChange = (event) => {
      const checkbox = event.target;
      if (!checkbox) return;
      const { value: strain } = checkbox;

      if (checkbox.checked) {
        state.selectedStrains.add(strain);
        if (state.selectedStrains.size > 2) {
          const first = state.selectedStrains.values().next().value;
          state.selectedStrains.delete(first);
          const firstCheckbox = builder.querySelector(
            `input[name="strain"][value="${escapeSelector(first)}"]`,
          );
          if (firstCheckbox) {
            firstCheckbox.checked = false;
          }
        }
      } else {
        state.selectedStrains.delete(strain);
      }
      updateProperties();
    };

    const handleFlavorChange = (event) => {
      const button = event.currentTarget;
      if (!button) return;

      const flavorChip = button.closest('.flavor-chip');
      if (!flavorChip) return;
      const flavorName = flavorChip.dataset.flavorName;
      if (!flavorName) return;
      const countEl = flavorChip.querySelector('.pump-count');
      if (!countEl) return;
      let currentCount = state.selectedFlavors.get(flavorName) || 0;
      const totalFlavors = Array.from(state.selectedFlavors.values()).filter((value) => value > 0).length;

      if (button.dataset.action === 'increment') {
        if (currentCount === 0 && totalFlavors >= maxFlavorSelections) {
          console.warn('Cannot add more flavor varieties for this drink.');
          return;
        }
        currentCount += 1;
      } else if (button.dataset.action === 'decrement') {
        currentCount = Math.max(0, currentCount - 1);
      }

      if (currentCount > 0) {
        state.selectedFlavors.set(flavorName, currentCount);
      } else {
        state.selectedFlavors.delete(flavorName);
      }

      countEl.textContent = String(currentCount);
      updatePrice();
      updateProperties();
    };

    const createModifierHandler = (stateSet) => (event) => {
      const checkbox = event.target;
      if (!checkbox) return;
      if (checkbox.checked) {
        stateSet.add(checkbox.value);
      } else {
        stateSet.delete(checkbox.value);
      }
      updateProperties();
    };

    const initialSizeRadio = builder.querySelector('input[name="size"]:checked');
    if (initialSizeRadio) {
      handleSizeChange({ target: initialSizeRadio });
    } else {
      updatePrice();
      updateProperties();
    }

    sizeRadios.forEach((radio) => radio.addEventListener('change', handleSizeChange));
    strainCheckboxes.forEach((checkbox) => checkbox.addEventListener('change', handleStrainChange));
    builder
      .querySelectorAll('.flavor-chip button[data-action]')
      .forEach((button) => button.addEventListener('click', handleFlavorChange));

    thcRadios.forEach((radio) =>
      radio.addEventListener('change', (event) => {
        state.selectedThc = event.target.value;
        updateProperties();
      }),
    );

    builder
      .querySelectorAll('input[name="booster"], input[name="sweetener"], input[name="creamer"]')
      .forEach((input) => {
        let stateSet = state.selectedBoosters;
        if (input.name === 'sweetener') {
          stateSet = state.selectedSweeteners;
        } else if (input.name === 'creamer') {
          stateSet = state.selectedCreamers;
        }
        input.addEventListener('change', createModifierHandler(stateSet));
      });

    form.addEventListener('submit', (event) => {
      updateProperties();

      if (state.isGallon && thcFieldset && !state.selectedThc) {
        event.preventDefault();
        const errorDiv = form.querySelector('[data-product-form-error]');
        const errorMessage = errorDiv ? errorDiv.querySelector('.error-message') : null;
        if (errorDiv && errorMessage) {
          errorMessage.textContent = 'Please select a THC concentration for the Gallon size.';
          errorDiv.hidden = false;
          if (typeof errorDiv.scrollIntoView === 'function') {
            errorDiv.scrollIntoView({ behavior: 'smooth' });
          }
        }
      }
    });
  });
})();
