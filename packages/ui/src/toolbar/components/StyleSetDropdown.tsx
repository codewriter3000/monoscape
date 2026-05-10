// Academic style-set dropdown for APA v7 and MLA

import { For, Show, createEffect, createSignal, type JSX } from "solid-js";
import { TOOLBAR_STYLES } from "../styles";
import {
  ACADEMIC_STYLE_SETS,
  type AcademicStyleSetId,
  type AcademicBlockStyleId
} from "@monoscape/document-core";

interface StyleSetDropdownProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onStyleApply: (styleSetId: AcademicStyleSetId, blockStyleId: AcademicBlockStyleId) => void;
  onNavigateOut?: (direction: "next" | "prev") => void;
  renderKeytip?: () => JSX.Element;
  containerRef?: (el: HTMLDivElement) => void;
  triggerRef?: (el: HTMLButtonElement | undefined) => void;
}

export function StyleSetDropdown(props: StyleSetDropdownProps) {
  const [selectedStyleSet, setSelectedStyleSet] = createSignal<AcademicStyleSetId>("apa-v7");
  const [focusedIndex, setFocusedIndex] = createSignal(0);
  const styleSetButtons: HTMLButtonElement[] = [];
  const blockStyleButtons: HTMLButtonElement[] = [];
  let triggerRef: HTMLButtonElement | undefined;
  const panelId = "monoscape-style-panel";

  const currentStyleSet = () =>
    ACADEMIC_STYLE_SETS.find((set) => set.id === selectedStyleSet());

  function handleTriggerKeyDown(event: KeyboardEvent) {
    if (event.key === "Tab") {
      event.preventDefault();
      props.onNavigateOut?.(event.shiftKey ? "prev" : "next");
      return;
    }

    if (event.key === "Enter" || event.key === " " || event.key === "ArrowDown") {
      event.preventDefault();
      props.onOpenChange(!props.isOpen);
      return;
    }

    if (event.key === "Escape" && props.isOpen) {
      event.preventDefault();
      props.onOpenChange(false);
    }
  }

  function handlePanelKeyDown(event: KeyboardEvent) {
    if (event.key === "Tab") {
      event.preventDefault();
      props.onOpenChange(false);
      props.onNavigateOut?.(event.shiftKey ? "prev" : "next");
      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();
      props.onOpenChange(false);
      triggerRef?.focus();
      return;
    }
  }

  function applyBlockStyle(blockStyleId: AcademicBlockStyleId) {
    props.onStyleApply(selectedStyleSet(), blockStyleId);
    props.onOpenChange(false);
  }

  function focusBlockStyle(index: number) {
    const nextIndex = clampIndex(index, blockStyleButtons.length);
    setFocusedIndex(nextIndex);
    blockStyleButtons[nextIndex]?.focus();
  }

  function handleBlockKeyDown(event: KeyboardEvent, index: number) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      focusBlockStyle(index + 1);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      focusBlockStyle(index - 1);
    } else if (event.key === "Home") {
      event.preventDefault();
      focusBlockStyle(0);
    } else if (event.key === "End") {
      event.preventDefault();
      focusBlockStyle(blockStyleButtons.length - 1);
    } else if (event.key === "Enter") {
      event.preventDefault();
      const style = currentStyleSet()?.styles[index];
      if (style) applyBlockStyle(style.id);
    }
  }

  function handleStyleSetKeyDown(event: KeyboardEvent, index: number) {
    if (event.key === "ArrowRight") {
      event.preventDefault();
      styleSetButtons[(index + 1) % styleSetButtons.length]?.focus();
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      styleSetButtons[(index - 1 + styleSetButtons.length) % styleSetButtons.length]?.focus();
    }
  }

  function clampIndex(index: number, length: number) {
    if (length <= 0) return 0;
    if (index < 0) return length - 1;
    if (index >= length) return 0;
    return index;
  }

  createEffect(() => {
    selectedStyleSet();
    if (props.isOpen) {
      setFocusedIndex(0);
      queueMicrotask(() => blockStyleButtons[0]?.focus());
    }
  });

  const triggerStyle = `
    ${TOOLBAR_STYLES.compactTrigger}
    width: 100px;
  `;

  const styleSetButtonStyle = (active: boolean) => `
    padding: 6px 12px;
    border: 1px solid ${active ? "#005fcc" : "#c3cad8"};
    background: ${active ? "#dce8ff" : "#ffffff"};
    color: ${active ? "#005fcc" : "#172033"};
    font-size: 0.875rem;
    font-weight: ${active ? "600" : "400"};
    cursor: pointer;
    border-radius: 4px;
    outline: none;
    transition: background-color 0.1s;
  `;

  const blockStyleButtonStyle = `
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    padding: 10px 12px;
    border: none;
    border-radius: 4px;
    background: transparent;
    color: #172033;
    font-size: 0.875rem;
    text-align: left;
    cursor: pointer;
    outline: none;
    transition: background-color 0.1s;
  `;

  return (
    <div ref={props.containerRef} style="position: relative; display: inline-flex;">
      <button
        ref={(el) => {
          triggerRef = el;
          props.triggerRef?.(el);
        }}
        aria-label="Apply academic style"
        aria-controls={panelId}
        aria-expanded={props.isOpen}
        tabIndex={-1}
        style={triggerStyle}
        onClick={() => props.onOpenChange(!props.isOpen)}
        onKeyDown={handleTriggerKeyDown}
      >
        <span style="font-size: 0.875rem;">Styles</span>
        <span style="font-size: 0.75rem; color: #5a606c;">▾</span>
        {props.renderKeytip?.()}
      </button>

      <Show when={props.isOpen}>
        <div
          role="dialog"
          aria-label="Academic style sets"
          id={panelId}
          data-style-set-panel="true"
          style={TOOLBAR_STYLES.dropdownPanel + "width: 280px;"}
          onKeyDown={handlePanelKeyDown}
        >
          {/* Style set switcher: APA v7 / MLA */}
          <div style="display: flex; gap: 8px; margin-bottom: 12px; padding: 8px 8px 0;">
            <For each={ACADEMIC_STYLE_SETS}>
              {(styleSet, index) => (
                <button
                  type="button"
                  ref={(el) => {
                    styleSetButtons[index()] = el;
                  }}
                  style={styleSetButtonStyle(selectedStyleSet() === styleSet.id)}
                  onClick={() => setSelectedStyleSet(styleSet.id)}
                  onKeyDown={(event) => handleStyleSetKeyDown(event, index())}
                  title={styleSet.description}
                >
                  {styleSet.label}
                </button>
              )}
            </For>
          </div>

          {/* Block style list */}
          <div style="padding: 0 4px 4px;">
            <div style={TOOLBAR_STYLES.label + "padding: 0 8px;"}>
              {currentStyleSet()?.description}
            </div>

            <div role="list" style="margin-top: 8px;">
              <For each={currentStyleSet()?.styles}>
                {(blockStyle, index) => (
                  <button
                    type="button"
                    role="listitem"
                    style={blockStyleButtonStyle}
                    ref={(el) => {
                      blockStyleButtons[index()] = el;
                    }}
                    tabIndex={focusedIndex() === index() ? 0 : -1}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "#f0f3f6";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "transparent";
                    }}
                    onClick={() => applyBlockStyle(blockStyle.id)}
                    onKeyDown={(event) => handleBlockKeyDown(event, index())}
                  >
                    <span style="font-weight: 500;">{blockStyle.label}</span>
                    <span style="font-size: 0.75rem; color: #5a606c;">
                      {blockStyle.typography.fontFamily}, {blockStyle.typography.fontSize}pt
                    </span>
                  </button>
                )}
              </For>
            </div>
          </div>

          {/* Footer hint */}
          <div
            style="padding: 8px; margin-top: 8px; border-top: 1px solid #e5e8ed; font-size: 0.7rem; color: #5a606c; text-align: center;"
          >
            Select a style to apply formatting to the current paragraph
          </div>
        </div>
      </Show>
    </div>
  );
}
