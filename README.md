# WTF Theme – Clean Launch Playbook

> Shopify Liquid theme for **WTF | Welcome To Florida**, optimized for a high-converting drink builder, in-store POS parity, and competitor-beating SEO.

## Manus.ai Handoff Prompt
Use this prompt inside manus.ai so the agent can complete the remaining launch-critical work:

```text
You are finalizing the WTF | Welcome To Florida Shopify theme stored in the `wtf-theme-clean` repository. The storefront already ships an enhanced drink builder (`sections/enhanced-drink-builder.liquid`) powered by `wtf.settings` metafields plus the supporting flavor system CSS/JS in `assets/base.css`, `assets/wtf_flavor_system.css`, and `assets/wtf-ajax-cart.js`. Operational scripts live in `/scripts/` and `/docs/` houses QA guides, runbooks, and metafield references.

Stay strictly within this stack: Shopify Liquid sections/snippets, vanilla CSS/JS, and the existing metafield contract—no extra Shopify apps or heavyweight libraries. Preserve performance defaults (lazy loading, minimized assets), maintain WCAG 2.1 AA accessibility, and keep JSON-LD coverage comprehensive across the site.

Deliverables for this session:
1. Performance & Accessibility – Refine the enhanced drink builder to load only critical CSS/JS, defer optional behavior, and complete a keyboard/focus accessibility pass for the builder, cart drawer, and checkout summaries. Document findings in `/docs/TESTING_CHECKLIST.md`.
2. Merchandising & Schema – Add metafield-driven preset recipes (e.g., “Focus Flow”, “Florida Chill”) with paired JSON-LD recipe markup. Refresh local business, events, loyalty, and FAQ schema so we surpass the competitor signals captured in `docs/competitor-insights.json` and `local-kava-bars-database - Sheet1.csv`.
3. Operations & Integrations – Execute and document a Lightspeed sync dry run and 2Accept payment QA inside `/docs/runbooks/`. Implement low-stock alerts surfaced in the builder UI and routed to Slack/webhook notifications.
4. Automation & Reporting – Chain `npm run conflicts:scan`, `npm run competitors:audit`, and `node scripts/order-readiness-check.js` in a pre-commit hook, extend schema regression coverage, configure Lighthouse score alerts, and verify GA4/Meta/TikTok pixels capture drink builder events.

Process requirements:
- Run `shopify theme check`, `npm run conflicts:scan`, `npm run competitors:audit`, and `node scripts/order-readiness-check.js` before handoff.
- Keep `README.md`, `WTF_Site_Config.md`, `/docs`, and `TASKS.md` synchronized with any new capabilities or configuration changes.
- Use the competitor table in `README.md` and the insights in `docs/competitor-insights.json` to justify every UX/SEO enhancement.
```

## 1. Current Experience Snapshot
- **Enhanced drink builder** with size-based pricing, pump counters, THC upgrade handling, and inline notices driven by product metafields.
- **Specialty templates** for kava and kratom menus that reuse builder logic while allowing tailored hero content.
- **Global theming assets** in `assets/` for base styling, flavor system UI, and AJAX cart interactions that keep bundle size lean.
- **Operational scripts** covering merge-conflict scanning, competitor insights generation, and order readiness validation to keep launch gates automated.

## 2. Tech Stack & Tooling
- **Platform**: Shopify Online Store 2.0 theme written in Liquid with modular sections and snippets.
- **Styling**: Vanilla CSS organized by concern (`assets/base.css`, `assets/wtf_flavor_system.css`).
- **JavaScript**: Vanilla modules for cart/builder interactivity (`assets/wtf-ajax-cart.js`, inline scripts within sections as needed).
- **Metafields Namespace**: `wtf.settings` governs flavors, hours, FAQs, and upsell messaging; keep Shopify metafield definitions in sync.
- **Automation**: Run `npm run competitors:audit`, `npm run conflicts:scan`, and `node scripts/order-readiness-check.js` before merging.

## 3. Local Development Workflow
1. **Install tooling**: Node.js 20+, Shopify CLI 3.x, and Shopify Theme Check.
2. **Authenticate**: `shopify login --store wtfswag.myshopify.com` to stream edits to a preview theme.
3. **Run theme dev**: `shopify theme dev --theme-editor-sync` for live data preview, or use the optional Express renderer inside `dev-server/` (`npm install && npm run dev`).
4. **Mirror CI checks locally**: execute the automation commands listed above plus `shopify theme check` before committing.
5. **Document updates**: Reflect configuration or process changes inside `WTF_Site_Config.md`, `/docs`, and `TASKS.md` when you ship new capabilities.

