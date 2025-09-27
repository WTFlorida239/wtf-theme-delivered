#!/usr/bin/env node

/**
 * GitHub Actions Health Check Script
 * Validates all workflow files and automation components
 */

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

console.log('🏥 GitHub Actions Health Check');
console.log('==============================');

let checks = 0;
let passed = 0;
let failed = 0;

function checkFile(filePath, description) {
  checks++;
  if (fs.existsSync(filePath)) {
    console.log(`✅ ${description}`);
    passed++;
    return true;
  } else {
    console.log(`❌ ${description} - Missing: ${filePath}`);
    failed++;
    return false;
  }
}

function checkWorkflowFile(filePath) {
  checks++;
  try {
    if (!fs.existsSync(filePath)) {
      console.log(`❌ Workflow file missing: ${filePath}`);
      failed++;
      return false;
    }
    
    const content = fs.readFileSync(filePath, 'utf8');
    const workflow = yaml.load(content);
    
    if (!workflow.name) {
      console.log(`❌ Workflow missing name: ${filePath}`);
      failed++;
      return false;
    }
    
    if (!workflow.on) {
      console.log(`❌ Workflow missing triggers: ${filePath}`);
      failed++;
      return false;
    }
    
    console.log(`✅ Workflow valid: ${workflow.name}`);
    passed++;
    return true;
    
  } catch (error) {
    console.log(`❌ Workflow invalid: ${filePath} - ${error.message}`);
    failed++;
    return false;
  }
}

// Run health checks
console.log('\n🔍 Checking core files...');
checkFile('package.json', 'Package.json exists');
checkFile('scripts/competitors-audit.js', 'Competitors audit script');
checkFile('scripts/order-readiness-check.js', 'Order readiness check script');
checkFile('scripts/conflicts-scan.js', 'Conflicts scan script');

console.log('\n🔍 Checking workflow files...');
const workflowDir = '.github/workflows';
if (fs.existsSync(workflowDir)) {
  const workflows = fs.readdirSync(workflowDir).filter(f => f.endsWith('.yml') || f.endsWith('.yaml'));
  workflows.forEach(workflow => {
    checkWorkflowFile(path.join(workflowDir, workflow));
  });
} else {
  console.log('❌ Workflows directory missing');
  failed++;
}

console.log('\n🔍 Checking theme files...');
checkFile('sections/footer.liquid', 'Footer section');
checkFile('layout/theme.liquid', 'Theme layout');
checkFile('assets/wtf-ajax-cart.js', 'AJAX cart script');

// Summary
console.log(`\n📊 Health Check Summary:`);
console.log(`   Total checks: ${checks}`);
console.log(`   Passed: ${passed}`);
console.log(`   Failed: ${failed}`);

if (failed === 0) {
  console.log('✅ All health checks passed');
  process.exit(0);
} else {
  console.log(`❌ ${failed} health checks failed`);
  process.exit(1);
}
