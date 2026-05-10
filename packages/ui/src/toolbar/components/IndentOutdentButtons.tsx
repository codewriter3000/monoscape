import type { JSX } from "solid-js";
import { TOOLBAR_STYLES } from "../styles";
import type { ToolbarButtonId } from "../constants";

interface IndentOutdentButtonsProps {
  buttonRefs: Partial<Record<ToolbarButtonId, HTMLButtonElement>>;
  onButtonKeyDown: (event: KeyboardEvent) => void;
  renderKeytip: (id: string) => JSX.Element;
  onIndent: () => void;
  onOutdent: () => void;
}

export function IndentOutdentButtons(props: IndentOutdentButtonsProps) {
  return (
    <>
      <div style="position: relative; display: inline-flex;">
        <button
          ref={(el) => { props.buttonRefs.indent = el; }}
          data-toolbar-button-id="indent"
          aria-label="Increase indent"
          title="Increase indent"
          tabIndex={-1}
          style={TOOLBAR_STYLES.button}
          onClick={props.onIndent}
          onKeyDown={props.onButtonKeyDown}
        >
          →
        </button>
        {props.renderKeytip("indent")}
      </div>

      <div style="position: relative; display: inline-flex;">
        <button
          ref={(el) => { props.buttonRefs.outdent = el; }}
          data-toolbar-button-id="outdent"
          aria-label="Decrease indent"
          title="Decrease indent"
          tabIndex={-1}
          style={TOOLBAR_STYLES.button}
          onClick={props.onOutdent}
          onKeyDown={props.onButtonKeyDown}
        >
          ←
        </button>
        {props.renderKeytip("outdent")}
      </div>
    </>
  );
}
