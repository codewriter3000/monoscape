// Font family picker dropdown

import { For, Show, createEffect, createSignal, type JSX } from "solid-js";
import { DEFAULT_TYPOGRAPHY, FONT_CATEGORY_LABELS } from "@monoscape/document-core";
import type { FontCatalogEntry } from "@monoscape/document-core";
import { type FontFilter, FONT_CATEGORY_OPTIONS, getVisibleFonts } from "./pickers/fontPickerUtils";

interface FontPickerDropdownProps {
  fonts: FontCatalogEntry[];
  selectedFontFamily: string | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onFontSelect: (fontFamily: string) => void;
  focusEditor?: () => void;
  onNavigateOut?: (direction: "next" | "prev") => void;
  fontCapabilities?: {
    searchGoogleFonts?: (query: string) => Promise<FontCatalogEntry[]>;
    uploadFonts?: boolean;
  };
  onAddCatalogFont?: (font: FontCatalogEntry) => void;
  onRemoveFont?: (fontId: string) => void;
  onUploadFonts?: (fileList: FileList | null) => Promise<void>;
  renderKeytip?: () => JSX.Element;
  containerRef?: (el: HTMLDivElement) => void;
  triggerRef?: (el: HTMLButtonElement | undefined) => void;
}

export function FontPickerDropdown(props: FontPickerDropdownProps) {
  const [filter, setFilter] = createSignal<FontFilter>("all");
  const [searchQuery, setSearchQuery] = createSignal("");
  const [isHovered, setIsHovered] = createSignal(false);
  const [isTriggerActive, setIsTriggerActive] = createSignal(false);
  let searchInputRef: HTMLInputElement | undefined;
  const panelId = "monoscape-font-panel";

  const visibleFonts = () => getVisibleFonts(props.fonts, props.selectedFontFamily, filter(), searchQuery());

  const canAddFonts = () =>
    Boolean(
      props.fontCapabilities?.uploadFonts ||
      props.fontCapabilities?.searchGoogleFonts ||
      props.onAddCatalogFont ||
      props.onUploadFonts
    );

  function handleTriggerKeyDown(event: KeyboardEvent) {
    if (event.key === "Tab") {
      event.preventDefault();
      props.onNavigateOut?.(event.shiftKey ? "prev" : "next");
      return;
    }

    if (event.key === "Enter" || event.key === " " || event.key === "ArrowDown") {
      event.preventDefault();
      if (!props.isOpen) {
        props.onOpenChange(true);
      }
      return;
    }

    if (event.key === "Escape" && props.isOpen) {
      event.preventDefault();
      props.onOpenChange(false);
    }
  }

  function handleSearchKeyDown(event: KeyboardEvent) {
    if (event.key === "Escape") {
      event.preventDefault();
      props.onOpenChange(false);
    }
  }

  function selectFont(fontFamily: string) {
    props.onFontSelect(fontFamily);
    props.onOpenChange(false);
    queueMicrotask(() => props.focusEditor?.());
  }

  const selectedCategoryLabel = () => {
    if (!props.selectedFontFamily) return "";
    const entry = props.fonts.find((f) => f.family === props.selectedFontFamily);
    return entry ? FONT_CATEGORY_LABELS[entry.category] : "";
  };

  createEffect(() => {
    if (props.isOpen) {
      queueMicrotask(() => searchInputRef?.focus());
    }
  });

  const fontTriggerBorderColor = () => {
    if (props.isOpen) return "#005fcc";
    if (isHovered()) return "#8a90a0";
    return "#c3cad8";
  };

  const fontTriggerStyle = () =>
    "display:flex;align-items:center;justify-content:space-between;gap:12px;height:42px;min-width:280px;" +
    `padding:0 14px;border:1px solid ${fontTriggerBorderColor()};border-radius:12px;` +
    `background:${isTriggerActive() ? "#dce8ff" : props.isOpen ? "#eef4ff" : "#f7f9fc"};` +
    "color:#172033;font:inherit;cursor:pointer;" +
    `box-shadow:${props.isOpen ? "0 0 0 2px rgba(0,95,204,0.2)" : "none"};` +
    "transition:border-color 0.15s,background 0.15s,box-shadow 0.15s;";

  return (
    <div ref={props.containerRef} style="position: relative; display: inline-flex;">
      <button
        ref={(el) => props.triggerRef?.(el)}
        aria-label={`Font family: ${props.selectedFontFamily ?? DEFAULT_TYPOGRAPHY.fontFamily}`}
        aria-controls={panelId}
        aria-expanded={props.isOpen}
        tabIndex={-1}
        style={fontTriggerStyle()}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => { setIsHovered(false); setIsTriggerActive(false); }}
        onMouseDown={(event) => { event.preventDefault(); setIsTriggerActive(true); }}
        onMouseUp={() => setIsTriggerActive(false)}
        onClick={() => props.onOpenChange(!props.isOpen)}
        onKeyDown={handleTriggerKeyDown}
      >
        <span style="display:flex;flex-direction:column;align-items:flex-start;min-width:0;">
          <span style="font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:220px;">
            {props.selectedFontFamily ?? DEFAULT_TYPOGRAPHY.fontFamily}
          </span>
          <span style={`font-size:0.8rem;color:${props.isOpen ? "#005fcc" : "#52607a"};transition:color 0.15s;`}>
            {selectedCategoryLabel()}
          </span>
        </span>
        <span
          aria-hidden="true"
          style={`font-size:1rem;color:${props.isOpen ? "#005fcc" : "#52607a"};display:inline-block;transition:transform 0.2s ease,color 0.15s;transform:rotate(${props.isOpen ? "180" : "0"}deg);`}
        >▾</span>
        {props.renderKeytip?.()}
      </button>

      <Show when={props.isOpen}>
        <div
          role="dialog"
          aria-label="Font picker"
          id={panelId}
          style={
            "position:absolute;left:0;top:calc(100% + 8px);z-index:20;" +
            "width:min(420px,calc(100vw - 48px));display:flex;flex-direction:column;gap:12px;" +
            "padding:14px;border:1px solid #c3cad8;border-radius:16px;background:#ffffff;" +
            "box-shadow:0 22px 40px rgba(15,23,42,0.14);"
          }
        >
          <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:12px;">
            <div style="display:flex;flex-direction:column;gap:2px;min-width:0;">
              <span style="font-size:0.8rem;font-weight:600;color:#52607a;">Current</span>
              <span
                style={
                  "font-size:1rem;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:200px;" +
                  (props.selectedFontFamily ? `font-family:${props.selectedFontFamily};` : "")
                }
              >
                {props.selectedFontFamily ?? DEFAULT_TYPOGRAPHY.fontFamily}
              </span>
            </div>
            <label style="display:flex;flex-direction:column;gap:4px;align-items:flex-start;">
              <span style="font-size:0.75rem;font-weight:600;color:#52607a;">Filter</span>
              <select
                aria-label="Filter fonts by category"
                value={filter()}
                onChange={(e) => setFilter(e.currentTarget.value as FontFilter)}
                style="height:34px;padding:0 10px;border:1px solid #c3cad8;border-radius:10px;background:#f7f9fc;color:#172033;font:inherit;font-size:0.9rem;"
              >
                <For each={FONT_CATEGORY_OPTIONS}>
                  {(option) => <option value={option.value}>{option.label}</option>}
                </For>
              </select>
            </label>
          </div>

          <input
            ref={searchInputRef}
            type="search"
            placeholder="Search fonts"
            aria-label="Search available fonts"
            value={searchQuery()}
            onInput={(e) => setSearchQuery(e.currentTarget.value)}
            onKeyDown={handleSearchKeyDown}
            style="height:42px;padding:0 12px;border:1px solid #c3cad8;border-radius:12px;background:#f7f9fc;color:#172033;font:inherit;"
          />

          <div
            role="listbox"
            aria-label="Available fonts"
            style="display:flex;flex-direction:column;gap:6px;max-height:260px;overflow-x:hidden;padding-right:2px;"
          >
            <Show
              when={visibleFonts().length}
              fallback={
                <p style="margin:0;padding:10px 12px;color:#52607a;font-size:0.9rem;">
                  No fonts match that search.
                </p>
              }
            >
              <For each={visibleFonts()}>
                {(font) => {
                  const isSelected = props.selectedFontFamily === font.family;
                  return (
                    <div
                      style={
                        "display:flex;align-items:center;gap:8px;width:100%;box-sizing:border-box;" +
                        "padding:4px;border:1px solid #e3e8f1;border-radius:10px;background:#ffffff;" +
                        (isSelected ? "background:#edf4ff;border-color:#6a95dd;box-shadow:inset 0 0 0 1px #6a95dd;" : "")
                      }
                    >
                      <button
                        type="button"
                        role="option"
                        aria-selected={isSelected}
                        tabIndex={-1}
                        style="display:flex;align-items:center;justify-content:space-between;gap:12px;flex:1;min-width:0;border:none;background:transparent;color:#172033;font:inherit;text-align:left;padding:6px 8px;cursor:pointer;"
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={() => selectFont(font.family)}
                      >
                        <span style="display:flex;flex-direction:column;min-width:0;">
                          <span
                            style={`font-family:${font.family};font-size:1rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;`}
                          >
                            {font.family}
                          </span>
                          <span style="font-size:0.78rem;color:#52607a;">
                            {FONT_CATEGORY_LABELS[font.category]}
                          </span>
                        </span>
                      </button>
                      <Show when={font.removable && font.source === "uploaded"}>
                        <button
                          type="button"
                          aria-label={`Remove imported font ${font.family}`}
                          title={`Remove imported font ${font.family}`}
                          style="display:inline-flex;align-items:center;justify-content:center;width:30px;height:30px;border:1px solid #d9dde6;border-radius:8px;background:#ffffff;color:#7d2135;font-size:1rem;cursor:pointer;"
                          onMouseDown={(event) => {
                            event.preventDefault();
                            event.stopPropagation();
                          }}
                          onClick={(event) => {
                            event.preventDefault();
                            event.stopPropagation();
                            props.onRemoveFont?.(font.id);
                          }}
                        >
                          ×
                        </button>
                      </Show>
                    </div>
                  );
                }}
              </For>
            </Show>
          </div>
        </div>
      </Show>
    </div>
  );
}
