#!/usr/bin/env node

/**
 * GitHub Actions Health Check Script
 * Validates all workflow components and dependencies
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔍 GitHub Actions Health Check');
console.log('=====================================\n');

const results = {
  passed: 0,
  failed: 0,
  warnings: 0,
  issues: []
};

function checkPassed(message) {
  console.log(`✅ ${message}`);
  results.passed++;
}

function checkFailed(message, error = null) {
  console.log(`❌ ${message}`);
  if (error) {
    console.log(`   Error: ${error.message || error}`);
  }
  results.failed++;
  results.issues.push(message);
}

function checkWarning(message) {
  console.log(`⚠️  ${message}`);
  results.warnings++;
}

// 1. Check workflow files exist and are valid YAML
console.log('1️⃣ Checking Workflow Files...');
const workflowDir = '.github/workflows';
const requiredWorkflows = [
  'automated-testing.yml',
  'deployment.yml', 
  'drift-prevention.yml'
];

if (!fs.existsSync(workflowDir)) {
  checkFailed('GitHub workflows directory not found');
} else {
  checkPassed('GitHub workflows directory exists');
  
  requiredWorkflows.forEach(workflow => {
    const workflowPath = path.join(workflowDir, workflow);
    if (!fs.existsSync(workflowPath)) {
      checkFailed(`Required workflow missing: ${workflow}`);
    } else {
      try {
        const yaml = require('js-yaml');
        const content = fs.readFileSync(workflowPath, 'utf8');
        yaml.load(content);
        checkPassed(`Workflow valid: ${workflow}`);
      } catch (error) {
        checkFailed(`Invalid YAML in ${workflow}`, error);
      }
    }
  });
}

console.log('\n2️⃣ Checking Script Dependencies...');

// 2. Check required scripts exist
const requiredScripts = [
  'scripts/order-readiness-check.js',
  'scripts/competitors-audit.js',
  'scripts/conflicts-scan.js'
];

requiredScripts.forEach(script => {
  if (!fs.existsSync(script)) {
    checkFailed(`Required script missing: ${script}`);
  } else {
    checkPassed(`Script exists: ${script}`);
  }
});

// 3. Check package.json scripts
console.log('\n3️⃣ Checking NPM Scripts...');
try {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const requiredNpmScripts = [
    'conflicts:scan',
    'competitors:audit'
  ];
  
  requiredNpmScripts.forEach(scriptName => {
    if (!packageJson.scripts || !packageJson.scripts[scriptName]) {
      checkFailed(`NPM script missing: ${scriptName}`);
    } else {
      checkPassed(`NPM script defined: ${scriptName}`);
    }
  });
} catch (error) {
  checkFailed('Could not read package.json', error);
}

// 4. Test script execution
console.log('\n4️⃣ Testing Script Execution...');

const testScripts = [
  { name: 'Conflicts Scan', command: 'npm run conflicts:scan' },
  { name: 'Competitors Audit', command: 'npm run competitors:audit' },
  { name: 'Order Readiness', command: 'node scripts/order-readiness-check.js' }
];

testScripts.forEach(test => {
  try {
    execSync(test.command, { stdio: 'pipe', timeout: 30000 });
    checkPassed(`${test.name} executes successfully`);
  } catch (error) {
    checkFailed(`${test.name} execution failed`, error);
  }
});

// 5. Check Shopify CLI availability
console.log('\n5️⃣ Checking Shopify CLI...');
try {
  execSync('shopify version', { stdio: 'pipe' });
  checkPassed('Shopify CLI available');
} catch (error) {
  checkWarning('Shopify CLI not available (install with: npm install -g @shopify/cli)');
}

// 6. Check theme validation
console.log('\n6️⃣ Testing Theme Validation...');
try {
  const output = execSync('shopify theme check --fail-level=error', { 
    stdio: 'pipe', 
    encoding: 'utf8',
    timeout: 60000 
  });
  
  if (output.includes('0 errors')) {
    checkPassed('Theme validation passes (0 errors)');
  } else {
    checkWarning('Theme has validation warnings (but no errors)');
  }
} catch (error) {
  if (error.status === 1) {
    checkFailed('Theme validation has errors');
  } else {
    checkWarning('Could not run theme validation');
  }
}

// 7. Check workflow triggers and schedules
console.log('\n7️⃣ Checking Workflow Configuration...');

requiredWorkflows.forEach(workflow => {
  const workflowPath = path.join(workflowDir, workflow);
  if (fs.existsSync(workflowPath)) {
    try {
      const yaml = require('js-yaml');
      const content = fs.readFileSync(workflowPath, 'utf8');
      const config = yaml.load(content);
      
      if (config.on) {
        checkPassed(`${workflow} has proper triggers configured`);
        
        // Check for schedule in drift prevention
        if (workflow === 'drift-prevention.yml' && config.on.schedule) {
          checkPassed('Drift prevention has scheduled runs');
        }
        
        // Check for push/PR triggers in testing
        if (workflow === 'automated-testing.yml' && (config.on.push || config.on.pull_request)) {
          checkPassed('Automated testing triggers on code changes');
        }
      } else {
        checkWarning(`${workflow} missing trigger configuration`);
      }
    } catch (error) {
      checkWarning(`Could not validate ${workflow} configuration`);
    }
  }
});

// 8. Check environment variables documentation
console.log('\n8️⃣ Checking Documentation...');

const requiredDocs = [
  'README.md',
  'TECHNICAL_DOCUMENTATION.md',
  'PAYMENT_RAILS_INTEGRATION.md'
];

requiredDocs.forEach(doc => {
  if (!fs.existsSync(doc)) {
    checkWarning(`Documentation missing: ${doc}`);
  } else {
    checkPassed(`Documentation exists: ${doc}`);
  }
});

// Summary
console.log('\n📊 Health Check Summary');
console.log('========================');
console.log(`✅ Passed: ${results.passed}`);
console.log(`❌ Failed: ${results.failed}`);
console.log(`⚠️  Warnings: ${results.warnings}`);

if (results.failed > 0) {
  console.log('\n🚨 Critical Issues Found:');
  results.issues.forEach(issue => {
    console.log(`   • ${issue}`);
  });
  console.log('\nPlease fix these issues before deploying to production.');
  process.exit(1);
} else if (results.warnings > 0) {
  console.log('\n⚠️  Warnings detected, but system is functional.');
  console.log('Consider addressing warnings for optimal performance.');
  process.exit(0);
} else {
  console.log('\n🎉 All checks passed! GitHub Actions are ready for production.');
  process.exit(0);
}
