import { defineExtension } from "@monoscape/extension-sdk";

export const citationsExtension = defineExtension({
  manifest: {
    id: "monoscape.citations",
    name: "Citations",
    version: "0.1.0",
    summary: "Supports citation workflows and bibliography-side actions for academic writing.",
    surfaces: ["document.command-bar", "document.sidebar"],
    installStrategy: "bundled",
    permissions: ["document.read", "document.write", "bibliography.manage"]
  },
  activate: () => ["citation-insert", "bibliography-panel"]
});
