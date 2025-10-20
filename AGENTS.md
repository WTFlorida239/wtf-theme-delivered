# WTF Theme Ops Handbook — Phase 4 Production Hardening

## 1. Orientation & Scope
- This repository contains the production Shopify theme for **WTF | Welcome To Florida**. All changes must preserve hardening standards set in Phase 4.
- Before modifying anything, review:
  - [`README.md`](README.md) for environment setup & deploy workflow.
  - [`WTF_Site_Config.md`](WTF_Site_Config.md) for theme settings, installed apps, and integration constraints.
  - [`local-kava-bars-database - Sheet1.csv`](local-kava-bars-database%20-%20Sheet1.csv) when benchmarking competitors for performance, UX, or structured data.
- Keep accessibility (WCAG 2.1 AA), performance (90+ Lighthouse), and SEO (comprehensive JSON-LD) as non-negotiable requirements.

## 2. Sources of Truth
| Artifact | Purpose |
| --- | --- |
| `/docs/` | ADRs, QA checklists, runbooks, metafield dictionaries. Update the relevant ADR when introducing architectural changes or third-party integrations. |
| `/scripts/` | Automation entry points. Every script must stay idempotent and CI-safe. |
| `NAMING_CONVENTIONS.md` | Required naming rules for Liquid, assets, and metafields. |
| `TECHNICAL_DOCUMENTATION.md` | Engineering reference for builder flows and integrations. |
| `TASKS.md` | Live task board; update whenever scope, automation status, or follow-up work changes. |

## 3. Non-Negotiable Delivery Standards
1. **Performance first** – optimize Liquid loops, defer non-critical scripts, and prefer lightweight vanilla JS/Alpine snippets.
2. **Accessibility always** – manage focus, label interactive components, and validate against WCAG 2.1 AA.
3. **SEO excellence** – produce rich JSON-LD schemas for homepage, products, collections, FAQs, and local business data.
4. **Operational safety** – no regressions to checkout, POS, or inventory workflows. Respect existing metafield namespaces (`wtf.settings`).
5. **Documentation parity** – reflect behavior, automation, and dependency shifts in `README.md`, `/docs`, and `TASKS.md`.

## 4. Automation & Quality Gates
| Workflow | Trigger | Manual Command | Notes |
| --- | --- | --- | --- |
| Theme Quality Check (`.github/workflows/theme-quality-check.yml`) | PRs & pushes to `main`, `develop`, `hardening/*` | `npm run theme:check` | Runs Shopify theme-check with fail-on-error, JSON validation, and Liquid linting. |
| CI/CD Pipeline (`ci-cd-pipeline.yml`) | PRs & pushes to `main`, `develop` | `npm run order:readiness` | Installs deps, runs competitor audit, security scan, and order readiness checks. |
| Automated Testing (`automated-testing.yml`) | PRs & `main` | `shopify theme check --fail-level=error` | Guardrail workflow; mirror changes here when updating lint rules. |
| Lighthouse CI (`quality-monitoring.yml`) | Nightly + manual dispatch | _N/A (handled via GitHub workflow)_ | Review artifacts; capture regressions in `TASKS.md`. |
| Security & Dependency Audit (`security-dependency-management.yml`) | PRs + scheduled | _N/A_ | Includes dependency updates, secret scans, and header validation. |
| Order Readiness Audit | PRs & `main` | `node scripts/order-readiness-check.js --ci` | Validates cart, builder paths, schema output. Update script if flows change. |
| Competitor Signal Snapshot | Manual + scheduled (`npm run competitors:audit`) | `npm run competitors:audit` | Parses competitor CSV, writes `/docs/competitor-insights.json`, and posts deltas to PRs. |
| Merge Conflict Scan | Pre-commit | `npm run conflicts:scan` | Fails if conflict markers remain. Required before commit. |
| Pre-commit Hooks (`.githooks/pre-commit`) | Every commit | _Runs automatically_ | Executes theme-check, JSON validation, secret scanning, large file detection. |
| Health Check (`scripts/github-actions-health-check.js`) | Manual | `npm run health:check` | Confirms workflow files are current and enforced. |

> ⚙️ When adding or updating automation, revise this table, document commands in `README.md`, and create/close tasks in `TASKS.md`.

## 5. Day-to-Day Workflow
1. **Plan** – Align with `TASKS.md`. Capture new work, automation findings, or regressions immediately.
2. **Implement** – Commit on `main` with small, focused changes. Follow naming rules and keep Liquid logic modular via snippets.
3. **Validate** – Run relevant `npm` scripts and Shopify CLI checks locally. Address failing hooks before pushing.
4. **Document** – Update reference docs, metafield dictionaries, and changelog notes (PR body + `TASKS.md`).
5. **Handoff** – Provide QA notes, Lighthouse deltas, and outstanding follow-ups in the PR description.

## 6. Implementation Standards
- **Liquid & JSON**: Use section & snippet compositions, guard against empty states, and load metafields via `wtf.settings`. Keep loops lean.
- **JavaScript**: Prefer vanilla JS or Alpine.js. Lazy-load heavy logic using `requestIdleCallback` or `IntersectionObserver`. Never import jQuery.
- **CSS/SCSS**: Scope styles, reuse theme tokens from `config/settings_data.json`, and avoid blocking fonts. Use logical properties for RTL compatibility.
- **Data & SEO**: Emit JSON-LD via `<script type="application/ld+json">` with full schema coverage. Sync structured data with competitor insights.
- **Testing Artifacts**: When fixing automated tests, update fixtures and document behavior changes in `/docs/testing/` if applicable.

## 7. QA & Validation Checklist
- `npm install` (first run) to ensure dependencies are present.
- `npm run conflicts:scan` before staging changes.
- `npm run theme:check` and `node scripts/order-readiness-check.js` for Liquid/cart validation.
- Capture Lighthouse results for UI-impacting changes; attach artifacts to the PR.
- Verify JSON outputs (`config/*.json`, section schema) with a formatter before commit.

## 8. Documentation & Communication
- Update `TASKS.md` with status changes, automation follow-ups, and links to PRs.
- Note any missing scripts or automation gaps in PR bodies and create follow-up tasks.
- Keep `README.md`, `WTF_Site_Config.md`, and relevant `/docs` pages synchronized with code changes.

Staying disciplined with these guidelines keeps the WTF theme production-ready, auditable, and ahead of competitors on performance and SEO.
