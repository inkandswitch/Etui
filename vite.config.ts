import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import wasm from "vite-plugin-wasm";
import topLevelAwait from "vite-plugin-top-level-await";
import cssInjectedByJs from "vite-plugin-css-injected-by-js";
import { EXTERNAL_DEPENDENCIES } from "@patchwork/sdk/shared-dependencies";

export default defineConfig({
  plugins: [react(), wasm(), topLevelAwait(), cssInjectedByJs()],
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'production'),
    'process.env': {}
  },
  build: {
    lib: {
      entry: "src/index.ts",
      name: "etui",
      formats: ["es"],
      fileName: "index",
    },
    rollupOptions: {
      external: EXTERNAL_DEPENDENCIES,
    },
  },
});
