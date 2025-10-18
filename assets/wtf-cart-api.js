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
  const JSON_HEADERS = {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  };

  function toPositiveInteger(value, { allowZero = false, label = 'value' } = {}) {
    const num = Number(value);
    if (!Number.isInteger(num) || (!allowZero && num <= 0) || (allowZero && num < 0)) {
      throw new Error(`Invalid ${label}`);
    }
    return num;
  }

  function normalizeProperties(properties) {
    if (!properties) return undefined;
    const normalized = {};
    Object.keys(properties).forEach((key) => {
      const value = properties[key];
      if (value === null || value === undefined || value === '') return;
      normalized[key] = String(value);
    });
    return Object.keys(normalized).length ? normalized : undefined;
  }

  function safeDispatch(name, detail) {
    try {
      document.dispatchEvent(new CustomEvent(name, { detail }));
    } catch (error) {
      if (window.WTFConfig && window.WTFConfig.get && window.WTFConfig.get('development.enableConsoleLogging')) {
        console.warn(`[WTFCartAPI] Failed to dispatch ${name}:`, error);
      }
    }
  }

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
    if (cart) {
      safeDispatch('wtf:cart:update', cart);
      safeDispatch('cart:updated', cart);
    }
    if (item) {
      safeDispatch('wtf:cart:add', { item, cart });
      safeDispatch('cart:added', { item, cart });
    }
  }

  /**
   * Add item to cart
   * @param {Object} params - { id: variantId, quantity: 1, properties: {...}, selling_plan: ... }
   * @returns {Promise<Object>} Added item object
   */
  async function addToCart(params) {
    const { id, quantity = 1, properties, selling_plan } = params || {};
    const vid = toPositiveInteger(id, { label: 'variant id' });
    const qty = toPositiveInteger(quantity || 1, { label: 'quantity' });
    const normalizedProps = normalizeProperties(properties);

    const payload = {
      id: vid,
      quantity: qty
    };

    if (normalizedProps) {
      payload.properties = normalizedProps;
    }

    if (selling_plan) {
      payload.selling_plan = String(selling_plan);
    }

    let response;

    try {
      response = await fetch(ROOT + 'cart/add.js', {
        method: 'POST',
        headers: JSON_HEADERS,
        credentials: 'same-origin',
        body: JSON.stringify(payload)
      });
    } catch (networkError) {
      throw new Error(networkError?.message || 'Network error while adding to cart');
    }

    if (!response.ok) {
      let err = 'Failed to add item to cart';
      try {
        const data = await response.json();
        err = data?.description || data?.message || err;
      } catch (parseError) {
        // ignore JSON parse errors for HTML/text responses
      }
      throw new Error(err);
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
    const payload = {};

    if (params == null || typeof params !== 'object') {
      throw new Error('Invalid cart update payload');
    }

    if (Object.prototype.hasOwnProperty.call(params, 'line')) {
      payload.line = toPositiveInteger(params.line, { label: 'cart line', allowZero: false });
    }

    if (Object.prototype.hasOwnProperty.call(params, 'id')) {
      payload.id = toPositiveInteger(params.id, { label: 'variant id' });
    }

    if (Object.prototype.hasOwnProperty.call(params, 'quantity')) {
      payload.quantity = toPositiveInteger(params.quantity, { label: 'quantity', allowZero: true });
    }

    if (!('line' in payload) && !('id' in payload)) {
      throw new Error('Cart update requires a line or variant id');
    }

    let response;

    try {
      response = await fetch(ROOT + 'cart/change.js', {
        method: 'POST',
        headers: JSON_HEADERS,
        credentials: 'same-origin',
        body: JSON.stringify(payload)
      });
    } catch (networkError) {
      throw new Error(networkError?.message || 'Network error while updating cart');
    }

    if (!response.ok) {
      let err = 'Failed to update cart';
      try {
        const data = await response.json();
        err = data?.description || data?.message || err;
      } catch {}
      throw new Error(err);
    }

    const cart = await response.json();

    // Dispatch events
    dispatchCartEvents(cart);

    return cart;
  }

  /**
   * Remove item from cart
   * @param {number|string|Object} target - Line index, cart key, variant id, or cart item descriptor
   * @returns {Promise<Object>} Updated cart object
   */
  async function removeFromCart(target) {
    if (target == null) {
      throw new Error('Cart removal target required');
    }

    const descriptor = {
      line: null,
      variantId: null,
      key: null
    };

    function applyCandidate(candidate) {
      if (!candidate || typeof candidate !== 'object') {
        return;
      }

      if (descriptor.line == null && Object.prototype.hasOwnProperty.call(candidate, 'line')) {
        try {
          descriptor.line = toPositiveInteger(candidate.line, { label: 'cart line' });
        } catch (error) {
          descriptor.line = null;
        }
      }

      if (descriptor.variantId == null) {
        const maybeVariant =
          candidate.id ??
          candidate.variantId ??
          candidate.variant_id;

        if (maybeVariant != null) {
          try {
            descriptor.variantId = toPositiveInteger(maybeVariant, { label: 'variant id' });
          } catch (error) {
            descriptor.variantId = null;
          }
        }
      }

      if (!descriptor.key && candidate.key) {
        const keyString = String(candidate.key).trim();
        if (keyString) {
          descriptor.key = keyString;
        }
      }
    }

    const isNumericString = (value) => {
      if (typeof value !== 'string') return false;
      const trimmed = value.trim();
      if (trimmed === '') return false;
      const num = Number(trimmed);
      return Number.isInteger(num);
    };

    if (typeof target === 'number') {
      descriptor.line = toPositiveInteger(target, { label: 'cart line' });
    } else if (typeof target === 'string') {
      const trimmed = target.trim();
      if (trimmed === '') {
        throw new Error('Invalid cart removal target');
      }

      if (isNumericString(trimmed)) {
        try {
          descriptor.line = toPositiveInteger(trimmed, { label: 'cart line' });
        } catch (error) {
          descriptor.key = trimmed;
        }
      } else {
        descriptor.key = trimmed;
      }
    } else if (typeof target === 'object') {
      applyCandidate(target);
      if (target.item) {
        applyCandidate(target.item);
      }
    } else {
      throw new Error('Invalid cart removal target');
    }

    if (descriptor.variantId != null) {
      return updateCart({ id: descriptor.variantId, quantity: 0 });
    }

    if (descriptor.line != null) {
      return updateCart({ line: descriptor.line, quantity: 0 });
    }

    if (descriptor.key) {
      const cart = await getCart();
      const index = cart.items.findIndex((item) => item && item.key === descriptor.key);

      if (index !== -1) {
        const item = cart.items[index];
        if (item?.variant_id) {
          try {
            const variantId = toPositiveInteger(item.variant_id, { label: 'variant id' });
            return updateCart({ id: variantId, quantity: 0 });
          } catch (error) {
            // fall through to line-based removal
          }
        }

        return updateCart({ line: index + 1, quantity: 0 });
      }

      throw new Error('Unable to locate cart item for removal');
    }

    throw new Error('Unable to resolve cart removal target');
  }

  /**
   * Clear entire cart
   * @returns {Promise<Object>} Empty cart object
   */
  async function clearCart() {
    let response;

    try {
      response = await fetch(ROOT + 'cart/clear.js', {
        method: 'POST',
        headers: { 'Accept': 'application/json' },
        credentials: 'same-origin'
      });
    } catch (networkError) {
      throw new Error(networkError?.message || 'Network error while clearing cart');
    }

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
      headers: JSON_HEADERS,
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
      headers: JSON_HEADERS,
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

