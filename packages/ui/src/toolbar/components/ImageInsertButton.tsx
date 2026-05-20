// Toolbar button that opens a small dropdown for inserting images either from
// a local file (opens the OS file picker) or from a URL (shows an inline form).

import { createSignal, onCleanup, onMount, Show } from "solid-js";

export interface ImageInsertButtonProps {
  onInsertFromFile: () => void;
  onInsertFromUrl: (url: string) => void;
}

export function ImageInsertButton(props: ImageInsertButtonProps) {
  const [isOpen,        setIsOpen]        = createSignal(false);
  const [showUrlInput,  setShowUrlInput]  = createSignal(false);
  const [urlDraft,      setUrlDraft]      = createSignal("");
  const [urlError,      setUrlError]      = createSignal(false);

  let containerRef: HTMLDivElement | undefined;
  let urlInputRef:  HTMLInputElement | undefined;

  const close = () => {
    setIsOpen(false);
    setShowUrlInput(false);
    setUrlDraft("");
    setUrlError(false);
  };

  const openUrlForm = () => {
    setShowUrlInput(true);
    // Focus after the next paint
    requestAnimationFrame(() => urlInputRef?.focus());
  };

  const commitUrl = () => {
    const url = urlDraft().trim();
    if (!url) {
      setUrlError(true);
      return;
    }
    props.onInsertFromUrl(url);
    close();
  };

  // Close on outside click
  onMount(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef && !containerRef.contains(e.target as Node)) {
        close();
      }
    };
    document.addEventListener("mousedown", handler);
    onCleanup(() => document.removeEventListener("mousedown", handler));
  });

  const dropdownStyle =
    "position:absolute;top:calc(100% + 6px);left:0;min-width:200px;" +
    "background:#fff;border:1px solid #d9dde6;border-radius:10px;padding:6px;" +
    "box-shadow:0 4px 16px rgba(15,23,42,0.12);z-index:200;box-sizing:border-box;";

  const menuItemStyle =
    "display:flex;align-items:center;gap:8px;width:100%;padding:8px 12px;" +
    "background:transparent;border:none;border-radius:6px;cursor:pointer;" +
    "font-size:0.875rem;color:#172033;text-align:left;";

  const menuItemHoverStyle = menuItemStyle +
    "background:#f0f4fa;";

  return (
    <div ref={(el) => (containerRef = el)} style="position:relative;display:inline-flex;">
      <button
        class="toolbar__button"
        title="Insert image"
        aria-label="Insert image"
        aria-haspopup="true"
        aria-expanded={isOpen() ? "true" : "false"}
        tabIndex={-1}
        onClick={() => (isOpen() ? close() : (setShowUrlInput(false), setIsOpen(true)))}
      >
        {/* Inline image icon */}
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <rect x="1.5" y="3.5" width="13" height="9" rx="1.5"
            stroke="currentColor" stroke-width="1.5" fill="none" />
          <circle cx="5.5" cy="7" r="1.25" fill="currentColor" />
          <path d="M1.5 11.5L5 8L8.5 11.5L11 9L14.5 12.5"
            stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"
            stroke-linecap="round" fill="none" />
        </svg>
      </button>

      <Show when={isOpen()}>
        <div role="dialog" aria-label="Insert image" style={dropdownStyle}>

          <Show
            when={showUrlInput()}
            fallback={
              /* ── Main menu ───────────────────────────────────────── */
              <div style="display:flex;flex-direction:column;gap:2px;">
                <button
                  style={menuItemStyle}
                  onMouseEnter={(e) => (e.currentTarget.style.cssText = menuItemHoverStyle)}
                  onMouseLeave={(e) => (e.currentTarget.style.cssText = menuItemStyle)}
                  onClick={() => { props.onInsertFromFile(); close(); }}
                >
                  {/* File icon */}
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                    <rect x="2" y="1" width="8" height="12" rx="1" stroke="currentColor" stroke-width="1.3" fill="none"/>
                    <path d="M10 1L12 3" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>
                    <path d="M10 1v2.5H12.5" stroke="currentColor" stroke-width="1.3" fill="none" stroke-linecap="round"/>
                    <rect x="2" y="1" width="8" height="12" rx="1" stroke="currentColor" stroke-width="1.3" fill="none"/>
                  </svg>
                  From file…
                </button>

                <button
                  style={menuItemStyle}
                  onMouseEnter={(e) => (e.currentTarget.style.cssText = menuItemHoverStyle)}
                  onMouseLeave={(e) => (e.currentTarget.style.cssText = menuItemStyle)}
                  onClick={openUrlForm}
                >
                  {/* Link icon */}
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                    <path d="M5.5 8.5a3.5 3.5 0 0 0 5 0l1.5-1.5a3.5 3.5 0 0 0-5-5L6 3" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>
                    <path d="M8.5 5.5a3.5 3.5 0 0 0-5 0L2 7a3.5 3.5 0 0 0 5 5L8 11" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>
                  </svg>
                  From URL…
                </button>
              </div>
            }
          >
            {/* ── URL input form ────────────────────────────────────── */}
            <div style="padding:4px 2px;display:flex;flex-direction:column;gap:8px;">
              <label style="font-size:0.78rem;font-weight:600;color:#495770;">Image URL</label>
              <input
                ref={(el) => (urlInputRef = el)}
                type="url"
                placeholder="https://example.com/photo.jpg"
                value={urlDraft()}
                style={
                  "width:100%;padding:7px 10px;border:1px solid " +
                  (urlError() ? "#d93025" : "#d9dde6") +
                  ";border-radius:6px;font-size:0.875rem;outline:none;" +
                  "box-sizing:border-box;color:#172033;"
                }
                onInput={(e) => { setUrlDraft(e.currentTarget.value); setUrlError(false); }}
                onKeyDown={(e) => {
                  if (e.key === "Enter")  { e.preventDefault(); commitUrl(); }
                  if (e.key === "Escape") { e.preventDefault(); close(); }
                }}
              />
              <Show when={urlError()}>
                <span style="font-size:0.75rem;color:#d93025;">Please enter a URL.</span>
              </Show>
              <div style="display:flex;gap:8px;">
                <button
                  style="flex:1;padding:7px 0;background:#005fcc;color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:0.875rem;font-weight:600;"
                  onClick={commitUrl}
                >
                  Insert
                </button>
                <button
                  style="padding:7px 12px;background:transparent;border:1px solid #d9dde6;border-radius:6px;cursor:pointer;font-size:0.875rem;color:#495770;"
                  onClick={() => setShowUrlInput(false)}
                >
                  Back
                </button>
              </div>
            </div>
          </Show>
        </div>
      </Show>
    </div>
  );
}
