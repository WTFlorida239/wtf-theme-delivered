# How to Bulk Edit Product Category Metafields in Shopify

This guide explains how to add category metafields to your products in bulk using Shopify's admin interface.

## Prerequisites

- Shopify admin access
- Products already assigned to a Google product category
- CSV file with metafield data (see `product-category-metafields-plan.csv`)

---

## Step 1: Assign Product Categories

Before adding category metafields, ensure your products have a Google product category assigned.

1. Go to **Products** in Shopify admin
2. Select a product
3. Scroll to **Product category** section
4. Click **Select category**
5. Search for and select the appropriate category (e.g., "Food > Beverages > Dietary Supplements")
6. Click **Save**

**Bulk Assignment**:
- Select multiple products using checkboxes
- Click **More actions** → **Edit products**
- Set **Product category** for all selected products

---

## Step 2: Understanding Category Metafields

Category metafields are automatically available once you assign a Google product category. The following metafields are supported:

| Metafield Key | Display Label | Example Value |
|---------------|---------------|---------------|
| `care_instructions` | Care Instructions | "Store in cool dry place" |
| `material` | Ingredients | "Hemp-derived THC, Natural flavors" |
| `size_guide` | Dosage Guide | "Start with 1 gummy, wait 60min" |
| `fit` | Consistency | "Gel-based chewable" |
| `additional_info` | Additional Info | "Lab-tested, 21+ only" |

**Documentation**: https://help.shopify.com/en/manual/products/details/product-category#category-metafields

---

## Step 3: Add Metafields via Product Editor

### Individual Product Method

1. Go to **Products** → Select a product
2. Scroll to **Metafields** section
3. Click **Add metafield**
4. Select **Category metafields** from the dropdown
5. Choose the metafield (e.g., "Care instructions")
6. Enter the value
7. Click **Save**

**Screenshot Placeholder**: [Product editor with metafields section]

---

## Step 4: Bulk Edit Using CSV Import

### Prepare CSV File

Use the provided `product-category-metafields-plan.csv` as a template:

```csv
handle,title,google_product_category,category_metafield_key,category_metafield_value
barneys-12mg-pack-of-10-light-blue,Barney's 12mg THC Gummies - 10 Pack,Food > Beverages > Dietary Supplements,care_instructions,Store in cool dry place away from direct sunlight
```

### Import Steps

1. Go to **Products** in Shopify admin
2. Click **Export** (to get current product data)
3. Open exported CSV and add category metafield columns:
   - `Metafield: category.care_instructions [single_line_text_field]`
   - `Metafield: category.material [single_line_text_field]`
   - `Metafield: category.size_guide [multi_line_text_field]`
   - `Metafield: category.fit [single_line_text_field]`
   - `Metafield: category.additional_info [multi_line_text_field]`
4. Fill in values for each product
5. Save CSV file
6. Go to **Products** → **Import**
7. Upload your CSV file
8. Click **Upload and continue**
9. Review changes
10. Click **Import products**

**Screenshot Placeholder**: [CSV import interface]

---

## Step 5: Bulk Edit Using Shopify Bulk Editor

### Access Bulk Editor

1. Go to **Products** in Shopify admin
2. Select products using checkboxes
3. Click **More actions** → **Edit products**
4. Or use **Bulk editor** from the Products page

### Edit Metafields in Bulk

1. In bulk editor, click **Columns** dropdown
2. Search for "metafields"
3. Select category metafields to display:
   - Care instructions
   - Material
   - Size guide
   - Fit
   - Additional info
4. Edit values directly in the grid
5. Changes save automatically

**Screenshot Placeholder**: [Bulk editor with metafield columns]

**Documentation**: https://help.shopify.com/en/manual/productivity-tools/bulk-editing-products

---

## Step 6: Verify on Storefront

After adding metafields:

1. Visit a product page on your storefront
2. Scroll to the **Product Specifications** section (below description)
3. Verify metafields display correctly
4. Check that products without metafields don't show empty specs

**Screenshot Placeholder**: [Product page with specs section]

---

## Metafield Best Practices

### Care Instructions
- Keep concise (1-2 sentences)
- Focus on storage and handling
- Example: "Store in cool dry place away from direct sunlight"

### Material (Ingredients)
- List main ingredients
- Separate with spaces or line breaks
- Example: "Hemp-derived Delta-9 THC Natural flavors Gelatin"

### Size Guide (Dosage Guide)
- Provide clear starting dosage
- Include timing information
- Example: "Start with 1 gummy (12mg). Wait 60-90 minutes before consuming more."

### Fit (Consistency)
- Describe physical form
- Example: "Gel-based chewable" or "Liquid syrup"

### Additional Info
- Lab testing information
- Age restrictions
- Usage tips
- Example: "Lab-tested. COA available upon request. 21+ only."

---

## Troubleshooting

### Metafields Not Showing on Storefront

**Issue**: Added metafields but they don't appear on product pages.

**Solutions**:
1. Verify product has a Google product category assigned
2. Check that metafield values are not empty
3. Clear browser cache and refresh page
4. Verify theme code is deployed (check `snippets/product-category-specs.liquid` exists)

### Wrong Metafield Type

**Issue**: Metafield value not saving or displaying incorrectly.

**Solution**: Category metafields have predefined types. Use:
- `care_instructions`: Single line text
- `material`: Single line text
- `size_guide`: Multi-line text
- `fit`: Single line text
- `additional_info`: Multi-line text

### Bulk Import Errors

**Issue**: CSV import fails or skips products.

**Solutions**:
1. Ensure CSV uses correct column headers (exact match required)
2. Check for special characters in values (escape quotes)
3. Verify product handles match existing products
4. Use UTF-8 encoding for CSV file

---

## Additional Resources

- **Product Categories**: https://help.shopify.com/en/manual/products/details/product-category
- **Category Metafields**: https://help.shopify.com/en/manual/products/details/product-category#category-metafields
- **Displaying Metafields**: https://help.shopify.com/en/manual/custom-data/metafields/displaying-metafields-on-your-online-store
- **Bulk Editor**: https://help.shopify.com/en/manual/productivity-tools/bulk-editing-products
- **CSV Import**: https://help.shopify.com/en/manual/products/import-export

---

## Quick Reference

### CSV Column Headers for Metafields

```
Metafield: category.care_instructions [single_line_text_field]
Metafield: category.material [single_line_text_field]
Metafield: category.size_guide [multi_line_text_field]
Metafield: category.fit [single_line_text_field]
Metafield: category.additional_info [multi_line_text_field]
```

### Liquid Code Reference

The theme renders metafields using:

```liquid
{% if product.category %}
  {% if product.category.metafields.care_instructions %}
    <div class="spec-row">
      <span class="spec-label">Care Instructions:</span>
      <span class="spec-value">{{ product.category.metafields.care_instructions }}</span>
    </div>
  {% endif %}
{% endif %}
```

**Full code**: See `snippets/product-category-specs.liquid`

---

**Last Updated**: 2025-10-06  
**Theme Version**: wtf-theme-delivered  
**Shopify OS**: 2.0
