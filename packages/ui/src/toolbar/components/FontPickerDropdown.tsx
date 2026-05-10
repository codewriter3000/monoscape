// Font family picker dropdown

import { For, Show, createEffect, createSignal, type JSX } from "solid-js";
import { TOOLBAR_STYLES } from "../styles";
import { sortFontCatalog, FONT_CATEGORY_LABELS } from "@monoscape/document-core";
import type { FontCatalogEntry, FontCategory } from "@monoscape/document-core";

type FontFilter = "all" | FontCategory;

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
  let searchInputRef: HTMLInputElement | undefined;
  const panelId = "monoscape-font-panel";

  const categoryOptions: Array<{ value: FontFilter; label: string }> = [
    { value: "all", label: "All types" },
    ...Object.entries(FONT_CATEGORY_LABELS)
      .sort((left, right) => left[1].localeCompare(right[1]))
      .map(([value, label]) => ({ value: value as FontCategory, label }))
  ];

  const visibleFonts = () => {
    const currentFont = props.fonts.find((font) => font.family === props.selectedFontFamily);
    const filteredByCategory =
      filter() === "all"
        ? props.fonts
        : props.fonts.filter((font) => font.category === filter());
    const query = searchQuery().trim().toLowerCase();
    const filtered = query
      ? filteredByCategory.filter((font) => font.family.toLowerCase().includes(query))
      : filteredByCategory;

    if (!currentFont || filtered.some((font) => font.family === currentFont.family)) {
      return filtered;
    }

    return sortFontCatalog([currentFont, ...filtered]);
  };

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
    if (!props.selectedFontFamily) return "Mixed selection";
    const entry = props.fonts.find((f) => f.family === props.selectedFontFamily);
    return entry ? FONT_CATEGORY_LABELS[entry.category] : "";
  };

  createEffect(() => {
    if (props.isOpen) {
      queueMicrotask(() => searchInputRef?.focus());
    }
  });

  const fontTriggerStyle =
    "display:flex;align-items:center;justify-content:space-between;gap:12px;height:42px;min-width:280px;" +
    "padding:0 14px;border:1px solid #c3cad8;border-radius:12px;background:#f7f9fc;" +
    "color:#172033;font:inherit;cursor:pointer;";

  return (
    <div ref={props.containerRef} style="position: relative; display: inline-flex;">
      <button
        ref={(el) => props.triggerRef?.(el)}
        aria-label={`Font family: ${props.selectedFontFamily ?? "Mixed"}`}
        aria-controls={panelId}
        aria-expanded={props.isOpen}
        tabIndex={-1}
        style={fontTriggerStyle}
        onMouseDown={(event) => event.preventDefault()}
        onClick={() => props.onOpenChange(!props.isOpen)}
        onKeyDown={handleTriggerKeyDown}
      >
        <span style="display:flex;flex-direction:column;align-items:flex-start;min-width:0;">
          <span style="font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:220px;">
            {props.selectedFontFamily ?? "Mixed"}
          </span>
          <span style="font-size:0.8rem;color:#52607a;">
            {selectedCategoryLabel()}
          </span>
        </span>
        <span aria-hidden="true" style="font-size:0.8rem;color:#52607a;">▾</span>
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
                {props.selectedFontFamily ?? "Mixed"}
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
                <For each={categoryOptions}>
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
