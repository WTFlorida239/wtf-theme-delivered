# WTF Ecommerce Readiness Roadmap

The automated audit plus manual go-live checklist below keeps our theme aligned with Shopify launch standards so we can confidently take live orders.

## Automated checks

The **Order Readiness Audit** script (`scripts/order-readiness-check.js`) runs locally via `node scripts/order-readiness-check.js` and in CI through `.github/workflows/order-readiness.yml`. It validates:

1. **Product form wiring** – ensures the `main-product` section posts to `routes.cart_add_url` with the variant `id` hidden input.
2. **Template bindings** – confirms `templates/product.json` mounts the `main-product` section and `templates/cart.liquid` loads `wtf-cart`.
3. **Checkout access** – verifies `sections/wtf-cart.liquid` exposes the checkout submit button and renders line item properties for drink builders.
4. **Structured data hooks** – checks `layout/theme.liquid` renders `enhanced-meta-tags`/`structured-data` and that the snippet ships both `Product` and `LocalBusiness` JSON-LD payloads.

The script prints GitHub Step Summary output with remediation tips whenever a check fails, so fixes are straightforward for the team.

## Manual activation checklist

Complete these Shopify Admin tasks before flipping on paid traffic:

- **Payments** – finish 2Accept onboarding, plug API credentials into Shopify, then run a real $1 authorization test order.
- **Shipping & pickup** – configure Cape Coral pickup hours, local delivery radiuses, and shipping rates for packaged items.
- **Taxes & compliance** – confirm Florida nexus, age-gate messaging, and THC/kratom disclaimers on PDPs.
- **Inventory sync** – run the Lightspeed Retail connector, map barcodes/SKUs, and spot check quantity parity.
- **Menu accuracy** – review drink builder defaults, ensure seasonal variants are active, and stage upsell bundles.
- **Analytics** – validate GA4, Meta, and TikTok pixels using Tag Assistant in a draft checkout session.
- **Content** – publish FAQ metafields (allergens, potency, serving suggestions) for rich snippets and staff readiness.

## Suggested workflows & automation

- **Preview theme deploys** – rely on `.github/workflows/preview-deploy.yml` to push PR builds to the password-protected preview theme once secrets are present.
- **Order readiness gate** – keep the new `.github/workflows/order-readiness.yml` required for the `main` branch so regressions block merges automatically.
- **Lighthouse budget** – run `.github/workflows/lighthouse.yml` after major UI work to hold ≥90 Lighthouse scores.
- **Metafield QA** – execute `snippets/wtf-metafield-audit.liquid` in a staging page weekly to surface missing content that could break product detail experiences.

## Next review session

1. Wire the checkout webhook to Slack for order notifications.
2. Build a staging-only banner that toggles when `Shopify.designMode` is true so staff know they are not on production.
3. Draft a CRM automation that exports new Shopify customers into the existing SMS list nightly.

Document progress by updating this roadmap as tasks are completed.
