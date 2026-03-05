import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { nodePolyfills } from "vite-plugin-node-polyfills";

export default defineConfig({
  plugins: [
    react(),
    nodePolyfills({
      include: ["buffer", "crypto", "stream", "util", "events"],
      globals: { Buffer: true, global: true, process: true },
    }),
  ],
  define: {
    "process.env": {},
  },
  build: {
    target: "esnext",
    rollupOptions: {
      output: {
        manualChunks: {
          "stellar-sdk": ["@stellar/stellar-sdk"],
        },
      },
    },
  },
});
