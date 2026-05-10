// Inline formatting buttons (Bold, Italic, Underline, etc.)

import { For, Show } from "solid-js";
import { TOOLBAR_STYLES } from "../styles";
import { inlineFormattingActions } from "../constants";
import type { FormattingState } from "@monoscape/document-core";
import type { InlineFormattingId } from "../constants";

interface InlineFormatButtonsProps {
  state: FormattingState;
  isKeytipMode: boolean;
  onFormat: (command: string) => void;
  buttonRefs: Partial<Record<InlineFormattingId, HTMLButtonElement>>;
  onButtonKeyDown: (event: KeyboardEvent) => void;
  renderKeytip: (target: string) => any;
}

export function InlineFormatButtons(props: InlineFormatButtonsProps) {
  function getButtonStyle(actionId: keyof FormattingState) {
    const base = TOOLBAR_STYLES.button;
    const active = props.state[actionId] ? TOOLBAR_STYLES.buttonActive : "";
    return base + active;
  }

  return (
    <>
      <For each={inlineFormattingActions}>
        {(action) => (
          <div style="position: relative; display: inline-flex;">
            <button
              ref={(el) => {
                props.buttonRefs[action.id] = el;
              }}
              data-toolbar-button-id={action.id}
              aria-label={action.label}
              aria-pressed={props.state[action.id as keyof FormattingState] ? "true" : "false"}
              aria-keyshortcuts={action.ariaShortcut}
              title={`${action.label} (${action.shortcut})`}
              tabIndex={-1}
              style={getButtonStyle(action.id as keyof FormattingState)}
              onClick={() => props.onFormat(action.command)}
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
