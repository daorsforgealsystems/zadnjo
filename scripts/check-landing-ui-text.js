#!/usr/bin/env node
/**
 * Check potential UI text overflow for LandingPage across locales.
 * - Uses simple character-length thresholds per key type as heuristics
 * - Reports keys that exceed thresholds per locale
 */

import fs from 'fs';
import path from 'path';

const localesRoot = path.resolve(process.cwd(), 'public', 'locales');
const fileName = 'translation.json';

const keyPolicies = [
  // Hero
  { key: 'landing.hero.title', max: 64, note: 'Large heading (md:text-7xl). Prefer concise titles.' },
  { key: 'landing.hero.subtitle', max: 160, note: 'Hero subtitle. Keep under ~2 lines on md screens.' },
  // CTA buttons (hero)
  { key: 'landing.cta.getStarted', max: 22, note: 'Primary CTA button. Keep succinct to avoid overflow on small screens.' },
  { key: 'landing.cta.login', max: 16, note: 'Secondary CTA button.' },
  // CTA section
  { key: 'landing.cta.title', max: 64, note: 'Section title.' },
  { key: 'landing.cta.subtitle', max: 160, note: 'Section subtitle.' },
  { key: 'landing.cta.startTrial', max: 26, note: 'CTA button in section.' },
  { key: 'landing.cta.contactSales', max: 28, note: 'CTA button in section.' },
  // Stats labels
  { key: 'landing.stats.onTime', max: 20, note: 'Stat label (small card).' },
  { key: 'landing.stats.tracking', max: 20, note: 'Stat label.' },
  { key: 'landing.stats.countries', max: 20, note: 'Stat label.' },
  { key: 'landing.stats.shipments', max: 20, note: 'Stat label.' },
  // Features
  { key: 'landing.features.title', max: 48, note: 'Section title.' },
  { key: 'landing.features.subtitle', max: 140, note: 'Section subtitle.' },
  { key: 'landing.features.tracking.title', max: 26, note: 'Feature card title.' },
  { key: 'landing.features.tracking.description', max: 120, note: 'Feature card description.' },
  { key: 'landing.features.coverage.title', max: 26, note: 'Feature card title.' },
  { key: 'landing.features.coverage.description', max: 120, note: 'Feature card description.' },
  { key: 'landing.features.security.title', max: 26, note: 'Feature card title.' },
  { key: 'landing.features.security.description', max: 120, note: 'Feature card description.' },
  { key: 'landing.features.speed.title', max: 26, note: 'Feature card title.' },
  { key: 'landing.features.speed.description', max: 120, note: 'Feature card description.' },
];

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

function readTranslations(locale) {
  const p = path.join(localesRoot, locale, fileName);
  try {
    const raw = fs.readFileSync(p, 'utf8');
    return JSON.parse(raw);
  } catch (e) {
    return { __error: e };
  }
}

function get(obj, dotKey) {
  return dotKey.split('.').reduce((acc, part) => (acc && typeof acc === 'object' ? acc[part] : undefined), obj);
}

function main() {
  const locales = findLocales();
  const results = [];

  for (const lng of locales) {
    const data = readTranslations(lng);
    if (data.__error) {
      results.push({ lng, errors: [`Failed to parse: ${data.__error.message}`] });
      continue;
    }
    const issues = [];
    for (const policy of keyPolicies) {
      const value = get(data, policy.key);
      if (typeof value !== 'string') continue; // missing will be caught by parity script
      const len = [...value].length; // count unicode code points
      if (len > policy.max) {
        issues.push({ key: policy.key, length: len, max: policy.max, text: value, note: policy.note });
      }
    }
    results.push({ lng, issues });
  }

  let totalIssues = 0;
  console.log('LandingPage UI text length check');
  console.log('Locales:', results.map(r => r.lng).join(', '));
  console.log('---');

  for (const r of results) {
    if (r.errors && r.errors.length) {
      console.log(`[ERROR] ${r.lng}`);
      for (const e of r.errors) console.log('  -', e);
      console.log('---');
      continue;
    }
    if (!r.issues.length) {
      console.log(`[OK] ${r.lng}: no potential overflow issues detected.`);
      console.log('---');
      continue;
    }
    totalIssues += r.issues.length;
    console.log(`[WARN] ${r.lng}: ${r.issues.length} potential issue(s)`);
    for (const i of r.issues) {
      console.log(`  - ${i.key} (${i.length}/${i.max})`);
      console.log(`    ${i.text}`);
      console.log(`    Hint: ${i.note}`);
    }
    console.log('---');
  }

  if (totalIssues > 0) {
    // Non-fatal: return success code but highlight warnings. Use CI failure only for parity errors.
    console.log(`Completed with ${totalIssues} warning(s). Consider shortening or adjusting styles for the listed keys.`);
  } else {
    console.log('No potential overflow issues found.');
  }
}

main();