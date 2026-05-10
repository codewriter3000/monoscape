import { defineConfig } from "vite";
import solid from "vite-plugin-solid";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  clearScreen: false,
  plugins: [tsconfigPaths(), solid()],
  build: {
    target: "es2022",
    outDir: "dist",
    emptyOutDir: true
  },
  server: {
    host: true,
    port: 1420,
    strictPort: true
  },
  preview: {
    host: true,
    port: 1420,
    strictPort: true
  }
});
