// Text alignment buttons

import { For, Show } from "solid-js";
import { TOOLBAR_STYLES } from "../styles";
import { alignmentActions } from "../constants";
import type { TextAlignment } from "@monoscape/document-core";

interface AlignmentButtonsProps {
  selectedAlignment: TextAlignment | null;
  isKeytipMode: boolean;
  onAlignmentChange: (alignment: TextAlignment) => void;
  buttonRefs: Partial<Record<TextAlignment, HTMLButtonElement>>;
  onButtonKeyDown: (event: KeyboardEvent) => void;
  renderKeytip: (target: string) => any;
}

export function AlignmentButtons(props: AlignmentButtonsProps) {
  function getButtonStyle(alignmentId: TextAlignment) {
    const base = TOOLBAR_STYLES.button;
    const active = props.selectedAlignment === alignmentId ? TOOLBAR_STYLES.buttonActive : "";
    return base + active;
  }

  return (
    <>
      <For each={alignmentActions}>
        {(action) => (
          <div style="position: relative; display: inline-flex;">
            <button
              ref={(el) => {
                props.buttonRefs[action.id] = el;
              }}
              data-toolbar-button-id={action.id}
              aria-label={action.label}
              aria-pressed={props.selectedAlignment === action.id ? "true" : "false"}
              title={action.label}
              tabIndex={-1}
              style={getButtonStyle(action.id)}
              onClick={() => props.onAlignmentChange(action.id)}
              onKeyDown={props.onButtonKeyDown}
            >
              {action.content}
            </button>
            <Show when={props.isKeytipMode}>
              {props.renderKeytip(action.id)}
            </Show>
          </div>
        )}
      </For>
    </>
  );
}
