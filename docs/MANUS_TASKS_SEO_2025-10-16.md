# WTFSEO: Manus Execution Plan (2025-10-16)

Owner: Manus AI (with GitHub + Shopify Admin connectors)
Scope: Shopify Online Store 2.0 theme “wtf-theme-delivered”
Goal: Maximize organic search visibility, rich results, and social share quality while staying policy-compliant for hemp/THC.

---

## Phase 0 — Guardrails & Baselines

- [ ] **Confirm policies & constraints matrix (hemp/THC):** Compile a short internal brief of what’s allowed per platform (Meta/Instagram, TikTok, YouTube, X). Note region differences; default to US. Link to official docs in the brief.
  - Sources to reference when writing brief:
    - Shopify SEO metadata & theme SEO docs.  
    - Google Product structured data guidelines.  
    - Shopify robots.txt customization guidance.  
    - Meta/Instagram “unsafe substances” ad rules (CBD/hemp limits).  
    - TikTok Advertising Policies (Healthcare/Pharma; Dangerous Products).  
    - YouTube regulated goods & ad-suitability rules.
- [ ] **Create `/docs/SEO_BASELINE.md`** with current metrics (Lighthouse/PSI desktop & mobile, LCP/CLS/INP, indexed pages, GSC sitemap status).

Deliverables:
- `/docs/POLICY_MATRIX_SOCIALS.md`
- `/docs/SEO_BASELINE.md`

---

## Phase 1 — Indexability & Metadata (highest ROI)

- [ ] **Head meta system (Liquid)**: centralize `<title>`, meta description, canonical, robots, OG, and Twitter cards in one snippet and include in `layout/theme.liquid`.
  - Titles/descriptions pull from page/product/collection/blog objects; fallbacks from theme settings/metafields.
  - Canonicals on all templates; prevent duplicate variants/querystrings.
  - OG/Twitter default images + per-resource override (metafields).
- [ ] **robots.txt.liquid**: add template and keep Shopify defaults; only add targeted disallows if needed (e.g., internal test pages, UTM param traps).  
- [ ] **Sitemap**: Verify Shopify sitemap is reachable; add it to GSC. Ensure no soft-404s/blocked important pages.

Deliverables:
- `snippets/seo-head.liquid`
- `layout/theme.liquid` inclusion
- `templates/robots.txt.liquid`
- `/docs/SEO_METADATA_PLAYBOOK.md`

---

## Phase 2 — Structured Data (rich results)

- [ ] **Product JSON-LD**: Inject compliant `Product` schema with `offers`, `availability`, `price`, `brand`, and `aggregateRating` (if reviews exist). Respect policy: avoid medical/therapeutic claims.
- [ ] **BreadcrumbList** on all hierarchical pages.
- [ ] **Organization** markup (logo, sameAs to official socials).
- [ ] Validate on Google Rich Results test; add screenshots to docs.

Deliverables:
- `snippets/schema-product.liquid`
- `snippets/schema-breadcrumbs.liquid`
- `snippets/schema-organization.liquid`
- `/docs/SCHEMA_VALIDATION_REPORT.md`

---

## Phase 3 — Performance & CWV

- [ ] **Responsive images**: Add `srcset`/`sizes` and WebP/AVIF where supported.
- [ ] **Lazy-load non-critical** images/iframes; defer non-critical JS; inline critical CSS for above-the-fold hero.
- [ ] **Minify & split** theme JS/CSS; remove dead assets; ensure no blocking third-party scripts before first paint.

Deliverables:
- Optimized assets under `/assets/`
- `/docs/PERF_BEFORE_AFTER.md` with metrics deltas

---

## Phase 4 — Content Depth & Internal Links

- [ ] **Collections & product SEO blocks**: Add configurable “SEO summary” and “FAQ” blocks (metafields) to collections/products; render as semantic HTML below fold.
- [ ] **Internal linking**: Add “Related Collections” and “You may also like” with keyword-aware anchors (liquid logic or JSON mapping).
- [ ] **Blog engine**: Use existing `BLOG_SETUP_GUIDE.md`; auto-generate topic clusters (Kratom, Kava, Legal Hemp, Apparel), each with pillar + 4 spokes; cross-link to relevant collections/products.

Deliverables:
- `sections/collection-seo-content.liquid`
- `sections/product-faqs.liquid`
- `/docs/CONTENT_MAP_TOPICS.md`
- 6–10 draft posts in `/content/blog/` (Markdown)

---

## Phase 5 — Social Share Optimization

- [ ] **OG/Twitter images**: Ensure 1200×630 fallback + template for per-page artwork; add brand mark and product/collection name overlays (build script in `scripts/` or use Shopify metafield upload).
- [ ] **Share buttons & UTM**: Add privacy-safe share buttons with canonical links and clean UTM for campaigns (do not index UTM versions).

Deliverables:
- `assets/og-default.jpg` + per-template logic
- `snippets/share-buttons.liquid`

---

## Phase 6 — Redirects & Canonicals Clean-up

- [ ] Map duplicate paths, trailing slashes, case variants, legacy paths. Add Shopify URL redirects in Admin or via CSV.
- [ ] Ensure canonical consistency across product variant URLs and filtered collections.

Deliverables:
- `/docs/REDIRECT_MAP.csv`

---

## Phase 7 — Monitoring & Automation

- [ ] **Add CI checks**: Lighthouse CI (mobile), schema validator, broken links, image weight budget.
- [ ] **Weekly SEO smoke test** workflow: fails on missing `<title>`, missing canonical, OG image absent, or schema errors.

Deliverables:
- `.github/workflows/seo-ci.yml`
- `.github/workflows/weekly-seo-audit.yml`

---

## Acceptance Criteria (per phase)

- Titles unique; ≤60 chars; meta desc present; canonical present; OG/Twitter present with valid image
- Robots default with minimal custom rules; sitemap indexed in GSC
- Product/Breadcrumb/Org schema validates without critical errors
- CWV: LCP ≤2.5s (mobile), CLS ≤0.1, INP ≤200ms on key templates
- Each collection/product has at least one SEO paragraph and 3+ internal links to relevant pages
- OG templates render distinct previews per page
- CI pipelines green; weekly audit passes with no broken links

