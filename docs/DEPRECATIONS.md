# Deprecations

This document lists files that have been deprecated and will be removed in a future release.

## Removed Files

| File | Replacement | Inclusion removed? (Y/N) | Status | Notes |
|---|---|---|---|---|
| `assets/dawn-cart.js` | `wtf-cart-api.js`, `wtf-cart-ui.js` | Y | `_deprecated/` | Redundant cart logic. |
| `assets/wtf-enhanced-cart.js` | `wtf-cart-api.js`, `wtf-cart-ui.js` | Y | `_deprecated/` | Redundant and overly complex cart logic. |
| `assets/dawn-product-form.js` | `assets/product-form.js` | Y | `_deprecated/` | Replaced with a version that uses `WTFCartAPI`. |

## Removal Policy

Files in the `_deprecated/` directory will be kept for one release cycle to allow for a safe transition. If no regressions are reported, they will be deleted in a subsequent release.

## Legacy Event Policy

The legacy cart events `cart:updated` and `cart:added` are slated for removal. They are currently being dispatched for backward compatibility, but a debug-only logger has been added to `wtf-cart-api.js` to detect any remaining listeners. Once all listeners have been updated, the legacy event dispatches will be removed.
