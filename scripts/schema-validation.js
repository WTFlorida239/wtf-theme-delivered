#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const projectRoot = path.resolve(__dirname, '..');

/**
 * Schema Validation Script for WTF Theme
 * Validates JSON-LD structured data output for homepage, builder flows, and hero cards
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

const extractJsonLd = (content) => {
  const jsonLdBlocks = [];
  const regex = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match;
  
  while ((match = regex.exec(content)) !== null) {
    try {
      const jsonContent = match[1].trim();
      // Remove Liquid template tags for basic validation
      const cleanedJson = jsonContent.replace(/\{\{[^}]*\}\}/g, '"TEMPLATE_VALUE"');
      const parsed = JSON.parse(cleanedJson);
      jsonLdBlocks.push({
        raw: jsonContent,
        parsed: parsed,
        type: parsed['@type'] || 'Unknown'
      });
    } catch (error) {
      jsonLdBlocks.push({
        raw: match[1].trim(),
        parsed: null,
        type: 'Invalid',
        error: error.message
      });
    }
  }
  
  return jsonLdBlocks;
};

const validateRequiredProperties = (schema, requiredProps) => {
  const missing = [];
  for (const prop of requiredProps) {
    if (!schema.hasOwnProperty(prop)) {
      missing.push(prop);
    }
  }
  return missing;
};

const schemaValidations = [
  {
    id: 'local-business-schema',
    description: 'LocalBusiness schema validation for homepage and business pages',
    file: 'snippets/local-business-schema.liquid',
    tests: [
      {
        description: 'Contains valid LocalBusiness JSON-LD structure',
        test: (content) => {
          const jsonLdBlocks = extractJsonLd(content);
          return jsonLdBlocks.some(block => 
            block.type === 'LocalBusiness' && block.parsed !== null
          );
        },
        fix: 'Ensure LocalBusiness schema has valid JSON-LD structure with @type: "LocalBusiness"'
      },
      {
        description: 'Includes required LocalBusiness properties',
        test: (content) => {
          const jsonLdBlocks = extractJsonLd(content);
          const localBusiness = jsonLdBlocks.find(block => block.type === 'LocalBusiness');
          if (!localBusiness || !localBusiness.parsed) return false;
          
          const required = ['name', 'address', 'telephone', 'openingHours', 'geo'];
          const missing = validateRequiredProperties(localBusiness.parsed, required);
          return missing.length === 0;
        },
        fix: 'Add required properties: name, address, telephone, openingHours, geo to LocalBusiness schema'
      }
    ]
  },
  {
    id: 'product-schema',
    description: 'Product schema validation for drink builder and product pages',
    file: 'snippets/product-schema.liquid',
    tests: [
      {
        description: 'Contains valid Product JSON-LD structure',
        test: (content) => {
          const jsonLdBlocks = extractJsonLd(content);
          return jsonLdBlocks.some(block => 
            block.type === 'Product' && block.parsed !== null
          );
        },
        fix: 'Ensure Product schema has valid JSON-LD structure with @type: "Product"'
      },
      {
        description: 'Includes required Product properties',
        test: (content) => {
          const jsonLdBlocks = extractJsonLd(content);
          const product = jsonLdBlocks.find(block => block.type === 'Product');
          if (!product || !product.parsed) return false;
          
          const required = ['name', 'description', 'offers', 'brand'];
          const missing = validateRequiredProperties(product.parsed, required);
          return missing.length === 0;
        },
        fix: 'Add required properties: name, description, offers, brand to Product schema'
      },
      {
        description: 'Product offers include required pricing information',
        test: (content) => {
          const jsonLdBlocks = extractJsonLd(content);
          const product = jsonLdBlocks.find(block => block.type === 'Product');
          if (!product || !product.parsed || !product.parsed.offers) return false;
          
          const offers = Array.isArray(product.parsed.offers) ? product.parsed.offers[0] : product.parsed.offers;
          const required = ['@type', 'price', 'priceCurrency', 'availability'];
          return required.every(prop => offers.hasOwnProperty(prop));
        },
        fix: 'Ensure Product offers include @type, price, priceCurrency, and availability'
      }
    ]
  },
  {
    id: 'recipe-schema',
    description: 'Recipe schema validation for preset drink recipes',
    file: 'snippets/recipe-schema.liquid',
    tests: [
      {
        description: 'Contains valid Recipe JSON-LD structure',
        test: (content) => {
          if (!content) return false; // File might not exist yet
          const jsonLdBlocks = extractJsonLd(content);
          return jsonLdBlocks.some(block => 
            block.type === 'Recipe' && block.parsed !== null
          );
        },
        fix: 'Create Recipe schema with valid JSON-LD structure for preset drink recipes'
      },
      {
        description: 'Includes required Recipe properties',
        test: (content) => {
          if (!content) return false;
          const jsonLdBlocks = extractJsonLd(content);
          const recipe = jsonLdBlocks.find(block => block.type === 'Recipe');
          if (!recipe || !recipe.parsed) return false;
          
          const required = ['name', 'description', 'recipeIngredient', 'recipeInstructions'];
          const missing = validateRequiredProperties(recipe.parsed, required);
          return missing.length === 0;
        },
        fix: 'Add required properties: name, description, recipeIngredient, recipeInstructions to Recipe schema'
      }
    ]
  },
  {
    id: 'faq-schema',
    description: 'FAQ schema validation for competitor differentiation',
    file: 'snippets/faq-schema.liquid',
    tests: [
      {
        description: 'Contains valid FAQPage JSON-LD structure',
        test: (content) => {
          if (!content) return false;
          const jsonLdBlocks = extractJsonLd(content);
          return jsonLdBlocks.some(block => 
            block.type === 'FAQPage' && block.parsed !== null
          );
        },
        fix: 'Create FAQPage schema with valid JSON-LD structure'
      },
      {
        description: 'Includes mainEntity with Question/Answer pairs',
        test: (content) => {
          if (!content) return false;
          const jsonLdBlocks = extractJsonLd(content);
          const faq = jsonLdBlocks.find(block => block.type === 'FAQPage');
          if (!faq || !faq.parsed || !faq.parsed.mainEntity) return false;
          
          const questions = Array.isArray(faq.parsed.mainEntity) ? faq.parsed.mainEntity : [faq.parsed.mainEntity];
          return questions.every(q => q['@type'] === 'Question' && q.acceptedAnswer);
        },
        fix: 'Ensure FAQPage mainEntity contains Question objects with acceptedAnswer properties'
      }
    ]
  },
  {
    id: 'event-schema',
    description: 'Event schema validation for competitive programming',
    file: 'snippets/events-schema.liquid',
    tests: [
      {
        description: 'Contains valid Event JSON-LD structure',
        test: (content) => {
          const jsonLdBlocks = extractJsonLd(content);
          return jsonLdBlocks.some(block => 
            block.type === 'Event' && block.parsed !== null
          );
        },
        fix: 'Ensure Event schema has valid JSON-LD structure with @type: "Event"'
      },
      {
        description: 'Includes required Event properties',
        test: (content) => {
          const jsonLdBlocks = extractJsonLd(content);
          const event = jsonLdBlocks.find(block => block.type === 'Event');
          if (!event || !event.parsed) return false;
          
          const required = ['name', 'startDate', 'location', 'description'];
          const missing = validateRequiredProperties(event.parsed, required);
          return missing.length === 0;
        },
        fix: 'Add required properties: name, startDate, location, description to Event schema'
      }
    ]
  },
  {
    id: 'homepage-schema',
    description: 'Homepage schema integration validation',
    file: 'templates/index.json',
    tests: [
      {
        description: 'Homepage template includes schema-enabled sections',
        test: (content) => {
          if (!content) return false;
          try {
            const data = JSON.parse(content);
            const sections = Object.values(data.sections || {});
            return sections.some(section => 
              section.type && ['hero', 'featured-products', 'local-business'].includes(section.type)
            );
          } catch (error) {
            return false;
          }
        },
        fix: 'Ensure homepage includes sections that render structured data (hero, featured-products, local-business)'
      }
    ]
  },
  {
    id: 'drink-builder-schema',
    description: 'Drink builder schema integration',
    file: 'sections/enhanced-drink-builder.liquid',
    tests: [
      {
        description: 'Drink builder includes product schema rendering',
        test: (content) => {
          return /\{\%\s*render\s+['"]product-schema['"]/.test(content);
        },
        fix: 'Add {% render "product-schema" %} to drink builder section for rich product results'
      },
      {
        description: 'Drink builder supports recipe schema for presets',
        test: (content) => {
          return /\{\%\s*render\s+['"]recipe-schema['"]/.test(content) || 
                 /recipe.*schema/i.test(content);
        },
        fix: 'Add recipe schema support for preset drink combinations'
      }
    ]
  }
];

const results = [];
let failures = 0;

console.log('🔍 WTF Theme Schema Validation');
console.log('=====================================');

for (const validation of schemaValidations) {
  const content = readFile(validation.file);
  
  if (content === null && validation.id !== 'recipe-schema' && validation.id !== 'faq-schema') {
    failures += 1;
    results.push({
      id: validation.id,
      description: validation.description,
      status: 'file-missing',
      file: validation.file,
      failures: [{
        description: 'File missing',
        fix: `Create ${validation.file} to implement required schema markup.`
      }]
    });
    continue;
  }

  const failedTests = [];
  for (const test of validation.tests) {
    let passed = false;
    try {
      passed = Boolean(test.test(content));
    } catch (error) {
      passed = false;
      failedTests.push({
        description: test.description,
        fix: `${test.fix} (validation error: ${error.message})`
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
      id: validation.id,
      description: validation.description,
      status: 'failed',
      file: validation.file,
      failures: failedTests
    });
  } else {
    results.push({
      id: validation.id,
      description: validation.description,
      status: 'passed',
      file: validation.file
    });
  }
}

// Output results
for (const result of results) {
  if (result.status === 'passed') {
    console.log(`✅ ${result.description}`);
  } else if (result.status === 'file-missing') {
    console.log(`❌ ${result.description} — missing file (${result.file})`);
    for (const failure of result.failures) {
      console.log(`   ↳ ${failure.description}`);
      console.log(`      Fix: ${failure.fix}`);
    }
  } else {
    console.log(`❌ ${result.description}`);
    for (const failure of result.failures) {
      console.log(`   ↳ ${failure.description}`);
      console.log(`      Fix: ${failure.fix}`);
    }
  }
}

console.log('\n📋 Schema Enhancement Recommendations:');
console.log('- Implement Recipe schema for preset drink combinations');
console.log('- Add FAQPage schema to differentiate from competitors');
console.log('- Enhance Event schema for weekly programming');
console.log('- Validate schema markup with Google Rich Results Test');
console.log('- Monitor schema performance in Google Search Console');

if (process.env.GITHUB_STEP_SUMMARY) {
  const summary = results.map(r => {
    if (r.status === 'passed') {
      return `✅ ${r.description}`;
    } else {
      return `❌ ${r.description}\n${r.failures.map(f => `   - ${f.description}`).join('\n')}`;
    }
  }).join('\n');
  
  try {
    fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, `## Schema Validation Results\n${summary}\n`);
  } catch (error) {
    console.warn('Unable to write GitHub step summary:', error.message);
  }
}

if (failures > 0) {
  console.log(`\n⚠️  ${failures} schema validation issues found`);
  process.exitCode = 1;
} else {
  console.log('\n🎉 All schema validations passed!');
}
