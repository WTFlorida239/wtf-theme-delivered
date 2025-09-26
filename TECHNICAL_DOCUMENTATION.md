# WTF Theme - Technical Documentation

## 🏗️ Architecture Overview

### Theme Structure
The WTF theme is built on Shopify's Online Store 2.0 architecture, utilizing modern Liquid templating with advanced JavaScript functionality for custom drink building and ordering systems.

```
wtf-theme-delivered/
├── assets/                     # Static assets (CSS, JS, images)
│   ├── wtf-ajax-cart.js       # AJAX cart functionality
│   ├── application.css        # Main stylesheet
│   └── wtf_storefront_hero_original.png
├── config/                     # Theme configuration
│   └── settings_schema.json   # Theme customization options
├── layout/                     # Layout templates
│   └── theme.liquid           # Master layout template
├── sections/                   # Reusable sections
│   ├── custom-kratom-tea-builder.liquid
│   ├── custom-kava-drink-builder.liquid
│   ├── enhanced-drink-builder.liquid
│   ├── wtf-cart.liquid
│   ├── wtf-order-builder.liquid
│   ├── home-hero.liquid
│   ├── home-category-grid.liquid
│   └── footer.liquid
├── snippets/                   # Reusable code snippets
├── templates/                  # Page and product templates
│   ├── product.kratom-tea.json
│   ├── product.kava-drink.json
│   ├── product.json
│   └── cart.liquid
├── scripts/                    # Automation and build scripts
│   ├── check-conflicts.js
│   ├── competitors-audit.js
│   └── order-readiness-check.js
└── .github/workflows/          # CI/CD automation
    ├── automated-testing.yml
    └── ci-cd-pipeline.yml
```

## 🛠️ Core Components

### 1. Custom Drink Builders

#### Kratom Tea Builder (`custom-kratom-tea-builder.liquid`)
**Purpose**: Handles custom kratom tea ordering with strain selection, flavor pumps, and size options.

**Key Features**:
- Size-based variant selection (Medium, Large, Gallon)
- Strain selection with mix capability (½+½)
- Flavor pump system with quantity limits
- Ice level selection
- Real-time price calculation
- Form validation and error handling
- AJAX cart integration

**JavaScript Architecture**:
```javascript
// Variant mapping for dynamic pricing
const variantIdBySize = {
  "Medium": {{ product.variants | where: "option1","Medium" | first.id }},
  "Large": {{ product.variants | where: "option1","Large" | first.id }},
  "Gallon": {{ product.variants | where: "option1","Gallon" | first.id }}
};

// State management
let selectedSize = 'Medium';
let selectedStrain = 'Green';
let isMix = false;
let pumpLimit = 4;
```

**Line Item Properties**:
- `properties[Strain]`: Selected strain or empty if mix
- `properties[Mix]`: "Yes" or "No"
- `properties[Strain A]`: First strain in mix
- `properties[Strain B]`: Second strain in mix
- `properties[Flavors & Pumps]`: Formatted as "Mango:2 | Lime:1"
- `properties[Notes]`: Special requests
- `properties[Ice]`: Ice level preference

#### Kava Drink Builder (`custom-kava-drink-builder.liquid`)
**Purpose**: Comprehensive kava drink customization with boosters, sweeteners, and creamers.

**Enhanced Features**:
- All kratom tea builder features
- Booster selection (Extra Kava Shot, CBD Oil, Turmeric, etc.)
- Sweetener options (Organic Honey, Agave, Stevia, etc.)
- Creamer selection (Coconut Milk, Almond Milk, etc.)
- Toggle-based add-on selection

**Additional Line Item Properties**:
- `properties[Boosters]`: Comma-separated list
- `properties[Sweeteners]`: Comma-separated list
- `properties[Creamers]`: Comma-separated list

### 2. AJAX Cart System (`wtf-ajax-cart.js`)

**Purpose**: Provides seamless add-to-cart functionality without page reloads.

**Core Functions**:
```javascript
// Main cart addition function
async function addItem(form) {
  const data = new FormData(form);
  const res = await fetch("/cart/add.js", {
    method: "POST",
    body: data,
    credentials: "same-origin",
    headers: { Accept: "application/json" }
  });
  
  if (!res.ok) throw new Error("Add to cart failed");
  
  const item = await res.json();
  const cart = await getCart();
  setCartCount(cart.item_count);
  
  // Dispatch custom event for theme integration
  document.dispatchEvent(new CustomEvent('wtf:cart:update', { 
    detail: { cart, last_added: item } 
  }));
}
```

