(() => {
  const moneyFormat = (() => {
    if (window.Shopify && typeof window.Shopify.formatMoney === 'function') {
      const format = window.Shopify.money_format || window.Shopify.currency_format || '${{amount}}';
      return (cents) => window.Shopify.formatMoney(cents, format);
    }
    if (window.WTF && typeof window.WTF.formatMoney === 'function') {
      return (cents) => window.WTF.formatMoney(cents / 100);
    }
    return (cents) => {
      const dollars = Number(cents || 0) / 100;
      return `$${dollars.toFixed(2)}`;
    };
  })();

  const variantStrings = window.variantStrings || {};

  function selectedOptions(container) {
    return Array.from(container.querySelectorAll('fieldset')).map((fieldset) => {
      const checked = fieldset.querySelector('input[type="radio"]:checked');
      return checked ? checked.value : null;
    });
  }

  function findVariant(data, options) {
    if (!Array.isArray(data)) return null;
    return data.find((variant) => variant.options.every((value, index) => value === options[index]));
  }

  function updateHistory(baseUrl, variantId) {
    if (!baseUrl || !variantId || typeof window.history.replaceState !== 'function') return;
    const url = new URL(baseUrl, window.location.origin);
    url.searchParams.set('variant', variantId);
    window.history.replaceState({}, document.title, url.toString());
  }

  function updatePriceDisplay(sectionId, variant) {
    const wrapper = document.getElementById(`price-${sectionId}`);
    if (!wrapper) return;
    const current = wrapper.querySelector('[data-price-current]');
    const compare = wrapper.querySelector('[data-price-compare]');
    if (current) current.textContent = moneyFormat(variant.price);
    if (compare) {
      if (variant.compare_at_price && variant.compare_at_price > variant.price) {
        compare.textContent = moneyFormat(variant.compare_at_price);
        compare.removeAttribute('hidden');
      } else {
        compare.textContent = '';
        compare.setAttribute('hidden', 'hidden');
      }
    }
    wrapper.classList.toggle('price--on-sale', Boolean(variant.compare_at_price && variant.compare_at_price > variant.price));
  }

  function updateAvailability(form, variant) {
    if (!form) return;
    const idInput = form.querySelector('input[name="id"]');
    if (idInput) {
      idInput.value = variant.id;
      idInput.dispatchEvent(new Event('change', { bubbles: true }));
    }
    const addButton = form.querySelector('[name="add"]');
    if (!addButton) return;
    const label = addButton.querySelector('span');
    const enable = Boolean(variant.available);
    addButton.disabled = !enable;
    if (label) {
      label.textContent = enable
        ? variantStrings.addToCart || label.dataset.defaultText || label.textContent
        : variantStrings.soldOut || 'Sold out';
    }
  }

  function handleUnavailable(form) {
    if (!form) return;
    const addButton = form.querySelector('[name="add"]');
    if (addButton) {
      addButton.disabled = true;
      const label = addButton.querySelector('span');
      if (label) {
        label.dataset.defaultText = label.dataset.defaultText || label.textContent;
        label.textContent = variantStrings.unavailable || 'Unavailable';
      }
    }
  }

  function dispatchVariantChange(sectionId, variant) {
    document.dispatchEvent(
      new CustomEvent('wtf:variant:change', {
        detail: { sectionId, variant },
      }),
    );
  }

  if (!customElements.get('variant-radios')) {
    class VariantRadios extends HTMLElement {
      connectedCallback() {
        this.sectionId = this.dataset.section;
        this.baseUrl = this.dataset.url || window.location.pathname;
        this.form = document.getElementById(`ProductForm-${this.sectionId}`);
        this.variantData = this.getVariantData();
        this.inputs = Array.from(this.querySelectorAll('input[type="radio"]'));
        this.inputs.forEach((input) => {
          input.addEventListener('change', () => this.onVariantChange());
        });
        // Capture default text for add to cart button once
        const addButton = this.form?.querySelector('[name="add"] span');
        if (addButton) {
          addButton.dataset.defaultText = addButton.textContent;
        }
        this.onVariantChange();
      }

      getVariantData() {
        const dataScript = this.querySelector('[type="application/json"]');
        if (!dataScript) return [];
        try {
          return JSON.parse(dataScript.textContent || '[]');
        } catch (error) {
          console.error('Failed to parse variant data', error);
          return [];
        }
      }

      onVariantChange() {
        const options = selectedOptions(this);
        if (options.includes(null)) return;
        const variant = findVariant(this.variantData, options);
        if (!variant) {
          handleUnavailable(this.form);
          return;
        }
        updateHistory(this.baseUrl, variant.id);
        updatePriceDisplay(this.sectionId, variant);
        updateAvailability(this.form, variant);
        dispatchVariantChange(this.sectionId, variant);
      }
    }

    customElements.define('variant-radios', VariantRadios);
  }
})();
