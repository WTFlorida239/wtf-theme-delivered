/**
 * DEPRECATED – superseded by wtf-cart-api.js and wtf-cart-ui.js.
 * This file is no longer included in theme.liquid and will be removed in a future release.
 */

/**
 * WTF Cart - Adapted from Dawn
 * Simplified cart management with wtf:cart:update event dispatching
 */

class CartRemoveButton extends HTMLElement {
  constructor() {
    super();

    this.addEventListener('click', (event) => {
      event.preventDefault();
      const cartItems = this.closest('cart-items') || this.closest('cart-drawer-items');
      if (cartItems) {
        cartItems.updateQuantity(this.dataset.index, 0, event);
      }
    });
  }
}

customElements.define('cart-remove-button', CartRemoveButton);

class CartItems extends HTMLElement {
  constructor() {
    super();
    
    const debouncedOnChange = debounce((event) => {
      this.onChange(event);
    }, 300);

    this.addEventListener('change', debouncedOnChange.bind(this));
  }

  cartUpdateUnsubscriber = undefined;

  connectedCallback() {
    if (typeof subscribe !== 'undefined') {
      this.cartUpdateUnsubscriber = subscribe(PUB_SUB_EVENTS.cartUpdate, (event) => {
        if (event.source === 'cart-items') {
          return;
        }
        return this.onCartUpdate();
      });
    }
  }

  disconnectedCallback() {
    if (this.cartUpdateUnsubscriber) {
      this.cartUpdateUnsubscriber();
    }
  }

  onChange(event) {
    const inputValue = parseInt(event.target.value);
    const index = event.target.dataset.index;
    
    if (inputValue >= 0) {
      this.updateQuantity(index, inputValue, event);
    }
  }

  onCartUpdate() {
    // Refresh cart display
    fetch(`${window.routes?.cart_url || '/cart'}?section_id=cart-items`)
      .then((response) => response.text())
      .then((responseText) => {
        const html = new DOMParser().parseFromString(responseText, 'text/html');
        const sourceQty = html.querySelector('cart-items');
        if (sourceQty) {
          this.innerHTML = sourceQty.innerHTML;
        }
      })
      .catch((e) => {
        console.error('[WTF Cart] Update error:', e);
      });
  }

  updateQuantity(line, quantity, event) {
    this.enableLoading(line);

    const body = JSON.stringify({
      line,
      quantity,
      sections_url: window.location.pathname,
    });

    fetch(`${window.routes?.cart_change_url || '/cart/change.js'}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body
    })
      .then((response) => response.json())
      .then((cartData) => {
        // Dispatch wtf:cart:update event
        document.dispatchEvent(new CustomEvent('wtf:cart:update', {
          detail: cartData
        }));

        // Update cart count
        this.updateCartCount(cartData.item_count);

        // Refresh cart display
        this.onCartUpdate();
      })
      .catch((error) => {
        console.error('[WTF Cart] Quantity update error:', error);
        const errors = document.getElementById('cart-errors') || document.getElementById('CartDrawer-CartErrors');
        if (errors) {
          errors.textContent = 'Unable to update cart. Please try again.';
        }
      })
      .finally(() => {
        this.disableLoading(line);
      });
  }

  updateCartCount(count) {
    const cartCountElements = document.querySelectorAll('[data-cart-count]');
    cartCountElements.forEach(el => {
      el.textContent = count;
      el.setAttribute('data-cart-count', count);
    });
  }

  enableLoading(line) {
    const lineItem = document.getElementById(`CartItem-${line}`) || 
                     document.getElementById(`CartDrawer-Item-${line}`);
    if (lineItem) {
      lineItem.classList.add('cart-item--loading');
    }
  }

  disableLoading(line) {
    const lineItem = document.getElementById(`CartItem-${line}`) || 
                     document.getElementById(`CartDrawer-Item-${line}`);
    if (lineItem) {
      lineItem.classList.remove('cart-item--loading');
    }
  }
}

customElements.define('cart-items', CartItems);

// Cart drawer component
class CartDrawer extends HTMLElement {
  constructor() {
    super();

    this.addEventListener('keyup', (evt) => evt.code === 'Escape' && this.close());
    this.querySelector('#CartDrawer-Overlay')?.addEventListener('click', this.close.bind(this));
    this.setHeaderCartIconAccessibility();
  }

  setHeaderCartIconAccessibility() {
    const cartLink = document.querySelector('#cart-icon-bubble');
    if (cartLink) {
      cartLink.setAttribute('role', 'button');
      cartLink.setAttribute('aria-haspopup', 'dialog');
      cartLink.addEventListener('click', (event) => {
        event.preventDefault();
        this.open(cartLink);
      });
      cartLink.addEventListener('keydown', (event) => {
        if (event.code.toUpperCase() === 'SPACE') {
          event.preventDefault();
          this.open(cartLink);
        }
      });
    }
  }

  open(triggeredBy) {
    if (triggeredBy) this.setActiveElement(triggeredBy);
    
    // Fetch latest cart data
    fetch('/cart.js', {
      headers: { 'Accept': 'application/json' }
    })
      .then(r => r.json())
      .then(cartData => {
        document.dispatchEvent(new CustomEvent('wtf:cart:update', {
          detail: cartData
        }));
      });

    this.classList.add('active');
    this.classList.add('animate');

    this.addEventListener(
      'transitionend',
      () => {
        const containerToTrapFocusOn = this.classList.contains('is-empty')
          ? this.querySelector('.drawer__inner-empty')
          : document.getElementById('CartDrawer');
        const focusElement = this.querySelector('.drawer__inner') || this.querySelector('.drawer__close');
        if (typeof trapFocus !== 'undefined') {
          trapFocus(containerToTrapFocusOn, focusElement);
        }
      },
      { once: true }
    );

    document.body.classList.add('overflow-hidden');
  }

  close() {
    this.classList.remove('active');
    if (typeof removeTrapFocus !== 'undefined') {
      removeTrapFocus(this.activeElement);
    }
    this.classList.remove('animate');
    document.body.classList.remove('overflow-hidden');
  }

  renderContents(parsedState) {
    this.querySelector('.drawer__inner').classList.contains('is-empty') &&
      this.querySelector('.drawer__inner').classList.remove('is-empty');
    this.productId = parsedState.id;
    this.getSectionsToRender().forEach((section) => {
      const sectionElement = section.selector
        ? document.querySelector(section.selector)
        : document.getElementById(section.id);
      if (sectionElement) {
        sectionElement.innerHTML = this.getSectionInnerHTML(parsedState.sections[section.id], section.selector);
      }
    });

    setTimeout(() => {
      this.querySelector('#CartDrawer-Overlay').addEventListener('click', this.close.bind(this));
      this.open();
    });
  }

  getSectionInnerHTML(html, selector = '.shopify-section') {
    return new DOMParser().parseFromString(html, 'text/html').querySelector(selector).innerHTML;
  }

  getSectionsToRender() {
    return [
      {
        id: 'cart-drawer',
        selector: '#CartDrawer',
      },
      {
        id: 'cart-icon-bubble',
      },
    ];
  }

  getSectionDOM(html, selector = '.shopify-section') {
    return new DOMParser().parseFromString(html, 'text/html').querySelector(selector);
  }

  setActiveElement(element) {
    this.activeElement = element;
  }
}

customElements.define('cart-drawer', CartDrawer);
