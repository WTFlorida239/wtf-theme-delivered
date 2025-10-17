/* safe-define.js
   Prevents "already been defined" errors for custom elements.
   Usage: safeDefine('wc-autosize-textarea', ClassRef);
*/
(function () {
  const g = (typeof window !== 'undefined') ? window : {};
  g.safeDefine = function (tagName, klass, options) {
    try {
      if (!tagName || typeof tagName !== 'string') return;
      if (!customElements.get(tagName)) {
        customElements.define(tagName, klass, options);
      }
    } catch (e) {
      console.warn('[CustomElements] define failed for', tagName, e);
    }
  };
}());
