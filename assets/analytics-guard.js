/* analytics-guard.js
   Defensive shim with a queue. Safe to include before or after the real analytics.
   If your real analytics later assigns window.WTFAnalytics, queued calls replay.
*/
(function () {
  const g = (typeof window !== 'undefined') ? window : {};
  const noop = () => {};
  const q = [];               // queued calls: [methodName, args[]]
  const api = {
    init: (...args) => q.push(['init', args]),
    trackView: (...args) => q.push(['trackView', args]),
    trackAddToCart: (...args) => q.push(['trackAddToCart', args]),
    trackCart: (...args) => q.push(['trackCart', args]),
    trackPurchase: (...args) => q.push(['trackPurchase', args]),
  };

  // Install stub once
  if (!g.WTFAnalytics) g.WTFAnalytics = api;

  // If the real analytics loads later, adopt & flush
  const adopt = () => {
    const real = g.WTFAnalyticsReal;
    if (!real || real.__adopted__) return;

    // Ensure all known methods exist on the real impl
    ['init', 'trackView', 'trackAddToCart', 'trackCart', 'trackPurchase'].forEach(m => {
      if (typeof real[m] !== 'function') real[m] = noop;
    });

    // Swap window.WTFAnalytics to real and flush queue
    g.WTFAnalytics = real;
    real.__adopted__ = true;
    while (q.length) {
      const [m, args] = q.shift();
      try { real[m](...args); } catch (e) { console.warn('[Analytics] method failed:', m, e); }
    }
  };

  // Re-check a few times in case of async load
  let tries = 0;
  const iv = setInterval(() => {
    tries += 1; adopt();
    if (tries > 40 || (g.WTFAnalytics && g.WTFAnalytics.__adopted__)) clearInterval(iv);
  }, 125);
}());
