import { For, createMemo, createSignal } from "solid-js";
import { createWorkspaceSeed, defaultWorkflowTemplates } from "@monoscape/document-core";

interface WelcomeTemplateGridProps {
  onCreateFromTemplate: (templateId: string) => void;
}

export function WelcomeTemplateGrid(props: WelcomeTemplateGridProps) {
  const templatePreviews = createMemo(() =>
    defaultWorkflowTemplates.map((template) => ({
      template,
      seed: createWorkspaceSeed(template.label, template.mode)
    }))
  );
  const [selectedTemplateId, setSelectedTemplateId] = createSignal(
    defaultWorkflowTemplates[0]?.id ?? ""
  );
  const selectedTemplate = createMemo(
    () =>
      templatePreviews().find(({ template }) => template.id === selectedTemplateId()) ??
      templatePreviews()[0]
  );

  return (
    <div class="desktop-welcome__panel desktop-welcome__section">
      <div class="desktop-welcome__section-header">
        <div>
          <h2 class="desktop-welcome__section-title">Workflow presets</h2>
          <p class="desktop-welcome__section-copy">
            These presets reuse the shared document-core workflow templates and starter checklists.
          </p>
        </div>
        <button
          type="button"
          class="desktop-welcome__button"
          aria-label={`Create document from ${selectedTemplate()?.template.label ?? "selected"} preset`}
          disabled={!selectedTemplate()}
          onClick={() => {
            const template = selectedTemplate()?.template;
            if (template) {
              props.onCreateFromTemplate(template.id);
            }
          }}
        >
          Use selected preset
        </button>
      </div>

      <div class="desktop-welcome__template-grid" role="list" aria-label="Workflow presets">
        <For each={templatePreviews()}>
          {({ template, seed }) => {
            const isSelected = () => selectedTemplateId() === template.id;
            return (
              <button
                type="button"
                role="listitem"
                class="desktop-welcome__template-card"
                data-selected={isSelected()}
                aria-pressed={isSelected()}
                aria-label={`Select ${template.label} preset`}
                onClick={() => setSelectedTemplateId(template.id)}
                onDblClick={() => {
                  setSelectedTemplateId(template.id);
                  props.onCreateFromTemplate(template.id);
                }}
              >
                <div class="desktop-welcome__template-header">
                  <div>
                    <h3 class="desktop-welcome__template-title">{template.label}</h3>
                    <p class="desktop-welcome__template-meta">
                      {seed.checklist.length} starter checkpoints
                    </p>
                  </div>
                  <span class="desktop-welcome__template-mode">{template.mode}</span>
                </div>
                <ul class="desktop-welcome__template-checklist" aria-label={`${template.label} checklist preview`}>
                  <For each={seed.checklist}>
                    {(item) => <li>{item}</li>}
                  </For>
                </ul>
                <div class="desktop-welcome__template-footer">
                  <span>{template.extensionIds.length} companion extensions</span>
                  <span>{isSelected() ? "Selected" : "Click to select"}</span>
                </div>
              </button>
            );
          }}
        </For>
      </div>
    </div>
  );
}
