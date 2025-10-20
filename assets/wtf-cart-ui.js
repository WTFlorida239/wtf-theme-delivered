/* WTF Cart UI – tiny controller for quantity & remove
   - Uses /cart/change.js with line (preferred) or item key fallback
   - Dispatches window 'cart:updated' on success
   - Robust against duplicate variants with different properties
*/
(() => {
  const root = (window.Shopify && window.Shopify.routes && window.Shopify.routes.root) || '/';

  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

  function moneyFromCents(cents) {
    return (cents / 100).toFixed(2);
  }

  async function changeLine({ line, quantity, key }) {
    const form = new FormData();
    if (Number.isFinite(line)) {
      form.append('line', String(line)); // 1-based index
    } else if (key) {
      form.append('id', key); // line item key fallback
    } else {
      throw new Error('Missing line/key for cart change');
    }
    form.append('quantity', String(quantity));

    const res = await fetch(root + 'cart/change.js', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Accept': 'application/json' },
      body: form
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  }

  function syncDom(cart) {
    // Title count
    const title = $('.cart-title');
    if (title) {
      title.textContent = `Your Cart (${cart.item_count} ${cart.item_count === 1 ? 'item' : 'items'})`;
    }

    // Subtotal
    const subtotalEl = $('[data-cart-subtotal]');
    if (subtotalEl) subtotalEl.textContent = `$${moneyFromCents(cart.total_price)}`;

    // Each item
    const domItems = $$('.cart-item');
    domItems.forEach((el) => {
      const key = el.dataset.key;
      const server = cart.items.find((i) => i.key === key);
      if (!server) {
        el.remove();
        return;
      }
      const qtyInput = el.querySelector('.qty-input');
      if (qtyInput && Number(qtyInput.value) !== server.quantity) {
        qtyInput.value = server.quantity;
      }
      const priceEl = el.querySelector('.cart-item__price--final');
      if (priceEl) priceEl.textContent = `$${moneyFromCents(server.final_line_price)}`;
    });

    if (cart.item_count === 0) {
      // Reload to render the empty state cleanly
      window.location.reload();
    }
  }

  // Event delegation for buttons
  document.addEventListener('click', async (e) => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;

    const action = btn.dataset.action;
    const line = Number(btn.dataset.line);
    const key = btn.dataset.key;

    // Resolve input for this line
    const itemEl = btn.closest('.cart-item');
    const input = itemEl ? itemEl.querySelector('.qty-input') : null;
    let qty = input ? Number(input.value) || 1 : 1;

    try {
      if (action === 'increase') {
        qty = Math.min(99, qty + 1);
        if (input) input.value = qty;
        const cart = await changeLine({ line, quantity: qty, key });
        syncDom(cart);
        window.dispatchEvent(new CustomEvent('cart:updated', { detail: cart }));
      } else if (action === 'decrease') {
        qty = Math.max(1, qty - 1);
        if (input) input.value = qty;
        const cart = await changeLine({ line, quantity: qty, key });
        syncDom(cart);
        window.dispatchEvent(new CustomEvent('cart:updated', { detail: cart }));
      } else if (action === 'remove') {
        const cart = await changeLine({ line, quantity: 0, key });
        syncDom(cart);
        window.dispatchEvent(new CustomEvent('cart:updated', { detail: cart }));
      }
    } catch (err) {
      console.error('Cart action failed:', err);
      window.location.reload(); // last-resort recovery
    }
  });

  // Manual quantity edits
  document.addEventListener('change', async (e) => {
    const input = e.target.closest('.qty-input');
    if (!input) return;

    const line = Number(input.dataset.line);
    const key = input.dataset.key;
    let qty = Number(input.value) || 1;
    qty = Math.min(99, Math.max(1, qty));
    input.value = qty;

    try {
      const cart = await changeLine({ line, quantity: qty, key });
      syncDom(cart);
      window.dispatchEvent(new CustomEvent('cart:updated', { detail: cart }));
    } catch (err) {
      console.error('Cart update failed:', err);
      window.location.reload();
    }
  });
})();
