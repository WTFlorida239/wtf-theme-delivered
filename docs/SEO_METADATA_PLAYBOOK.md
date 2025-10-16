# SEO Metadata Playbook - WTF | Welcome To Florida

**Document Owner**: Manus AI  
**Last Updated**: 2025-10-16  
**Phase**: Phase 1 - Indexability & Metadata  
**Branch**: feat/seo-hardening-2025-10

---

## Overview

This playbook documents the centralized SEO metadata system implemented in `snippets/seo-head.liquid`. All title tags, meta descriptions, canonical URLs, Open Graph tags, Twitter Cards, and geo/local meta tags are managed through this single snippet.

---

## Architecture

### Central Snippet: `snippets/seo-head.liquid`

**Purpose**: Single source of truth for all SEO-related `<head>` meta tags

**Inclusion**: `{% render 'seo-head' %}` in `layout/theme.liquid`

**Features**:
- Dynamic title/description per template type
- Canonical URL handling (strips variants/UTM)
- Open Graph + Twitter Cards
- Geo/local meta tags for Cape Coral
- Robots meta control
- Fallbacks from metafields/settings
- Product-specific OG tags
- Pagination handling (noindex on page 2+)

---

## Title Tag Logic

### Homepage
```liquid
Cape Coral's Premier Kava Bar | WTF | Welcome To Florida | Best Kava Drinks & Kratom Teas in Southwest Florida
```
- **Max Length**: 60 chars (truncated for mobile)
- **Keywords**: kava bar, Cape Coral, kratom teas, Southwest Florida

### Product Pages
```liquid
{{ product.title }} | WTF | Welcome To Florida
```
- **Fallback**: `product.metafields.seo.title` if set
- **Example**: "Barney's 12mg THC Gummies | WTF | Welcome To Florida"

### Collection Pages
```liquid
{{ collection.title }} | WTF | Welcome To Florida
```
- **Fallback**: `collection.metafields.seo.title` if set
- **Example**: "Kratom Teas | WTF | Welcome To Florida"

### Blog Posts
```liquid
{{ article.title }} | WTF | Welcome To Florida Blog
```
- **Example**: "What is Kava? | WTF | Welcome To Florida Blog"

### Custom Pages
```liquid
{{ page.title }} | WTF | Welcome To Florida
```
- **Fallback**: `page.metafields.seo.title` if set
- **Example**: "FAQ | WTF | Welcome To Florida"

---

## Meta Description Logic

### Homepage
```
Cape Coral's premier kava bar offering custom kava drinks, kratom teas, THC beverages, and sober nightlife. Located at 1520 SE 46th Ln, serving Cape Coral, Fort Myers, and Southwest Florida.
```
- **Length**: 155 chars (optimal for Google)
- **Includes**: Location, products, service area

### Product Pages
- **Priority 1**: `product.metafields.seo.description`
- **Priority 2**: `product.description` (stripped, truncated to 155 chars)
- **Example**: "Premium 12mg Delta-9 THC gummies in Cape Coral. Lab-tested, 21+ only. 10-pack available for pickup or delivery."

### Collection Pages
- **Priority 1**: `collection.metafields.seo.description`
- **Priority 2**: `collection.description` (stripped, truncated)
- **Example**: "Premium kratom teas in Cape Coral. Choose from green, red, white, and yellow strains with custom flavors."

### Blog Posts
- **Priority 1**: `article.excerpt`
- **Priority 2**: `article.content` (first 155 chars)

### Custom Pages
- **Priority 1**: `page.metafields.seo.description`
- **Priority 2**: `page.content` (first 155 chars)

---

## Canonical URL Handling

### Purpose
Prevent duplicate content issues from:
- Product variants (`?variant=123456`)
- UTM parameters (`?utm_source=facebook`)
- Tracking codes
- Pagination

### Implementation
```liquid
<link rel="canonical" href="{{ canonical_url }}">
```

**Shopify's `canonical_url`** automatically:
- Strips query parameters
- Points to the main product URL (not variant-specific)
- Maintains HTTPS protocol

### Pagination Handling
```liquid
{%- if current_page > 1 -%}
  <meta name="robots" content="noindex, follow">
{%- endif -%}
```
- Page 1: Indexed
- Page 2+: Not indexed (prevents duplicate content)

---

## Open Graph Tags

