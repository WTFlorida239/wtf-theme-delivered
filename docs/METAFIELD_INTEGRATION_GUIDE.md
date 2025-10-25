# Metafield & Metaobject Integration Guide
## WTF | Welcome To Florida - Phase 4 Data Architecture

**Date:** October 24, 2025  
**Status:** ✅ Complete  
**API Version:** 2024-10

---

## Overview

This guide documents the complete metafield and metaobject architecture implemented for the dual-channel catalog strategy (Bar/Beverage Layer + E-Commerce Layer).

---

## Architecture Summary

### Metafield Definitions

#### 1. Active Ingredient (`inventory.active_ingredient`)
- **ID:** `gid://shopify/MetafieldDefinition/129777139890`
- **Type:** Single line text field
- **Owner:** Product
- **Values:** THC, Kratom, Kava, Mushroom, CBD, Caffeine
- **Purpose:** Powers filtering, content tagging, and structured data integration
- **Visibility:** Storefront API enabled

#### 2. Ingredient Profile (`inventory.ingredient_profile`)
- **ID:** `gid://shopify/MetafieldDefinition/129777172658`
- **Type:** JSON
- **Owner:** Product
- **Purpose:** Stores detailed ingredient metadata (strength, origin, format)
- **Example:**
  ```json
  {
    "strength": "moderate",
    "origin": "hemp",
    "format": "drink"
  }
  ```
- **Visibility:** Storefront API enabled

#### 3. Bar Menu Reference (`bar.menu_reference`)
- **ID:** `gid://shopify/MetafieldDefinition/129778319538`
- **Type:** Metaobject reference
- **Owner:** Product
- **Purpose:** Links products to their bar_menu_item metaobjects
- **Visibility:** Storefront API enabled

### Metaobject Definitions

#### Bar Menu Item (`bar_menu_item`)
- **ID:** `gid://shopify/MetaobjectDefinition/4421157042`
- **Type:** `bar_menu_item`
- **Access:** Public read (storefront)
- **Fields:**
  1. `product_reference` (Product Reference) - Required
  2. `menu_label` (Single line text)
  3. `card_type` (Single line text) - Values: draft, can, shot, keg
  4. `size_oz` (Number - Integer)
  5. `price_display` (Single line text)
  6. `keg_status` (Single line text) - Values: full, half, empty
  7. `display_order` (Number - Integer)
  8. `seasonal_flag` (Boolean)
  9. `image_override` (File reference)
  10. `meta_title` (Single line text)
  11. `meta_description` (Multi-line text)
  12. `canonical_tag` (Single line text)

---

## Product Assignment Summary

### E-Commerce Products (69 total)
- **50 products** assigned `active_ingredient` metafield
- **19 products** skipped (Unknown ingredient - apparel/accessories)

**Breakdown by Ingredient:**
- **THC:** 35 products (51%)
- **Kratom:** 8 products (12%)
- **Mushroom:** 6 products (9%)
- **Caffeine:** 1 product (1%)
- **Unknown:** 19 products (28%)

### Bar/Beverage Products (75 total)
- **75 bar_menu_item metaobjects** created
- **75 product-to-metaobject links** established
- **0 failures**

---

## Liquid Integration

### Enhanced Product Card

**File:** `snippets/wtf-product-card-enhanced.liquid`

**New Features:**
1. **Ingredient Badges** - Displays active ingredient with color-coded styling
2. **Bar Menu Mode** - Special rendering for bar menu items with keg status, size, card type
3. **Schema Integration** - Automatic injection of structured data
4. **Metafield-Driven Content** - Pulls menu labels, images, and metadata from metaobjects

**Usage:**

```liquid
{%- comment -%} Standard product card with ingredient badge {%- endcomment -%}
{% render 'wtf-product-card-enhanced',
  product: product,
  show_ingredient_badge: true
%}

{%- comment -%} Bar menu mode {%- endcomment -%}
{% render 'wtf-product-card-enhanced',
  product: product,
  mode: 'bar_menu',
  show_bar_menu_details: true
%}

{%- comment -%} Browse mode {%- endcomment -%}
{% render 'wtf-product-card-enhanced',
  mode: 'browse',
  title: 'Custom Title',
  image: 'https://...',
  link_url: '/collections/kratom'
%}
```

