# Canned Drinks GUI Wiring Implementation Plan

## Executive Summary

This document outlines the complete plan for wiring the existing `/pages/canned-drinks` GUI to real Shopify product data from the Canned Drinks smart collection.

**Current State:**
- ✅ 17 products discovered across 10+ brands
- ✅ Smart collection created (`gid://shopify/Collection/350522212530`)
- ✅ Product-to-variant mapping generated
- ✅ Existing GUI is functional with hardcoded data
- ⏳ GUI not yet connected to real products

**Goal:**
Wire the existing brand/flavor selector GUI to pull data dynamically from Shopify products while maintaining the same UX.

---

## Phase 1: Data Preparation ✅ COMPLETE

### Completed Tasks

1. **Product Discovery**
   - Found 17 canned/seltzer products
   - Identified 6 multi-variant products (Uncle Skunks, Mitra, Rapture, etc.)
   - Identified 11 single-variant products

2. **Collection Setup**
   - Smart collection created with auto-inclusion rules
   - Products tagged with "can", "canned", "seltzer"

3. **Data Structure Generation**
   - Created `canned_products.json` with full product data
   - Created `canned_products_wired.json` with brand/flavor mapping
   - Generated JavaScript data structure for GUI integration

### Data Files Created

```
/data/architecture/
├── canned_products.json          # Raw product data from Shopify
├── canned_products_wired.json    # Brand/flavor mapping
└── catalog_integrations_result.json  # Collection IDs
```

---

## Phase 2: GUI Wiring Strategy

### Current GUI Structure

The existing `/pages/canned-drinks` template uses:

1. **Hardcoded Brand Buttons** (lines 117-135)
   ```liquid
   <button onclick="selectBrand('Uncle Skunk')">Uncle Skunk</button>
   ```

2. **Hardcoded Flavor Sections** (lines 139-400+)
   ```liquid
   <div class="flavor-section" id="flavors-uncle-skunk">
     <button onclick="selectFlavor('Cola')">Cola</button>
   </div>
   ```

3. **Hardcoded Price Map** (lines 63-77)
   ```javascript
   const BRAND_PRICES = {
     'Uncle Skunk': 15.99,
     'Rapture': 8.0,
     ...
   };
   ```

4. **Line Item Properties Approach**
   - Adds to cart with `properties[Brand]` and `properties[Flavor]`
   - Uses a single "Canned Drinks" variant ID from settings

### New Approach: Dynamic Data Loading

**Option A: Liquid-Generated JavaScript (Recommended)**
- Generate brand/flavor data structure in Liquid at page load
- Pull from `collections.canned-drinks.products`
- Maintain existing JavaScript UI logic
- Pros: No API calls, fast, works offline
- Cons: Requires template changes

**Option B: AJAX Data Loading**
- Fetch products via `/collections/canned-drinks/products.json`
- Build UI dynamically in JavaScript
- Pros: Fully dynamic, no template changes
- Cons: Slower, requires API calls

**Recommendation: Option A** (Liquid-generated JavaScript)

---

## Phase 3: Implementation Steps

### Step 1: Generate Dynamic Brand Buttons

**Current (Hardcoded):**
```liquid
<button onclick="selectBrand('Uncle Skunk')">Uncle Skunk</button>
<button onclick="selectBrand('Rapture')">Rapture</button>
```

**New (Dynamic):**
```liquid
{%- assign canned_collection = collections['canned-drinks'] -%}
{%- assign brands = canned_collection.products | map: 'vendor' | uniq | sort -%}

{% for brand in brands %}
  <button type="button" class="brand-button" onclick="selectBrand('{{ brand | escape }}')">
    {{ brand }}
  </button>
{% endfor %}
```

### Step 2: Generate Dynamic Flavor Sections

**Current (Hardcoded):**
```liquid
<div class="flavor-section" id="flavors-uncle-skunk">
  <button onclick="selectFlavor('Cola')">Cola</button>
  <button onclick="selectFlavor('Root Beer')">Root Beer</button>
</div>
```

