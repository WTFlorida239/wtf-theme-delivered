# WTF Theme Ops Handbook

## 1. Mission & Launch Focus
- Deliver a production-ready Shopify theme for **WTF | Welcome To Florida** with a frictionless drink builder, POS-ready catalog, and compliant payment stack.
- Current milestone: **Phase 4 – Hardening & Production Readiness**. We have completed comprehensive theme auditing, implemented quality automation, standardized naming conventions, and updated all documentation for production deployment.
- Always keep accessibility (WCAG 2.1 AA), performance (90+ Lighthouse), and SEO (rich structured data) as non-negotiable requirements.

## 1.1. Recent Hardening Improvements
- **Theme Quality Automation**: Implemented comprehensive CI/CD workflows including theme-check validation, JSON validation, accessibility testing, and security scanning.
- **Development Standards**: Established consistent naming conventions across all files, documented in `NAMING_CONVENTIONS.md`.
- **Pre-commit Hooks**: Added automated quality checks that run before every commit to prevent issues from entering the codebase.
- **Documentation Overhaul**: Updated README.md, AGENTS.md, and TASKS.md to reflect current architecture and procedures.

## 2. Sources of Truth
| Artifact | Purpose |
| --- | --- |
| [`README.md`](README.md) | Ground-level orientation, setup, and workflow summary. |
| [`WTF_Site_Config.md`](WTF_Site_Config.md) | Storefront configuration, brand, and integration constraints. |
| [`local-kava-bars-database - Sheet1.csv`](local-kava-bars-database%20-%20Sheet1.csv) | Competitor benchmark data. Use it when making UX, SEO, or performance decisions. |
| `/docs/` | ADRs, deployment guides, QA checklists, metafield dictionaries. |
| `/scripts/order-readiness-check.js` | Automated storefront readiness audit executed in CI. |

When modifying files inside a subdirectory, check for additional `AGENTS.md` files (none exist today) and follow their rules.

## 3. Automation & Quality Gates
| Automation | Trigger | What it must do |
| --- | --- | --- |
| **Theme Quality Check (theme-quality-check.yml)** | PR + pushes to `main`, `develop`, `hardening/*` | Comprehensive quality validation including theme-check with auto-correct, JSON validation, Liquid syntax checking, asset optimization review, accessibility patterns, and naming convention enforcement. |
| **CI/CD Pipeline (ci-cd-pipeline.yml)** | PR + pushes to `main`, `develop` | Install dependencies, run conflict scan, competitor audit, order readiness check, theme validation, and security scanning. |
| **Theme Check (automated-testing.yml)** | PR + `main` | Execute `shopify theme check` against Liquid templates with error-level failure threshold. |
| **Lighthouse CI (quality-monitoring.yml)** | Nightly + manual dispatch | Audits storefront Performance, Best Practices, Accessibility, SEO. Export results to the PR as artifacts. |
| **Security & Dependencies (security-dependency-management.yml)** | PR + scheduled | Vulnerability scanning, dependency updates, security header validation, and compliance checking. |
| **Pre-commit Hooks (.githooks/pre-commit)** | Every commit | Local quality validation including theme-check, JSON validation, large file detection, secret scanning, and required file verification. |
| **Order Readiness Audit** | PR + `main` | Runs `node scripts/order-readiness-check.js --ci` to confirm cart, builder, and schema outputs remain launch-ready. |
| **Preview Deploy** | PR merge queue | Publishes preview theme using Shopify CLI with password-protected access. |
| **Production Deploy** | Release tags | Pushes theme bundle to the live store after approvals. |
| **Competitor Signal Snapshot** | Manual + scheduled (`npm run competitors:audit`) | Parse the CSV dataset, validate doc parity, surface schema/performance deltas, write `docs/competitor-insights.json`, and attach findings to PRs. _Implementation progress tracked in `TASKS.md`._ |
| **Merge Conflict Scan** | Pre-commit (`npm run conflicts:scan`) | Fail fast when merge conflict markers remain anywhere in the repo. |

> ✅ Before committing: Pre-commit hooks automatically run quality checks including `shopify theme check`, JSON validation, security scanning, and file verification. For manual validation, run `./setup-dev.sh` to ensure proper development environment setup.  
> If a script is missing, note the gap in the PR body and create a follow-up in `TASKS.md`.

## 4. Role Guides
- **Architect Agent**: Maintain ADRs (`/docs/adr/`), validate metafield strategy, and own integration trade-offs (Shopify Functions vs. Hydrogen). Any new dependency or architectural shift requires an ADR and updates to `README.md`.
- **Theme/Liquid Agent**: Touch only Liquid/JSON/CSS needed for the acceptance criteria. Respect translation strings, use snippets to limit nesting, and wire metafields under the `wtf.settings` namespace. Provide accessibility annotations and focus management.
- **Hydrogen/Headless Agent**: Build Storefront API integrations using edge-ready patterns. Cache responsibly, keep queries colocated, and add unit or component tests.
- **Payments & POS Agent**: Configure 2Accept + Lightspeed syncs. Record secrets/env requirements in `/docs/runbooks/payments.md`. Provide mocks for automated tests.
- **Discounts & Upsell Agent**: Ship Shopify Functions with tests, config via metafields, and documentation updates.
- **Social Wall Agent**: Aggregate IG/YT/TikTok feeds with caching + graceful fallback. Keep rate limits in mind.

## 5. Delivery Cadence & Expectations
1. **Plan** – Align with `TASKS.md` and update it when scope evolves.
2. **Implement** – Small, reviewable commits directly on `main` (no feature branches in this environment). Keep commit messages imperative and scoped.
3. **Verify** – Run the automation suite locally, gather Lighthouse data when UI changes are made, and attach evidence in the PR.
4. **Document** – Update `README.md`, `WTF_Site_Config.md`, or `/docs` when behavior, dependencies, or configuration changes.
5. **Handoff** – Each PR must include manual QA notes and highlight any follow-up tasks in `TASKS.md`.

## 6. Launch Criteria Snapshot
- Shopify payments + 2Accept gateway verified in staging & production.
- Lightspeed Retail inventory sync operational with fallback messaging.
- Drink builder supports Dunkin-style customization, price diffs, and line-item properties across all entry points (PDP, quick add, cart).
- Structured data (JSON-LD) covers homepage, products, collections, FAQs, and local business schema referencing the latest competitor insights.
- Analytics plan implemented (GA4 + Meta pixel) with consent compliance.
- A11y + performance regression suite passing for home, PDP, builder flows.

Keep this handbook updated as processes evolve. If you add or modify automation, mirror the change here, update `README.md`, and capture outstanding work in `TASKS.md`.
