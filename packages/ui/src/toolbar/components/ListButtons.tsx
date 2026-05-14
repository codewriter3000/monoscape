// Toolbar list type selector — three connected buttons (None / Bullets / Numbers)

import type { ListType } from "../../editor/hooks/useListFormatting";

interface ListButtonsProps {
  listType: ListType;
  onToggleUnordered: () => void;
  onToggleOrdered: () => void;
}

function segBtn(active: boolean, pos: "first" | "mid" | "last"): string {
  const r = pos === "first" ? "5px 0 0 5px" : pos === "last" ? "0 5px 5px 0" : "0";
  return (
    `padding: 5px 8px; border: 1px solid; font-size: 0.72rem; cursor: pointer;` +
    ` outline: none; font-family: inherit; line-height: 1;` +
    ` border-radius: ${r}; border-right-width: ${pos === "last" ? "1px" : "0"};` +
    ` border-color: ${active ? "#005fcc" : "#c3cad8"};` +
    ` background: ${active ? "#dce8ff" : "#f7f9fc"};` +
    ` color: ${active ? "#005fcc" : "#172033"}; font-weight: ${active ? "600" : "400"};`
  );
}

export function ListButtons(props: ListButtonsProps) {
  return (
    <div style="position: relative; display: inline-flex; align-items: center;">
      {/* None — deactivates current list */}
      <button
        type="button"
        aria-label="No list"
        aria-pressed={props.listType === "none" ? "true" : "false"}
        title="No list"
        style={segBtn(props.listType === "none", "first")}
        onClick={() => {
          if (props.listType === "ul") props.onToggleUnordered();
          else if (props.listType === "ol") props.onToggleOrdered();
        }}
      >
        None
      </button>

      {/* Bullets */}
      <button
        aria-label="Bullet list"
        aria-pressed={props.listType === "ul" ? "true" : "false"}
        title="Bullet list"
        style={segBtn(props.listType === "ul", "mid")}
        onClick={() => { if (props.listType !== "ul") props.onToggleUnordered(); }}
      >
        ● Bullets
      </button>

      {/* Numbers */}
      <button
        aria-label="Numbered list"
        aria-pressed={props.listType === "ol" ? "true" : "false"}
        title="Numbered list"
        style={segBtn(props.listType === "ol", "last")}
        onClick={() => { if (props.listType !== "ol") props.onToggleOrdered(); }}
      >
        1. Numbers
      </button>
    </div>
  );
}