**Event System**:
- `wtf:cart:update`: Fired after successful cart addition
- Automatic cart count updates
- Error handling with user feedback

### 3. Enhanced Cart Display (`wtf-cart.liquid`)

**Purpose**: Professional cart experience with detailed customization display.

**Features**:
- Line item properties display
- Quantity adjustment
- Remove item functionality
- Mobile-responsive design
- Accessibility compliance
- Empty cart state handling

**Line Item Properties Display**:
```liquid
{% if item.properties.size > 0 %}
  <div class="cart-item__properties">
    {% for property in item.properties %}
      {% unless property.first contains '_' or property.last == blank %}
        <div class="cart-item__property">
          <span class="property-name">{{ property.first }}:</span>
          <span class="property-value">{{ property.last }}</span>
        </div>
      {% endunless %}
    {% endfor %}
  </div>
{% endif %}
```

## 🎨 Styling Architecture

### CSS Organization
The theme uses a modular CSS approach with performance optimization:

```css
/* Base styles for typography, layout, and utilities */
@import 'base.css';

/* Component-specific styles */
.custom-builder {
  padding: 2rem 0;
  max-width: 120rem;
  margin: 0 auto;
}

.chip {
  background: white;
  border: 2px solid #ddd;
  border-radius: 2.5rem;
  padding: 1rem 2rem;
  transition: all 0.3s ease;
}

.chip--active {
  background: #ff6900;
  border-color: #ff6900;
  color: white;
}
```

### Responsive Design
Mobile-first approach with breakpoints:
- **Mobile**: 320px - 767px
- **Tablet**: 768px - 1023px
- **Desktop**: 1024px+

### Color Scheme
- **Primary**: #ff6900 (WTF Orange)
- **Secondary**: #333333 (Dark Gray)
- **Success**: #28a745 (Green)
- **Error**: #dc3545 (Red)
- **Background**: #f9f9f9 (Light Gray)

## 🔧 JavaScript Architecture

### Event-Driven Design
The theme uses an event-driven architecture for component communication:

```javascript
// Custom event dispatching
document.dispatchEvent(new CustomEvent('wtf:cart:update', {
  detail: { cart: cartData, last_added: itemData }
}));

// Event listening
document.addEventListener('wtf:cart:update', function(e) {
  updateCartDrawer(e.detail.cart);
  showSuccessMessage();
});
```

### Form Validation System
Comprehensive validation with user-friendly error messages:

```javascript
function validateForm() {
  // Size validation
  if (!selectedSize) {
    showStatus('Please select a size', 'error');
    return false;
  }
  
  // Strain validation
  if (!isMix && !selectedStrain) {
    showStatus('Please select a strain', 'error');
    return false;
  }
  
  if (isMix && (!selectedStrainA || !selectedStrainB)) {
    showStatus('Please select both strains for your mix', 'error');
    return false;
  }
  
  // Pump limit validation
  if (selectedSize !== 'Gallon' && currentPumps > pumpLimit) {
    showStatus(`Too many pumps! Maximum ${pumpLimit} for ${selectedSize}`, 'error');
    return false;
  }
  
  return true;
}
```

### State Management
Centralized state management for complex interactions:

```javascript
// Global state object
const builderState = {
  selectedSize: 'Medium',
  selectedStrain: 'Green',
  selectedStrainA: '',
  selectedStrainB: '',
  selectedIce: 'Regular Ice',
  selectedBoosters: [],
  selectedSweeteners: [],
  selectedCreamers: [],
  isMix: false,
  pumpLimit: 4,
  currentPumps: 0
};

// State update function
function updateState(key, value) {
  builderState[key] = value;
  updateHiddenInputs();
  updateUI();
}
```

## 🚀 Performance Optimization

### Asset Loading Strategy
- **Critical CSS**: Inlined in `<head>` for above-the-fold content
- **Non-critical CSS**: Loaded asynchronously
- **JavaScript**: Deferred loading with progressive enhancement
- **Images**: Lazy loading with proper sizing attributes

### Shopify Liquid Optimization
```liquid
{% comment %} Efficient variant mapping {% endcomment %}
{% liquid
  assign variant_map = product.variants | map: 'option1' | zip: product.variants | map: 'id'
  assign variant_prices = product.variants | map: 'option1' | zip: product.variants | map: 'price'
%}

{% comment %} Conditional rendering {% endcomment %}
{% unless product.has_only_default_variant %}
  {% render 'variant-selector', product: product %}
{% endunless %}
```

