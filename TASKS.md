# WTF Theme – Production Task Board

> Maintain this board as the single source of truth for automation upkeep, theme hardening, and follow-up work. Update statuses whenever a task is started, completed, or re-scoped.

## Status Legend
- [ ] Not started
- [~] In progress / needs follow-up
- [x] Complete

## 0. Operational Snapshot
- **Phase**: 4 – Production Hardening & Sustainment
- **Theme health**: Passing theme-check, order readiness audit, and CI workflows.
- **Open risks**: Lighthouse performance improvements (21 non-blocking suggestions) and ongoing competitor monitoring.

## 1. Active Automation Upkeep
- [ ] **Verify workflow integrity** – Run `npm run health:check` and confirm all GitHub Actions use the latest shared steps. Document results in `docs/status/workflow-health-log.md` (create/update as needed).
- [ ] **Order readiness smoke** – Execute `node scripts/order-readiness-check.js --ci` after major cart/builder updates and capture output in PR QA notes.
- [ ] **Competitor signal snapshot** – Schedule `npm run competitors:audit` (weekly) and update `/docs/competitor-insights.json` with notable deltas and action items.
- [ ] **Lighthouse regression watch** – Review nightly `quality-monitoring.yml` artifacts; file follow-up issues here when performance drops below target.
- [ ] **Pre-commit enforcement review** – Audit `.githooks/pre-commit` quarterly to ensure commands match documented standards in `AGENTS.md`.

## 2. Near-Term Enhancements
- [ ] **Automation reporting rollup** – Create `docs/automation/status.md` summarizing workflow coverage, manual triggers, and owner assignments.
- [ ] **Schema regression coverage** – Extend `scripts/order-readiness-check.js` to validate JSON-LD payloads against competitor baseline.
- [ ] **Accessibility regression smoke** – Evaluate adding pa11y CLI to CI (document trade-offs, update ADR if adopted).
- [ ] **Performance budget alerts** – Define Lighthouse performance budgets and integrate thresholds into `quality-monitoring.yml` outputs.

## 3. Monitoring Cadence
| Area | Check | Frequency | Owner | Notes |
| --- | --- | --- | --- | --- |
| Theme validation | `npm run theme:check` | Before each PR | Theme Engineer | Block merges on Liquid errors. |
| Cart & builder | `node scripts/order-readiness-check.js --ci` | Weekly + post-feature | Commerce Engineer | Ensures drink builder + cart flows remain stable. |
| Competitor insights | `npm run competitors:audit` | Weekly | SEO Specialist | Update insights doc and JSON-LD strategies. |
| Workflow health | `npm run health:check` | Monthly | DevOps | Confirms automation parity with documentation. |
| Lighthouse CI | `quality-monitoring.yml` artifacts | Nightly | Performance Engineer | Log regressions in this board. |

## 4. Completed Milestones
- [x] Theme audit & validation
- [x] Schema regression tests
- [x] Drink builder performance pass
- [x] 2Accept gateway QA + Lightspeed sync dry run
- [x] Documentation overhaul & naming convention standardization
- [x] Quality automation implementation (44 automated corrections applied)

Keep this board updated alongside PRs. Close tasks only after documentation and automation updates are merged.
