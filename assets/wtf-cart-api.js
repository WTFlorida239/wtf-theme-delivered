/**
 * WTF Cart API - Unified cart operations
 * Provides consistent cart add/update/remove with proper event dispatching
 * 
 * Usage:
 *   import { addToCart, updateCart, removeFromCart } from 'wtf-cart-api.js';
 *   
 *   // Add item
 *   await addToCart({ id: variantId, quantity: 1, properties: {...} });
 *   
 *   // Update quantity
 *   await updateCart({ line: 1, quantity: 2 });
 *   
 *   // Remove item
 *   await removeFromCart(lineIndex);
 */

(function() {
  'use strict';

  const ROOT = (window.Shopify && window.Shopify.routes && window.Shopify.routes.root) || '/';

  /**
   * Fetch current cart state
   * @returns {Promise<Object>} Cart object
   */
  async function getCart() {
    const response = await fetch(ROOT + 'cart.js', {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      },
      credentials: 'same-origin'
    });

    if (!response.ok) {
      throw new Error('Failed to fetch cart');
    }

    return response.json();
  }

  /**
   * Dispatch cart update events
   * @param {Object} cart - Cart object from /cart.js
   * @param {Object} item - Optional item that was just added
   */
  function dispatchCartEvents(cart, item) {
    // Dispatch wtf:cart:update event
    document.dispatchEvent(new CustomEvent('wtf:cart:update', {
      detail: cart
    }));

    // If item was added, dispatch wtf:cart:add event
    if (item) {
      document.dispatchEvent(new CustomEvent('wtf:cart:add', {
        detail: { item: item, cart: cart }
      }));
    }

    // Legacy events for backwards compatibility
    document.dispatchEvent(new CustomEvent('cart:updated', {
      detail: cart
    }));

    if (item) {
      document.dispatchEvent(new CustomEvent('cart:added', {
        detail: { item: item, cart: cart }
      }));
    }
  }

  /**
   * Add item to cart
   * @param {Object} params - { id: variantId, quantity: 1, properties: {...}, selling_plan: ... }
   * @returns {Promise<Object>} Added item object
   */
  async function addToCart(params) {
    const { id, quantity = 1, properties = {}, selling_plan } = params;

    if (!id) {
      throw new Error('Variant ID is required');
    }

    // Build request body
    const body = new FormData();
    body.set('id', String(id));
    body.set('quantity', String(quantity));

    // Add properties
    for (const key in properties) {
      if (properties[key] !== null && properties[key] !== undefined && properties[key] !== '') {
        body.set(`properties[${key}]`, String(properties[key]));
      }
    }

    // Add selling plan if present
    if (selling_plan) {
      body.set('selling_plan', String(selling_plan));
    }

    // Add to cart
    const response = await fetch(ROOT + 'cart/add.js', {
      method: 'POST',
      headers: {
        'Accept': 'application/json'
      },
      credentials: 'same-origin',
      body: body
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.description || errorData.message || 'Failed to add item to cart';
      throw new Error(errorMessage);
    }

    const item = await response.json();

    // Fetch full cart state
    const cart = await getCart();

    // Dispatch events
    dispatchCartEvents(cart, item);

    return item;
  }

  /**
   * Update cart line item
   * @param {Object} params - { line: 1, quantity: 2 } or { id: variantId, quantity: 2 }
   * @returns {Promise<Object>} Updated cart object
   */
  async function updateCart(params) {
    const response = await fetch(ROOT + 'cart/change.js', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      credentials: 'same-origin',
      body: JSON.stringify(params)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.description || errorData.message || 'Failed to update cart';
      throw new Error(errorMessage);
    }

    const cart = await response.json();

    // Dispatch events
    dispatchCartEvents(cart);

    return cart;
  }

  /**
   * Remove item from cart
   * @param {number} line - Line index (1-based)
   * @returns {Promise<Object>} Updated cart object
   */
  async function removeFromCart(line) {
    return updateCart({ line: line, quantity: 0 });
  }

  /**
   * Clear entire cart
   * @returns {Promise<Object>} Empty cart object
   */
  async function clearCart() {
    const response = await fetch(ROOT + 'cart/clear.js', {
      method: 'POST',
      headers: {
        'Accept': 'application/json'
      },
      credentials: 'same-origin'
    });

    if (!response.ok) {
      throw new Error('Failed to clear cart');
    }

    const cart = await getCart();

    // Dispatch events
    dispatchCartEvents(cart);

    return cart;
  }

  /**
   * Update cart attributes
   * @param {Object} attributes - Cart attributes object
   * @returns {Promise<Object>} Updated cart object
   */
  async function updateCartAttributes(attributes) {
    const response = await fetch(ROOT + 'cart/update.js', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      credentials: 'same-origin',
      body: JSON.stringify({ attributes: attributes })
    });

    if (!response.ok) {
      throw new Error('Failed to update cart attributes');
    }

    const cart = await response.json();

    // Dispatch events
    dispatchCartEvents(cart);

    return cart;
  }

  /**
   * Update cart note
   * @param {string} note - Cart note
   * @returns {Promise<Object>} Updated cart object
   */
  async function updateCartNote(note) {
    const response = await fetch(ROOT + 'cart/update.js', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      credentials: 'same-origin',
      body: JSON.stringify({ note: note })
    });

    if (!response.ok) {
      throw new Error('Failed to update cart note');
    }

    const cart = await response.json();

    // Dispatch events
    dispatchCartEvents(cart);

    return cart;
  }

  // Expose API
  window.WTFCartAPI = {
    getCart,
    addToCart,
    updateCart,
    removeFromCart,
    clearCart,
    updateCartAttributes,
    updateCartNote
  };

  // Also expose as module for ES6 imports (if supported)
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = window.WTFCartAPI;
  }
})();

