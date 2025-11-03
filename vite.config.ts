import { defineConfig } from "vite";

export default defineConfig({
  base: "/Hirundu1.1-/",
  esbuild: {
    jsx: "automatic",
    jsxImportSource: "react",
  },
});
