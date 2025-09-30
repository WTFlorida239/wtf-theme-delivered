/**
 * Pricing Validation System for WTF | Welcome To Florida
 * Ensures accurate pricing for all product configurations at checkout
 */

class PricingValidator {
  constructor() {
    this.pricingRules = {
      // Kratom Teas pricing
      'kratom-teas': {
        basePrice: {
          'Medium': 9.00,
          'Large': 15.00,
          'Gallon': 100.00
        },
        addOns: {
          // No additional charges for flavors or strains
        }
      },
      
      // Kava Drinks pricing
      'kava-drinks': {
        basePrice: {
          'Regular': 9.00,
          'Double': 15.00,
          'Gallon': 100.00
        },
        addOns: {
          // No additional charges for flavors or creamers
        }
      },
      
      // THC Drinks pricing
      'thc-drinks': {
        basePrice: {
          'Regular': 15.00,
          'Large': 20.00,
          'Gallon': 120.00
        },
        addOns: {
          // No additional charges for flavors
        }
      },
      
      // THC Shots pricing with flight discount
      'thc-shots': {
        basePrice: {
          '1 Shot': 12.00,
          'Flight of Shots': 40.00 // Discounted from 48.00 (4 x 12.00)
        },
        addOns: {
          // No additional charges for flavors
        },
        discounts: {
          'Flight of Shots': {
            originalPrice: 48.00,
            discountedPrice: 40.00,
            savings: 8.00
          }
        }
      },
      
      // Draft Pours pricing
      'draft-pours': {
        basePrice: {
          '16oz': 15.00
        },
        addOns: {
          // No additional charges for draft selection
        }
      },
      
      // Canned Drinks pricing (variable by brand)
      'canned-drinks': {
        basePrice: {
          'White Rabbit Energy': 8.0,
          'Rapture': 8.0,
          'Drippy': 8.0,
          'Uncle Skunk': 15.99,
          'Chronic Harvest Lemonade': 15.99,
          'Crank': 10.99,
          'Tea Time': 8.49,
          'Much Love': 7.99,
          'Mitra': 7.0,
          'Lumenade': 10.0,
          'Imba': 3.99,
          'Torch': 10.99,
          'Two Scoops': 9.0
        },
        defaultPrice: 10.0
      }
    };
    
    this.init();
  }

  init() {
    // Bind to cart events
    document.addEventListener('DOMContentLoaded', () => {
      this.bindCartEvents();
      this.validateExistingCart();
    });
  }

  bindCartEvents() {
    // Listen for add to cart events
    document.addEventListener('kratom:added', (e) => this.validateItemPrice(e.detail, 'kratom-teas'));
    document.addEventListener('kava:added', (e) => this.validateItemPrice(e.detail, 'kava-drinks'));
    document.addEventListener('thc-drinks:added', (e) => this.validateItemPrice(e.detail, 'thc-drinks'));
    document.addEventListener('thc-shots:added', (e) => this.validateItemPrice(e.detail, 'thc-shots'));
    document.addEventListener('draft:added', (e) => this.validateItemPrice(e.detail, 'draft-pours'));
    document.addEventListener('canned:added', (e) => this.validateItemPrice(e.detail, 'canned-drinks'));
  }

  validateItemPrice(itemDetail, productType) {
    const expectedPrice = this.calculateExpectedPrice(itemDetail, productType);
    const actualPrice = this.extractActualPrice(itemDetail);
    
    if (Math.abs(expectedPrice - actualPrice) > 0.01) { // Allow for rounding differences
      console.warn('Price mismatch detected:', {
        productType,
        expected: expectedPrice,
        actual: actualPrice,
        item: itemDetail
      });
      
      // Optionally show user notification
      this.showPricingAlert(expectedPrice, actualPrice, productType);
    }
    
    return expectedPrice;
  }

  calculateExpectedPrice(itemDetail, productType) {
    const rules = this.pricingRules[productType];
    if (!rules) {
      console.warn('No pricing rules found for product type:', productType);
      return 0;
    }

    let basePrice = 0;
    
    // Calculate base price based on product type
    switch (productType) {
      case 'kratom-teas':
      case 'kava-drinks':
      case 'thc-drinks':
        basePrice = rules.basePrice[itemDetail.Size] || 0;
        break;
        
      case 'thc-shots':
        basePrice = rules.basePrice[itemDetail.Type] || 0;
        break;
        
      case 'draft-pours':
        basePrice = rules.basePrice['16oz'] || 0;
        break;
        
      case 'canned-drinks':
        basePrice = rules.basePrice[itemDetail.Brand] || rules.defaultPrice;
        break;
        
      default:
        console.warn('Unknown product type for pricing:', productType);
        return 0;
    }

    // Add any applicable add-on charges
    let addOnCharges = 0;
    if (rules.addOns) {
      // Currently no add-on charges, but structure is ready for future use
    }

    const totalPrice = basePrice + addOnCharges;
    const quantity = itemDetail.quantity || 1;
    
    return totalPrice * quantity;
  }

