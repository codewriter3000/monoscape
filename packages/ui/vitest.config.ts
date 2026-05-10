import { defineConfig } from "vitest/config";
import solid from "vite-plugin-solid";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tsconfigPaths(), solid()],
  test: {
    environment: "jsdom"
  }
});
