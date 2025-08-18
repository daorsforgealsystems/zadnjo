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
      svgo: true,
      svgoConfig: {
        plugins: [
          { name: "removeViewBox", active: false }, // keep viewBox for responsiveness
          { name: "cleanupIDs", active: true },
        ],
      },
    }),

    // Build-time image optimization (jpg/png/webp/avif/svg)
    ViteImageOptimizer({
      includePublic: true, // also optimize images placed in /public
      logStats: true,
      // common quality presets; tweak as needed
      jpg: { quality: 80, mozjpeg: false },
      png: { quality: 80 },
      webp: { quality: 75 },
      avif: { quality: 50 },
      svg: { multipass: true },
    }),

    react(),

    // Progressive Web App support
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'robots.txt'],
      manifest: {
        name: 'Flow Motion Logistics',
        short_name: 'FlowMotion',
        description: 'Advanced logistics platform',
        theme_color: '#1e293b',
        background_color: '#0f172a',
        display: 'standalone',
        start_url: '/',
        icons: [
          // Add proper PNG icons in /public later for best PWA support
          // { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          // { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          // { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        cleanupOutdatedCaches: true,
        clientsClaim: true,
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
    esbuild: {
      drop: ["console", "debugger"],
    },

    rollupOptions: {
      output: {
        manualChunks: {
          react: ["react", "react-dom", "react-router-dom"],
          i18n: [
            "i18next",
            "react-i18next",
            "i18next-http-backend",
            "i18next-browser-languagedetector"
          ],
          ui: [
            "@radix-ui/react-accordion",
            "@radix-ui/react-alert-dialog",
            "@radix-ui/react-aspect-ratio",
            "@radix-ui/react-avatar",
            "@radix-ui/react-checkbox",
            "@radix-ui/react-collapsible",
            "@radix-ui/react-context-menu",
            "@radix-ui/react-dialog",
            "@radix-ui/react-dropdown-menu",
            "@radix-ui/react-hover-card",
            "@radix-ui/react-label",
            "@radix-ui/react-menubar",
            "@radix-ui/react-navigation-menu",
            "@radix-ui/react-popover",
            "@radix-ui/react-progress",
            "@radix-ui/react-radio-group",
            "@radix-ui/react-scroll-area",
            "@radix-ui/react-select",
            "@radix-ui/react-separator",
            "@radix-ui/react-slider",
            "@radix-ui/react-slot",
            "@radix-ui/react-switch",
            "@radix-ui/react-tabs",
            "@radix-ui/react-toast",
            "@radix-ui/react-toggle",
            "@radix-ui/react-toggle-group",
            "@radix-ui/react-tooltip",
            "lucide-react"
          ],
          charts: ["recharts"],
          maps: ["leaflet", "react-leaflet"],
          motion: ["framer-motion"],
          supabase: ["@supabase/supabase-js"],
          utils: ["date-fns", "clsx", "class-variance-authority", "uuid"]
        }
      }
    }
  },
  server: {
    // Open the default browser automatically when the dev server starts
    open: true
  }
});