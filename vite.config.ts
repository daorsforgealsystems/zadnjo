import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import svgr from "vite-plugin-svgr";
import { ViteImageOptimizer } from "vite-plugin-image-optimizer";

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
    registerType: 'autoUpdate',
    includeAssets: ['favicon.ico', 'robots.txt', 'offline.html'],
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
          // Cache API responses with network-first strategy (dynamic pattern based on env)
          urlPattern: ({ url }) => {
            const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';
            const baseUrl = new URL(apiBaseUrl).origin;
            return url.origin === baseUrl || url.pathname.startsWith('/api/');
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
    },
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
      output: {
        // Use a function to assign modules to manual chunks by inspecting
        // the module id string. This avoids passing RegExp objects into
        // the resolver which can cause a type error during the commonjs
        // resolution phase.
        manualChunks(id: string) {
          if (!id) return undefined;
          if (id.includes('react') && id.includes('node_modules')) return 'vendor';
          if (id.includes('radix-ui') || id.includes('lucide-react')) return 'ui';
          if (id.includes('recharts')) return 'charts';
          if (id.includes('leaflet') || id.includes('react-leaflet')) return 'maps';
          if (id.includes('i18next') || id.includes('react-i18next')) return 'i18n';
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