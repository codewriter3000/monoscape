import { createSignal } from "solid-js";
import { Show } from "solid-js";
import { type RightPanelTab } from "./rightPanelHelpers";
import { RightPanelInsertTab } from "./RightPanelInsertTab";
import { RightPanelStyleTab } from "./RightPanelStyleTab";
import { RightPanelLayoutTab } from "./RightPanelLayoutTab";

export function RightPanel() {
  const [tab, setTab] = createSignal<RightPanelTab>("insert");

  function tabButtonStyle(t: RightPanelTab): string {
    const active = tab() === t;
    return (
      `flex: 1; padding: 10px 4px; border: none; border-bottom: 2px solid ${active ? "#005fcc" : "transparent"};` +
      ` background: none; color: ${active ? "#005fcc" : "#52607a"};` +
      ` font-size: 0.78rem; font-weight: ${active ? 600 : 400}; cursor: pointer; outline: none;` +
      ` font-family: inherit; transition: color 0.15s, border-color 0.15s;`
    );
  }

  return (
    <div style="display: flex; flex-direction: column; margin: -20px;">
      {/* Tab bar */}
      <div style="display: flex; border-bottom: 1px solid #e9ecf0; background: #f7f9fc; flex-shrink: 0; border-radius: 16px 16px 0 0;">
        <button type="button" style={tabButtonStyle("insert")} onClick={() => setTab("insert")}>
          Insert
        </button>
        <button type="button" style={tabButtonStyle("style")} onClick={() => setTab("style")}>
          Style
        </button>
        <button type="button" style={tabButtonStyle("layout")} onClick={() => setTab("layout")}>
          Layout
        </button>
      </div>

      {/* Scrollable content */}
      <div style="overflow-y: auto; padding: 20px 20px 24px;">
        <Show when={tab() === "insert"}>
          <RightPanelInsertTab />
        </Show>
        <Show when={tab() === "style"}>
          <RightPanelStyleTab />
        </Show>
        <Show when={tab() === "layout"}>
          <RightPanelLayoutTab />
        </Show>
      </div>
    </div>
  );
}