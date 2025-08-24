#!/usr/bin/env node

/**
 * Validate components.json against shadcn/ui schema
 * This helps catch configuration drift and ensures tooling compatibility
 */

import { readFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = dirname(__dirname);

// Expected schema structure for shadcn/ui components.json
const requiredFields = [
  '$schema',
  'style',
  'rsc',
  'tsx',
  'tailwind',
  'aliases'
];

const requiredTailwindFields = [
  'config',
  'css',
  'baseColor',
  'cssVariables'
];

const requiredAliases = [
  'components',
  'utils',
  'ui',
  'lib',
  'hooks'
];

async function validateComponents() {
  try {
    console.log('🔍 Validating components.json...');
    
    // Read and parse components.json
    const componentsPath = join(rootDir, 'components.json');
    const content = await readFile(componentsPath, 'utf-8');
    const config = JSON.parse(content);
    
    let isValid = true;
    const issues = [];

    // Validate schema URL
    if (!config.$schema || !config.$schema.includes('ui.shadcn.com/schema.json')) {
      issues.push('❌ Missing or invalid $schema URL');
      isValid = false;
    } else {
      console.log('✅ Schema URL is valid');
    }

    // Validate required top-level fields
    for (const field of requiredFields) {
      if (!(field in config)) {
        issues.push(`❌ Missing required field: ${field}`);
        isValid = false;
      }
    }

    // Validate tailwind configuration
    if (config.tailwind) {
      for (const field of requiredTailwindFields) {
        if (!(field in config.tailwind)) {
          issues.push(`❌ Missing required tailwind field: ${field}`);
          isValid = false;
        }
      }
      
      // Validate CSS variables setting
      if (config.tailwind.cssVariables !== true) {
        issues.push('⚠️  cssVariables should be true for proper shadcn/ui theming');
      } else {
        console.log('✅ CSS variables enabled');
      }
      
      // Validate file paths exist
      const cssPath = join(rootDir, config.tailwind.css);
      const configPath = join(rootDir, config.tailwind.config);
      
      try {
        await readFile(cssPath);
        console.log(`✅ CSS file exists: ${config.tailwind.css}`);
      } catch {
        issues.push(`❌ CSS file not found: ${config.tailwind.css}`);
        isValid = false;
      }
      
      try {
        await readFile(configPath);
        console.log(`✅ Tailwind config exists: ${config.tailwind.config}`);
      } catch {
        issues.push(`❌ Tailwind config not found: ${config.tailwind.config}`);
        isValid = false;
      }
    }

    // Validate aliases
    if (config.aliases) {
      for (const alias of requiredAliases) {
        if (!(alias in config.aliases)) {
          issues.push(`❌ Missing required alias: ${alias}`);
          isValid = false;
        }
      }
      
      // Validate alias consistency (should use @/ prefix)
      for (const [key, value] of Object.entries(config.aliases)) {
        if (!value.startsWith('@/')) {
          issues.push(`⚠️  Alias '${key}' should use @/ prefix, got: ${value}`);
        }
      }
      
      if (isValid) {
        console.log('✅ All required aliases present');
      }
    }

    // Validate React configuration
    if (config.rsc !== false) {
      issues.push('⚠️  RSC should be false for Vite + React setup');
    } else {
      console.log('✅ RSC correctly disabled for Vite setup');
    }

    if (config.tsx !== true) {
      issues.push('⚠️  TSX should be true for TypeScript setup');
    } else {
      console.log('✅ TSX enabled');
    }

    // Report results
    if (isValid && issues.length === 0) {
      console.log('\n🎉 components.json is valid and properly configured!');
      process.exit(0);
    } else {
      console.log('\n📋 Validation Summary:');
      if (issues.length > 0) {
        issues.forEach(issue => console.log(`  ${issue}`));
      }
      
      if (!isValid) {
        console.log('\n💥 Validation failed - components.json has critical issues');
        process.exit(1);
      } else {
        console.log('\n⚠️  Validation passed with warnings');
        process.exit(0);
      }
    }

  } catch (error) {
    console.error('💥 Failed to validate components.json:', error.message);
    process.exit(1);
  }
}

// Validate JSON schema by fetching the actual schema (optional advanced check)
async function validateAgainstRemoteSchema() {
  try {
    const componentsPath = join(rootDir, 'components.json');
    const content = await readFile(componentsPath, 'utf-8');
    const config = JSON.parse(content);
    
    if (!config.$schema) {
      throw new Error('No $schema field found');
    }
    
    console.log(`📡 Schema URL: ${config.$schema}`);
    console.log('ℹ️  For advanced schema validation, consider using ajv or similar JSON schema validator');
    
  } catch (error) {
    console.warn('⚠️  Could not perform remote schema validation:', error.message);
  }
}

// Run validation
(async () => {
  await validateComponents();
  await validateAgainstRemoteSchema();
})();