  extractActualPrice(itemDetail) {
    // Try to extract price from various possible sources
    if (itemDetail.price) {
      return parseFloat(itemDetail.price);
    }
    
    if (itemDetail.totalPrice) {
      return parseFloat(itemDetail.totalPrice);
    }
    
    // If no price in item detail, we'll need to fetch from cart
    return 0;
  }

  async validateExistingCart() {
    try {
      const cart = await fetch('/cart.js').then(r => r.json());
      
      for (const item of cart.items) {
        const productType = this.identifyProductType(item);
        if (productType) {
          const expectedPrice = this.calculateExpectedPriceFromCartItem(item, productType);
          const actualPrice = item.final_price / 100; // Shopify prices are in cents
          
          if (Math.abs(expectedPrice - actualPrice) > 0.01) {
            console.warn('Cart item price mismatch:', {
              productType,
              expected: expectedPrice,
              actual: actualPrice,
              item: item
            });
          }
        }
      }
    } catch (error) {
      console.warn('Failed to validate existing cart:', error);
    }
  }

  identifyProductType(cartItem) {
    // Identify product type from cart item properties or product handle
    const handle = cartItem.handle || cartItem.product_handle || '';
    const properties = cartItem.properties || {};
    
    if (handle.includes('kratom') || properties.Strain) {
      return 'kratom-teas';
    }
    
    if (handle.includes('kava') || properties.Creamer !== undefined) {
      return 'kava-drinks';
    }
    
    if (handle.includes('thc-drinks') || (properties.Flavor && properties.Size && !properties.Type)) {
      return 'thc-drinks';
    }
    
    if (handle.includes('thc-shots') || properties.Type) {
      return 'thc-shots';
    }
    
    if (handle.includes('draft') || properties.Draft) {
      return 'draft-pours';
    }
    
    if (handle.includes('canned') || properties.Brand) {
      return 'canned-drinks';
    }
    
    return null;
  }

  calculateExpectedPriceFromCartItem(cartItem, productType) {
    const properties = cartItem.properties || {};
    const quantity = cartItem.quantity || 1;
    
    // Convert cart item to itemDetail format
    const itemDetail = {
      Size: properties.Size,
      Type: properties.Type,
      Brand: properties.Brand,
      quantity: quantity
    };
    
    return this.calculateExpectedPrice(itemDetail, productType);
  }

  showPricingAlert(expectedPrice, actualPrice, productType) {
    // Create a non-intrusive notification
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #fff3cd;
      border: 1px solid #ffeaa7;
      color: #856404;
      padding: 15px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 10000;
      max-width: 300px;
      font-size: 14px;
      line-height: 1.4;
    `;
    
    notification.innerHTML = `
      <strong>⚠️ Pricing Notice</strong><br>
      Expected: $${expectedPrice.toFixed(2)}<br>
      Actual: $${actualPrice.toFixed(2)}<br>
      <small>Product: ${productType}</small>
    `;
    
    document.body.appendChild(notification);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 5000);
  }

  // Public method to manually validate a price
  validatePrice(itemDetail, productType) {
    return this.validateItemPrice(itemDetail, productType);
  }

  // Public method to get expected price without validation
  getExpectedPrice(itemDetail, productType) {
    return this.calculateExpectedPrice(itemDetail, productType);
  }

  // Public method to get pricing rules for debugging
  getPricingRules() {
    return this.pricingRules;
  }

  // Method to update pricing rules (for admin use)
  updatePricingRules(productType, newRules) {
    if (this.pricingRules[productType]) {
      this.pricingRules[productType] = { ...this.pricingRules[productType], ...newRules };
      console.log(`Updated pricing rules for ${productType}:`, this.pricingRules[productType]);
    } else {
      console.warn(`Product type ${productType} not found in pricing rules`);
    }
  }
}

// Initialize pricing validator
document.addEventListener('DOMContentLoaded', () => {
  window.pricingValidator = new PricingValidator();
  
  // Expose for debugging
  window.validatePricing = (itemDetail, productType) => {
    return window.pricingValidator.validatePrice(itemDetail, productType);
  };
  
  window.getPricingRules = () => {
    return window.pricingValidator.getPricingRules();
  };
});
