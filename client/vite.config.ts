import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { visualizer } from "rollup-plugin-visualizer";
import compression from "vite-plugin-compression";

const isAnalyze = process.env.ANALYZE === "true";

export default defineConfig({
  plugins: [
    tailwindcss(),
    reactRouter(),
    tsconfigPaths(),

    // Gzip compression
    compression({
      algorithm: "gzip",
      ext: ".gz",
      threshold: 1024,
    }),

    // Brotli compression
    compression({
      algorithm: "brotliCompress",
      ext: ".br",
      threshold: 1024,
    }),

    // Bundle analysis (conditional on ANALYZE env var)
    isAnalyze &&
      visualizer({
        filename: "stats.html",
        open: true,
        gzipSize: true,
        brotliSize: true,
      }),
  ].filter(Boolean),

  build: {
    // Hidden source maps for production debugging without exposing to users
    sourcemap: "hidden",

    rollupOptions: {
      output: {
        // Manual chunk splitting for optimal caching
        manualChunks: (id) => {
          // React core
          if (id.includes("node_modules/react-dom")) {
            return "vendor-react";
          }
          if (id.includes("node_modules/react/")) {
            return "vendor-react";
          }

          // React Router
          if (
            id.includes("node_modules/react-router") ||
            id.includes("node_modules/@react-router")
          ) {
            return "vendor-router";
          }

          // Radix UI components
          if (id.includes("node_modules/@radix-ui")) {
            return "vendor-radix";
          }

          // Framer Motion
          if (id.includes("node_modules/framer-motion")) {
            return "vendor-framer";
          }

          // Recharts
          if (id.includes("node_modules/recharts")) {
            return "vendor-charts";
          }

          // Date utilities
          if (id.includes("node_modules/date-fns")) {
            return "vendor-date";
          }

          // TanStack Query
          if (id.includes("node_modules/@tanstack/react-query")) {
            return "vendor-query";
          }

          // Form handling (react-hook-form, hookform resolvers, zod)
          if (
            id.includes("node_modules/react-hook-form") ||
            id.includes("node_modules/@hookform") ||
            id.includes("node_modules/zod")
          ) {
            return "vendor-forms";
          }
        },
      },
    },

    // Remove console and debugger statements in production
    minify: "esbuild",
  },

  esbuild: {
    // Remove console.log and debugger in production builds
    drop: process.env.NODE_ENV === "production" ? ["console", "debugger"] : [],
  },

  server: {
    // Warmup files for faster cold starts in development
    warmup: {
      clientFiles: [
        "./app/root.tsx",
        "./app/routes.ts",
        "./app/routes/**/*.tsx",
      ],
    },
  },
});
