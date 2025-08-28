#!/usr/bin/env node

/**
 * Fix Build Issues Script
 * Addresses common React and service worker issues
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔧 Fixing build issues...\n');

// 1. Fix service worker registration in dist folder
function fixServiceWorkerRegistration() {
  const registerSWPath = path.join(__dirname, '../dist/registerSW.js');
  
  if (fs.existsSync(registerSWPath)) {
    let content = fs.readFileSync(registerSWPath, 'utf8');
    
    // Fix missing closing parenthesis
    const fixedContent = content.replace(
      /if\('serviceWorker' in navigator\) \{window\.addEventListener\('load', \(\) => \{navigator\.serviceWorker\.register\('\/sw\.js', \{ scope: '\/' \}\)\}\)\}/g,
      "if('serviceWorker' in navigator) {window.addEventListener('load', () => {navigator.serviceWorker.register('/sw.js', { scope: '/' })})}"
    );
    
    if (content !== fixedContent) {
      fs.writeFileSync(registerSWPath, fixedContent);
      console.log('✅ Fixed service worker registration syntax');
    } else {
      console.log('ℹ️  Service worker registration already correct');
    }
  } else {
    console.log('⚠️  Service worker registration file not found (this is normal in development)');
  }
}

// 2. Check React dependencies
function checkReactDependencies() {
  const packageJsonPath = path.join(__dirname, '../package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  
  const reactVersion = packageJson.dependencies?.react;
  const reactDomVersion = packageJson.dependencies?.['react-dom'];
  const reactTypesVersion = packageJson.devDependencies?.['@types/react'];
  
  console.log('📦 React Dependencies:');
  console.log(`   React: ${reactVersion || 'Not found'}`);
  console.log(`   React DOM: ${reactDomVersion || 'Not found'}`);
  console.log(`   @types/react: ${reactTypesVersion || 'Not found'}`);
  
  if (reactVersion && reactDomVersion) {
    if (reactVersion === reactDomVersion) {
      console.log('✅ React versions match');
    } else {
      console.log('⚠️  React versions mismatch - this could cause forwardRef issues');
    }
  }
}

// 3. Check for duplicate React installations
function checkDuplicateReact() {
  const nodeModulesPath = path.join(__dirname, '../node_modules');
  
  if (!fs.existsSync(nodeModulesPath)) {
    console.log('⚠️  node_modules not found - run npm install first');
    return;
  }
  
  const reactPaths = [];
  
  // Check main react
  if (fs.existsSync(path.join(nodeModulesPath, 'react'))) {
    reactPaths.push('node_modules/react');
  }
  
  // Check for nested react installations (common cause of forwardRef issues)
  const checkNestedReact = (dir, depth = 0) => {
    if (depth > 3) return; // Limit recursion depth
    
    try {
      const items = fs.readdirSync(dir);
      for (const item of items) {
        if (item === 'react' && dir !== nodeModulesPath) {
          reactPaths.push(path.relative(path.join(__dirname, '..'), path.join(dir, item)));
        } else if (item === 'node_modules' && depth < 3) {
          checkNestedReact(path.join(dir, item), depth + 1);
        }
      }
    } catch (error) {
      // Ignore permission errors
    }
  };
  
  checkNestedReact(nodeModulesPath);
  
  console.log('\n🔍 React installations found:');
  if (reactPaths.length === 1) {
    console.log('✅ Single React installation found:', reactPaths[0]);
  } else if (reactPaths.length > 1) {
    console.log('⚠️  Multiple React installations detected:');
    reactPaths.forEach(p => console.log(`   - ${p}`));
    console.log('   This can cause forwardRef errors. Consider using npm dedupe or yarn resolutions.');
  } else {
    console.log('❌ No React installations found');
  }
}

// 4. Generate helpful diagnostics
function generateDiagnostics() {
  const diagnostics = {
    timestamp: new Date().toISOString(),
    nodeVersion: process.version,
    platform: process.platform,
    arch: process.arch,
    cwd: process.cwd()
  };
  
  const diagnosticsPath = path.join(__dirname, '../build-diagnostics.json');
  fs.writeFileSync(diagnosticsPath, JSON.stringify(diagnostics, null, 2));
  console.log('\n📊 Build diagnostics saved to build-diagnostics.json');
}

// 5. Provide recommendations
function provideRecommendations() {
  console.log('\n💡 Recommendations:');
  console.log('   1. If you see forwardRef errors:');
  console.log('      - Clear node_modules and package-lock.json');
  console.log('      - Run: npm install');
  console.log('      - Check for duplicate React versions');
  console.log('   2. If service worker issues persist:');
  console.log('      - Clear browser cache');
  console.log('      - Check browser console for detailed errors');
  console.log('   3. For development:');
  console.log('      - PWA features are disabled in development mode');
  console.log('      - Use npm run build && npm run preview to test PWA features');
}

// Run all fixes
async function main() {
  try {
    fixServiceWorkerRegistration();
    checkReactDependencies();
    checkDuplicateReact();
    generateDiagnostics();
    provideRecommendations();
    
    console.log('\n🎉 Build issue analysis complete!');
  } catch (error) {
    console.error('❌ Error running fix script:', error);
    process.exit(1);
  }
}

main();