### Standard Tags (All Pages)
```html
<meta property="og:site_name" content="WTF | Welcome To Florida">
<meta property="og:title" content="...">
<meta property="og:description" content="...">
<meta property="og:url" content="{{ canonical_url }}">
<meta property="og:type" content="website|product|article">
<meta property="og:locale" content="en_US">
```

### Product-Specific Tags
```html
<meta property="product:price:amount" content="9.00">
<meta property="product:price:currency" content="USD">
<meta property="product:availability" content="in stock">
<meta property="product:brand" content="WTF | Welcome To Florida">
```

### Image Optimization
```html
<meta property="og:image" content="https://cdn.shopify.com/.../image.jpg?width=1200&height=630">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="1200">
<meta property="og:image:alt" content="...">
```

**Image Priority**:
1. Product page: `product.featured_image`
2. Collection page: `collection.image`
3. Blog post: `article.image`
4. Fallback: `settings.og_default` or `settings.logo`

**Dimensions**: 1200×630 (Facebook/LinkedIn recommended)

---

## Twitter Cards

### Card Type
```html
<meta name="twitter:card" content="summary_large_image">
```

**Why `summary_large_image`?**
- Shows large image preview (better engagement)
- Works for products, articles, pages
- Recommended by Twitter for e-commerce

### Twitter-Specific Tags
```html
<meta name="twitter:title" content="...">
<meta name="twitter:description" content="...">
<meta name="twitter:image" content="...">
<meta name="twitter:image:alt" content="...">
```

### Twitter Handle (Optional)
```html
<meta name="twitter:site" content="@wtfswagbrand">
```
- **Metafield**: `shop.metafields.social.twitter_handle`
- **Setup**: Add metafield in Shopify Admin

---

## Geo/Local Meta Tags

### Purpose
Help Google understand physical location for local search rankings

### Tags Included
```html
<meta name="geo.region" content="US-FL">
<meta name="geo.placename" content="Cape Coral">
<meta name="geo.position" content="26.5629;-81.9495">
<meta name="ICBM" content="26.5629, -81.9495">
```

### Business-Specific (Homepage Only)
```html
<meta property="business:contact_data:street_address" content="1520 SE 46th Ln, Unit B">
<meta property="business:contact_data:locality" content="Cape Coral">
<meta property="business:contact_data:region" content="FL">
<meta property="business:contact_data:postal_code" content="33904">
<meta property="business:contact_data:country_name" content="USA">
<meta property="place:location:latitude" content="26.5629">
<meta property="place:location:longitude" content="-81.9495">
```

---

## Robots Meta Tag Logic

### Default (Most Pages)
```html
<meta name="robots" content="index, follow">
```

### Search Pages
```html
<meta name="robots" content="noindex, follow">
```
- **Reason**: Prevent indexing of search result pages (duplicate content)

### Cart/Checkout
```html
<meta name="robots" content="noindex, nofollow">
```
- **Reason**: No SEO value; contains user-specific data

### Account Pages
```html
<meta name="robots" content="noindex, nofollow">
```
- **Reason**: Private user data

### Pagination (Page 2+)
```html
<meta name="robots" content="noindex, follow">
```
- **Reason**: Prevent duplicate content; allow crawling of links

---

## Performance Optimizations

### Preconnect Hints
```html
<link rel="preconnect" href="https://cdn.shopify.com" crossorigin>
<link rel="preconnect" href="https://fonts.googleapis.com" crossorigin>
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
```

**Benefits**:
- Faster DNS resolution
- Reduced latency for CDN assets
- Improved LCP (Largest Contentful Paint)

### Mobile Alternate
```html
<link rel="alternate" media="only screen and (max-width: 640px)" href="{{ canonical_url }}">
```

**Purpose**: Signal to Google that site is responsive (not separate mobile URL)

---

## Metafield Setup Guide

### SEO Title Metafield

**Namespace**: `seo`  
**Key**: `title`  
**Type**: Single line text  
**Where**: Products, Collections, Pages

**Example**:
```
Best Kratom Tea in Cape Coral | Premium Green Kratom | WTF
```

### SEO Description Metafield

**Namespace**: `seo`  
**Key**: `description`  
**Type**: Multi-line text  
**Where**: Products, Collections, Pages

**Example**:
```
Premium green kratom tea in Cape Coral, FL. Handcrafted with your choice of flavor. Lab-tested, 21+ only. Order online for pickup or enjoy in our lounge.
```

### Twitter Handle Metafield

**Namespace**: `social`  
**Key**: `twitter_handle`  
**Type**: Single line text  
**Where**: Shop settings

