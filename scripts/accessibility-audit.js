#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const projectRoot = path.resolve(__dirname, '..');

/**
 * Accessibility Audit Script for WTF Theme
 * Validates WCAG 2.1 AA compliance for keyboard navigation, ARIA labels, and focus management
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

const accessibilityChecks = [
  {
    id: 'drink-builder-accessibility',
    description: 'Drink builder accessibility compliance',
    file: 'sections/enhanced-drink-builder.liquid',
    tests: [
      {
        description: 'Form has proper labels and fieldsets',
        test: (content) => {
          return /<fieldset/i.test(content) && /<legend/i.test(content);
        },
        fix: 'Add <fieldset> and <legend> elements to group related form controls'
      },
      {
        description: 'Radio buttons have associated labels',
        test: (content) => {
          const radioInputs = content.match(/<input[^>]*type=["']radio["'][^>]*>/gi) || [];
          const labels = content.match(/<label[^>]*for=["'][^"']*["'][^>]*>/gi) || [];
          return radioInputs.length > 0 && labels.length >= radioInputs.length;
        },
        fix: 'Ensure all radio buttons have associated <label> elements with proper for attributes'
      },
      {
        description: 'Interactive elements have focus indicators',
        test: (content) => {
          return /focus[^}]*outline|focus[^}]*border|:focus/i.test(content);
        },
        fix: 'Add :focus styles for all interactive elements'
      },
      {
        description: 'ARIA roles and properties are present',
        test: (content) => {
          return /aria-/i.test(content) && /role=/i.test(content);
        },
        fix: 'Add appropriate ARIA roles, labels, and properties for screen readers'
      }
    ]
  },
  {
    id: 'navigation-accessibility',
    description: 'Navigation accessibility compliance',
    file: 'sections/header.liquid',
    tests: [
      {
        description: 'Navigation has proper landmark roles',
        test: (content) => {
          return /role=["']navigation["']|<nav/i.test(content);
        },
        fix: 'Use <nav> element or role="navigation" for main navigation'
      },
      {
        description: 'Skip links are present',
        test: (content) => {
          return /skip.*main|skip.*content/i.test(content);
        },
        fix: 'Add skip links for keyboard users to bypass navigation'
      },
      {
        description: 'Mobile menu has proper ARIA attributes',
        test: (content) => {
          return /aria-expanded|aria-controls|aria-label/i.test(content);
        },
        fix: 'Add ARIA attributes for mobile menu toggle functionality'
      }
    ]
  },
  {
    id: 'images-accessibility',
    description: 'Image accessibility compliance',
    files: ['sections/enhanced-drink-builder.liquid', 'snippets/wtf-product-card.liquid', 'templates/index.json'],
    tests: [
      {
        description: 'Images have descriptive alt text',
        test: (content) => {
          const images = content.match(/<img[^>]*>/gi) || [];
          const imagesWithAlt = content.match(/<img[^>]*alt=["'][^"']+["'][^>]*>/gi) || [];
          return images.length === 0 || imagesWithAlt.length >= images.length * 0.9; // Allow 10% decorative images
        },
        fix: 'Add descriptive alt text to all content images, use alt="" for decorative images'
      },
      {
        description: 'Decorative images are properly marked',
        test: (content) => {
          return /alt=["']["']|role=["']presentation["']/.test(content);
        },
        fix: 'Use alt="" or role="presentation" for decorative images'
      }
    ]
  },
  {
    id: 'forms-accessibility',
    description: 'Form accessibility compliance',
    files: ['sections/enhanced-drink-builder.liquid', 'sections/wtf-cart.liquid'],
    tests: [
      {
        description: 'Form controls have labels',
        test: (content) => {
          const inputs = content.match(/<input[^>]*>/gi) || [];
          const selects = content.match(/<select[^>]*>/gi) || [];
          const textareas = content.match(/<textarea[^>]*>/gi) || [];
          const totalControls = inputs.length + selects.length + textareas.length;
          
          const labels = content.match(/<label[^>]*>/gi) || [];
          const ariaLabels = content.match(/aria-label=/gi) || [];
          const ariaLabelledby = content.match(/aria-labelledby=/gi) || [];
          const totalLabels = labels.length + ariaLabels.length + ariaLabelledby.length;
          
          return totalControls === 0 || totalLabels >= totalControls * 0.8;
        },
        fix: 'Ensure all form controls have associated labels or ARIA labels'
      },
      {
        description: 'Error messages are accessible',
        test: (content) => {
          return /aria-describedby|aria-invalid|role=["']alert["']/.test(content);
        },
        fix: 'Use aria-describedby and aria-invalid for form validation messages'
      },
      {
        description: 'Required fields are indicated',
        test: (content) => {
          return /required|aria-required/.test(content);
        },
        fix: 'Mark required fields with required attribute or aria-required="true"'
      }
    ]
  },
  {
    id: 'color-contrast',
    description: 'Color contrast compliance',
    file: 'assets/theme.css',
    tests: [
      {
        description: 'CSS includes high contrast color definitions',
        test: (content) => {
          if (!content) return false;
          // Look for dark text on light backgrounds or vice versa
          return /color:\s*#[0-4][0-4][0-4]|color:\s*rgb\(.*[0-6][0-9],.*[0-6][0-9],.*[0-6][0-9]\)|color:\s*black/i.test(content);
        },
        fix: 'Ensure text colors meet WCAG AA contrast ratios (4.5:1 for normal text, 3:1 for large text)'
      }
    ]
  },
  {
    id: 'keyboard-navigation',
    description: 'Keyboard navigation support',
    files: ['assets/enhanced-drink-builder.js', 'assets/theme.js'],
    tests: [
      {
        description: 'Keyboard event handlers are present',
        test: (content) => {
          if (!content) return false;
          return /keydown|keyup|keypress/i.test(content);
        },
        fix: 'Add keyboard event handlers for interactive components'
      },
      {
        description: 'Focus management is implemented',
        test: (content) => {
          if (!content) return false;
          return /focus\(\)|tabindex|setAttribute.*tabindex/.test(content);
        },
        fix: 'Implement proper focus management for dynamic content'
      }
    ]
  },
  {
    id: 'semantic-html',
    description: 'Semantic HTML structure',
    files: ['layout/theme.liquid', 'sections/header.liquid', 'sections/footer.liquid'],
    tests: [
      {
        description: 'Proper heading hierarchy',
        test: (content) => {
          const h1Count = (content.match(/<h1/gi) || []).length;
          return h1Count === 1; // Should have exactly one h1 per page
        },
        fix: 'Use proper heading hierarchy with one h1 per page and logical h2-h6 structure'
      },
      {
        description: 'Semantic landmarks are used',
        test: (content) => {
          return /<main|<header|<footer|<nav|<aside|role=["']main["']|role=["']banner["']|role=["']contentinfo["']/.test(content);
        },
        fix: 'Use semantic HTML5 elements (main, header, footer, nav, aside) or ARIA landmark roles'
      }
    ]
  }
];

const results = [];
let failures = 0;

console.log('♿ WTF Theme Accessibility Audit');
console.log('==================================');

for (const check of accessibilityChecks) {
  const files = check.files || [check.file];
  let checkPassed = true;
  const checkFailures = [];

  for (const file of files) {
    if (!file) continue;
    
    const content = readFile(file);
    
    if (content === null) {
      checkPassed = false;
      checkFailures.push({
        file: file,
        description: 'File missing',
        fix: `Create ${file} to implement accessibility features.`
      });
      continue;
    }

    for (const test of check.tests) {
      let passed = false;
      try {
        passed = Boolean(test.test(content));
      } catch (error) {
        passed = false;
        checkFailures.push({
          file: file,
          description: test.description,
          fix: `${test.fix} (validation error: ${error.message})`
        });
        continue;
      }

      if (!passed) {
        checkPassed = false;
        checkFailures.push({
          file: file,
          description: test.description,
          fix: test.fix
        });
      }
    }
  }

  if (!checkPassed) {
    failures += checkFailures.length;
    results.push({
      id: check.id,
      description: check.description,
      status: 'failed',
      failures: checkFailures
    });
  } else {
    results.push({
      id: check.id,
      description: check.description,
      status: 'passed'
    });
  }
}

// Output results
for (const result of results) {
  if (result.status === 'passed') {
    console.log(`✅ ${result.description}`);
  } else {
    console.log(`❌ ${result.description}`);
    for (const failure of result.failures) {
      console.log(`   ↳ ${failure.description} (${failure.file})`);
      console.log(`      Fix: ${failure.fix}`);
    }
  }
}

console.log('\n📋 Accessibility Enhancement Recommendations:');
console.log('- Implement keyboard navigation for all interactive elements');
console.log('- Add ARIA live regions for dynamic content updates');
console.log('- Ensure color contrast meets WCAG AA standards');
console.log('- Test with screen readers (NVDA, JAWS, VoiceOver)');
console.log('- Validate with automated tools (axe-core, WAVE)');
console.log('- Conduct user testing with assistive technology users');

if (process.env.GITHUB_STEP_SUMMARY) {
  const summary = results.map(r => {
    if (r.status === 'passed') {
      return `✅ ${r.description}`;
    } else {
      return `❌ ${r.description}\n${r.failures.map(f => `   - ${f.description} (${f.file})`).join('\n')}`;
    }
  }).join('\n');
  
  try {
    fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, `## Accessibility Audit Results\n${summary}\n`);
  } catch (error) {
    console.warn('Unable to write GitHub step summary:', error.message);
  }
}

if (failures > 0) {
  console.log(`\n⚠️  ${failures} accessibility issues found`);
  process.exitCode = 1;
} else {
  console.log('\n🎉 All accessibility checks passed!');
}
