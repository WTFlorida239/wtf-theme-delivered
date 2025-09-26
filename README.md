#######################################################################
# WTF Theme — Delivered
#
# Shopify Liquid theme for WTF | Welcome To Florida
# Optimized for: high-converting drink builder, POS parity,
# and competitor-beating SEO.
#
# Repository: wtf-theme-delivered
#######################################################################

#######################################################################
# Manus.ai Handoff Prompt
#######################################################################
You are finalizing the WTF | Welcome To Florida Shopify theme in the
`wtf-theme-delivered` repository.

Core storefront features:
- Enhanced drink builder (`sections/enhanced-drink-builder.liquid`)
  driven by `wtf.settings` metafields.
- Supporting CSS/JS: `assets/base.css`,
  `assets/wtf_flavor_system.css`, `assets/wtf-ajax-cart.js`.
- Operational scripts: `/scripts/`
- QA, runbooks, references: `/docs/`

STRICT CONSTRAINTS:
- Stack: Shopify Liquid sections/snippets, vanilla CSS/JS only.
- Honor the existing metafield contract.
- No external Shopify apps / heavy libraries.
- Preserve performance defaults (lazy loading, minimized assets).
- Maintain WCAG 2.1 AA accessibility.
- Ensure JSON-LD coverage (Recipe, LocalBusiness, Events, Loyalty, FAQ).

DELIVERABLES:
1) Performance & Accessibility
   - Critical CSS/JS only, defer non-critical.
   - Full keyboard/focus pass for builder, cart, checkout.
   - Document in `/docs/TESTING_CHECKLIST.md`.

2) Merchandising & Schema
   - Add metafield-driven recipes (e.g. “Focus Flow”, “Florida Chill”).
   - JSON-LD Recipe + refreshed LocalBusiness, Events, Loyalty, FAQ schema.
   - Benchmark against `/docs/competitor-insights.json`.

3) Operations & Integrations
   - Lightspeed sync dry run + 2Accept payment QA → `/docs/runbooks/`.
   - Low-stock alerts in builder UI → route Slack/webhook.

4) Automation & Reporting
   - Pre-commit hook: `npm run conflicts:scan` →
     `npm run competitors:audit` →
     `node scripts/order-readiness-check.js`.
   - Extend schema regression tests.
   - Configure Lighthouse alerts.
   - Verify GA4 / Meta / TikTok pixels capture builder events.

PROCESS:
- Run before handoff:
  shopify theme check
  npm run conflicts:scan
  npm run competitors:audit
  node scripts/order-readiness-check.js

- Keep `README.md`, `WTF_Site_Config.md`, `/docs`, and `TASKS.md`
  synchronized with changes.

#######################################################################
# 1. Current Experience Snapshot
#######################################################################
- Drink builder: size-based pricing, pump counters, THC upgrade handling,
  metafield notices.
- Specialty templates for kava/kratom menus.
- Lean global assets for styling + AJAX cart.
- Automation scripts for conflicts, competitor insights, order readiness.

#######################################################################
# 2. Tech Stack & Tooling
#######################################################################
Platform: Shopify Online Store 2.0 (Liquid sections/snippets)
CSS: assets/base.css, assets/wtf_flavor_system.css
JS: assets/wtf-ajax-cart.js (+ minimal inline)
Metafields: wtf.settings namespace (flavors, hours, FAQs, upsells)
Automation:
  - npm run competitors:audit
  - npm run conflicts:scan
  - node scripts/order-readiness-check.js
  - shopify theme check

#######################################################################
# 3. Local Development
#######################################################################
Install: Node.js 20+, Shopify CLI 3.x, Theme Check
Auth:    shopify login --store wtfswag.myshopify.com
Dev:     shopify theme dev --theme-editor-sync
CI:      run all automation + theme check before commit
Docs:    update WTF_Site_Config.md, /docs, TASKS.md with changes

#######################################################################
# 4. Repository Map
#######################################################################
wtf-theme-delivered/
├── assets/                 # CSS/JS/media
├── config/                 # settings_schema.json + defaults
├── layout/                 # theme.liquid
├── sections/               # Builder, events, hero, etc.
├── snippets/               # Partials (schema, cards, analytics)
├── templates/              # JSON templates
├── docs/                   # Deployment guides, QA, runbooks
├── scripts/                # Automation utilities
├── dev-server/             # Optional mock renderer
├── WTF_Site_Config.md      # Config + branding brief
└── TASKS.md                # Launch backlog

#######################################################################
# 5. Launch Checklist (all must be green)
#######################################################################
npm ci
npm run conflicts:scan
npm run competitors:audit
node scripts/order-readiness-check.js
shopify theme check --fail-level=error

Verify files exist/valid:
- layout/theme.liquid
- config/settings_schema.json
- sections/enhanced-drink-builder.liquid
- sections/main-product.liquid
- sections/wtf-cart.liquid
- templates/product.json
- templates/cart.liquid

Secrets: SHOPIFY_CLI_THEME_TOKEN set if deploying via CLI.

#######################################################################
# 6. Troubleshooting (fast fixes)
#######################################################################
- HTML nesting: ensure <div> closes before </fieldset>.
- Parser-blocking: add defer/async to <script> tags.
- Missing assets: guard with image_picker or add to /assets.
- Stray submodules: clean .gitmodules and remove backups.

#######################################################################
# 7. Competitors (65-mile radius Cape Coral, FL)
#######################################################################
Primary chains:
- Kava Culture (12 venues incl. NA taproom: Cape Coral HQ,
  Downtown Fort Myers, North Fort Myers, Fort Myers Beach, Summerlin,
  Estero, Bonita Springs, Naples North, Naples Golden Gate,
  Marco Island, Port Charlotte)
- Botanical Brewing Taproom (Cape Coral)
- Island Vibes Kava Bar (North Fort Myers, Fort Myers)
- Nectar Lab Kava Bar (North & Central Naples)

Independents:
Roots House of Kava (Cape Coral)
The Sound Garden Kava Bar (Fort Myers)
Burma Kava Company (Fort Myers)
Kapua Kava Bar (Fort Myers)
Kava Nirvana Kava Bar (Fort Myers)
Cosmic Kava (Naples)
Alchemist Kava Bar & Lounge (Naples)
Kava Luv Social Lounge (Naples)
Downtown Kava (Punta Gorda)

#######################################################################
# 8. Competitive Positioning
#######################################################################
- Wellness-forward, daylight-friendly, “soccer-mom adjacent”.
- Quality & safety: COAs, dosing guidance, trained staff.
- Menu: Culinary-grade botanical cocktails, functional add-ons, LTOs.
- Consistency & speed: SOPs, predictable hours, online pickup.
- Community & loyalty: partnerships, referral rewards, VIP events.
- Content & SEO moat: education-led + strong local listings.
#######################################################################
