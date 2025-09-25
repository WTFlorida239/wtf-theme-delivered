# WTF | Welcome to Florida – Site Configuration

## 1. Business Profile
- **Legal Name**: WTF | Welcome to Florida
- **Storefront URL**: [wtfswag.com](https://wtfswag.com)
- **Primary Location**: 1520 SE 46th Ln, Unit B, Cape Coral, FL 33904
- **Phone / SMS**: (239) 955-0314
- **Email**: info@wtfswag.com
- **Hours**: Daily 8am–10pm (update `wtf.settings.hours` metafield when hours change)

## 2. Commerce Stack
| Area | Details |
| --- | --- |
| Theme | `wtf-theme-clean` (Liquid) with modular sections + snippets. |
| Payments | Shopify Payments + 2Accept gateway (Docs: `docs/runbooks/payments.md`). |
| POS & Inventory | Lightspeed Retail sync (Docs: `docs/runbooks/lightspeed-sync.md`). |
| Analytics | GA4, Meta Pixel, TikTok Pixel – managed via theme settings and snippets. |
| Customer Data | Klaviyo flows integrated via theme scripts (no additional app installs). |
| Local SEO | Google Business Profile, Apple Maps, Bing Places – maintain consistency with `wtf.settings.local_business` metafields. |

## 3. Theme Architecture Notes
- **Primary Templates**: `templates/page.kratom-teas.liquid`, `templates/page.kava-drinks.liquid`, `sections/enhanced-drink-builder.liquid`.
- **Dynamic Pricing**: Booster + upsell logic handled in Liquid + inline JS; ensure price calculations remain in sync with Shopify variants.
- **Line Item Properties**: Captured under `properties[wtf_*]`; surfaced in cart drawer and checkout.
- **Localization**: Strings live in `locales/en.default.json`. Additional locales inherit from this structure.
- **Assets**: Global styling in `assets/base.css`; drink builder specific CSS lives in `assets/wtf_flavor_system.css`; JS interactions in `assets/wtf-ajax-cart.js` and inline modules.

## 4. Metafields & Settings
- **Namespace**: `wtf.settings`
- **Key Metafields**:
  - `flavors` (JSON) – list of available flavors, pumps, availability.
  - `hours` (JSON) – open/close times for each day.
  - `upsell_messages` (multi-line text) – large-upgrade callouts.
  - `faq` (list) – Q/A pairs for structured data.
- Update metafields alongside theme changes and document adjustments in `/docs/metafields.md`.

## 5. Content & Tone
- **Voice**: Community-forward, Florida sunshine, welcoming for botanical newcomers.
- **Messaging Pillars**: Premium ingredients, social lounge vibe, sober-friendly nightlife.
- **Imagery**: Bright, inviting, leaning on orange/white palette inspired by Dunkin'.
- **Compliance**: Avoid medical claims; include age/responsibility disclaimers when referencing THC/kratom.

## 6. Competitor Snapshot (from `local-kava-bars-database - Sheet1.csv`)
| Competitor | Neighborhood Focus | Differentiators | WTF Countermove |
| --- | --- | --- | --- |
| Roots House Of Kava | Cape Coral – Downtown | Traditional shells, kratom teas, local cold brew | Highlight premium ingredient sourcing, faster pickup, and shell-friendly presets. |
| Shangri-La Botanical | Cape Coral – South | Herbal elixirs, wellness shots | Emphasize mood-based drink builder presets plus structured wellness education. |
| Elevation Kava | Cape Coral – South | Signature "Elevation" blend, iced teas | Showcase mix-and-match strains with pump counters + ingredient transparency schema. |
| High Tide Kava Bar | Cape Coral – Midtown | Beach vibe, nitro cold brew | Leverage hero video snippets, loyalty perks, and pickup messaging to match energy. |
| Bula Kava Bar & Coffeehouse | Cape Coral – East | Espresso program, cocktail-style kava | Promote seasonal crossover drinks backed by recipe schema + promo automations. |
| Purple Lotus Kava Bar | Cape Coral – North | CBD mocktails, kombucha | Surface lab-tested terpene data and deliver combos via builder upsell automation. |
| Southern Roots Kava Bar | Fort Myers | Vegan bites, flight experiences | Push tasting flight bundles via Shopify Functions + associated structured data. |
| Kava Culture Kava Bar | Fort Myers – Downtown | App-based loyalty, weekly events | Ensure event schema + loyalty messaging appears in hero modules and CRM flows. |

Use these competitor cues when prioritizing UX, schema, and promotional copy. Every feature should create measurable lift versus this list.

## 7. Automation & Monitoring
- **CI Gates**: `shopify theme check`, `node scripts/order-readiness-check.js`, conditional lint/tests via `dev-server/`.
- **Lighthouse CI**: Nightly run. Investigate regressions >5 points immediately.
- **Preview Deploy**: Automatic on merged PRs; share password-protected preview link with stakeholders.
- **Competitor Signal Audit**: Run `npm run competitors:audit` to refresh `docs/competitor-insights.json`, confirm README/WTF_Site_Config parity, and raise follow-up tasks.

## 8. Reporting Rhythm
- **Weekly**: Publish Core Web Vitals + SEO schema status in #wtf-digital channel.
- **Biweekly**: Compare menu schema + builder UX against top competitors; note action items in `TASKS.md`.
- **Monthly**: Review Lightspeed inventory sync logs and payment gateway settlements.

Keep this file current whenever integrations, metafields, or positioning change. Treat it as the contract between strategy and implementation.
