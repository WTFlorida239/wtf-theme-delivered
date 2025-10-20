/* WTF Cart Badge – updates the header count
   - Listens for 'cart:updated' (from wtf-cart-ui.js)
   - Also syncs on tab focus/visibility to catch changes from other tabs/pages
*/
(() => {
  const root = (window.Shopify && window.Shopify.routes && window.Shopify.routes.root) || '/';

  const badge = document.querySelector('[data-cart-count]');
  if (!badge) return;

  function render(count) {
    const n = Number(count) || 0;
    if (n <= 0) {
      badge.textContent = '0';
      badge.classList.add('is-empty');
      badge.setAttribute('aria-hidden', 'true');
    } else {
      badge.textContent = String(n);
      badge.classList.remove('is-empty');
      badge.removeAttribute('aria-hidden');
    }
  }

  // Initial state from server-rendered Liquid
  render(parseInt(badge.textContent, 10));

  // Update when our cart UI finishes an action
  window.addEventListener('cart:updated', (e) => {
    const count = e?.detail?.item_count;
    if (typeof count !== 'undefined') render(count);
  });

  // Safety sync: when user returns to the tab
  document.addEventListener('visibilitychange', async () => {
    if (document.visibilityState !== 'visible') return;
    try {
      const res = await fetch(root + 'cart.js', {
        credentials: 'same-origin',
        headers: { 'Accept': 'application/json' }
      });
      if (res.ok) {
        const cart = await res.json();
        render(cart.item_count);
      }
    } catch (_) {}
  });
})();
