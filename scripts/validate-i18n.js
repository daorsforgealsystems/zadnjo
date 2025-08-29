#!/usr/bin/env node
/*
 Validate i18n key parity across locales.
 - Uses the keys in the base locale (en) as source of truth
 - Reports missing keys per locale and optionally extra keys
 - Exits with non-zero code if any missing keys are found
*/

import fs from 'fs';
import path from 'path';

const localesRoot = path.resolve(process.cwd(), 'public', 'locales');
const baseLocale = 'en';
const fileName = 'translation.json';

function isObject(val) {
  return val && typeof val === 'object' && !Array.isArray(val);
}

function flattenKeys(obj, prefix = '') {
  const keys = [];
  for (const [k, v] of Object.entries(obj || {})) {
    const newKey = prefix ? `${prefix}.${k}` : k;
    if (isObject(v)) {
      keys.push(...flattenKeys(v, newKey));
    } else {
      keys.push(newKey);
    }
  }
  return keys;
}

function readJsonSafe(filePath) {
  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    return { __error: err };
  }
}

function loadLocale(locale) {
  const p = path.join(localesRoot, locale, fileName);
  if (!fs.existsSync(p)) return { __missingFile: true };
  return readJsonSafe(p);
}

function findLocales() {
  if (!fs.existsSync(localesRoot)) {
    console.error(`Locales folder not found: ${localesRoot}`);
    process.exit(2);
  }
  return fs.readdirSync(localesRoot).filter((d) => {
    const full = path.join(localesRoot, d);
    return fs.statSync(full).isDirectory() && fs.existsSync(path.join(full, fileName));
  });
}

function main() {
  const locales = findLocales();
  if (!locales.includes(baseLocale)) {
    console.error(`Base locale "${baseLocale}" not found in ${localesRoot}`);
    process.exit(2);
  }

  const dataByLocale = Object.fromEntries(locales.map((lng) => [lng, loadLocale(lng)]));

  // Handle parse errors first
  const parseIssues = Object.entries(dataByLocale).filter(([lng, data]) => data.__error);
  if (parseIssues.length) {
    console.error('Failed to parse translation files:');
    for (const [lng, data] of parseIssues) {
      console.error(`- ${lng}: ${data.__error.message}`);
    }
    process.exit(2);
  }

  const baseKeys = new Set(flattenKeys(dataByLocale[baseLocale]));
  const report = [];
  let missingCount = 0;

  for (const lng of locales) {
    const data = dataByLocale[lng];
    if (data.__missingFile) {
      report.push({ lng, missing: ['<missing file>'], extra: [] });
      missingCount += 1;
      continue;
    }
    const keys = new Set(flattenKeys(data));

    const missing = [...baseKeys].filter((k) => !keys.has(k));
    const extra = [...keys].filter((k) => !baseKeys.has(k));

    if (missing.length) missingCount += missing.length;
    report.push({ lng, missing, extra });
  }

  // Output
  console.log('i18n parity check (base=en)');
  console.log('Locales found:', locales.join(', '));
  console.log('Base key count:', baseKeys.size);
  console.log('---');

  for (const r of report) {
    if (r.missing.length === 0) {
      console.log(`[OK] ${r.lng}: all keys present (${baseKeys.size})`);
    } else {
      console.log(`[MISSING] ${r.lng}: ${r.missing.length} key(s) missing`);
      for (const k of r.missing) console.log(`  - ${k}`);
    }

    // Show extra keys as info (not failing)
    if (r.extra.length) {
      console.log(`[INFO] ${r.lng}: ${r.extra.length} extra key(s)`);
      // Uncomment to list extra keys
      // for (const k of r.extra) console.log(`  + ${k}`);
    }

    console.log('---');
  }

  if (missingCount > 0) {
    console.error(`Found ${missingCount} missing key(s) across locales.`);
    process.exit(1);
  }

  console.log('All locales have full key coverage.');
}

main();