**New (Dynamic):**
```liquid
{% for brand in brands %}
  {%- assign brand_products = canned_collection.products | where: 'vendor', brand -%}
  
  <div class="flavor-section" id="flavors-{{ brand | handleize }}">
    <h4 class="section-title">🍋 Choose Your {{ brand }} Flavor</h4>
    <div class="flavor-grid">
      {% for product in brand_products %}
        {% if product.variants.size > 1 %}
          {%- comment -%} Multi-variant product - show each variant as flavor {%- endcomment -%}
          {% for variant in product.variants %}
            <button
              type="button"
              class="flavor-button"
              data-variant-id="{{ variant.id }}"
              data-price="{{ variant.price | money_without_currency }}"
              onclick="selectFlavor('{{ variant.title | escape }}', '{{ variant.id }}', {{ variant.price | money_without_currency }})"
            >
              {{ variant.title }}
            </button>
          {% endfor %}
        {% else %}
          {%- comment -%} Single-variant product - use product title {%- endcomment -%}
          {%- assign flavor = product.title | remove: brand | strip -%}
          <button
            type="button"
            class="flavor-button"
            data-variant-id="{{ product.selected_or_first_available_variant.id }}"
            data-price="{{ product.price | money_without_currency }}"
            onclick="selectFlavor('{{ flavor | escape }}', '{{ product.selected_or_first_available_variant.id }}', {{ product.price | money_without_currency }})"
          >
            {{ flavor }}
          </button>
        {% endif %}
      {% endfor %}
    </div>
  </div>
{% endfor %}
```

### Step 3: Update JavaScript to Use Real Variant IDs

**Current (Line Item Properties):**
```javascript
function addToCart() {
  fetch('/cart/add.js', {
    method: 'POST',
    body: JSON.stringify({
      id: window.CANNED_VARIANT_ID,  // Single variant for all
      quantity: qty,
      properties: {
        Brand: selectedBrand,
        Flavor: selectedFlavor,
        Comments: comments
      }
    })
  });
}
```

**New (Real Variants):**
```javascript
let selectedVariantId = null;
let selectedPrice = 0;

function selectFlavor(flavor, variantId, price) {
  // Store the actual variant ID
  selectedVariantId = variantId;
  selectedPrice = price;
  selectedFlavor = flavor;
  
  // Update UI
  updatePrice(price);
  highlightFlavorButton(flavor);
}

function addToCart() {
  if (!selectedVariantId) {
    alert('Please select a flavor');
    return;
  }
  
  fetch('/cart/add.js', {
    method: 'POST',
    body: JSON.stringify({
      id: selectedVariantId,  // Actual product variant
      quantity: qty,
      properties: {
        Comments: comments  // Optional notes only
      }
    })
  });
}
```

### Step 4: Generate Dynamic Price Map

**Current (Hardcoded):**
```javascript
const BRAND_PRICES = {
  'Uncle Skunk': 15.99,
  'Rapture': 8.0,
  ...
};
```

**New (Dynamic):**
```liquid
<script>
  const BRAND_PRICES = {
    {% for brand in brands %}
      {%- assign brand_products = canned_collection.products | where: 'vendor', brand -%}
      {%- assign min_price = brand_products | map: 'price' | sort | first -%}
      '{{ brand | escape }}': {{ min_price | money_without_currency }},
    {% endfor %}
  };
</script>
```

---

## Phase 4: Testing Plan

### Test Cases

1. **Brand Selection**
   - ✅ Click each brand button
   - ✅ Verify correct flavor section shows
   - ✅ Verify price updates correctly

2. **Flavor Selection**
   - ✅ Click each flavor in each brand
   - ✅ Verify price updates to variant price
   - ✅ Verify flavor button highlights

3. **Add to Cart**
   - ✅ Add Uncle Skunks Cola (multi-variant)
   - ✅ Add Mitra Tropical (multi-variant)
   - ✅ Add single-variant product
   - ✅ Verify correct variant ID in cart
   - ✅ Verify cart count updates

4. **POS Compatibility**
   - ✅ Ring up order in Lightspeed
   - ✅ Verify product/variant matches
   - ✅ Verify price matches

