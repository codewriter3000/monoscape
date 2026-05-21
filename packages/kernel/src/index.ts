export type PlatformTarget = "desktop" | "mobile" | "web";
export type AccessibilityBaseline = "WCAG 2.2 AA";
export type ExtensionSurface =
  | "document.command-bar"
  | "document.sidebar"
  | "document.review-pane"
  | "document.status-bar"
  | "app.theme";

export interface ExtensionManifest {
  id: string;
  name: string;
  version: string;
  summary: string;
  surfaces: ExtensionSurface[];
  installStrategy: "bundled" | "catalog";
  permissions: string[];
}

export interface AppShellDescriptor {
  id: string;
  name: string;
  platform: PlatformTarget;
  accessibilityBaseline: AccessibilityBaseline;
  audience: string;
  extensionSlots: ExtensionSurface[];
  defaultExtensionIds: string[];
}

export interface BootstrapPlan {
  app: AppShellDescriptor;
  discoveredExtensions: ExtensionManifest[];
  extensionQueue: string[];
}

export function createBootstrapPlan(
  app: AppShellDescriptor,
  discoveredExtensions: ExtensionManifest[] = []
): BootstrapPlan {
  const discoveredExtensionIds = new Set(discoveredExtensions.map((extension) => extension.id));

  return {
    app,
    discoveredExtensions,
    extensionQueue: app.defaultExtensionIds.filter((extensionId) => !discoveredExtensionIds.has(extensionId))
  };
}