### AJAX Optimization
- Request batching for multiple operations
- Response caching for frequently accessed data
- Error retry logic with exponential backoff
- Loading state management

## 🧪 Testing & Quality Assurance

### Automated Testing Scripts

#### Conflict Detection (`check-conflicts.js`)
```javascript
// Scans for merge conflicts in theme files
const conflictMarkers = ['<<<<<<<', '>>>>>>>', '======='];
const files = glob.sync('**/*.liquid');

files.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  conflictMarkers.forEach(marker => {
    if (content.includes(marker)) {
      console.error(`Conflict marker found in ${file}`);
      process.exit(1);
    }
  });
});
```

#### Order Readiness Check (`order-readiness-check.js`)
```javascript
// Validates ordering system components
const requiredFiles = [
  'sections/main-product.liquid',
  'sections/wtf-cart.liquid',
  'templates/product.json',
  'templates/cart.liquid'
];

const requiredSections = [
  'enhanced-drink-builder',
  'custom-kratom-tea-builder',
  'custom-kava-drink-builder'
];

// Check file existence and validate structure
requiredFiles.forEach(file => {
  if (!fs.existsSync(file)) {
    console.error(`Missing required file: ${file}`);
    process.exit(1);
  }
});
```

#### Competitor Analysis (`competitors-audit.js`)
```javascript
// Analyzes competitor data and market positioning
const competitorData = require('./local-kava-bars-database - Sheet1.csv');
const documentationFiles = ['README.md', 'WTF_Site_Config.md'];

// Extract competitor names from documentation
function extractCompetitorNames(content) {
  const tableRegex = /\|([^|]+)\|([^|]+)\|/g;
  const names = [];
  let match;
  
  while ((match = tableRegex.exec(content)) !== null) {
    const name = match[1].trim();
    if (name && name !== 'Competitor') {
      names.push(name);
    }
  }
  
  return names;
}
```

### Manual Testing Checklist

#### Functionality Testing
- [ ] Size selection updates price correctly
- [ ] Strain selection works for individual and mix options
- [ ] Flavor pumps respect quantity limits
- [ ] Add-on selections save properly
- [ ] Form validation prevents invalid submissions
- [ ] AJAX cart updates without page reload
- [ ] Line item properties display in cart
- [ ] Mobile responsiveness across devices

#### Accessibility Testing
- [ ] Keyboard navigation works throughout
- [ ] Screen reader compatibility
- [ ] Focus indicators visible
- [ ] ARIA labels present and accurate
- [ ] Color contrast meets WCAG standards
- [ ] Form labels properly associated

#### Performance Testing
- [ ] Page load times under 3 seconds
- [ ] Core Web Vitals pass
- [ ] Images properly optimized
- [ ] JavaScript execution time minimal
- [ ] CSS render-blocking minimized

## 🔐 Security Considerations

### Input Validation
All user inputs are validated both client-side and server-side:

```javascript
// Client-side validation
function sanitizeInput(input) {
  return input.replace(/[<>\"']/g, '');
}

// Server-side validation via Shopify's built-in protection
// Line item properties are automatically sanitized
```

### CSRF Protection
Shopify's built-in CSRF protection is utilized for all form submissions.

### Data Privacy
No sensitive customer data is stored in line item properties beyond order customization details.

## 📊 Analytics Integration

### Event Tracking
Custom events are tracked for business intelligence:

```javascript
// Track drink builder interactions
function trackBuilderEvent(action, details) {
  if (typeof gtag !== 'undefined') {
    gtag('event', action, {
      event_category: 'Drink Builder',
      event_label: details.product_type,
      custom_parameters: details
    });
  }
}

// Usage
trackBuilderEvent('size_selected', {
  product_type: 'kratom_tea',
  size: 'Medium',
  price: 8.00
});
```

### Conversion Tracking
- Add to cart events
- Checkout initiation
- Purchase completion
- Custom drink configurations

## 🚀 Deployment & CI/CD

### GitHub Actions Workflows

#### Automated Testing (`automated-testing.yml`)
```yaml
name: Automated Testing
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run conflicts:scan
      - run: npm run competitors:audit
      - run: node scripts/order-readiness-check.js
      - run: shopify theme check --fail-level=error
```

#### CI/CD Pipeline (`ci-cd-pipeline.yml`)
```yaml
name: CI/CD Pipeline
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to Shopify
        run: shopify theme push --theme=${{ secrets.THEME_ID }}
        env:
          SHOPIFY_CLI_THEME_TOKEN: ${{ secrets.SHOPIFY_CLI_THEME_TOKEN }}
```

