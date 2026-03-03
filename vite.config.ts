import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: true,
    port: 8080,
    open: true, // 🔥 auto opens browser
  },

  plugins: [
    react(),
    mode === "development" && componentTagger(),
  ].filter(Boolean),

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@components": path.resolve(__dirname, "./src/components"),
      "@sections": path.resolve(__dirname, "./src/components/sections"),
      "@ui": path.resolve(__dirname, "./src/components/ui"),
      "@hooks": path.resolve(__dirname, "./src/hooks"),
      "@lib": path.resolve(__dirname, "./src/lib"),
    },
  },

  build: {
    outDir: "dist",
    sourcemap: mode === "development",
  },

  optimizeDeps: {
    include: ["react", "react-dom"],
  },
}));