# WTF Theme – Launch Task Board

> Update this file as tasks move through the pipeline. Group related subtasks and include owners + target dates when assigned.

## 1. Automation & Tooling
- [x] **Competitor Signal Audit Script** – Implemented `npm run competitors:audit` to parse the CSV, export insights, and enforce README/WTF_Site_Config parity.
- [x] **Merge Conflict Scanner** – Added `npm run conflicts:scan` to block unresolved Git markers before commits.
- [ ] **Pre-commit Automation Bundle** – Chain `npm run conflicts:scan`, `npm run competitors:audit`, and `node scripts/order-readiness-check.js` via Husky-style git hook (Owner: Automation, Target: 2024-06-07).
- [ ] **Schema Regression Tests** – Extend `scripts/order-readiness-check.js` (or sibling script) to validate JSON-LD output for homepage, builder flows, and hero cards (Owner: SEO, Target: 2024-06-05).
- [ ] **Lighthouse Threshold Alerts** – Configure `lighthouse.yml` to comment on PRs when scores dip below 90 and auto-open an issue (Owner: Performance, Target: 2024-06-09).

## 2. Theme Polish & UX
- [ ] **Drink Builder Performance Pass** – Audit bundle size + critical CSS for `enhanced-drink-builder.liquid`; ensure JS is modular and lazy-loaded where possible.
- [ ] **Accessibility Sweep** – Validate keyboard flow, ARIA labels, and focus management for builder, cart drawer, and checkout line-item summaries.
- [ ] **Preset Recipes** – Add quick-pick presets (“Focus Flow”, “Florida Chill”, etc.) using metafields + JSON-LD recipe markup to differentiate from competitors.

## 3. Commerce Operations
- [ ] **Lightspeed Sync Dry Run** – Execute sandbox sync, confirm SKU parity, and document fallback steps in `docs/runbooks/lightspeed-sync.md` (Owner: Ops Enablement, Target: 2024-06-06).
- [ ] **2Accept Gateway QA** – Perform live auth/void/refund transactions and capture evidence for compliance docs (Owner: Payments, Target: 2024-06-10).
- [ ] **Inventory Safety Nets** – Implement low-stock alerts surfaced in the drink builder (Liquid conditional + webhook to Slack) (Owner: Theme, Target: 2024-06-12).

## 4. SEO & Content
- [ ] **Local Business Schema Refresh** – Align address, hours, and review markup with GBP and competitor deltas.
- [ ] **Events Calendar Integration** – Publish upcoming events with structured data to counter Kava Culture’s weekly programming.
- [ ] **Competitor Comparison Landing Page** – Create a new template highlighting WTF advantages vs. Cape Coral competition, including FAQ schema.
- [ ] **Loyalty Countermeasures** – Translate competitor loyalty offerings into a WTF perks module + structured data surfaced on PDP/homepage.
- [ ] **Event Schema Automation** – Feed competitor event cadence into WTF event calendar with JSON-LD so nightly programming appears in SERPs.

## 5. Analytics & Reporting
- [ ] **GA4 + Pixel Validation** – Use Tag Assistant / Meta Pixel Helper to confirm event coverage for builder interactions.
- [ ] **Performance Dashboard** – Pipe Lighthouse + Core Web Vitals data into Looker Studio for weekly reporting.
- [ ] **Launch Readiness Review** – Complete `docs/LAUNCH_READINESS_ASSESSMENT.md` with updated status, blockers, and owner sign-offs.

---
**Working Agreement**: Every PR should reference the task it addresses. When a task is delivered, update this board and capture any follow-up work.