## 4. Repository Map
```
wtf-theme-clean/
├── assets/                 # Theme CSS/JS/media
├── config/                 # settings_schema.json + defaults
├── layout/                 # theme.liquid + checkout wrappers
├── sections/               # Modular UI blocks (builder, events, hero, etc.)
├── snippets/               # Shared partials (schema, cards, analytics)
├── templates/              # Page/product/collection templates & JSON routes
├── docs/                   # Deployment guides, ADRs, runbooks, QA checklists
├── scripts/                # Automation utilities run in CI/local workflows
├── dev-server/             # Optional Express renderer for mock data prototyping
├── local-kava-bars-database - Sheet1.csv  # Competitor intelligence dataset
├── WTF_Site_Config.md      # Canonical configuration + branding brief
└── TASKS.md                # Launch backlog and follow-up log
```

## 5. Launch-Complete Roadmap
Prioritize the following to move from “polish” to “ship”:

### A. Performance & Accessibility
- Optimize `sections/enhanced-drink-builder.liquid` CSS/JS for critical-path loading, trimming unused styles and lazy-loading optional scripts.
- Complete an accessibility sweep for keyboard/focus handling across the builder, cart drawer, and checkout summaries; document fixes in `/docs/TESTING_CHECKLIST.md`.

### B. Merchandising & Schema Differentiators
- Launch preset recipes driven by metafields with matching JSON-LD recipe markup to outperform competitor menu visibility.
- Refresh local business schema, events calendar, and loyalty/FAQ content to answer competitor strengths captured in the CSV dataset.

### C. Operations & Integrations
- Dry run Lightspeed inventory sync and 2Accept payment gateway QA, documenting outcomes in `/docs/runbooks/`.
- Implement low-stock alerts surfaced in the builder UI and connected to Slack/webhook notifications.

### D. Automation & Reporting
- Bundle pre-commit hooks for conflict scanning, competitor audits, and order readiness checks; escalate any gaps in `TASKS.md`.
- Extend schema regression coverage and Lighthouse alerting so CI flags SEO/performance regressions automatically.
- Validate GA4, Meta, and TikTok pixel coverage for builder events, and feed Lighthouse/Core Web Vitals into the reporting cadence.

## 6. Source of Truth & Communication
- **Configuration**: `WTF_Site_Config.md` captures branding, metafields, integrations, and competitor counter-moves—keep it synchronized with code.
- **Competitor Intel**: `local-kava-bars-database - Sheet1.csv` informs UX/SEO differentiators; regenerate insights via `npm run competitors:audit`.
- **Operational Docs**: `/docs` covers deployments, QA, and runbooks; update after every launch-impacting change.
- **Task Tracking**: Maintain `TASKS.md` as the living backlog and reference in every PR.

Stay aligned with the launch criteria outlined in `AGENTS.md`: WCAG 2.1 AA accessibility, 90+ Lighthouse scores, and comprehensive structured data coverage across the storefront.

### Competitor Intelligence
| Competitor | City | Signature Edge | WTF Countermove |
| --- | --- | --- | --- |
| Kava Culture Kava Bar | Fort Myers, FL | Loyalty app, weekly events, CBD specials | Publish event JSON-LD + highlight on builder hero to win calendar visibility. |
| Elevation Kava | Cape Coral, FL | Flagship "Elevation" blend and iced teas | Emphasize mix-and-match strains with pump counters + ingredient transparency schema. |
| High Tide Kava Bar | Cape Coral, FL | Nitro cold brew and beachy ambiance | Showcase fast pickup ordering and premium sourcing with video snippets + review markup. |
| Bula Kava Bar & Coffeehouse | Cape Coral, FL | Espresso cocktail crossover program | Launch seasonal drink presets with recipe schema to feature sober-nightlife twists. |
| Shangri-La Botanical | Cape Coral, FL | Herbal wellness shots and education | Surface wellness FAQs + blog schema for mood-based recommendations. |
| Purple Lotus Kava Bar | Cape Coral, FL | CBD mocktails and kombucha program | Spotlight lab-tested terpene data + deliver combos via builder upsell automation. |
| Roots House Of Kava | Cape Coral, FL | Traditional shells and kratom flights | Promote premium ingredient sourcing + faster pickup to win habitual shell drinkers. |
| Southern Roots Kava Bar | Fort Myers, FL | Vegan bites and curated flights | Automate tasting flight bundles via Shopify Functions + structured data. |
# wtf-theme-delivered