### Schema Snippets

#### 1. Ingredient Schema (`snippets/schema-ingredient.liquid`)
Injects Product schema with active_ingredient data.

**Usage:**
```liquid
{% render 'schema-ingredient', product: product %}
```

**Output:**
```json
{
  "@context": "https://schema.org",
  "@type": "Product",
  "category": "THC",
  "additionalProperty": [
    {
      "@type": "PropertyValue",
      "name": "Active Ingredient",
      "value": "THC"
    }
  ]
}
```

#### 2. Bar Menu Item Schema (`snippets/schema-bar-menu-item.liquid`)
Generates MenuItem schema for bar products.

**Usage:**
```liquid
{% render 'schema-bar-menu-item', product: product %}
```

**Output:**
```json
{
  "@context": "https://schema.org",
  "@type": "MenuItem",
  "name": "Mitra 9 Draft Pours",
  "nutrition": {
    "@type": "NutritionInformation",
    "servingSize": "16 oz"
  },
  "additionalProperty": [
    {
      "@type": "PropertyValue",
      "name": "Serving Type",
      "value": "Draft"
    }
  ]
}
```

---

## Collection Filtering

### Smart Collections by Ingredient

You can now create Smart Collections that automatically filter by `inventory.active_ingredient`:

**Example: THC Products Collection**
- **Condition:** Product metafield `inventory.active_ingredient` equals `THC`
- **Result:** Automatically includes all 35 THC products

**Example: Kratom Products Collection**
- **Condition:** Product metafield `inventory.active_ingredient` equals `Kratom`
- **Result:** Automatically includes all 8 Kratom products

### Liquid Filtering

```liquid
{%- comment -%} Filter products by ingredient {%- endcomment -%}
{% assign thc_products = collection.products | where: "metafields.inventory.active_ingredient", "THC" %}

{%- comment -%} Filter bar menu items by card type {%- endcomment -%}
{% for product in collection.products %}
  {% if product.metafields.bar.menu_reference.card_type == "draft" %}
    {%- comment -%} Render draft products {%- endcomment -%}
  {% endif %}
{% endfor %}
```

---

## Analytics Integration

### GTM dataLayer Enhancement

Add ingredient and bar menu data to your GTM dataLayer pushes:

```javascript
window.dataLayer = window.dataLayer || [];
window.dataLayer.push({
  event: 'view_item',
  ecommerce: {
    items: [{
      item_name: '{{ product.title }}',
      item_id: '{{ product.id }}',
      item_category: '{{ product.metafields.inventory.active_ingredient }}',
      item_variant: '{{ product.metafields.bar.menu_reference.card_type }}',
      price: {{ product.price | divided_by: 100.0 }}
    }]
  },
  ingredient: '{{ product.metafields.inventory.active_ingredient }}',
  menu_item_type: '{{ product.metafields.bar.menu_reference.card_type }}'
});
```

---

## SEO Benefits

### 1. Enhanced Product Schema
- Products now include `category` and `additionalProperty` fields
- Ingredient information is machine-readable
- Better understanding by search engines and LLMs

### 2. MenuItem Schema for Bar Products
- Local SEO boost for "kava near me", "kratom bar cape coral"
- Nutrition information (serving size)
- Availability and pricing data

### 3. Collection-Level SEO
- Ingredient-based collections are automatically organized
- Clean URL structure: `/collections/thc-products`, `/collections/kratom-products`
- Consistent metadata across product categories

---

## Migration Path

### Updating Existing Templates

**Option 1: Gradual Migration**
1. Keep existing `wtf-product-card.liquid`
2. Use `wtf-product-card-enhanced.liquid` for new pages
3. Test thoroughly
4. Replace old snippet when ready

