# Cart Standardization Notes

## Runtime audit
- Primary cart API script: `assets/wtf-cart-api.js` loaded from `layout/theme.liquid`.
- Custom drink builder page previously called `/cart/add.js` directly from `templates/page.thc-drinks.liquid` (`addToCart()` inline function).
- Theme-level helpers (`assets/global.js`, `assets/wtf-enhanced-cart.js`, `assets/wtf-flavor-system.js`, Dawn cart/product scripts) also posted directly to `/cart/*.js` endpoints.

## Current approach
- All cart mutations (`add`, `update`, `clear`, `get`) now flow through `WTFCartAPI`.
- Legacy helpers proxy to the API and rely on the standard `wtf:cart:update` / `wtf:cart:add` events that `WTFCartAPI` emits.
- THC drinks page resolves the active variant id per size before calling `WTFCartAPI.addToCart`, preventing invalid variant submissions.
- Safety guards added for quantity/variant validation, JSON payloads, and error surfacing to eliminate Shopify 422 responses.

## Follow-up
- Populate `page.metafields.custom.thc_drinks_variant_map` (JSON) or `settings.thc_drinks_product_handle` with the authoritative variant ids for each size.
- Extend the same variant-resolution pattern to any future chip-driven builders to keep validation consistent.
