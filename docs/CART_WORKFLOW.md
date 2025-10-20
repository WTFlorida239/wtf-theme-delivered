# Cart Workflow

## Overview

This document outlines the authoritative end-to-end purchase workflow for the theme. The goal is to have a single, coherent set of files and a clear event contract to ensure a robust and maintainable cart system.

**Flow Diagram:**

```
PDP -> WTFCartAPI.addToCart -> POST /cart/add.js -> GET /cart.js -> dispatch('wtf:cart:update') -> UI (header/drawer)
```

## Authoritative Files

The following files are the single source of truth for cart functionality and are loaded in `layout/theme.liquid`:

*   `assets/wtf-cart-api.js`: The only cart API used across the theme. It handles all cart mutations and always re-reads `/cart.js` after a change.
*   `assets/wtf-cart-ui.js`: Binds the header cart count/badge to the authoritative cart state. It listens for the standard cart event and hydrates the count on page load.
*   `assets/wtf-analytics-shim.js`: Defines no-op analytics functions to prevent errors if the main analytics script fails to load.

## Event Contract

*   **`wtf:cart:update`**: The single source of truth for all cart updates. The `detail` property of the event contains the full cart object from `/cart.js`.
*   **`wtf:cart:add`**: An optional event for showing toasts or opening the cart drawer. The `detail` property contains `{ item, cart }`.

## Load Order Excerpt

The following is the corrected script load order from `layout/theme.liquid`:

```html
    {%- comment -%} 1) Hardening shims {%- endcomment -%}
    {{ 'safe-define.js'       | asset_url | script_tag | replace: '<script', '<script defer' }}
    {{ 'postmessage-guard.js' | asset_url | script_tag | replace: '<script', '<script defer' }}

    {%- comment -%} 2) Analytics no-op shim (prevents missing method crashes) {%- endcomment -%}
    {{ 'wtf-analytics-shim.js' | asset_url | script_tag | replace: '<script', '<script defer' }}

    {%- comment -%} 3) Integration guards {%- endcomment -%}
    {{ 'analytics-guard.js'  | asset_url | script_tag | replace: '<script', '<script defer' }}
    {{ 'lightspeed-guard.js' | asset_url | script_tag | replace: '<script', '<script defer' }}

    {%- comment -%} 4) Dawn foundation (only what you actually use) {%- endcomment -%}
    <script src="{{ 'constants.js'      | asset_url }}" defer></script>
    <script src="{{ 'pubsub.js'         | asset_url }}" defer></script>
    <script src="{{ 'fetch-config.js'   | asset_url }}" defer></script>
    <script src="{{ 'product-form.js' | asset_url }}" defer></script>

    {%- comment -%} 5) Cart stack: API → UI → bridge → enhancements {%- endcomment -%}
    {{ 'wtf-cart-api.js' | asset_url | script_tag | replace: '<script', '<script defer' }}
    {{ 'wtf-cart-ui.js'  | asset_url | script_tag | replace: '<script', '<script defer' }}
    <script src="{{ 'wtf-cart-event-bridge.js' | asset_url }}" defer></script>
    <script src="{{ 'wtf-variants.js'           | asset_url }}" defer></script>
    <script src="{{ 'wtf-drink-builder-enhanced.js' | asset_url }}" defer></script>
    <script src="{{ 'wtf-upselling.js'          | asset_url }}" defer></script>
    <script src="{{ 'wtf-analytics.js'          | asset_url }}" defer></script>

    {%- comment %} 6) Pricing Validation System {%- endcomment -%}
    {{ 'pricing-validation.js' | asset_url | script_tag | replace: '<script', '<script defer' }}

    {%- comment %} 7) Integrations (conditional) {%- endcomment -%}
```

## Mutation Rules

*   Every `/cart/*` mutation must be followed by a fresh read of `/cart.js`.
*   The `fetch` call for `/cart.js` must use `cache: 'no-store'` and a timestamp parameter to prevent caching.

## Header Hooks

The following `data-` attributes are used in the header and are owned exclusively by `wtf-cart-ui.js`:

*   `data-cart-count`: The number of items in the cart.
*   `data-cart-label`: A descriptive label for the cart (e.g., "Cart: 3 items").

## Test Checklist

*   **Add/update/remove flow**: Cart operations work correctly from the PDP, drawer, and cart page.
*   **Badge hydration**: The header badge updates immediately on load and after any cart mutation.
*   **No duplicate network calls**: Each cart mutation results in a single `POST` to `/cart/*` followed by a single `GET` to `/cart.js`.
*   **No console errors**: The console is free of errors related to cart or analytics.
