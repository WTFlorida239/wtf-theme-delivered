#!/usr/bin/env node

/**
 * GitHub Actions Comprehensive Fix Script
 * Resolves all known issues with WTF Theme GitHub Actions workflows
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 WTF Theme GitHub Actions Comprehensive Fix');
console.log('============================================');

// Configuration
const FIXES = {
  // Fix missing scripts
  missingScripts: [
    'conflicts-scan.js',
    'github-actions-health-check.js'
  ],
  
  // Fix package.json scripts
  packageJsonScripts: {
    'conflicts:scan': 'node scripts/conflicts-scan.js',
    'competitors:audit': 'node scripts/competitors-audit.js',
    'order:readiness': 'node scripts/order-readiness-check.js',
    'theme:check': 'shopify theme check --fail-level=error',
    'health:check': 'node scripts/github-actions-health-check.js'
  },

  // Fix workflow permissions
  workflowPermissions: {
    'contents': 'read',
    'actions': 'read',
    'security-events': 'write',
    'statuses': 'write',
    'checks': 'write'
  }
};

// Create missing scripts
function createMissingScripts() {
  console.log('\n📝 Creating missing automation scripts...');
  
  // Create conflicts-scan.js
  const conflictsScanScript = `#!/usr/bin/env node

/**
 * WTF Theme Conflicts Scanner
 * Scans for merge conflicts and code issues
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Scanning for conflicts and issues...');

let issues = 0;
let warnings = 0;

// Check for merge conflict markers
function scanForConflicts(dir) {
  const files = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const file of files) {
    const fullPath = path.join(dir, file.name);
    
    if (file.isDirectory() && !file.name.startsWith('.') && file.name !== 'node_modules') {
      scanForConflicts(fullPath);
    } else if (file.isFile() && (file.name.endsWith('.liquid') || file.name.endsWith('.js') || file.name.endsWith('.css'))) {
      try {
        const content = fs.readFileSync(fullPath, 'utf8');
        
        // Check for merge conflict markers
        if (content.includes('<<<<<<<') || content.includes('>>>>>>>') || content.includes('=======')) {
          console.log(\`❌ Merge conflict found in: \${fullPath}\`);
          issues++;
        }
        
        // Check for TODO/FIXME comments
        const todoMatches = content.match(/TODO|FIXME|XXX/gi);
        if (todoMatches) {
          console.log(\`⚠️  \${todoMatches.length} TODO/FIXME items in: \${file.name}\`);
          warnings += todoMatches.length;
        }
        
      } catch (error) {
        console.warn(\`Warning: Could not read \${fullPath}\`);
      }
    }
  }
}

// Run the scan
try {
  scanForConflicts('.');
  
  console.log(\`\\n📊 Conflicts scan complete:\`);
  console.log(\`   Issues: \${issues}\`);
  console.log(\`   Warnings: \${warnings}\`);
  
  if (issues > 0) {
    console.log('❌ Conflicts scan failed - merge conflicts detected');
    process.exit(1);
  } else {
    console.log('✅ Conflicts scan passed - no merge conflicts detected');
    process.exit(0);
  }
  
} catch (error) {
  console.error('❌ Conflicts scan failed:', error.message);
  process.exit(1);
}
`;

  // Create github-actions-health-check.js
  const healthCheckScript = `#!/usr/bin/env node

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
    console.log(\`✅ \${description}\`);
    passed++;
    return true;
  } else {
    console.log(\`❌ \${description} - Missing: \${filePath}\`);
    failed++;
    return false;
  }
}

function checkWorkflowFile(filePath) {
  checks++;
  try {
    if (!fs.existsSync(filePath)) {
      console.log(\`❌ Workflow file missing: \${filePath}\`);
      failed++;
      return false;
    }
    
    const content = fs.readFileSync(filePath, 'utf8');
    const workflow = yaml.load(content);
    
    if (!workflow.name) {
      console.log(\`❌ Workflow missing name: \${filePath}\`);
      failed++;
      return false;
    }
    
    if (!workflow.on) {
      console.log(\`❌ Workflow missing triggers: \${filePath}\`);
      failed++;
      return false;
    }
    
    console.log(\`✅ Workflow valid: \${workflow.name}\`);
    passed++;
    return true;
    
  } catch (error) {
    console.log(\`❌ Workflow invalid: \${filePath} - \${error.message}\`);
    failed++;
    return false;
  }
}

// Run health checks
console.log('\\n🔍 Checking core files...');
checkFile('package.json', 'Package.json exists');
checkFile('scripts/competitors-audit.js', 'Competitors audit script');
checkFile('scripts/order-readiness-check.js', 'Order readiness check script');
checkFile('scripts/conflicts-scan.js', 'Conflicts scan script');

console.log('\\n🔍 Checking workflow files...');
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

console.log('\\n🔍 Checking theme files...');
checkFile('sections/footer.liquid', 'Footer section');
checkFile('layout/theme.liquid', 'Theme layout');
checkFile('assets/wtf-ajax-cart.js', 'AJAX cart script');

// Summary
console.log(\`\\n📊 Health Check Summary:\`);
console.log(\`   Total checks: \${checks}\`);
console.log(\`   Passed: \${passed}\`);
console.log(\`   Failed: \${failed}\`);

if (failed === 0) {
  console.log('✅ All health checks passed');
  process.exit(0);
} else {
  console.log(\`❌ \${failed} health checks failed\`);
  process.exit(1);
}
`;

  // Write the scripts
  const scriptsDir = 'scripts';
  if (!fs.existsSync(scriptsDir)) {
    fs.mkdirSync(scriptsDir, { recursive: true });
  }

  fs.writeFileSync(path.join(scriptsDir, 'conflicts-scan.js'), conflictsScanScript);
  fs.writeFileSync(path.join(scriptsDir, 'github-actions-health-check.js'), healthCheckScript);
  
  // Make scripts executable
  try {
    fs.chmodSync(path.join(scriptsDir, 'conflicts-scan.js'), 0o755);
    fs.chmodSync(path.join(scriptsDir, 'github-actions-health-check.js'), 0o755);
  } catch (error) {
    console.warn('Warning: Could not set script permissions');
  }

  console.log('✅ Created missing automation scripts');
}

// Fix package.json scripts
function fixPackageJsonScripts() {
  console.log('\\n📦 Fixing package.json scripts...');
  
  try {
    const packageJsonPath = 'package.json';
    let packageJson = {};
    
    if (fs.existsSync(packageJsonPath)) {
      packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    }
    
    if (!packageJson.scripts) {
      packageJson.scripts = {};
    }
    
    // Add missing scripts
    Object.entries(FIXES.packageJsonScripts).forEach(([key, value]) => {
      packageJson.scripts[key] = value;
    });
    
    // Ensure we have basic package info
    if (!packageJson.name) packageJson.name = 'wtf-theme-delivered';
    if (!packageJson.version) packageJson.version = '1.0.0';
    if (!packageJson.description) packageJson.description = 'WTF | Welcome To Florida Shopify Theme';
    
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
    console.log('✅ Updated package.json scripts');
    
  } catch (error) {
    console.error('❌ Failed to fix package.json:', error.message);
  }
}

// Create workflow permissions fix
function createWorkflowPermissionsFix() {
  console.log('\\n🔐 Creating workflow permissions documentation...');
  
  const permissionsDoc = `# GitHub Actions Permissions Fix

## Current Issue
GitHub Actions workflows are failing due to insufficient permissions.

## Required Permissions
${Object.entries(FIXES.workflowPermissions).map(([key, value]) => `- ${key}: ${value}`).join('\n')}

## How to Fix

### Method 1: Repository Settings
1. Go to repository Settings → Actions → General
2. Under "Workflow permissions" select "Read and write permissions"
3. Check "Allow GitHub Actions to create and approve pull requests"

### Method 2: Update Workflow Files
Add this to each workflow file under the 'jobs' section:

\`\`\`yaml
permissions:
  contents: read
  actions: read
  security-events: write
  statuses: write
  checks: write
\`\`\`

### Method 3: Personal Access Token
1. Create PAT with 'repo' and 'workflow' scopes
2. Update git remote: \`git remote set-url origin https://TOKEN@github.com/USER/REPO.git\`

## Verification
After applying fixes, run: \`npm run health:check\`
`;

  fs.writeFileSync('GITHUB_ACTIONS_PERMISSIONS_FIX.md', permissionsDoc);
  console.log('✅ Created permissions fix documentation');
}

// Main execution
function main() {
  try {
    createMissingScripts();
    fixPackageJsonScripts();
    createWorkflowPermissionsFix();
    
    console.log('\\n🎉 GitHub Actions comprehensive fix completed!');
    console.log('\\n📋 Next steps:');
    console.log('1. Commit and push these changes');
    console.log('2. Fix GitHub permissions using the documentation');
    console.log('3. Re-run your GitHub Actions workflows');
    console.log('4. Run: npm run health:check');
    
  } catch (error) {
    console.error('❌ Fix script failed:', error.message);
    process.exit(1);
  }
}

// Run the fix
main();
