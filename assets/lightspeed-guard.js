/* lightspeed-guard.js
   Disables Lightspeed calls unless config is fully present.
   Prevents 404 spam and surfaces a single, clear console note.
*/
(function () {
  const g = (typeof window !== 'undefined') ? window : {};
  const cfg = g.WTFLightspeed || {}; // expected: { enabled: true, accountId: '...', publicKey: '...' }

  function valid(cfg) {
    return !!(cfg && cfg.enabled && typeof cfg.accountId === 'string' && cfg.accountId && typeof cfg.publicKey === 'string' && cfg.publicKey);
  }

  // Replace global helper with a no-op wrapper that only runs when valid
  g.WTFLightspeedFetch = async function (path, options = {}) {
    if (!valid(cfg)) {
      if (!g.__ls_warned__) {
        console.info('[Lightspeed] Disabled: missing or invalid config; skipping calls.');
        g.__ls_warned__ = true;
      }
      return null;
    }
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), 6000);
    try {
      const res = await fetch(path, { credentials: 'same-origin', signal: controller.signal, ...options });
      if (!res.ok) throw new Error(`Lightspeed HTTP ${res.status}`);
      const type = (res.headers.get('content-type') || '');
      return type.includes('application/json') ? res.json() : res.text();
    } catch (e) {
      console.warn('[Lightspeed] Request failed:', path, e.message);
      return null;
    } finally {
      clearTimeout(t);
    }
  };
}());
