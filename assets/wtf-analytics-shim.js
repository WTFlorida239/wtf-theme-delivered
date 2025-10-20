/* assets/wtf-analytics-shim.js */
(function () {
  const ns = (window.WTFAnalytics = window.WTFAnalytics || {});
  ['init','trackAddToCart','trackViewCart','trackCheckout','trackRemoveFromCart']
    .forEach((name) => {
      if (typeof ns[name] !== 'function') ns[name] = function () {};
    });
})();