**Option 2: Direct Replacement**
1. Backup `wtf-product-card.liquid`
2. Rename `wtf-product-card-enhanced.liquid` to `wtf-product-card.liquid`
3. All existing renders will automatically use new features

### Adding Ingredient Badges to Existing Cards

Minimal change to existing templates:

```liquid
{%- comment -%} Add this before or after product title {%- endcomment -%}
{% assign active_ingredient = product.metafields.inventory.active_ingredient %}
{% if active_ingredient %}
  <span class="wtf-ingredient-badge wtf-ingredient-{{ active_ingredient | downcase }}">
    {{ active_ingredient }}
  </span>
{% endif %}
```

---

## API Access

### GraphQL Query Examples

**Get product with metafields:**
```graphql
{
  product(id: "gid://shopify/Product/PRODUCT_ID") {
    title
    metafields(first: 10) {
      edges {
        node {
          namespace
          key
          value
        }
      }
    }
  }
}
```

**Get bar menu items:**
```graphql
{
  metaobjects(type: "bar_menu_item", first: 50) {
    edges {
      node {
        id
        fields {
          key
          value
        }
      }
    }
  }
}
```

---

## Maintenance

### Adding New Products

**E-Commerce Products:**
1. Create product in Shopify Admin
2. Set `inventory.active_ingredient` metafield (THC, Kratom, Kava, etc.)
3. Optionally set `inventory.ingredient_profile` JSON
4. Product will automatically appear in ingredient-based collections

**Bar/Beverage Products:**
1. Create product in Shopify Admin
2. Create `bar_menu_item` metaobject:
   - Link to product
   - Set menu_label, card_type, size_oz
   - Set keg_status if applicable
3. Link product to metaobject via `bar.menu_reference`
4. Product will render with bar menu styling

### Updating Metaobjects

Use Shopify Admin or GraphQL API:

```graphql
mutation {
  metaobjectUpdate(
    id: "gid://shopify/Metaobject/METAOBJECT_ID"
    metaobject: {
      fields: [
        { key: "keg_status", value: "half" }
      ]
    }
  ) {
    metaobject {
      id
    }
  }
}
```

---

## Files Created

### Snippets
- `snippets/schema-ingredient.liquid` - Ingredient-based Product schema
- `snippets/schema-bar-menu-item.liquid` - MenuItem schema for bar products
- `snippets/wtf-product-card-enhanced.liquid` - Enhanced product card with metafield integration

### Documentation
- `docs/METAFIELD_INTEGRATION_GUIDE.md` - This file

### Data Files
- `bar_menu_item_map.json` - Complete SKU → Metaobject mapping
- `active_ingredient_map.json` - Complete SKU → Ingredient mapping
- `catalog_segmentation_report.json` - Full product categorization
- `data_architecture_report.json` - Metafield/metaobject definitions
- `phase3_exec_log.json` - Assignment execution audit trail

---

## Next Steps

### Immediate (Week 1)
1. ✅ Test enhanced product cards on staging
2. ✅ Verify schema markup with Google Rich Results Test
3. ✅ Create Smart Collections for each ingredient
4. ✅ Update navigation menus to link to new collections

### Short-term (Month 1)
1. Create `/pages/bar-menu` with OfferCatalog schema
2. Implement ingredient-based filtering UI on collection pages
3. Add "Recommended For You" widget using ingredient data
4. Set up GTM events for ingredient-based tracking

### Long-term (Quarter 1)
1. Build ingredient-specific landing pages for SEO
2. Auto-generate FAQs by ingredient using `product-faq.liquid`
3. Implement personalization based on ingredient preferences
4. A/B test ingredient badge designs for conversion optimization

---

## Support

For questions or issues with the metafield integration:
1. Review this documentation
2. Check `phase3_exec_log.json` for assignment details
3. Verify metafield values in Shopify Admin
4. Test schema markup with Google's Rich Results Test

---

**Last Updated:** October 24, 2025  
**Version:** 1.0  
**Author:** Manus AI