### Deployment Checklist
1. **Pre-deployment**:
   - [ ] Run all automated tests
   - [ ] Validate theme with Shopify CLI
   - [ ] Check for merge conflicts
   - [ ] Verify competitor data is current
   - [ ] Test ordering system functionality

2. **Deployment**:
   - [ ] Deploy to staging environment
   - [ ] Run smoke tests
   - [ ] Deploy to production
   - [ ] Monitor for errors

3. **Post-deployment**:
   - [ ] Verify all functionality works
   - [ ] Check analytics tracking
   - [ ] Monitor performance metrics
   - [ ] Update documentation

## 🔧 Troubleshooting Guide

### Common Issues

#### AJAX Cart Not Working
**Symptoms**: Add to cart button doesn't respond, no cart updates
**Solution**:
1. Check browser console for JavaScript errors
2. Verify `wtf-ajax-cart.js` is loaded
3. Ensure form has `data-wtf-ajax` attribute
4. Check network tab for failed requests

#### Variant Selection Issues
**Symptoms**: Price doesn't update, wrong variant selected
**Solution**:
1. Verify variant mapping in JavaScript
2. Check product has correct variants in Shopify admin
3. Ensure variant IDs are properly set in hidden inputs

#### Styling Problems
**Symptoms**: Layout broken, styles not applying
**Solution**:
1. Check CSS file paths in `theme.liquid`
2. Verify CSS syntax is valid
3. Check for conflicting styles
4. Clear browser cache

#### Performance Issues
**Symptoms**: Slow page loads, poor Core Web Vitals
**Solution**:
1. Optimize images (WebP format, proper sizing)
2. Minimize CSS and JavaScript
3. Use lazy loading for non-critical assets
4. Check for render-blocking resources

### Debug Mode
Enable debug mode by adding `?debug=1` to any URL:

```liquid
{% if request.params.debug %}
  <div class="debug-info">
    <h3>Debug Information</h3>
    <p>Product ID: {{ product.id }}</p>
    <p>Selected Variant: {{ product.selected_or_first_available_variant.id }}</p>
    <p>Cart Count: {{ cart.item_count }}</p>
  </div>
{% endif %}
```

## 📚 API Reference

### Custom Events

#### `wtf:cart:update`
Fired when cart is successfully updated.

**Detail Object**:
```javascript
{
  cart: {
    item_count: 2,
    total_price: 1800,
    items: [...]
  },
  last_added: {
    id: 123456,
    title: "Custom Kratom Tea",
    price: 800,
    properties: {...}
  }
}
```

#### `wtf:builder:validate`
Fired before form submission for custom validation.

**Detail Object**:
```javascript
{
  form: HTMLFormElement,
  isValid: boolean,
  errors: string[]
}
```

### Utility Functions

#### `updateCartCount(count)`
Updates cart count display in header.

#### `showStatus(message, type)`
Shows status message to user.
- `message`: String message to display
- `type`: 'success', 'error', or 'info'

#### `formatPrice(cents)`
Formats price in cents to currency string.

## 🔄 Version History

### v2.0.0 (Current)
- Added custom kratom tea builder
- Added custom kava drink builder
- Enhanced AJAX cart system
- Improved mobile responsiveness
- Added comprehensive testing suite
- Implemented CI/CD pipeline

### v1.0.0
- Initial theme release
- Basic drink builder functionality
- Standard Shopify cart integration
- Basic styling and layout

## 📞 Support & Maintenance

### Getting Help
1. **Check Documentation**: Review this technical documentation
2. **Search Issues**: Check GitHub issues for similar problems
3. **Create Issue**: Submit detailed bug report or feature request
4. **Contact Support**: Reach out to development team for urgent issues

### Maintenance Schedule
- **Daily**: Automated monitoring and error alerts
- **Weekly**: Performance review and optimization
- **Monthly**: Security updates and dependency updates
- **Quarterly**: Feature updates and major improvements

### Code Standards
- **Liquid**: Follow Shopify's Liquid coding standards
- **JavaScript**: ES6+ with proper error handling
- **CSS**: BEM methodology with mobile-first approach
- **Accessibility**: WCAG 2.1 AA compliance required
- **Performance**: Core Web Vitals optimization

---

**Last Updated**: September 2025  
**Version**: 2.0.0  
**Maintainer**: WTF Development Team
