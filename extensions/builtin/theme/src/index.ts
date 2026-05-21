// Load Open Sans font (bundled locally via @fontsource — no CDN dependency).
// Weights: 400 regular, 600 semibold, 700 bold.
import "@fontsource/open-sans/400.css";
import "@fontsource/open-sans/600.css";
import "@fontsource/open-sans/700.css";
// Load design tokens as a CSS side-effect when this module is imported.
// Any app that imports themeExtension will automatically receive the tokens.
import "./tokens.css";
import { defineExtension } from "@monoscape/extension-sdk";

export const themeExtension = defineExtension({
  manifest: {
    id: "monoscape.theme",
    name: "Theme",
    version: "0.1.0",
    summary: "Provides the Monoscape default design tokens and visual theme.",
    surfaces: ["app.theme"],
    installStrategy: "bundled",
    permissions: []
  },
  activate: () => ["tokens"]
});
