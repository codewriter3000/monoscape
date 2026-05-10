import { createWorkspaceSeed, defaultWorkflowTemplates } from "@monoscape/document-core";
import { citationsExtension } from "@monoscape/extension-citations";
import { reviewExtension } from "@monoscape/extension-review";
import { createBootstrapPlan } from "@monoscape/kernel";
import { MonoscapeShell, TextEditor } from "@monoscape/ui";
import { onMount } from "solid-js";
import { createMobileLogger } from "./logging";

export const mobileBootstrapPlan = createBootstrapPlan(
  {
    id: "mobile-shell",
    name: "Monoscape Mobile",
    platform: "mobile",
    accessibilityBaseline: "WCAG 2.2 AA",
    audience: "Students capturing ideas, reading feedback, and making quick revisions on the go",
    extensionSlots: ["document.command-bar", "document.sidebar"],
    defaultExtensionIds: [citationsExtension.manifest.id, reviewExtension.manifest.id]
  },
  [citationsExtension.manifest, reviewExtension.manifest]
);

const quickCaptureDocument = createWorkspaceSeed("Seminar reflection", "quick-capture");

export function MobileApp() {
  const logger = createMobileLogger("MobileShell");

  onMount(() => {
    logger.info("Mobile shell mounted.", {
      extensionQueue: mobileBootstrapPlan.extensionQueue,
      defaultExtensions: mobileBootstrapPlan.app.defaultExtensionIds
    });
  });

  return (
    <div class="mobile-runtime">
      <style>{`
        .mobile-runtime {
          min-height: 100vh;
          padding-bottom: env(safe-area-inset-bottom);
        }

        .mobile-runtime .monoscape-shell__header {
          padding-top: max(20px, env(safe-area-inset-top));
        }

        .mobile-runtime .monoscape-shell__footer {
          padding-bottom: max(24px, env(safe-area-inset-bottom));
        }
      `}</style>
      <MonoscapeShell
        platform="mobile"
        title="Monoscape Mobile"
        subtitle="Quick capture on Android with the same shared editor surface students use everywhere else."
        primary={<TextEditor />}
        secondary={
          <>
            <p style="margin:0 0 12px;font-weight:600;color:#172033;">Quick actions</p>
            <ol style="margin:0;padding-left:18px;color:#52607a;">
              {defaultWorkflowTemplates.slice(0, 2).map((template) => (
                <li>{template.label}</li>
              ))}
            </ol>
          </>
        }
        utilities={
          <p style="margin:0;">
            Quick-capture seed: {quickCaptureDocument.title}. Default install queue:
            {" "}
            {mobileBootstrapPlan.extensionQueue.join(", ") || "none"}. Keep touch tuning in this shell so the
            shared editor stays portable.
          </p>
        }
      />
    </div>
  );
}
