import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(() => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return undefined;
          if (
            id.includes("react") ||
            id.includes("react-dom") ||
            id.includes("react-router") ||
            id.includes("@remix-run") ||
            id.includes("scheduler") ||
            id.includes("use-sync-external-store") ||
            id.includes("react-helmet-async")
          ) {
            return "vendor-react";
          }
          if (id.includes("react-hook-form") || id.includes("@hookform") || id.includes("zod")) {
            return "vendor-forms";
          }
          if (id.includes("date-fns") || id.includes("clsx") || id.includes("tailwind-merge") || id.includes("class-variance-authority")) {
            return "vendor-utils";
          }
          if (id.includes("lucide-react")) {
            return "vendor-icons";
          }
          if (id.includes("framer-motion")) {
            return "vendor-motion";
          }
          if (id.includes("recharts")) {
            return "vendor-charts";
          }
          if (id.includes("xlsx")) {
            return "vendor-xlsx-parser";
          }
          if (id.includes("pdfjs-dist")) {
            return "vendor-pdf-parser";
          }
          if (id.includes("mammoth")) {
            return "vendor-docx-parser";
          }
          if (id.includes("jspdf")) {
            return "vendor-pdf-export";
          }
          return undefined;
        },
      },
    },
  },
}));
