/* postmessage-guard.js
   Ensures we only postMessage to our own origin or an explicitly allowed list.
*/
(function () {
  const g = (typeof window !== 'undefined') ? window : {};
  const SELF = g.location ? g.location.origin : '*';
  const ALLOW = new Set([SELF]); // add whitelisted origins here if needed

  g.safePostMessage = function (targetWindow, data, targetOrigin) {
    try {
      if (!targetWindow || typeof targetWindow.postMessage !== 'function') return false;
      const origin = (typeof targetOrigin === 'string' && targetOrigin.length) ? targetOrigin : SELF;
      if (!ALLOW.has(origin)) {
        // Skip noisy posts
        // console.debug('[postMessage] blocked target origin', origin);
        return false;
      }
      targetWindow.postMessage(data, origin);
      return true;
    } catch (e) {
      console.warn('[postMessage] failed:', e);
      return false;
    }
  };
}());
