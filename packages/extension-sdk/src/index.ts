import type { ExtensionManifest } from "@monoscape/kernel";

export interface MonoscapeExtensionModule {
  manifest: ExtensionManifest;
  activate: () => string[];
}

export function defineExtension(module: MonoscapeExtensionModule) {
  return module;
}
