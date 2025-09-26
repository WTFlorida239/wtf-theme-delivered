#!/usr/bin/env node

/**
 * Conflicts Scan Script
 * Scans for merge conflict markers and other potential issues
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 WTF Conflicts Scan');
console.log('=====================');

let conflictsFound = 0;
let filesScanned = 0;

// Conflict markers to look for
const conflictMarkers = [
  '<<<<<<< HEAD',
  '=======',
  '>>>>>>> ',
  '<<<<<<< ',
  '|||||||| '
];

// File extensions to scan
const scanExtensions = ['.liquid', '.js', '.css', '.scss', '.json', '.md', '.yml', '.yaml'];

// Directories to ignore
const ignoreDirs = ['node_modules', '.git', '.cache', 'dist', 'build'];

function shouldScanFile(filePath) {
  const ext = path.extname(filePath);
  return scanExtensions.includes(ext);
}

function shouldIgnoreDir(dirName) {
  return ignoreDirs.includes(dirName);
}

function scanFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    
    lines.forEach((line, index) => {
      conflictMarkers.forEach(marker => {
        if (line.includes(marker)) {
          console.log(`❌ Conflict marker found in ${filePath}:${index + 1}`);
          console.log(`   ${line.trim()}`);
          conflictsFound++;
        }
      });
    });
    
    filesScanned++;
  } catch (error) {
    console.log(`⚠️  Could not scan ${filePath}: ${error.message}`);
  }
}

function scanDirectory(dirPath) {
  try {
    const items = fs.readdirSync(dirPath);
    
    items.forEach(item => {
      const itemPath = path.join(dirPath, item);
      const stat = fs.statSync(itemPath);
      
      if (stat.isDirectory()) {
        if (!shouldIgnoreDir(item)) {
          scanDirectory(itemPath);
        }
      } else if (stat.isFile()) {
        if (shouldScanFile(itemPath)) {
          scanFile(itemPath);
        }
      }
    });
  } catch (error) {
    console.log(`⚠️  Could not scan directory ${dirPath}: ${error.message}`);
  }
}

// Start scanning from current directory
console.log('Scanning for merge conflict markers...\n');
scanDirectory('.');

console.log('\n📊 Scan Results:');
console.log(`Files scanned: ${filesScanned}`);
console.log(`Conflicts found: ${conflictsFound}`);

if (conflictsFound === 0) {
  console.log('✅ No merge conflict markers found!');
  process.exit(0);
} else {
  console.log('❌ Merge conflict markers detected!');
  console.log('Please resolve conflicts before proceeding.');
  process.exit(1);
}
