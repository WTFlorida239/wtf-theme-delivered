/**
 * WTF Product Form - Adapted from Dawn
 * Handles AJAX add-to-cart with wtf:cart:update event dispatching
 */

if (!customElements.get('wtf-product-form')) {
  customElements.define(
    'wtf-product-form',
    class WTFProductForm extends HTMLElement {
      constructor() {
        super();

        this.form = this.querySelector('form');
        if (!this.form) return;
        
        this.variantIdInput.disabled = false;
        this.form.addEventListener('submit', this.onSubmitHandler.bind(this));
        this.submitButton = this.querySelector('[type="submit"]');
        this.submitButtonText = this.submitButton?.querySelector('span') || this.submitButton;

        this.hideErrors = this.dataset.hideErrors === 'true';
      }

      onSubmitHandler(evt) {
        evt.preventDefault();
        if (this.submitButton.getAttribute('aria-disabled') === 'true') return;

        this.handleErrorMessage();

        this.submitButton.setAttribute('aria-disabled', true);
        this.submitButton.classList.add('loading');
        
        const spinner = this.querySelector('.loading__spinner');
        if (spinner) spinner.classList.remove('hidden');

        const formData = new FormData(this.form);
        const payload = { quantity: 1, properties: {} };

        formData.forEach((value, key) => {
          if (key === 'id') {
            payload.id = value;
          } else if (key === 'quantity') {
            const parsed = parseInt(value || '1', 10);
            payload.quantity = Number.isInteger(parsed) && parsed > 0 ? parsed : 1;
          } else if (key.startsWith('properties[') && key.endsWith(']')) {
            const propKey = key.slice('properties['.length, -1);
            if (propKey) payload.properties[propKey] = value;
          }
        });

        window.WTFCartAPI.addToCart(payload)
          .then(() => window.WTFCartAPI.getCart())
          .then((cartData) => {
            this.updateCartCount(cartData.item_count);
            this.showSuccessMessage();
            this.error = false;
          })
          .catch((e) => {
            console.error('[WTF Product Form] Error:', e);
            this.handleErrorMessage(e?.message || 'Unable to add to cart. Please try again.');
            this.error = true;
          })
          .finally(() => {
            this.submitButton.classList.remove('loading');
            if (!this.error) this.submitButton.removeAttribute('aria-disabled');

            const spinner = this.querySelector('.loading__spinner');
            if (spinner) spinner.classList.add('hidden');
          });
      }

      updateCartCount(count) {
        const cartCountElements = document.querySelectorAll('[data-cart-count]');
        cartCountElements.forEach(el => {
          el.textContent = count;
          el.setAttribute('data-cart-count', count);
        });
      }

      showSuccessMessage() {
        // Try to open cart drawer if it exists
        const cartDrawer = document.querySelector('cart-drawer');
        if (cartDrawer && typeof cartDrawer.open === 'function') {
          cartDrawer.open();
          return;
        }

        // Fallback: show simple success message
        const successMsg = this.querySelector('.product-form__success-message');
        if (successMsg) {
          successMsg.classList.remove('hidden');
          setTimeout(() => {
            successMsg.classList.add('hidden');
          }, 3000);
        }
      }

      handleErrorMessage(errorMessage = false) {
        if (this.hideErrors) return;

        this.errorMessageWrapper =
          this.errorMessageWrapper || this.querySelector('.product-form__error-message-wrapper');
        if (!this.errorMessageWrapper) return;
        
        this.errorMessage = this.errorMessage || this.errorMessageWrapper.querySelector('.product-form__error-message');

        this.errorMessageWrapper.toggleAttribute('hidden', !errorMessage);

        if (errorMessage) {
          this.errorMessage.textContent = errorMessage;
        }
      }

      get variantIdInput() {
        return this.form.querySelector('[name=id]');
      }
    }
  );
}

