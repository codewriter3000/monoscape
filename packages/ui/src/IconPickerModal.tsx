import { createSignal, createMemo, For, Show, onMount } from "solid-js";
import { Portal } from "solid-js/web";
import type { CarbonIconData } from "./carbonIconsData";
import { CARBON_ICONS } from "./carbonIconsData";
import { getRecentIcons, recordRecentIcon, removeRecentIcon, type RecentIcon } from "./recentIconsStore";

// ─── Custom icon storage ────────────────────────────────────────────────────

const STORAGE_KEY = "monoscape-custom-icons";

export interface CustomIconData {
  id: string;
  name: string;
  svg: string;
}

function loadCustomIcons(): CustomIconData[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as CustomIconData[]) : [];
  } catch {
    return [];
  }
}

function persistCustomIcons(icons: CustomIconData[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(icons));
  } catch {
    /* storage unavailable */
  }
}

// ─── SVG sanitization (applied to user-uploaded files) ──────────────────────

/**
 * Parse and sanitize an SVG string from an untrusted source.
 * Removes scripts, event-handler attributes, <foreignObject>, and
 * javascript: URIs. Returns the sanitized SVG string or null on failure.
 */
function sanitizeSvg(raw: string): string | null {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(raw, "image/svg+xml");

    // DOMParser reports parse errors as <parsererror> nodes
    if (doc.querySelector("parsererror")) return null;

    const svgEl = doc.querySelector("svg");
    if (!svgEl) return null;

    // Remove executable elements
    for (const el of Array.from(doc.querySelectorAll("script, use"))) {
      el.remove();
    }
    // <foreignObject> can embed arbitrary HTML
    for (const el of Array.from(doc.querySelectorAll("foreignObject"))) {
      el.remove();
    }
    // Strip event-handler attributes and javascript: href values
    for (const el of Array.from(doc.querySelectorAll("*"))) {
      const drop: string[] = [];
      for (const attr of Array.from(el.attributes)) {
        const val = attr.value.trim().toLowerCase().replace(/\s+/g, "");
        if (
          attr.name.toLowerCase().startsWith("on") ||
          val.startsWith("javascript:") ||
          val.startsWith("data:text/html")
        ) {
          drop.push(attr.name);
        }
      }
      drop.forEach((a) => el.removeAttribute(a));
    }

    // Ensure fill="currentColor" so the icon respects theme colour
    if (!svgEl.hasAttribute("fill")) {
      svgEl.setAttribute("fill", "currentColor");
    }

    return svgEl.outerHTML;
  } catch {
    return null;
  }
}

// ─── Derived data ────────────────────────────────────────────────────────────

const CARBON_CATEGORIES: string[] = (() => {
  const seen = new Set<string>();
  for (const icon of CARBON_ICONS) seen.add(icon.category);
  return Array.from(seen).sort();
})();

const PAGE_SIZE = 240;

// ─── Component ───────────────────────────────────────────────────────────────

export interface IconPickerModalProps {
  onClose: () => void;
  onInsert: (svg: string, name: string) => void;
}

type DisplayIcon = (CarbonIconData | CustomIconData) & { isCustom?: true; isRecent?: true };

