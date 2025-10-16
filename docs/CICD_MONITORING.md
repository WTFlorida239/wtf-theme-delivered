# CI/CD Monitoring & Automated SEO Checks

**Site**: https://wtfswag.com/  
**Date**: 2025-10-16  
**Phase**: Phase 7 - CI/CD Monitoring  
**Branch**: feat/seo-phase3-7-performance-content

---

## Executive Summary

This document outlines the automated monitoring and CI/CD checks implemented to maintain SEO health and prevent regressions. All checks run automatically on PRs, pushes to main, and weekly schedules.

---

## CI/CD Components

### 1. Lighthouse CI Workflow

**File**: `.github/workflows/lighthouse-ci.yml`

**Purpose**: Run Lighthouse audits on every PR and push to main

**Triggers**:
- Pull requests to `main`
- Pushes to `main`
- Weekly schedule (Monday 9 AM UTC)
- Manual dispatch

**What it checks**:
- ✅ Performance score (threshold: 70+)
- ✅ Accessibility score (threshold: 90+)
- ✅ Best Practices score (threshold: 90+)
- ✅ SEO score (threshold: 90+)
- ✅ Core Web Vitals (LCP, CLS, TBT)
- ✅ Image optimization
- ✅ Text compression
- ✅ Font loading

**Outputs**:
- Lighthouse reports (uploaded as artifacts)
- PR comments with scores
- Pass/fail based on thresholds

---

### 2. SEO Validation Checks

**File**: `.github/workflows/lighthouse-ci.yml` (job: `seo-checks`)

**Purpose**: Validate SEO compliance and content quality

**What it checks**:
- ✅ **Medical claims**: Scans for prohibited terms (treats, cures, heals, etc.)
- ✅ **Age restrictions**: Verifies 21+ mentions in content
- ✅ **Schema markup**: Validates required schema files exist
- ✅ **Canonical tags**: Checks for canonical tag in seo-head.liquid
- ✅ **Meta descriptions**: Verifies meta description exists
- ✅ **Open Graph tags**: Checks for required OG tags (title, description, image, url, type)

**Prohibited Terms**:
- treats
- cures
- heals
- therapeutic
- medical benefits
- health benefits
- relieves pain
- reduces anxiety
- helps with depression
- anti-inflammatory
- antioxidant

**Action**: Fails PR if medical claims found

---

### 3. Internal Link Checker

**File**: `.github/workflows/lighthouse-ci.yml` (job: `link-checker`)

**Purpose**: Detect broken internal links

**What it checks**:
- ✅ Empty href attributes (`href=""`)
- ✅ Placeholder links (`href="#"`)
- ✅ Extracts all internal links for review

**Action**: Warns if issues found

---

### 4. Performance Budget Check

**File**: `.github/workflows/lighthouse-ci.yml` (job: `performance-budget`)

**Purpose**: Prevent file bloat

**What it checks**:
- ✅ Snippet file sizes (max 50KB per file)
- ✅ Critical CSS size (max 10KB)

**Action**: Warns if files exceed budget

---

### 5. Weekly SEO Health Check

**File**: `scripts/weekly-seo-check.sh`

**Purpose**: Comprehensive weekly SEO audit

**What it checks**:
1. **Site Accessibility**: HTTP status code
2. **HTTPS**: SSL certificate
3. **robots.txt**: Accessibility and content
4. **Sitemap**: Accessibility and URL count
5. **Meta Tags**: Title, description, canonical, OG, Twitter
6. **Structured Data**: JSON-LD schema presence
7. **Mobile Optimization**: Viewport meta tag
8. **Performance**: Page load time
9. **Common Issues**: noindex, nofollow tags

**Output**: Markdown report in `docs/seo-reports/`

**Health Score**: Calculated from errors, warnings, successes

**Usage**:
```bash
./scripts/weekly-seo-check.sh
```

**Schedule**: Run weekly (can be automated via cron or GitHub Actions)

