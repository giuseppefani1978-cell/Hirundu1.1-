import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: "/", // Play beta: dedicated root domain. Production GitHub Pages remains unchanged.
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
