#!/usr/bin/env node
/**
 * Competitor Signal Audit
 * -----------------------
 * Parses the local competitor CSV and verifies that operational docs stay in
 * sync with the source data. Outputs a JSON snapshot under docs/ and fails when
 * coverage drifts.
 */

const fs = require('node:fs');
const path = require('node:path');

const DATA_PATH = path.join(__dirname, '..', 'local-kava-bars-database - Sheet1.csv');
const README_PATH = path.join(__dirname, '..', 'README.md');
const SITE_CONFIG_PATH = path.join(__dirname, '..', 'WTF_Site_Config.md');
const OUTPUT_PATH = path.join(__dirname, '..', 'docs', 'competitor-insights.json');

function parseCsv(content) {
  const rows = [];
  let currentCell = '';
  let currentRow = [];
  let inQuotes = false;

  const pushCell = () => {
    currentRow.push(currentCell.trim());
    currentCell = '';
  };

  const pushRow = () => {
    if (currentRow.length) {
      rows.push(currentRow);
    }
    currentRow = [];
  };

  for (let i = 0; i < content.length; i += 1) {
    const char = content[i];
    const nextChar = content[i + 1];

    if (inQuotes) {
      if (char === '"' && nextChar === '"') {
        currentCell += '"';
        i += 1;
        continue;
      }

      if (char === '"') {
        inQuotes = false;
        continue;
      }

      currentCell += char;
      continue;
    }

    if (char === '"') {
      inQuotes = true;
      continue;
    }

    if (char === ',') {
      pushCell();
      continue;
    }

    if (char === '\r') {
      continue;
    }

    if (char === '\n') {
      pushCell();
      pushRow();
      continue;
    }

    currentCell += char;
  }

  if (currentCell.length > 0 || currentRow.length > 0) {
    pushCell();
    pushRow();
  }

  return rows;
}

function mapRows(rows) {
  const [headers, ...records] = rows;
  return records
    .filter((row) => row.length && row.some((cell) => cell.length > 0))
    .map((row) => Object.fromEntries(row.map((value, index) => [headers[index], value])));
}

function isLocalFlorida(record) {
  if (!record) return false;
  const distance = Number.parseFloat((record.Distance || '').replace(/[^\d.]/g, ''));
  const isFlorida = (record.State || '').toLowerCase() === 'florida';
  const isCapeCoralOrFortMyers = ['cape coral', 'fort myers'].includes((record.City || '').toLowerCase());
  return isFlorida && isCapeCoralOrFortMyers && Number.isFinite(distance) && distance <= 20;
}

function normalizeName(name) {
  return (name || '')
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]/g, '');
}

function extractMarkdownNames(markdown, heading) {
  const lines = markdown.split('\n');
  const startIndex = lines.findIndex((line) => line.toLowerCase().includes(heading.toLowerCase()));
  if (startIndex === -1) return new Map();

  const names = new Map();
  for (let i = startIndex + 2; i < lines.length; i += 1) {
    const line = lines[i];
    if (!line.trim()) break;
    if (!line.trim().startsWith('|')) break;
    const cells = line.split('|').map((cell) => cell.trim()).filter(Boolean);
    if (cells.length === 0) continue;
    names.set(normalizeName(cells[0]), cells[0]);
  }

  return names;
}

function writeJsonSnapshot(localCompetitors) {
  const summary = {
    generatedAt: new Date().toISOString(),
    totals: {
      localCompetitorCount: localCompetitors.length,
      loyaltyPrograms: localCompetitors.filter((competitor) => /yes|rewards|membership/i.test(competitor['Loyalty program'])).length,
      activeEvents: localCompetitors.filter((competitor) => (competitor['Events/live music schedule'] || '').trim().length > 0).length,
      socialStandouts: localCompetitors.filter((competitor) => /tiktok|reels|daily updates/i.test(competitor['Social presence'] || '')).length,
    },
    competitors: localCompetitors.map((competitor) => ({
      name: competitor['Competitor Name'],
      city: competitor.City,
      distanceMiles: Number.parseFloat((competitor.Distance || '').replace(/[^\d.]/g, '')),
      uniqueDrinkOfferings: competitor['Unique drink offerings'],
      loyaltyProgram: competitor['Loyalty program'],
      events: competitor['Events/live music schedule'],
      socialPresence: competitor['Social presence'],
    })),
  };

  fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
  fs.writeFileSync(OUTPUT_PATH, `${JSON.stringify(summary, null, 2)}\n`, 'utf8');
  return summary;
}

function printReport(summary) {
  const header = '\n🏝️  WTF Competitor Signal Snapshot\n----------------------------------';
  console.log(header);
  console.log(`Local competitors tracked: ${summary.totals.localCompetitorCount}`);
  console.log(`Active loyalty programs:   ${summary.totals.loyaltyPrograms}`);
  console.log(`Promoted events:           ${summary.totals.activeEvents}`);
  console.log(`High social cadence:       ${summary.totals.socialStandouts}`);
  console.log('\nKey Differentiators to Mirror or Beat:');

  summary.competitors.forEach((competitor) => {
    console.log(`- ${competitor.name} (${competitor.distanceMiles} mi)`);
    console.log(`  • Unique offerings: ${competitor.uniqueDrinkOfferings}`);
    console.log(`  • Loyalty: ${competitor.loyaltyProgram || 'n/a'}`);
    console.log(`  • Events: ${competitor.events || 'n/a'}`);
    console.log(`  • Social: ${competitor.socialPresence || 'n/a'}`);
  });
}

function ensureDocumentationCoverage(localCompetitors, readmeContent, siteConfigContent) {
  const expectedNames = localCompetitors.map((competitor) => ({
    raw: competitor['Competitor Name'],
    normalized: normalizeName(competitor['Competitor Name']),
  }));
  const readmeNames = extractMarkdownNames(readmeContent, 'competitor | city');
  const siteConfigNames = extractMarkdownNames(siteConfigContent, 'competitor | neighborhood focus');

  const missingFromReadme = expectedNames
    .filter((competitor) => !readmeNames.has(competitor.normalized))
    .map((competitor) => competitor.raw);
  const missingFromSiteConfig = expectedNames
    .filter((competitor) => !siteConfigNames.has(competitor.normalized))
    .map((competitor) => competitor.raw);

  const messages = [];

  if (missingFromReadme.length) {
    messages.push(`README.md is missing: ${missingFromReadme.join(', ')}`);
  }

  if (missingFromSiteConfig.length) {
    messages.push(`WTF_Site_Config.md is missing: ${missingFromSiteConfig.join(', ')}`);
  }

  if (messages.length) {
    const errorMessage = messages.join('\n');
    throw new Error(`Documentation out of sync with competitor dataset:\n${errorMessage}`);
  }
}

function main() {
  const rawCsv = fs.readFileSync(DATA_PATH, 'utf8');
  const rows = parseCsv(rawCsv);
  const records = mapRows(rows);
  const localCompetitors = records.filter(isLocalFlorida);

  if (localCompetitors.length === 0) {
    throw new Error('No local competitors found in dataset. Verify CSV content.');
  }

  const readmeContent = fs.readFileSync(README_PATH, 'utf8');
  const siteConfigContent = fs.readFileSync(SITE_CONFIG_PATH, 'utf8');

  ensureDocumentationCoverage(localCompetitors, readmeContent, siteConfigContent);

  const summary = writeJsonSnapshot(localCompetitors);
  printReport(summary);
}

try {
  main();
} catch (error) {
  console.error('\n❌ Competitor audit failed:\n');
  console.error(error.message);
  process.exitCode = 1;
}
