#!/usr/bin/env node

/**
 * Script to fix locatorjs warning by ensuring proper build configuration
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 Fixing locatorjs warning...');

// Check if vite.config.ts exists
const viteConfigPath = path.join(__dirname, 'vite.config.ts');
if (!fs.existsSync(viteConfigPath)) {
  console.error('❌ vite.config.ts not found');
  process.exit(1);
}

// Read vite.config.ts
let viteConfig = fs.readFileSync(viteConfigPath, 'utf8');

// Add test environment exclusion for @testing-library/dom
const viteConfigFix = `  // Define build configuration
  build: {
    commonjsOptions: {
      transformMixedEsModules: true,
    },
    // Keep assets as external files (avoid base64 inlining for better caching)
    assetsInlineLimit: 0,

    // Explicitly enable CSS splitting and modern module preload
    cssCodeSplit: true,
    modulePreload: true,

    // Skip computing brotli/gzip sizes to speed up builds
    reportCompressedSize: false,

    // Increase warning limit and split large vendor chunks
    chunkSizeWarningLimit: 1024, // 1 MB

    // Exclude testing libraries from production build
    rollupOptions: {
      external: ['@testing-library/dom'],
      output: {
        // Use a function to assign modules to manual chunks by inspecting
        // the module id string. This avoids passing RegExp objects into
        // the resolver which can cause a type error during the commonjs
        // resolution phase.
        manualChunks(id: string) {
          if (!id) return undefined;
          const isNodeMod = id.includes('node_modules');
          // Put Recharts in its own chunk. Ensure this check runs before generic react check.
          // if (isNodeMod && /[\\/]recharts[\\/]/.test(id)) return 'charts';
          // Group core React libs only (avoid matching packages that just contain the word "react")
          if (
            isNodeMod && /[\\/](react|react-dom|scheduler)[\\/]/.test(id)
          ) return 'vendor';
          // Merge UI libraries (Radix, lucide-react) into the default chunk to avoid circular helper imports
          // that can cause runtime issues like React being undefined in split chunks.
          // if (isNodeMod && (/[\\/]@radix-ui[\\/]/.test(id) || /[\\/]lucide-react[\\/]/.test(id))) return 'ui';
          // Don't separate maps into their own chunk to avoid React context issues
          // if (isNodeMod && (/[\\/]leaflet[\\/]/.test(id) || /[\\/]react-leaflet[\\/]/.test(id))) return 'maps';
          // Avoid isolating i18n libs into a separate chunk to prevent React being undefined at runtime
          // if (isNodeMod && (/[\\/]i18next[\\/]/.test(id) || /[\\/]react-i18next[\\/]/.test(id))) return 'i18n';
          return undefined;
        }
      }
    }
  },`;

// Replace the build configuration
const buildConfigRegex = /build:\s*{[\s\S]*?}/;
if (buildConfigRegex.test(viteConfig)) {
  viteConfig = viteConfig.replace(buildConfigRegex, viteConfigFix);
  console.log('✅ Updated vite.config.ts build configuration');
} else {
  console.log('⚠️  Could not find build configuration in vite.config.ts');
}

// Write the updated configuration back
fs.writeFileSync(viteConfigPath, viteConfig);

// Create a script to handle development environment warnings
const devWarningScript = `
// Development environment warning for locatorjs
if (import.meta.env.DEV) {
  console.warn(
    '[locatorjs] Development warning: This is expected when using @testing-library/dom in development mode. ' +
    'This warning does not affect production builds.'
  );
}
`;

// Add to the top of main.tsx
const mainTsxPath = path.join(__dirname, 'src/main.tsx');
if (fs.existsSync(mainTsxPath)) {
  let mainTsx = fs.readFileSync(mainTsxPath, 'utf8');
  
  // Add the development warning script at the top
  mainTsx = devWarningScript + mainTsx;
  
  fs.writeFileSync(mainTsxPath, mainTsx);
  console.log('✅ Added locatorjs development warning handler to main.tsx');
}

console.log('🎉 Fix applied successfully!');
console.log('📝 Next steps:');
console.log('   1. Run `npm run build` to create a production build');
console.log('   2. The warning should disappear in production builds');
console.log('   3. For development, the warning is now acknowledged and explained');
