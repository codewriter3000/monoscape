import { createWorkspaceSeed } from "@monoscape/document-core";
import { citationsExtension } from "@monoscape/extension-citations";
import { reviewExtension } from "@monoscape/extension-review";
import { createBootstrapPlan } from "@monoscape/kernel";
import { MonoscapeShell, RightPanel, TextEditor } from "@monoscape/ui";

const webBootstrapPlan = createBootstrapPlan(
  {
    id: "web-preview",
    name: "Monoscape Web Preview",
    platform: "web",
    accessibilityBaseline: "WCAG 2.2 AA",
    audience: "Cross-device preview surface for shared editor and extension behavior",
    extensionSlots: ["document.command-bar", "document.sidebar", "document.review-pane"],
    defaultExtensionIds: [citationsExtension.manifest.id, reviewExtension.manifest.id]
  },
  [citationsExtension.manifest, reviewExtension.manifest]
);

const seed = createWorkspaceSeed("Freshman composition draft", "essay");

export function App() {
  return (
    <MonoscapeShell
      platform="web"
      title="Monoscape"
      subtitle="Shared UI preview for the editor kernel and extension system."
      primary={<TextEditor />}
      secondary={<RightPanel />}
      utilities={
        <p style="margin:0;">
          Previewing {seed.title} with {webBootstrapPlan.extensionQueue.length} extensions staged. Keep
          browser-specific behavior out of the editor surface so desktop and mobile can reuse the same chrome.
        </p>
      }
    />
  );
}