---

## Lighthouse CI Configuration

**File**: `.lighthouserc.json`

**URLs Audited**:
1. Homepage: `https://wtfswag.com/`
2. Kava Collection: `https://wtfswag.com/collections/kava-drinks`
3. Kratom Collection: `https://wtfswag.com/collections/kratom-teas`
4. THC Collection: `https://wtfswag.com/collections/thc-drinks`
5. Sample Product: `https://wtfswag.com/products/barneys-12mg-pack-of-10`

**Settings**:
- **Runs per URL**: 3 (median score used)
- **Device**: Desktop
- **Throttling**: Desktop (fast 3G)
- **Screen**: 1350×940

**Assertions**:
- Performance: ≥70 (error if below)
- Accessibility: ≥90 (warn if below)
- Best Practices: ≥90 (warn if below)
- SEO: ≥90 (error if below)
- CLS: ≤0.1 (error if above)
- LCP: ≤3000ms (warn if above)
- FCP: ≤2000ms (warn if above)

---

## How to Use

### Running Lighthouse CI Locally

```bash
# Install Lighthouse CI
npm install -g @lhci/cli

# Run audit
lhci autorun --config=.lighthouserc.json
```

### Running Weekly SEO Check

```bash
# Make script executable (first time only)
chmod +x scripts/weekly-seo-check.sh

# Run check
./scripts/weekly-seo-check.sh

# View report
cat docs/seo-reports/seo-report-$(date +%Y-%m-%d).md
```

### Viewing Lighthouse Reports in CI

1. Go to GitHub Actions → Lighthouse CI workflow
2. Click on a run
3. Download "lighthouse-reports" artifact
4. Open `.lighthouseci/` folder
5. View HTML reports in browser

---

## Thresholds & Budgets

### Performance Budgets

| Resource | Max Size | Current |
|----------|----------|---------|
| Snippet files | 50KB | ~10-20KB |
| Critical CSS | 10KB | ~8KB |
| Total page size | 2MB | TBD |
| JavaScript | 500KB | TBD |
| Images | 1MB | TBD |

### Lighthouse Thresholds

| Category | Threshold | Action |
|----------|-----------|--------|
| Performance | ≥70 | Error if below |
| Accessibility | ≥90 | Warn if below |
| Best Practices | ≥90 | Warn if below |
| SEO | ≥90 | Error if below |

### Core Web Vitals

| Metric | Good | Needs Improvement | Poor |
|--------|------|-------------------|------|
| LCP | ≤2.5s | 2.5-4.0s | >4.0s |
| FID/INP | ≤100ms | 100-300ms | >300ms |
| CLS | ≤0.1 | 0.1-0.25 | >0.25 |

---

## Monitoring Schedule

### Automated (GitHub Actions)

- **On PR**: Lighthouse CI + SEO checks + Link checker + Performance budget
- **On Push to Main**: Same as PR
- **Weekly (Monday 9 AM UTC)**: Lighthouse CI

### Manual (Weekly)

- **Monday**: Run `weekly-seo-check.sh`
- **Review**: Check Google Search Console for errors
- **Review**: Check Core Web Vitals in GSC
- **Review**: Check Analytics for traffic drops

### Manual (Monthly)

- **Full site crawl**: Use Screaming Frog
- **Redirect audit**: Check for chains/loops
- **Content audit**: Review new products/collections for SEO
- **Schema validation**: Use Google Rich Results Test

---

## Alerts & Notifications

### GitHub Actions Failures

**When**: PR fails Lighthouse CI or SEO checks

**Action**:
1. Check GitHub Actions logs
2. Identify failing check
3. Fix issue in PR
4. Push new commit (re-runs checks)

### Weekly SEO Report

**When**: Weekly SEO check completes

**Action**:
1. Review report in `docs/seo-reports/`
2. If health score <70: Investigate errors
3. If health score 70-90: Address warnings
4. If health score >90: Monitor trends