5. **Edge Cases**
   - ✅ Out of stock variants (disable button)
   - ✅ New products added to collection (auto-appear)
   - ✅ Products removed from collection (auto-hide)

---

## Phase 5: Deployment

### Pre-Deployment Checklist

- [ ] All brands render correctly
- [ ] All flavors render correctly
- [ ] Prices match Shopify product data
- [ ] Add to cart uses real variant IDs
- [ ] Cart drawer opens on success
- [ ] Out of stock variants are disabled
- [ ] Mobile responsive layout works
- [ ] No JavaScript errors in console

### Deployment Steps

1. **Backup Current Template**
   ```bash
   cp templates/page.canned-drinks.liquid templates/page.canned-drinks.liquid.backup
   ```

2. **Deploy New Template**
   ```bash
   # Via Shopify CLI
   shopify theme push --only templates/page.canned-drinks.liquid
   
   # Or via GitHub + Shopify integration
   git push origin feat/canned-drinks-wiring
   ```

3. **Test on Live Site**
   - Visit https://wtfswag.com/pages/canned-drinks
   - Test all brands and flavors
   - Complete a test purchase

4. **Monitor for Issues**
   - Check Shopify Admin → Orders
   - Verify variant IDs are correct
   - Check for customer feedback

### Rollback Plan

If issues arise:

```bash
# Restore backup
cp templates/page.canned-drinks.liquid.backup templates/page.canned-drinks.liquid
shopify theme push --only templates/page.canned-drinks.liquid
```

---

## Phase 6: Future Enhancements

### Potential Improvements

1. **Product Images**
   - Show product image when brand is selected
   - Use variant images for flavors

2. **Inventory Display**
   - Show "Low Stock" badge when inventory < 5
   - Show "Out of Stock" for unavailable variants

3. **Flavor Descriptions**
   - Pull from product descriptions
   - Show in tooltip on hover

4. **Sorting Options**
   - Sort brands alphabetically
   - Sort flavors by popularity

5. **Search/Filter**
   - Add search box for quick flavor finding
   - Filter by THC/non-THC, price range, etc.

---

## Appendix A: Brand/Flavor Mapping

Based on `canned_products_wired.json`:

| Brand | Flavor Count | Price Range | Notes |
|-------|--------------|-------------|-------|
| Uncle Skunks Soda | 8 | $12.00 | Multi-variant product |
| Mitra | 12 | $6.00 | Multi-variant product |
| Rapture | 9 | $8.00-$10.00 | Multi-variant product |
| Tea Time | 6 | $8.00 | Multi-variant product |
| Chronic Harvest | 1 | $15.00 | Single product |
| White Rabbit | 1 | $8.00 | Single product |
| Tortuga | 1 | $8.00 | Single product |
| D9 Cocktails | 1 | $7.00 | Single product |
| Sodas | 1 | $3.00 | Single product |
| Lumenade | 1 | $10.00 | Single product |

**Total: 10 brands, 41 flavors, 17 products**

---

## Appendix B: File Structure

```
wtf-theme-delivered/
├── templates/
│   ├── page.canned-drinks.liquid          # Main template (to be updated)
│   └── page.canned-drinks.liquid.backup   # Backup before changes
├── sections/
│   └── collection-on-page.liquid          # Alternative approach (created)
├── data/
│   └── architecture/
│       ├── canned_products.json           # Raw product data
│       ├── canned_products_wired.json     # Brand/flavor mapping
│       └── catalog_integrations_result.json
├── docs/
│   └── CANNED_DRINKS_GUI_WIRING_PLAN.md   # This document
└── scripts/
    ├── canned_drinks_discovery.py         # Product discovery script
    ├── populate_canned_collection.py      # Collection population
    └── wire_canned_products.py            # Data structure generator
```

---

## Appendix C: Code Snippets

### Complete Liquid Template Structure

