#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const projectRoot = path.resolve(__dirname, '..');

/**
 * Utility helpers
 */
const readFile = (relativePath) => {
  const filePath = path.join(projectRoot, relativePath);
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch (error) {
    if (error.code === 'ENOENT') {
      return null;
    }
    throw error;
  }
};

const safeJsonParse = (raw, filePath) => {
  try {
    return JSON.parse(raw);
  } catch (error) {
    throw new Error(`Unable to parse JSON for ${filePath}: ${error.message}`);
  }
};

const checks = [
  {
    id: 'product-form',
    description: 'Main product section posts variants to the Shopify cart API.',
    file: 'sections/main-product.liquid',
    tests: [
      {
        description: 'Contains a form that posts to routes.cart_add_url',
        test: (content) => /<form[^>]+action="\{\{\s*routes\.cart_add_url\s*\}\}"/i.test(content),
        fix: 'Ensure the product form uses action="{{ routes.cart_add_url }}" so add-to-cart works.'
      },
      {
        description: 'Includes the hidden variant input name="id"',
        test: (content) => /<input[^>]+name="id"/i.test(content),
        fix: 'Add <input type="hidden" name="id" value="{{ product.selected_or_first_available_variant.id }}"> inside the form.'
      }
    ]
  },
  {
    id: 'product-template-section',
    description: 'Online Store 2.0 product template loads the main-product section.',
    file: 'templates/product.json',
    tests: [
      {
        description: 'Template JSON includes a main section with type "main-product"',
        test: (content) => {
          if (!content) return false;
          const data = safeJsonParse(content, 'templates/product.json');
          return Boolean(data.sections && data.sections.main && data.sections.main.type === 'main-product');
        },
        fix: 'Update templates/product.json so the main section uses type "main-product".'
      }
    ]
  },
  {
    id: 'cart-template',
    description: 'Cart template renders the polished WTF cart section.',
    file: 'templates/cart.liquid',
    tests: [
      {
        description: 'Includes {% section "wtf-cart" %}',
        test: (content) => /\{\%\s*section\s+'wtf-cart'\s*\%\}/.test(content),
        fix: 'Mount the wtf-cart section from templates/cart.liquid so checkout flows are branded.'
      }
    ]
  },
  {
    id: 'cart-checkout-button',
    description: 'Cart section exposes a checkout button for conversion.',
    file: 'sections/wtf-cart.liquid',
    tests: [
      {
        description: 'Has a checkout submit button with name="checkout"',
        test: (content) => /<button[^>]+name="checkout"/i.test(content),
        fix: 'Add <button name="checkout" type="submit">Checkout</button> to the cart form.'
      },
      {
        description: 'Renders line item properties for drink builders',
        test: (content) => /wtf-line__properties/.test(content),
        fix: 'Expose cart line item properties so custom drink notes are visible to staff.'
      }
    ]
  },
  {
    id: 'seo-structured-data',
    description: 'Product schema JSON-LD is in place for PDP rich results.',
    file: 'snippets/enhanced-meta-tags.liquid',
    tests: [
      {
        description: 'Contains "@type": "Product" JSON-LD block',
        test: (content) => /"@type"\s*:\s*"Product"/.test(content),
        fix: 'Add a Product JSON-LD block inside enhanced-meta-tags.liquid.'
      },
      {
        description: 'Contains LocalBusiness schema for local SEO',
        test: (content) => /"@type"\s*:\s*"LocalBusiness"/.test(content),
        fix: 'Embed LocalBusiness structured data for WTF Cape Coral.'
      }
    ]
  },
  {
    id: 'theme-layout-hooks',
    description: 'Theme layout loads enhanced meta tags and structured data snippets.',
    file: 'layout/theme.liquid',
    tests: [
      {
        description: 'Renders enhanced-meta-tags snippet',
        test: (content) => /\{\%\s*render\s+'enhanced-meta-tags'\s*\%\}/.test(content),
        fix: 'Include {% render "enhanced-meta-tags" %} inside <head>.'
      },
      {
        description: 'Renders structured-data snippet',
        test: (content) => /\{\%\s*render\s+'structured-data'\s*\%\}/.test(content),
        fix: 'Include {% render "structured-data" %} inside <head>.'
      }
    ]
  }
];

const results = [];
let failures = 0;

for (const check of checks) {
  const content = readFile(check.file);
  if (content === null) {
    failures += 1;
    results.push({
      id: check.id,
      description: check.description,
      status: 'file-missing',
      file: check.file,
      failures: [
        {
          description: 'File missing',
          fix: `Create ${check.file} to satisfy the order readiness requirement.`
        }
      ]
    });
    continue;
  }

  const failedTests = [];
  for (const test of check.tests) {
    let passed = false;
    try {
      passed = Boolean(test.test(content));
    } catch (error) {
      passed = false;
      failedTests.push({
        description: test.description,
        fix: `${test.fix} (error: ${error.message})`
      });
      continue;
    }

    if (!passed) {
      failedTests.push({
        description: test.description,
        fix: test.fix
      });
    }
  }

  if (failedTests.length > 0) {
    failures += failedTests.length;
    results.push({
      id: check.id,
      description: check.description,
      status: 'failed',
      file: check.file,
      failures: failedTests
    });
  } else {
    results.push({
      id: check.id,
      description: check.description,
      status: 'passed',
      file: check.file
    });
  }
}

const summaryLines = [];
summaryLines.push('🧪 WTF Order Readiness Audit');
summaryLines.push('---------------------------------------');
for (const result of results) {
  if (result.status === 'passed') {
    summaryLines.push(`✅ ${result.description}`);
  } else if (result.status === 'file-missing') {
    summaryLines.push(`❌ ${result.description} — missing file (${result.file})`);
    for (const failure of result.failures) {
      summaryLines.push(`   ↳ ${failure.description}`);
      summaryLines.push(`      Fix: ${failure.fix}`);
    }
  } else {
    summaryLines.push(`❌ ${result.description}`);
    for (const failure of result.failures) {
      summaryLines.push(`   ↳ ${failure.description}`);
      summaryLines.push(`      Fix: ${failure.fix}`);
    }
  }
}

const manualSteps = [
  'Configure the 2Accept payment gateway and run a $1 authorization in Shopify admin.',
  'Confirm shipping and pickup rates in Settings → Shipping and delivery.',
  'Verify tax settings for Florida and any ship-to states.',
  'Sync Lightspeed Retail inventory and map SKUs to Shopify variants.',
  'QA the drink builder flows on mobile and desktop using a real checkout session.',
  'Populate product metafields for allergens, potency, and FAQs to maximize structured data richness.'
];

summaryLines.push('\nNext manual go-live tasks:');
for (const step of manualSteps) {
  summaryLines.push(`- ${step}`);
}

const summary = summaryLines.join('\n');
console.log(summary);

if (process.env.GITHUB_STEP_SUMMARY) {
  try {
    fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, `${summary}\n`);
  } catch (error) {
    console.warn('Unable to write GitHub step summary:', error.message);
  }
}

if (failures > 0) {
  process.exitCode = 1;
}
