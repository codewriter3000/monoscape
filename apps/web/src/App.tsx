import { createWorkspaceSeed, defaultWorkflowTemplates } from "@monoscape/document-core";
import { citationsExtension } from "@monoscape/extension-citations";
import { reviewExtension } from "@monoscape/extension-review";
import { createBootstrapPlan } from "@monoscape/kernel";
import { MonoscapeShell, TextEditor } from "@monoscape/ui";

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
      secondary={
        <ul>
          {defaultWorkflowTemplates.map((template) => (
            <li>{template.label}</li>
          ))}
        </ul>
      }
      utilities={<p>Use the web shell to smoke-test shared UI without anchoring the architecture to the browser.</p>}
    />
  );
}