### Google Search Console

**When**: New errors appear in GSC

**Action**:
1. Check Coverage report for 404s
2. Check Core Web Vitals for regressions
3. Check Manual Actions for penalties
4. Fix issues and request re-indexing

---

## Troubleshooting

### Lighthouse CI Fails on PR

**Symptom**: PR blocked by failing Lighthouse check

**Causes**:
1. SEO score <90
2. Performance score <70
3. CLS >0.1

**Solutions**:
1. Check Lighthouse report artifact
2. Identify failing audit
3. Fix issue (e.g., add missing meta tag, optimize image)
4. Push fix to PR

---

### SEO Checks Fail (Medical Claims)

**Symptom**: PR blocked by medical claims check

**Causes**:
- Prohibited terms in snippets/docs

**Solutions**:
1. Check GitHub Actions logs for term found
2. Replace with neutral language
3. Push fix to PR

**Example**:
```
❌ "Kava treats anxiety"
✅ "Kava is enjoyed for relaxation"
```

---

### Weekly SEO Check Shows Errors

**Symptom**: Health score <70

**Causes**:
- Missing meta tags
- Broken robots.txt
- Site inaccessible
- noindex on homepage

**Solutions**:
1. Review report for specific errors
2. Fix issues in theme files
3. Deploy to production
4. Re-run check to verify

---

## Maintenance

### Weekly Tasks
- [ ] Run `weekly-seo-check.sh`
- [ ] Review Lighthouse CI results
- [ ] Check Google Search Console for errors

### Monthly Tasks
- [ ] Review performance budgets
- [ ] Update Lighthouse thresholds (if needed)
- [ ] Audit redirect list
- [ ] Check for new prohibited terms

### Quarterly Tasks
- [ ] Full site crawl with Screaming Frog
- [ ] Review and update monitoring scripts
- [ ] Audit CI/CD workflow efficiency
- [ ] Update documentation

---

## Metrics & KPIs

### CI/CD Health

| Metric | Target | Current |
|--------|--------|---------|
| PR pass rate | >90% | TBD |
| Avg. Lighthouse score | >85 | TBD |
| SEO check failures | <5% | TBD |
| Weekly report health | >80 | TBD |

### SEO Health

| Metric | Target | Current |
|--------|--------|---------|
| Indexed pages | 100+ | ~50 |
| Avg. position | <10 | ~15 |
| Organic traffic | 2,000/mo | ~500/mo |
| Core Web Vitals pass | >75% | TBD |

---

## Future Enhancements

### Phase 8 (Future)

1. **Automated Schema Validation**: Use Google's Structured Data Testing Tool API
2. **Broken Link Monitoring**: Crawl site weekly for 404s
3. **Competitor Monitoring**: Track competitor rankings
4. **Keyword Tracking**: Monitor target keyword positions
5. **Backlink Monitoring**: Track new/lost backlinks
6. **Content Freshness**: Alert when content is >6 months old
7. **Image Optimization**: Auto-compress images in CI
8. **Accessibility Testing**: Automated a11y checks

---

## Resources

### Tools
- **Lighthouse CI**: https://github.com/GoogleChrome/lighthouse-ci
- **Screaming Frog**: https://www.screamingfrogseoseo.com/
- **Google Search Console**: https://search.google.com/search-console
- **Google Rich Results Test**: https://search.google.com/test/rich-results
- **PageSpeed Insights**: https://pagespeed.web.dev/

### Documentation
- **Lighthouse Scoring**: https://developer.chrome.com/docs/lighthouse/performance/performance-scoring
- **Core Web Vitals**: https://web.dev/vitals/
- **Shopify SEO**: https://help.shopify.com/en/manual/promoting-marketing/seo

---

## Revision History

| Date | Changes | Author |
|------|---------|--------|
| 2025-10-16 | Initial CI/CD monitoring setup | Manus AI |

---

**Status**: ✅ Phase 7 Complete - Monitoring Active
