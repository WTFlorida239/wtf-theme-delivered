# WTF Theme Naming Conventions

This document establishes consistent naming conventions across the WTF Shopify theme to ensure maintainability and clarity.

## File Naming Standards

### Sections & Snippets: kebab-case
- **Format**: `word-word-word.liquid`
- **Examples**: 
  - `enhanced-drink-builder.liquid`
  - `home-category-grid.liquid`
  - `local-business-schema.liquid`

### Templates: kebab-case with descriptive prefixes
- **Format**: `type.descriptor.liquid` or `type.descriptor.json`
- **Examples**:
  - `page.kava-drinks.liquid`
  - `collection.kratom-teas.liquid`
  - `product.kratom-tea.json`

### Assets: kebab-case with descriptive prefixes
- **CSS**: `component-name.css` or `wtf_component_name.css`
- **JS**: `component-name.js` or `wtf-component-name.js`
- **Images**: `descriptive-name_dimensions.format`

## Code Naming Standards

### CSS Classes: BEM (Block Element Modifier)
- **Block**: `.wtf-component`
- **Element**: `.wtf-component__element`
- **Modifier**: `.wtf-component--modifier`
- **Examples**:
  - `.wtf-drink-builder`
  - `.wtf-drink-builder__flavor-chip`
  - `.wtf-drink-builder__flavor-chip--selected`

### JavaScript Variables: camelCase
- **Variables**: `flavorSelection`, `cartItemCount`
- **Functions**: `updateCartCount()`, `buildFlavorString()`
- **Constants**: `FLAVOR_LIMITS`, `API_ENDPOINTS`

### HTML Data Attributes: kebab-case
- **Format**: `data-component-action`
- **Examples**:
  - `data-cart-count`
  - `data-flavor-chip`
  - `data-variant-id`

### Liquid Variables: snake_case
- **Format**: `variable_name`
- **Examples**:
  - `product_handle`
  - `flavor_data`
  - `cart_item_count`

### Settings & Block IDs: snake_case
- **Settings**: `google_analytics_id`, `enable_cart_drawer`
- **Block IDs**: `hero_banner`, `category_grid`, `footer_info`

### Locale Keys: dot.notation with feature namespacing
- **Format**: `feature.component.key`
- **Examples**:
  - `cart.drawer.title`
  - `product.builder.add_to_cart`
  - `general.accessibility.skip_to_content`

## Metafield Naming

### Namespace: `wtf.settings`
- **Format**: `wtf.settings.key_name`
- **Examples**:
  - `wtf.settings.business_hours`
  - `wtf.settings.flavor_options`
  - `wtf.settings.upsell_messages`

## Directory Structure Conventions

```
wtf-theme-delivered/
├── assets/                 # kebab-case files
├── config/                 # snake_case JSON keys
├── layout/                 # kebab-case files
├── sections/               # kebab-case files
├── snippets/               # kebab-case files
├── templates/              # kebab-case with type prefixes
├── locales/                # dot.notation keys
└── docs/                   # UPPERCASE for main docs
```

## Implementation Status

### ✅ Already Consistent
- Section files: All use kebab-case
- Snippet files: All use kebab-case
- Template files: Mostly consistent with kebab-case

### 🔄 Needs Review
- CSS class naming: Mix of patterns, standardizing to BEM
- JavaScript variables: Some inconsistencies, standardizing to camelCase
- Settings schema: Mostly snake_case, some cleanup needed

### 📋 Action Items
1. Audit all CSS classes and convert to BEM pattern
2. Review JavaScript naming for consistency
3. Standardize all data attributes to kebab-case
4. Ensure all locale keys follow dot.notation
5. Document any exceptions with justification

## Enforcement

These conventions should be:
1. Enforced in code reviews
2. Checked by automated linting where possible
3. Updated in this document when patterns evolve
4. Applied to all new code consistently

Last updated: September 25, 2025