**Example**:
```
wtfswagbrand
```

### OG Default Image Setting

**Setting**: `og_default`  
**Type**: Image  
**Dimensions**: 1200×630  
**Where**: Theme settings

---

## Testing Checklist

### Homepage
- [ ] Title ≤60 chars
- [ ] Description ≤155 chars
- [ ] Canonical URL present
- [ ] OG tags present
- [ ] Twitter Card present
- [ ] Geo tags present
- [ ] Business tags present
- [ ] OG image 1200×630

### Product Page
- [ ] Title includes product name
- [ ] Description from product or metafield
- [ ] Canonical strips variant param
- [ ] OG type = "product"
- [ ] Product price/availability in OG
- [ ] Product image in OG/Twitter
- [ ] Image 1200×630

### Collection Page
- [ ] Title includes collection name
- [ ] Description from collection or metafield
- [ ] Canonical present
- [ ] OG type = "website"
- [ ] Collection image in OG/Twitter
- [ ] BreadcrumbList schema present

### Blog Post
- [ ] Title includes article title + "Blog"
- [ ] Description from excerpt or content
- [ ] Canonical present
- [ ] OG type = "article"
- [ ] Article image in OG/Twitter
- [ ] BreadcrumbList schema present

### Pagination
- [ ] Page 2+ has noindex
- [ ] Canonical points to page 1
- [ ] Follow enabled (for link crawling)

---

## Validation Tools

### Google Rich Results Test
https://search.google.com/test/rich-results

**Test**:
- Homepage
- 1 product page
- 1 collection page
- 1 blog post

**Expected**: No critical errors

### Facebook Sharing Debugger
https://developers.facebook.com/tools/debug/

**Test**: Homepage, product page

**Expected**:
- OG tags detected
- Image preview shows
- Title/description correct

### Twitter Card Validator
https://cards-dev.twitter.com/validator

**Test**: Homepage, product page

**Expected**:
- Summary large image card
- Image preview shows
- Title/description correct

### Screaming Frog SEO Spider
https://www.screamingfrogseoseo.com/

**Crawl**: https://wtfswag.com/

**Check**:
- All pages have unique titles
- All pages have meta descriptions
- All pages have canonicals
- No duplicate content
- No broken links

---

## Common Issues & Solutions

### Issue: Title Too Long (>60 chars)
**Solution**: Add custom `seo.title` metafield with shorter version

### Issue: Missing OG Image
**Solution**: Set `og_default` in theme settings or add featured image to product/collection

### Issue: Duplicate Titles
**Solution**: Ensure each product/collection has unique title or custom metafield

### Issue: Pagination Indexed
**Solution**: Verify `current_page > 1` logic in seo-head.liquid

### Issue: Variant URLs Indexed
**Solution**: Canonical tag automatically handles this (Shopify default)

---

## Maintenance

### Monthly Tasks
- [ ] Audit new products for SEO metafields
- [ ] Check Google Search Console for duplicate titles
- [ ] Validate OG images render correctly
- [ ] Test Twitter Card previews

### Quarterly Tasks
- [ ] Review title/description performance in GSC
- [ ] Update OG default image if branding changes
- [ ] Check for broken canonical URLs
- [ ] Audit pagination handling

---

## Performance Impact

### Before Centralization
- ❌ Duplicate meta tags in theme.liquid
- ❌ Inconsistent title formats
- ❌ Missing Twitter Cards
- ❌ No metafield support

### After Centralization
- ✅ Single source of truth
- ✅ Consistent formatting
- ✅ Full Twitter Card support
- ✅ Metafield fallbacks
- ✅ Better maintainability

**HTML Size Impact**: +~500 bytes per page (negligible)  
**Performance Impact**: None (meta tags don't affect rendering)

---

## Next Steps (Phase 2)

- [ ] Enhance Product schema with aggregateRating
- [ ] Add Review schema if reviews exist
- [ ] Implement BreadcrumbList on all pages
- [ ] Add FAQ schema to product pages
- [ ] Optimize OG images (brand overlay)

---

## Revision History

| Date | Changes | Author |
|------|---------|--------|
| 2025-10-16 | Initial playbook created | Manus AI |
| 2025-10-16 | Added metafield setup guide | Manus AI |
| 2025-10-16 | Added testing checklist | Manus AI |

---

**Status**: ✅ Phase 1 Complete - Metadata System Implemented
