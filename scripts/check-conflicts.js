#!/usr/bin/env node
/**
 * Merge Conflict Scanner
 * ----------------------
 * Walks the repository (excluding build + vendor dirs) and fails when
 * leftover Git conflict markers are detected. Helps prevent accidental
 * commits with unresolved merges.
 */

const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');

const IGNORE_PATHS = new Set([
  '.git',
  'node_modules',
  'docs/competitor-insights.json',
]);

const IGNORE_SUBDIRS = new Set([
  'node_modules',
  'dist',
  'build',
  'tmp',
  '.tmp',
  '.cache',
  '.git',
]);

const CONFLICT_PATTERNS = [/^<<<<<<<\s/, /^>>>>>>>\s/, /^=======$/];

function shouldIgnore(entryPath) {
  const parts = entryPath.replace(ROOT + path.sep, '').split(path.sep);
  if (parts.some((part) => IGNORE_SUBDIRS.has(part))) {
    return true;
  }
  const relative = path.relative(ROOT, entryPath);
  return IGNORE_PATHS.has(relative);
}

function isBinary(buffer) {
  return buffer.includes(0);
}

function scanFile(filePath, findings) {
  let buffer;
  try {
    buffer = fs.readFileSync(filePath);
  } catch (error) {
    console.warn(`⚠️  Unable to read ${filePath}: ${error.message}`);
    return;
  }

  if (isBinary(buffer)) {
    return;
  }

  const content = buffer.toString('utf8');
  const lines = content.split(/\r?\n/);

  lines.forEach((line, index) => {
    if (CONFLICT_PATTERNS.some((pattern) => pattern.test(line))) {
      findings.push({
        file: path.relative(ROOT, filePath),
        line: index + 1,
        content: line.trim(),
      });
    }
  });
}

function walkDirectory(dirPath, findings) {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });

  entries.forEach((entry) => {
    const entryPath = path.join(dirPath, entry.name);

    if (shouldIgnore(entryPath)) {
      return;
    }

    if (entry.isDirectory()) {
      walkDirectory(entryPath, findings);
      return;
    }

    if (entry.isFile()) {
      scanFile(entryPath, findings);
    }
  });
}

function main() {
  const findings = [];
  walkDirectory(ROOT, findings);

  if (findings.length) {
    console.error('\n❌ Unresolved merge conflict markers detected:');
    findings.forEach((finding) => {
      console.error(`  - ${finding.file}:${finding.line} → ${finding.content}`);
    });
    console.error('\nResolve these conflicts before committing.');
    process.exitCode = 1;
    return;
  }

  console.log('✅ No merge conflict markers found.');
}

main();
