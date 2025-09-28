#!/usr/bin/env node

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
        
        // Check for merge conflict markers (avoid self-detection)
        const hasConflictStart = content.includes('<<' + '<<<<< HEAD');
        const hasConflictEnd = content.includes('>>>' + '>>> ');
        const hasConflictSep = content.includes('===' + '====') && hasConflictStart;
        if (hasConflictStart || hasConflictEnd || hasConflictSep) {
          console.log(`❌ Merge conflict found in: ${fullPath}`);
          issues++;
        }
        
        // Check for TODO/FIXME comments
        const todoMatches = content.match(/TODO|FIXME|XXX/gi);
        if (todoMatches) {
          console.log(`⚠️  ${todoMatches.length} TODO/FIXME items in: ${file.name}`);
          warnings += todoMatches.length;
        }
        
      } catch (error) {
        console.warn(`Warning: Could not read ${fullPath}`);
      }
    }
  }
}

// Run the scan
try {
  scanForConflicts('.');
  
  console.log(`\n📊 Conflicts scan complete:`);
  console.log(`   Issues: ${issues}`);
  console.log(`   Warnings: ${warnings}`);
  
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
