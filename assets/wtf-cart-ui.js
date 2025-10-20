/* assets/wtf-cart-ui.js
   Binds header/cart badges to the authoritative cart state.
   - Works with WTFCartAPI events from your current API file:
       • 'wtf:cart:update' (detail: cart or {cart})
       • 'wtf:cart:add'    (detail: { item, cart })
       • legacy: 'cart:updated' (detail: cart or {cart})
   - Hydrates on load: uses server-rendered Liquid value first, then Ajax read.
   - Resilient to header re-renders: re-applies the last known count.
*/
(function () {
  'use strict';

  // ---------- Config ----------
  var COUNT_SELECTOR = '[data-cart-count]';
  var LABEL_SELECTOR = '[data-cart-label]';
  var ROOT = (window.Shopify && window.Shopify.routes && window.Shopify.routes.root) || '/';

  // ---------- State ----------
  var lastCount = 0;

  // ---------- DOM helpers ----------
  function q(sel) { return document.querySelector(sel); }

  function getBubble() { return q(COUNT_SELECTOR); }
  function getLabel()  { return q(LABEL_SELECTOR); }

  function setAria(count) {
    var bubble = getBubble();
    if (!bubble) return;
    // Keep it accessible
    bubble.setAttribute('aria-live', 'polite');
    bubble.setAttribute('aria-atomic', 'true');
    bubble.setAttribute('role', 'status');
  }

  function renderCount(n) {
    n = Number.isFinite(n) ? n : 0;
    lastCount = n;

    var bubble = getBubble();
    var label  = getLabel();

    if (bubble) {
      bubble.textContent = String(n);
      // If your theme hides the badge at 0, keep this behavior
      if ('hidden' in bubble) bubble.hidden = n === 0;
      bubble.title = n === 1 ? '1 item in cart' : (n + ' items in cart');
    }

    if (label) {
      label.textContent = 'Cart: ' + n + ' item' + (n === 1 ? '' : 's');
    }

    document.documentElement.classList.toggle('has-cart-items', n > 0);
  }

  // Re-apply count if the header/badge gets re-rendered by Shopify sections
  function observeHeaderMounts() {
    var obs = new MutationObserver(function (muts) {
      for (var i = 0; i < muts.length; i++) {
        var m = muts[i];
        if (m.type === 'childList' && (m.addedNodes && m.addedNodes.length)) {
          // If a new badge/label appears, refresh its value
          if (getBubble() || getLabel()) {
            setAria(lastCount);
            renderCount(lastCount);
          }
        }
      }
    });
    try {
      obs.observe(document.documentElement, { childList: true, subtree: true });
    } catch {}
  }

  // ---------- Cart sources ----------
  function countFromEventDetail(detail) {
    if (!detail) return 0;
    // Accept either a raw cart or {cart}
    var cart = detail.cart || detail;
    return Number(cart && cart.item_count || 0);
  }

  async function hydrateFromAjax() {
    // Prefer your WTFCartAPI if present, otherwise do a direct fetch
    try {
      if (window.WTFCartAPI && typeof window.WTFCartAPI.getCart === 'function') {
        var cart = await window.WTFCartAPI.getCart();
        renderCount(Number(cart && cart.item_count || 0));
        return;
      }
    } catch {}
    // Fallback direct read (no-store + cache buster)
    try {
      var res = await fetch(ROOT + 'cart.js?ts=' + Date.now(), { cache: 'no-store', credentials: 'same-origin' });
      if (res.ok) {
        var c = await res.json();
        renderCount(Number(c && c.item_count || 0));
      }
    } catch {}
  }

  // ---------- Event wiring ----------
  function wireEvents() {
    // Primary: your hardened API
    document.addEventListener('wtf:cart:update', function (e) {
      renderCount(countFromEventDetail(e.detail));
    });

    document.addEventListener('wtf:cart:add', function (e) {
      var c = e && e.detail && e.detail.cart;
      renderCount(Number(c && c.item_count || 0));
    });

    // Legacy compatibility (some scripts may dispatch this)
    document.addEventListener('cart:updated', function (e) {
      renderCount(countFromEventDetail(e.detail));
    });

    // Optional: if other parts of the app fire this generic signal
    document.addEventListener('wtf:cart:changed', function (e) {
      var cart = e && e.detail && e.detail.cart;
      if (cart) renderCount(Number(cart.item_count || 0));
    });
  }

  // ---------- Boot ----------
  window.addEventListener('DOMContentLoaded', function () {
    // 1) Use the server-rendered value immediately (avoids visible “pop”)
    var bubble = getBubble();
    var serverCount = 0;
    if (bubble && bubble.textContent) {
      var n = parseInt(String(bubble.textContent).trim(), 10);
      if (Number.isFinite(n)) serverCount = n;
    }
    setAria(serverCount);
    renderCount(serverCount);

    // 2) Hydrate from authoritative Ajax
    hydrateFromAjax();

    // 3) Wire event listeners
    wireEvents();

    // 4) Keep badge in sync if header is re-rendered
    observeHeaderMounts();
  });

  // Optional: expose a tiny helper for debugging
  window.WTFCartUI = {
    refresh: hydrateFromAjax,
    set: renderCount
  };
})();
