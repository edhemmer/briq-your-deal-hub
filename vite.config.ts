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
          if (id.includes("recharts")) {
            return "vendor-charts";
          }
          if (id.includes("xlsx") || id.includes("exceljs")) {
            return "vendor-spreadsheets";
          }
          if (id.includes("pdfjs-dist") || id.includes("mammoth") || id.includes("jspdf")) {
            return "vendor-documents";
          }
          return "vendor";
        },
      },
    },
  },
}));
