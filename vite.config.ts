/// <reference types="vite/client" />

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import svgr from "vite-plugin-svgr";
import { ViteImageOptimizer as _ViteImageOptimizer } from "vite-plugin-image-optimizer";

import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    // Optimize and import SVGs as React components with SVGO cleanup
    svgr({
      svgrOptions: { icon: true },
    }),

    // Build-time image optimization (jpg/png/webp/avif/svg)
    // ViteImageOptimizer({
    //   includePublic: true, // also optimize images placed in /public
    //   logStats: true,
    //   // common quality presets; tweak as needed
    //   jpg: { quality: 80, mozjpeg: false },
    //   png: { quality: 80 },
    //   webp: { quality: 75 },
    //   avif: { quality: 50 },
    //   svg: { multipass: true },
    // }),

    react(),

  // Progressive Web App support
  VitePWA({
    registerType: 'prompt',
    disable: process.env.NODE_ENV === 'development', // Disable PWA in development
    includeAssets: ['favicon.ico', 'robots.txt', 'offline.html'],
    injectRegister: false, // We'll handle registration manually
    manifest: {
      name: 'Flow Motion Logistics',
      short_name: 'FlowMotion',
      description: 'Advanced logistics platform',
      theme_color: '#1e293b',
      background_color: '#0f172a',
      display: 'standalone',
      start_url: '/',
      icons: [
      ],
    },
    workbox: {
      cleanupOutdatedCaches: true,
      clientsClaim: true,
      navigateFallback: '/offline.html',
      runtimeCaching: [
        {
          // Cache image assets
          urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|ico)$/,
          handler: 'CacheFirst',
          options: {
            cacheName: 'images-cache',
            expiration: {
              maxEntries: 60,
              maxAgeSeconds: 60 * 60 * 24 * 7, // 7 days
            },
          },
        },
        {
          // Cache same-origin navigation/doc requests for offline
          urlPattern: ({ request, sameOrigin }) => sameOrigin && request.mode === 'navigate',
          handler: 'NetworkFirst',
          options: {
            cacheName: 'pages-cache',
            expiration: {
              maxEntries: 50,
              maxAgeSeconds: 60 * 60 * 24, // 1 day
            },
            networkTimeoutSeconds: 3,
            plugins: [
              {
                handlerDidError: async () => Response.redirect('/offline.html', 302),
              },
            ],
          },
        },
        {
          // Cache API responses with network-first strategy
          urlPattern: ({ url }) => {
            // Use static patterns that work in service worker context
            return url.pathname.startsWith('/api/') || 
                   url.hostname === 'localhost' ||
                   url.hostname.includes('daorsflow.com') ||
                   url.hostname.includes('supabase.co');
          },
          handler: 'NetworkFirst',
          options: {
            cacheName: 'api-cache',
            expiration: {
              maxEntries: 100,
              maxAgeSeconds: 60 * 60, // 1 hour
            },
            networkTimeoutSeconds: 5,
          },
        },
      ],
    },
  }),
  ],
  resolve: {
    alias: {
  "@": path.resolve(__dirname, "./src"),
  "components": path.resolve(__dirname, "./src/components"),
  "ui": path.resolve(__dirname, "./src/components/ui"),
  "lib": path.resolve(__dirname, "./src/lib"),
  "hooks": path.resolve(__dirname, "./src/hooks"),
  "utils": path.resolve(__dirname, "./src/lib/utils"),
      "react": path.resolve(__dirname, "./node_modules/react"),
      "react-dom": path.resolve(__dirname, "./node_modules/react-dom"),
    },
    dedupe: ["react", "react-dom"],
  },
  optimizeDeps: {
    include: [
      "react", 
      "react-dom", 
      "react-leaflet", 
      "leaflet",
      "@radix-ui/react-slot",
      "@radix-ui/react-tooltip",
      "@radix-ui/react-dropdown-menu",
      "@radix-ui/react-select",
      "@radix-ui/react-dialog",
      "@radix-ui/react-popover",
      "@radix-ui/react-alert-dialog",
      "@radix-ui/react-avatar",
      "@radix-ui/react-button",
      "@radix-ui/react-card",
      "@radix-ui/react-label"
    ],
    force: true,
  },
  define: {
    global: 'globalThis',
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
  },
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

  // Drop console/debugger in production for smaller bundles

    rollupOptions: {
      external: (_id) => {
        // Don't externalize React - keep it bundled
        return false;
      },
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
  },
  server: {
    // Open the default browser automatically when the dev server starts
    open: true
  }
});