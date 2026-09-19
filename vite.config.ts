import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: "/Hirundu1.1-/", // ✅ essentiel pour GitHub Pages (sous-dossier du repo)
  plugins: [react()],
  server: {
    host: "0.0.0.0",
    allowedHosts: ["terminal.local"],
  },
  esbuild: {
    jsx: "automatic",
    jsxImportSource: "react",
  },
});