export function IconPickerModal(props: IconPickerModalProps) {
  const [query, setQuery] = createSignal("");
  const [category, setCategory] = createSignal<string>("All");
  const [selected, setSelected] = createSignal<DisplayIcon | null>(null);
  const [customIcons, setCustomIcons] = createSignal<CustomIconData[]>(loadCustomIcons());
  const [recentIcons, setRecentIcons] = createSignal<RecentIcon[]>(getRecentIcons());
  const [page, setPage] = createSignal(1);
  const [uploadError, setUploadError] = createSignal("");

  // "Recent" shows up first if there are any, then Custom, then all Carbon categories
  const categories = createMemo<string[]>(() => {
    const base = ["All", ...(recentIcons().length ? ["Recent"] : []), "Custom", ...CARBON_CATEGORIES];
    return base;
  });

  const filteredIcons = createMemo<DisplayIcon[]>(() => {
    const q = query().toLowerCase().trim();
    const cat = category();
    const customSet = new Set(customIcons().map((c) => c.id));

    // Recent
    if (cat === "Recent") {
      return recentIcons()
        .filter((ic) => !q || ic.name.toLowerCase().includes(q) || ic.id.toLowerCase().includes(q))
        .map((ic) => ({
          ...ic,
          isRecent: true as const,
          isCustom: customSet.has(ic.id) ? (true as const) : undefined,
        } as DisplayIcon));
    }

    const custom: DisplayIcon[] = customIcons()
      .filter((ic) => {
        if (cat !== "All" && cat !== "Custom") return false;
        return !q || ic.name.toLowerCase().includes(q) || ic.id.toLowerCase().includes(q);
      })
      .map((ic) => ({ ...ic, isCustom: true as const }));

    if (cat === "Custom") return custom;

    // "All" also includes recent icons at the top
    const recentInAll: DisplayIcon[] = cat === "All"
      ? recentIcons()
          .filter((ic) => !q || ic.name.toLowerCase().includes(q) || ic.id.toLowerCase().includes(q))
          .map((ic) => ({
            ...ic,
            isRecent: true as const,
            isCustom: customSet.has(ic.id) ? (true as const) : undefined,
          } as DisplayIcon))
      : [];

    const carbon: DisplayIcon[] = CARBON_ICONS.filter((ic) => {
      if (cat !== "All" && ic.category !== cat) return false;
      if (!q) return true;
      return ic.name.toLowerCase().includes(q) || ic.id.toLowerCase().includes(q);
    });

    return cat === "All" ? [...recentInAll, ...custom, ...carbon] : [...custom, ...carbon];
  });

  const visibleIcons = createMemo<DisplayIcon[]>(() =>
    filteredIcons().slice(0, page() * PAGE_SIZE)
  );

  const remaining = createMemo(() => filteredIcons().length - page() * PAGE_SIZE);

  function resetPaging() {
    setPage(1);
  }

  // ── File upload ────────────────────────────────────────────────────────────

  function handleFileChange(e: Event) {
    const input = e.currentTarget as HTMLInputElement;
    const files = input.files;
    if (!files?.length) return;
    setUploadError("");

    const newIcons: CustomIconData[] = [];
    let remaining = files.length;

    for (const file of Array.from(files)) {
      if (!file.name.toLowerCase().endsWith(".svg")) {
        remaining--;
        continue;
      }
      const reader = new FileReader();
      reader.onload = (ev) => {
        const raw = ev.target?.result as string;
        const sanitized = sanitizeSvg(raw ?? "");
        if (sanitized) {
          const stem = file.name.replace(/\.svg$/i, "");
          newIcons.push({
            id: `custom-${Date.now()}-${stem}`,
            name: stem
              .replace(/[-_]+/g, " ")
              .replace(/\b\w/g, (c) => c.toUpperCase()),
            svg: sanitized,
          });
        }
        remaining--;
        if (remaining === 0 && newIcons.length > 0) {
          const updated = [...customIcons(), ...newIcons];
          setCustomIcons(updated);
          persistCustomIcons(updated);
          setCategory("Custom");
        }
      };
      reader.onerror = () => {
        remaining--;
        setUploadError("Failed to read one or more files.");
      };
      reader.readAsText(file);
    }

    input.value = "";
  }

  /** Remove a custom-uploaded icon from both the custom list and recent history. */
  function handleDeleteCustomIcon(id: string) {
    const updated = customIcons().filter((ic) => ic.id !== id);
    setCustomIcons(updated);
    persistCustomIcons(updated);
    removeRecentIcon(id);
    setRecentIcons(getRecentIcons());
    if (selected()?.id === id) setSelected(null);
  }

  function handleInsert(icon: DisplayIcon) {
    // Record in recently used
    recordRecentIcon(icon.id, icon.name, icon.svg);
    setRecentIcons(getRecentIcons());
    props.onInsert(icon.svg, icon.name);
  }

  // ── Keyboard shortcuts ─────────────────────────────────────────────

  onMount(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") props.onClose();
      if (e.key === "Enter" && selected()) {
        handleInsert(selected()!);
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  });

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <Portal mount={document.body}>
    {/* Backdrop */}
    <div
      style="position: fixed; inset: 0; background: rgba(10,18,34,0.55); z-index: 9000; display: flex; align-items: center; justify-content: center;"
      onClick={(e) => {
        if (e.target === e.currentTarget) props.onClose();
      }}
    >
      {/* Panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Insert icon"
        style="background: #fff; border-radius: 12px; width: 780px; max-width: 96vw; max-height: 88vh; display: flex; flex-direction: column; box-shadow: 0 24px 64px rgba(0,0,0,0.28); overflow: hidden;"
      >
        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div style="display: flex; align-items: center; padding: 14px 18px; border-bottom: 1px solid #e9ecf0; flex-shrink: 0; background: #f7f9fc;">
          <h2 style="margin: 0; font-size: 0.95rem; font-weight: 700; color: #172033; flex: 1; font-family: inherit;">
            Insert Icon
          </h2>
          <span style="font-size: 0.7rem; color: #8896ae; margin-right: 12px;">
            {filteredIcons().length.toLocaleString()} icon{filteredIcons().length !== 1 ? "s" : ""}
          </span>
          <button
            type="button"
            onClick={props.onClose}
            title="Close (Esc)"
            style="background: none; border: none; cursor: pointer; font-size: 1rem; color: #52607a; padding: 4px 6px; line-height: 1; border-radius: 4px; font-family: inherit;"
          >
            ✕
          </button>
        </div>

        {/* ── Search bar ─────────────────────────────────────────────────── */}
        <div style="padding: 12px 18px 0; flex-shrink: 0;">
          <input
            type="search"
            placeholder="Search icons by name…"
            value={query()}
            onInput={(e) => {
              setQuery(e.currentTarget.value);
              resetPaging();
            }}
            style="width: 100%; padding: 7px 12px; border: 1px solid #c3cad8; border-radius: 8px; font-size: 0.82rem; outline: none; box-sizing: border-box; font-family: inherit; color: #172033; background: #fff;"
            autofocus
          />
        </div>

        {/* ── Category pills ─────────────────────────────────────────────── */}
        <div
          style="display: flex; gap: 5px; padding: 10px 18px 6px; overflow-x: auto; flex-shrink: 0; scrollbar-width: none; -ms-overflow-style: none;"
        >
          <For each={categories()}>
            {(cat) => {
              const active = () => category() === cat;
              return (
                <button
                  type="button"
                  onClick={() => {
                    setCategory(cat);
                    resetPaging();
                  }}
                  style={`padding: 3px 11px; border-radius: 20px; border: 1px solid ${active() ? "#005fcc" : "#c3cad8"}; background: ${active() ? "#005fcc" : "transparent"}; color: ${active() ? "#fff" : "#52607a"}; font-size: 0.7rem; cursor: pointer; white-space: nowrap; font-family: inherit; transition: background 0.1s, color 0.1s;`}
                >
                  {cat}
                </button>
              );
            }}
          </For>
        </div>

        {/* ── Icon grid ──────────────────────────────────────────────────── */}
        <div style="flex: 1; overflow-y: auto; padding: 4px 12px 8px; min-height: 0;">
          <Show when={filteredIcons().length > 0} fallback={
            <p style="text-align: center; color: #8896ae; padding: 48px 0; font-size: 0.85rem; font-family: inherit; margin: 0;">
              No icons match your search.
            </p>
          }>
            <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(68px, 1fr)); gap: 2px;">
              <For each={visibleIcons()}>
                {(icon) => {
                  const isSelected = () => selected()?.id === icon.id;
                  return (
                    <div
                      title={icon.name}
                      style={`display: flex; flex-direction: column; align-items: center; padding: 8px 4px 5px; border-radius: 7px; border: 2px solid ${isSelected() ? "#005fcc" : "transparent"}; background: ${isSelected() ? "#dce8ff" : "transparent"}; cursor: pointer; position: relative; box-sizing: border-box; transition: background 0.1s;`}
                      onClick={() => setSelected(icon)}
                      onDblClick={() => {
                        setSelected(icon);
                        handleInsert(icon);
                      }}
                    >
                      {/* Remove button for uploaded custom icons only */}
                      <Show when={(icon as DisplayIcon).isCustom}>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteCustomIcon(icon.id);
                          }}
                          title="Remove icon"
                          style="position: absolute; top: 2px; right: 2px; background: #e53935; border: none; border-radius: 50%; width: 13px; height: 13px; color: #fff; font-size: 8px; cursor: pointer; line-height: 13px; padding: 0; display: flex; align-items: center; justify-content: center; font-family: inherit;"
                        >
                          ✕
                        </button>
                      </Show>

                      {/* Icon preview */}
                      <div
                        style="width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; color: #172033; pointer-events: none; flex-shrink: 0;"
                        // eslint-disable-next-line solid/no-innerhtml
                        innerHTML={icon.svg}
                      />

                      {/* Label */}
                      <span style="font-size: 0.58rem; color: #52607a; margin-top: 3px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; width: 100%; display: block; text-align: center; line-height: 1.2;">
                        {icon.name}
                      </span>
                    </div>
                  );
                }}
              </For>
            </div>

            {/* Load more */}
            <Show when={remaining() > 0}>
              <div style="text-align: center; padding: 14px 0 4px;">
                <button
                  type="button"
                  onClick={() => setPage((p) => p + 1)}
                  style="padding: 5px 20px; border: 1px solid #c3cad8; border-radius: 6px; background: #f7f9fc; color: #172033; font-size: 0.75rem; cursor: pointer; font-family: inherit;"
                >
                  Show more ({remaining()} remaining)
                </button>
              </div>
            </Show>
          </Show>
        </div>

        {/* ── Footer ─────────────────────────────────────────────────────── */}
        <div style="display: flex; align-items: center; gap: 8px; padding: 10px 18px; border-top: 1px solid #e9ecf0; flex-shrink: 0; background: #f7f9fc;">
          {/* Upload */}
          <label
            style="display: flex; align-items: center; gap: 5px; padding: 5px 12px; border: 1px solid #c3cad8; border-radius: 6px; background: #fff; color: #172033; font-size: 0.75rem; cursor: pointer; font-family: inherit; white-space: nowrap;"
            title="Add your own SVG icons. They are stored in your browser."
          >
            📁 Upload SVG…
            <input
              type="file"
              accept=".svg"
              multiple
              style="display: none;"
              onChange={handleFileChange}
            />
          </label>

          <Show when={uploadError()}>
            <span style="font-size: 0.7rem; color: #e53935;">{uploadError()}</span>
          </Show>

          <span style="flex: 1;" />

          {/* Selected preview */}
          <Show when={selected()}>
            <div style="display: flex; align-items: center; gap: 7px; padding: 4px 10px; background: #fff; border: 1px solid #e9ecf0; border-radius: 6px;">
              <div
                style="width: 20px; height: 20px; color: #172033; display: flex; align-items: center; justify-content: center; pointer-events: none;"
                // eslint-disable-next-line solid/no-innerhtml
                innerHTML={selected()!.svg}
              />
              <span style="font-size: 0.75rem; color: #172033; max-width: 140px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                {selected()!.name}
              </span>
            </div>
          </Show>

          <button
            type="button"
            onClick={props.onClose}
            style="padding: 5px 16px; border: 1px solid #c3cad8; border-radius: 6px; background: #fff; color: #172033; font-size: 0.75rem; cursor: pointer; font-family: inherit;"
          >
            Cancel
          </button>

          <button
            type="button"
            disabled={!selected()}
            onClick={() => {
              const s = selected();
              if (s) handleInsert(s);
            }}
            style={`padding: 5px 16px; border: none; border-radius: 6px; background: ${selected() ? "#005fcc" : "#c3cad8"}; color: #fff; font-size: 0.75rem; cursor: ${selected() ? "pointer" : "not-allowed"}; font-family: inherit;`}
          >
            Insert
          </button>
        </div>
      </div>
    </div>
    </Portal>
  );
}
