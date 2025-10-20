/**
 * WTF Product Form - Refactored
 * Handles AJAX add-to-cart using the authoritative WTFCartAPI.
 */

if (!customElements.get('wtf-product-form')) {
  customElements.define(
    'wtf-product-form',
    class WTFProductForm extends HTMLElement {
      constructor() {
        super();

        this.form = this.querySelector('form');
        if (!this.form) return;

        this.form.addEventListener('submit', this.onSubmitHandler.bind(this));
        this.submitButton = this.querySelector('[type="submit"]');
      }

      async onSubmitHandler(evt) {
        evt.preventDefault();
        if (this.submitButton.getAttribute('aria-disabled') === 'true') return;

        this.submitButton.setAttribute('aria-disabled', true);
        this.submitButton.classList.add('loading');

        const formData = new FormData(this.form);
        const params = {
          id: formData.get('id'),
          quantity: formData.get('quantity'),
          properties: {},
        };

        for (const [key, value] of formData.entries()) {
          if (key.startsWith('properties[')) {
            const propName = key.match(/properties\[(.*?)\]/)[1];
            params.properties[propName] = value;
          }
        }

        try {
          await window.WTFCartAPI.addToCart(params);
          // The 'wtf:cart:add' and 'wtf:cart:update' events will be dispatched by the API.
          // wtf-cart-ui.js will handle the UI updates.
        } catch (error) {
          console.error('[WTF Product Form] Error:', error);
          // You can add more sophisticated error handling here if needed.
        } finally {
          this.submitButton.classList.remove('loading');
          this.submitButton.removeAttribute('aria-disabled');
        }
      }
    }
  );
}
