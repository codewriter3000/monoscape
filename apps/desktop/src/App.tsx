import { createWorkspaceSeed, defaultWorkflowTemplates } from "@monoscape/document-core";
import { citationsExtension } from "@monoscape/extension-citations";
import { reviewExtension } from "@monoscape/extension-review";
import { createBootstrapPlan } from "@monoscape/kernel";
import { MonoscapeShell, TextEditor } from "@monoscape/ui";
import { DesktopTopbar } from "./DesktopTopbar";
import { desktopFontCapabilities } from "./fontSources";

export const desktopBootstrapPlan = createBootstrapPlan(
  {
    id: "desktop-shell",
    name: "Monoscape Desktop",
    platform: "desktop",
    accessibilityBaseline: "WCAG 2.2 AA",
    audience: "Students moving between focused drafting, research, and review",
    extensionSlots: ["document.command-bar", "document.sidebar", "document.review-pane"],
    defaultExtensionIds: [citationsExtension.manifest.id, reviewExtension.manifest.id]
  },
  [citationsExtension.manifest, reviewExtension.manifest]
);

const starterDocument = createWorkspaceSeed("Untitled syllabus notes", "notes");

export function DesktopApp() {
  return (
    <div class="desktop-runtime">
      <style>{`
        .desktop-runtime {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
        }

        .desktop-runtime__shell {
          flex: 1;
          min-height: 0;
        }

        .desktop-runtime .monoscape-shell {
          min-height: 100%;
        }

        .desktop-runtime .monoscape-shell__primary-card {
          width: min(100%, 1180px);
        }
      `}</style>
      <DesktopTopbar extensionCount={desktopBootstrapPlan.extensionQueue.length} />
      <div class="desktop-runtime__shell">
        <MonoscapeShell
          platform="desktop"
          title="Monoscape Desktop"
          subtitle="Large-canvas drafting in a Tauri shell with the shared editor stack intact."
          primary={<TextEditor fontCapabilities={desktopFontCapabilities} />}
          secondary={
            <>
              <p style="margin:0 0 12px;font-weight:600;color:#172033;">Workflow templates</p>
              <ul style="margin:0;padding-left:18px;color:#52607a;">
                {defaultWorkflowTemplates.map((template) => (
                  <li>{template.label}</li>
                ))}
              </ul>
            </>
          }
          utilities={
            <p style="margin:0;">
              {desktopBootstrapPlan.extensionQueue.length} extensions are ready for activation. Starter
              {" "}
              document: {starterDocument.title}. Desktop chrome stays local to `apps/desktop`; the
              shared editor shell still lives in `packages/ui`.
            </p>
          }
        />
      </div>
    </div>
  );
}