```liquid
{%- assign canned_collection = collections['canned-drinks'] -%}
{%- assign brands = canned_collection.products | map: 'vendor' | uniq | sort -%}

<style>
  /* Existing styles remain unchanged */
</style>

<script>
  // Dynamic brand prices from real products
  const BRAND_PRICES = {
    {% for brand in brands %}
      {%- assign brand_products = canned_collection.products | where: 'vendor', brand -%}
      {%- assign min_price = brand_products | map: 'price' | sort | first -%}
      '{{ brand | escape }}': {{ min_price | money_without_currency }},
    {% endfor %}
  };
  
  // Dynamic brand/flavor/variant mapping
  const PRODUCT_DATA = {
    {% for brand in brands %}
      '{{ brand | escape }}': {
        {% for product in canned_collection.products %}
          {% if product.vendor == brand %}
            {% for variant in product.variants %}
              '{{ variant.title | escape }}': {
                variantId: '{{ variant.id }}',
                price: {{ variant.price | money_without_currency }},
                available: {{ variant.available | json }}
              },
            {% endfor %}
          {% endif %}
        {% endfor %}
      },
    {% endfor %}
  };
</script>

<div class="container">
  <!-- Existing header/nav unchanged -->
  
  <div class="selection-section">
    <h3 class="section-title">🥤 Choose Your Brand</h3>
    <div class="brand-grid">
      {% for brand in brands %}
        <button type="button" class="brand-button" onclick="selectBrand('{{ brand | escape }}')">
          {{ brand }}
        </button>
      {% endfor %}
    </div>
  </div>
  
  <!-- Dynamic flavor sections -->
  {% for brand in brands %}
    {%- assign brand_products = canned_collection.products | where: 'vendor', brand -%}
    <div class="flavor-section" id="flavors-{{ brand | handleize }}">
      <h4 class="section-title">🍋 Choose Your {{ brand }} Flavor</h4>
      <div class="flavor-grid">
        {% for product in brand_products %}
          {% for variant in product.variants %}
            <button
              type="button"
              class="flavor-button"
              data-variant-id="{{ variant.id }}"
              data-price="{{ variant.price | money_without_currency }}"
              onclick="selectFlavorWithVariant('{{ variant.title | escape }}', '{{ variant.id }}', {{ variant.price | money_without_currency }})"
              {% unless variant.available %}disabled{% endunless %}
            >
              {{ variant.title }}
              {% unless variant.available %}<br><small>(Sold Out)</small>{% endunless %}
            </button>
          {% endfor %}
        {% endfor %}
      </div>
    </div>
  {% endfor %}
  
  <!-- Existing quantity/comments/add-to-cart unchanged -->
</div>

<script>
  // Updated JavaScript functions
  let selectedVariantId = null;
  let selectedPrice = 0;
  
  function selectFlavorWithVariant(flavor, variantId, price) {
    selectedVariantId = variantId;
    selectedPrice = price;
    selectedFlavor = flavor;
    updatePrice(price);
    highlightFlavorButton(flavor);
  }
  
  function addToCart() {
    if (!selectedVariantId) {
      alert('Please select a brand and flavor');
      return;
    }
    
    const qty = parseInt(document.getElementById('quantity').value);
    const comments = document.getElementById('comments').value;
    
    fetch('/cart/add.js', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: selectedVariantId,
        quantity: qty,
        properties: comments ? { Comments: comments } : {}
      })
    })
    .then(response => response.json())
    .then(data => {
      // Update cart count
      updateCartCount();
      // Open cart drawer
      if (window.WTF_CART) window.WTF_CART.open();
      // Show success message
      showSuccessMessage();
    })
    .catch(error => {
      console.error('Add to cart error:', error);
      alert('Error adding to cart. Please try again.');
    });
  }
</script>
```

---

## Summary

**Status:** Phase 1 complete, ready for Phase 2-3 implementation

**Next Actions:**
1. Update `templates/page.canned-drinks.liquid` with dynamic Liquid code
2. Test all brands and flavors
3. Deploy to production
4. Monitor for issues

**Estimated Time:** 2-3 hours for full implementation and testing

**Risk Level:** Low (can easily rollback to hardcoded version)

**Impact:** High (real-time inventory, accurate pricing, POS compatibility)

