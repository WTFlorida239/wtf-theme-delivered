/**
 * WTF Cart API - Unified cart operations (Hardened)
 * Provides consistent cart add/update/remove with proper validation and event dispatching.
 *
 * Usage:
 *   WTFCartAPI.addToCart({ id: variantId, quantity: 1, properties: {...} });
 *   WTFCartAPI.updateCart({ line: 1, quantity: 2 });
 *   WTFCartAPI.removeFromCart(lineIndex);
 */

(function () {
  'use strict';

  const ROOT =
    (window.Shopify && window.Shopify.routes && window.Shopify.routes.root) || '/';

  /**
   * Fetch current cart state
   * @returns {Promise<Object>} Cart object
   */
  async function getCart() {
    const res = await fetch(`${ROOT}cart.js`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      credentials: 'same-origin',
    });
    if (!res.ok) throw new Error('Failed to fetch cart');
    return res.json();
  }

  /**
   * Safe event dispatcher
   */
  function safeDispatch(name, detail) {
    try {
      document.dispatchEvent(new CustomEvent(name, { detail }));
    } catch (e) {
      console.warn('[WTFCartAPI] dispatch failed', name, e);
    }
  }

  /**
   * Dispatch cart update events
   * @param {Object} cart - Cart object from /cart.js
   * @param {Object} item - Optional item that was just added
   */
  function dispatchCartEvents(cart, item) {
    safeDispatch('wtf:cart:update', cart);
    if (item) safeDispatch('wtf:cart:add', { item, cart });

    // legacy compatibility
    safeDispatch('cart:updated', cart);
    if (item) safeDispatch('cart:added', { item, cart });
  }

  /**
   * Add item to cart
   * @param {Object} params - { id, quantity, properties, selling_plan }
   * @returns {Promise<Object>} Added item
   */
  async function addToCart(params) {
    const { id, quantity = 1, properties = {}, selling_plan } = params || {};

    // --- Validation ---
    const vid = Number(id);
    const qty = Number(quantity || 1);
    if (!Number.isInteger(vid) || vid <= 0)
      throw new Error(`Invalid variant id: ${id}`);
    if (!Number.isInteger(qty) || qty <= 0)
      throw new Error(`Invalid quantity: ${quantity}`);

    // --- Build payload ---
    const payload = { id: vid, quantity: qty };
    if (properties && typeof properties === 'object' && Object.keys(properties).length)
      payload.properties = properties;
    if (selling_plan) payload.selling_plan = String(selling_plan);

    // --- Send request ---
    let response;
    try {
      response = await fetch(`${ROOT}cart/add.js`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        credentials: 'same-origin',
        body: JSON.stringify(payload),
      });
    } catch (e) {
      throw new Error('Network error adding to cart: ' + e.message);
    }

    if (!response.ok) {
      let msg = 'Failed to add item to cart';
      try {
        const data = await response.json();
        msg = data?.description || data?.message || msg;
      } catch {}
      throw new Error(msg);
    }

    const item = await response.json();
    const cart = await getCart();
    dispatchCartEvents(cart, item);
    return item;
  }

  /**
   * Update cart line item
   * @param {Object} params - { line, quantity } or { id, quantity }
   * @returns {Promise<Object>} Updated cart
   */
  async function updateCart(params) {
    const res = await fetch(`${ROOT}cart/change.js`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      credentials: 'same-origin',
      body: JSON.stringify(params),
    });
    if (!res.ok) {
      let msg = 'Failed to update cart';
      try {
        const data = await res.json();
        msg = data?.description || data?.message || msg;
      } catch {}
      throw new Error(msg);
    }
    const cart = await res.json();
    dispatchCartEvents(cart);
    return cart;
  }

  /**
   * Remove item from cart
   * @param {number} line - 1-based line index
   */
  async function removeFromCart(line) {
    return updateCart({ line, quantity: 0 });
  }

  /**
   * Clear entire cart
   */
  async function clearCart() {
    const res = await fetch(`${ROOT}cart/clear.js`, {
      method: 'POST',
      headers: { Accept: 'application/json' },
      credentials: 'same-origin',
    });
    if (!res.ok) throw new Error('Failed to clear cart');
    const cart = await getCart();
    dispatchCartEvents(cart);
    return cart;
  }

  /**
   * Update cart attributes
   */
  async function updateCartAttributes(attributes) {
    const res = await fetch(`${ROOT}cart/update.js`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      credentials: 'same-origin',
      body: JSON.stringify({ attributes }),
    });
    if (!res.ok) throw new Error('Failed to update cart attributes');
    const cart = await res.json();
    dispatchCartEvents(cart);
    return cart;
  }

  /**
   * Update cart note
   */
  async function updateCartNote(note) {
    const res = await fetch(`${ROOT}cart/update.js`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      credentials: 'same-origin',
      body: JSON.stringify({ note }),
    });
    if (!res.ok) throw new Error('Failed to update cart note');
    const cart = await res.json();
    dispatchCartEvents(cart);
    return cart;
  }

  // Public API
  window.WTFCartAPI = {
    getCart,
    addToCart,
    updateCart,
    removeFromCart,
    clearCart,
    updateCartAttributes,
    updateCartNote,
  };

  if (typeof module !== 'undefined' && module.exports)
    module.exports = window.WTFCartAPI;

  /* --- DEV VALIDATOR (optional) ---
     Logs cart payloads and highlights invalid ids/quantities.
     Remove or comment out before pushing to production.
  */
  (function validator() {
    const _f = window.fetch;
    window.fetch = async (...args) => {
      const [url, opts] = args;
      const isCart = typeof url === 'string' && url.includes('/cart/');
      if (isCart) {
        const method = (opts?.method || 'GET').toUpperCase();
        let body = {};
        try {
          if (opts?.body) {
            if (
              opts.headers &&
              opts.headers['Content-Type'] === 'application/json'
            ) {
              body = JSON.parse(opts.body);
            } else if (opts.body instanceof FormData) {
              for (const [k, v] of opts.body.entries()) body[k] = v;
            }
          }
        } catch {}
        if (url.includes('/cart/add.js')) {
          const id = Number(body.id);
          const qty = Number(body.quantity);
          const badId = !Number.isInteger(id) || id <= 0;
          const badQty = !Number.isInteger(qty) || qty <= 0;
          console.groupCollapsed(`[WTF-Cart-Add] ${method} ${url}`);
          console.log('Payload:', body);
          if (badId) console.error('❌ Invalid variant id →', body.id);
          if (badQty) console.error('❌ Invalid quantity →', body.quantity);
          console.groupEnd();
        }
      }
      return _f(...args);
    };
    console.info('[WTF-Cart-API] Validator active – check console for payloads.');
  })();
})();
