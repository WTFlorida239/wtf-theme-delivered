# Redirects & Canonicals Management - WTF | Welcome To Florida

**Site**: https://wtfswag.com/  
**Date**: 2025-10-16  
**Phase**: Phase 6 - Redirects & Canonicals Cleanup  
**Branch**: feat/seo-phase3-7-performance-content

---

## Executive Summary

This document outlines redirect management and canonical URL strategy for wtfswag.com. Proper redirects prevent 404 errors and preserve link equity; canonical tags prevent duplicate content issues.

---

## Canonical URL Strategy

### Current Implementation ✅

**File**: `snippets/seo-head.liquid`

```liquid
<link rel="canonical" href="{{ canonical_url }}">
```

**Shopify's `canonical_url` automatically**:
- ✅ Strips query parameters (`?variant=123`, `?utm_source=facebook`)
- ✅ Points to main product URL (not variant-specific)
- ✅ Maintains HTTPS protocol
- ✅ Removes trailing slashes

### Canonical Rules

#### Product Pages
**Canonical**: Main product URL  
**Example**: `https://wtfswag.com/products/kratom-tea`

**Variants**: All variants point to main product URL
- `/products/kratom-tea?variant=123` → `/products/kratom-tea`
- `/products/kratom-tea?variant=456` → `/products/kratom-tea`

#### Collection Pages
**Canonical**: Main collection URL  
**Example**: `https://wtfswag.com/collections/kava-drinks`

**Filters/Sorting**: All filtered views point to main collection
- `/collections/kava-drinks?sort_by=price-ascending` → `/collections/kava-drinks`
- `/collections/kava-drinks?filter.v.price.gte=10` → `/collections/kava-drinks`

#### Pagination
**Canonical**: Each page has its own canonical  
**Robots**: Page 2+ has `noindex, follow`

**Example**:
- Page 1: `<link rel="canonical" href="/collections/kava-drinks">`
- Page 2: `<link rel="canonical" href="/collections/kava-drinks?page=2">` + `<meta name="robots" content="noindex, follow">`

#### Blog Posts
**Canonical**: Main article URL  
**Example**: `https://wtfswag.com/blogs/news/what-is-kava`

#### Custom Pages
**Canonical**: Page URL  
**Example**: `https://wtfswag.com/pages/faq`

---

## Redirect Management

### Shopify URL Redirects

**Location**: Shopify Admin → Online Store → Navigation → URL Redirects

**Current Redirects**: (to be audited)

### Common Redirect Scenarios

#### 1. Product Handle Changes
**Scenario**: Product renamed from "Green Kratom" to "Premium Green Kratom Tea"

**Old URL**: `/products/green-kratom`  
**New URL**: `/products/premium-green-kratom-tea`

**Redirect Type**: 301 (permanent)

**Setup**:
```
Redirect from: /products/green-kratom
Redirect to: /products/premium-green-kratom-tea
```

---

#### 2. Collection Handle Changes
**Scenario**: Collection renamed from "THC Products" to "THC Drinks"

**Old URL**: `/collections/thc-products`  
**New URL**: `/collections/thc-drinks`

**Redirect Type**: 301 (permanent)

**Setup**:
```
Redirect from: /collections/thc-products
Redirect to: /collections/thc-drinks
```

---

#### 3. Page Deletions
**Scenario**: Old "About Us" page replaced with new "About WTF" page

**Old URL**: `/pages/about-us`  
**New URL**: `/pages/about-wtf`

**Redirect Type**: 301 (permanent)

**Setup**:
```
Redirect from: /pages/about-us
Redirect to: /pages/about-wtf
```

---

#### 4. Blog Post Moves
**Scenario**: Blog post moved from "News" to "Education" blog

**Old URL**: `/blogs/news/what-is-kava`  
**New URL**: `/blogs/education/what-is-kava`

**Redirect Type**: 301 (permanent)

**Setup**:
```
Redirect from: /blogs/news/what-is-kava
Redirect to: /blogs/education/what-is-kava
```

---

#### 5. HTTP to HTTPS
**Scenario**: All HTTP traffic should redirect to HTTPS

**Shopify Default**: ✅ Automatic (no manual setup needed)

**Example**:
- `http://wtfswag.com/` → `https://wtfswag.com/`

---

#### 6. Non-WWW to WWW (or vice versa)
**Scenario**: Standardize on non-www

**Shopify Default**: ✅ Automatic (based on primary domain setting)

**Example**:
- `https://www.wtfswag.com/` → `https://wtfswag.com/`

---

### Redirect Audit Checklist

#### Step 1: Export Current Redirects
1. Go to Shopify Admin → Online Store → Navigation → URL Redirects
2. Export to CSV
3. Review for:
   - Redirect chains (A → B → C)
   - Redirect loops (A → B → A)
   - Broken redirects (404 destinations)

#### Step 2: Check for 404 Errors
1. Go to Google Search Console → Coverage
2. Filter by "Not found (404)"
3. For each 404:
   - If URL should exist: Fix the page
   - If URL is old: Create redirect to relevant page
   - If URL is spam/invalid: Leave as 404 (no redirect)

#### Step 3: Audit Canonical Tags
1. Use Screaming Frog SEO Spider
2. Crawl https://wtfswag.com/
3. Check "Canonicals" tab
4. Look for:
   - Missing canonical tags
   - Self-referencing canonicals (good)
   - Cross-domain canonicals (bad, unless intentional)
   - Non-indexable canonicals (check if intended)

---

## Redirect Best Practices

### ✅ DO

1. **Use 301 redirects** for permanent moves
2. **Redirect to most relevant page** (not always homepage)
3. **Update internal links** instead of relying on redirects
4. **Monitor redirect chains** (max 1 hop)
5. **Test redirects** after implementation
6. **Document redirects** in a spreadsheet

### ❌ DON'T

1. **Don't redirect to homepage** unless no relevant alternative
2. **Don't create redirect chains** (A → B → C)
3. **Don't create redirect loops** (A → B → A)
4. **Don't use 302 redirects** for permanent moves
5. **Don't redirect to 404 pages**
6. **Don't over-redirect** (keep under 100 redirects if possible)

---

## Redirect Scenarios for WTF

### Scenario 1: Old Product URLs (if any)

**Check**: Are there old product URLs in Google Search Console?

**Action**: Create redirects to current products or collections

**Example**:
```
/products/old-kava-drink → /collections/kava-drinks
/products/discontinued-item → /collections/all
```

---

### Scenario 2: Seasonal Collections

**Check**: Do seasonal collections (e.g., "Summer Drinks") need redirects after season ends?

**Action**: Redirect to main collection or homepage

**Example**:
```
/collections/summer-drinks → /collections/all
/collections/holiday-specials → /
```

---

### Scenario 3: Campaign Landing Pages

**Check**: Are there old campaign landing pages (e.g., `/pages/promo-2024`)?

**Action**: Redirect to current promotions or homepage

**Example**:
```
/pages/promo-2024 → /pages/current-promotions
/pages/old-event → /pages/events
```

---

### Scenario 4: Duplicate Content

**Check**: Are there multiple URLs for the same content?

**Action**: Choose canonical version, redirect others

**Example**:
```
/pages/faq → /pages/frequently-asked-questions (keep this one)
/pages/faqs → /pages/frequently-asked-questions (redirect)
/pages/questions → /pages/frequently-asked-questions (redirect)
```

---

## Canonical Tag Audit

### Pages to Check

1. **Homepage**: `https://wtfswag.com/`
   - ✅ Should have: `<link rel="canonical" href="https://wtfswag.com/">`

2. **Product Pages**: `/products/*`
   - ✅ Should have: `<link rel="canonical" href="https://wtfswag.com/products/[handle]">`
   - ✅ Variants should point to main product URL

3. **Collection Pages**: `/collections/*`
   - ✅ Should have: `<link rel="canonical" href="https://wtfswag.com/collections/[handle]">`
   - ✅ Filtered/sorted views should point to main collection URL

4. **Blog Posts**: `/blogs/*/[article]`
   - ✅ Should have: `<link rel="canonical" href="https://wtfswag.com/blogs/[blog]/[article]">`

5. **Custom Pages**: `/pages/*`
   - ✅ Should have: `<link rel="canonical" href="https://wtfswag.com/pages/[handle]">`

---

## Implementation Checklist

### Phase 6 Tasks

- [x] Document canonical URL strategy
- [x] Document redirect best practices
- [ ] Audit current redirects in Shopify Admin
- [ ] Check Google Search Console for 404 errors
- [ ] Create redirects for any broken URLs
- [ ] Audit canonical tags with Screaming Frog
- [ ] Update internal links to avoid redirects
- [ ] Test all redirects (200 → 301 → 200)

---

## Monitoring

### Weekly Tasks
- [ ] Check Google Search Console for new 404 errors
- [ ] Review redirect report in Shopify Admin

### Monthly Tasks
- [ ] Audit redirect chains (should be 0)
- [ ] Check for redirect loops (should be 0)
- [ ] Review canonical tags on new pages

### Quarterly Tasks
- [ ] Full site crawl with Screaming Frog
- [ ] Export and review all redirects
- [ ] Clean up unnecessary redirects (>1 year old)

---

## Tools

### Redirect Testing
- **Chrome DevTools**: Network tab → Check status codes
- **Redirect Checker**: https://httpstatus.io/
- **Screaming Frog**: Bulk redirect testing

### Canonical Testing
- **View Source**: Check `<link rel="canonical">` tag
- **Google Search Console**: URL Inspection tool
- **Screaming Frog**: Canonicals report

---

## Current Status

### Canonical Tags
- ✅ **Implemented**: `seo-head.liquid` includes canonical tag
- ✅ **Shopify Default**: Handles variants, filters, sorting automatically
- ✅ **Pagination**: Handled in `seo-head.liquid` (noindex page 2+)

### Redirects
- ⚠️ **Audit Needed**: Check Shopify Admin for current redirects
- ⚠️ **404 Check Needed**: Review Google Search Console
- ⚠️ **Redirect Chains**: Need to check for chains/loops

---

## Redirect Template (CSV)

```csv
Redirect from,Redirect to,Type,Notes
/products/old-product,/products/new-product,301,Product renamed
/collections/old-collection,/collections/new-collection,301,Collection renamed
/pages/old-page,/pages/new-page,301,Page moved
/blogs/old-blog/article,/blogs/new-blog/article,301,Blog restructure
```

**Import**: Shopify Admin → Online Store → Navigation → URL Redirects → Import

---

## Revision History

| Date | Changes | Author |
|------|---------|--------|
| 2025-10-16 | Initial redirects & canonicals guide | Manus AI |

---

**Status**: ✅ Phase 6 Documentation Complete - Audit Required
