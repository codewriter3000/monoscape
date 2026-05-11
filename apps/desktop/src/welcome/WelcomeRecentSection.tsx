import { For, Show, createMemo, createSignal } from "solid-js";
import type { RecentDesktopDocument } from "../documentFileIO";

export type WelcomeRecentSortMode = "recent" | "alpha-asc" | "alpha-desc" | "size";
export type WelcomeRecentLayoutMode = "tiles" | "list";

interface WelcomeRecentSectionProps {
  loadingRecentDocuments?: boolean;
  recentDocuments: RecentDesktopDocument[];
  onOpenRecent: (path: string) => void;
}

const recentDocumentCollator = new Intl.Collator(undefined, {
  numeric: true,
  sensitivity: "base"
});

function formatRecentTimestamp(timestamp: number) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(timestamp));
}

function formatFileSize(fileSize: number) {
  if (fileSize <= 0) {
    return "0 KB";
  }

  const units = ["B", "KB", "MB", "GB"];
  const exponent = Math.min(Math.floor(Math.log(fileSize) / Math.log(1024)), units.length - 1);
  const value = fileSize / 1024 ** exponent;
  return `${value >= 10 || exponent === 0 ? value.toFixed(0) : value.toFixed(1)} ${units[exponent]}`;
}

function buildRecentSearchText(document: RecentDesktopDocument) {
  return [document.title, document.path, document.workspaceMode].join(" ").toLowerCase();
}

export function WelcomeRecentSection(props: WelcomeRecentSectionProps) {
  const [filterQuery, setFilterQuery] = createSignal("");
  const [sortMode, setSortMode] = createSignal<WelcomeRecentSortMode>("recent");
  const [layoutMode, setLayoutMode] = createSignal<WelcomeRecentLayoutMode>("tiles");

  const visibleRecentDocuments = createMemo(() => {
    const query = filterQuery().trim().toLowerCase();
    const documents = query
      ? props.recentDocuments.filter((document) => buildRecentSearchText(document).includes(query))
      : props.recentDocuments.slice();

    const mode = sortMode();
    documents.sort((left, right) => {
      if (mode === "alpha-asc") {
        return recentDocumentCollator.compare(left.title, right.title);
      }

      if (mode === "alpha-desc") {
        return recentDocumentCollator.compare(right.title, left.title);
      }

      if (mode === "size") {
        return right.fileSize - left.fileSize || right.lastModified - left.lastModified;
      }

      return right.lastModified - left.lastModified;
    });

    return documents;
  });

  return (
    <div class="desktop-welcome__panel desktop-welcome__section">
      <div class="desktop-welcome__section-header">
        <div>
          <h2 class="desktop-welcome__section-title">Recent documents</h2>
          <p class="desktop-welcome__section-copy">
            Browse every recent file at once, then sort and filter without paging through results.
          </p>
        </div>
        <span class="desktop-welcome__resume-chip">{props.recentDocuments.length} tracked</span>
      </div>

      <div class="desktop-welcome__recent-toolbar">
        <div class="desktop-welcome__recent-controls">
          <label class="desktop-welcome__field">
            <span class="desktop-welcome__field-label">Filter</span>
            <input
              type="search"
              class="desktop-welcome__filter-input"
              aria-label="Filter recent documents"
              placeholder="Search by title, path, or mode"
              value={filterQuery()}
              onInput={(event) => setFilterQuery(event.currentTarget.value)}
            />
          </label>
          <label class="desktop-welcome__field">
            <span class="desktop-welcome__field-label">Sort by</span>
            <div class="desktop-welcome__sort-select-wrap">
              <select
                class="desktop-welcome__sort-select"
                aria-label="Sort recent documents"
                value={sortMode()}
                onChange={(event) => setSortMode(event.currentTarget.value as WelcomeRecentSortMode)}
              >
                <option value="recent">Last modified</option>
                <option value="alpha-asc">A-Z</option>
                <option value="alpha-desc">Z-A</option>
                <option value="size">File size</option>
              </select>
            </div>
          </label>
        </div>

        <div class="desktop-welcome__recent-view-toggle" role="group" aria-label="Recent layout mode">
          <button
            type="button"
            class="desktop-welcome__toggle"
            aria-label="Show recent documents as tiles"
            aria-pressed={layoutMode() === "tiles"}
            onClick={() => setLayoutMode("tiles")}
          >
            <span aria-hidden="true">▥</span>
            Tiles
          </button>
          <button
            type="button"
            class="desktop-welcome__toggle"
            aria-label="Show recent documents as a list"
            aria-pressed={layoutMode() === "list"}
            onClick={() => setLayoutMode("list")}
          >
            <span aria-hidden="true">☰</span>
            List
          </button>
        </div>
      </div>

      <Show
        when={!props.loadingRecentDocuments}
        fallback={<div class="desktop-welcome__empty-state">Loading recent documents…</div>}
      >
        <Show
          when={visibleRecentDocuments().length > 0}
          fallback={
            <div class="desktop-welcome__empty-state">
              {props.recentDocuments.length === 0
                ? "No recent documents yet. Save or open a file to build your history."
                : "No recent documents match the current filter."}
            </div>
          }
        >
          <div
            class={`desktop-welcome__recent-grid${layoutMode() === "list" ? " desktop-welcome__recent-grid--list" : ""}`}
            role="list"
            aria-label="Recent documents"
          >
            <For each={visibleRecentDocuments()}>
              {(document) => (
                <button
                  type="button"
                  role="listitem"
                  class={`desktop-welcome__recent-card${layoutMode() === "list" ? " desktop-welcome__recent-card--list" : ""}`}
                  data-available={document.available}
                  aria-label={`Open recent document ${document.title}`}
                  disabled={!document.available}
                  onClick={() => props.onOpenRecent(document.path)}
                >
                  <div class="desktop-welcome__recent-stat">
                    <h3 class="desktop-welcome__recent-title">{document.title}</h3>
                    <span class="desktop-welcome__recent-path">{document.path}</span>
                    <span class="desktop-welcome__recent-meta">
                      {document.workspaceMode}
                      {document.available ? "" : " • missing from disk"}
                    </span>
                  </div>
                  <div class="desktop-welcome__recent-stat">
                    <span>Modified</span>
                    <strong>{formatRecentTimestamp(document.lastModified)}</strong>
                  </div>
                  <div class="desktop-welcome__recent-stat">
                    <span>Size</span>
                    <strong>{formatFileSize(document.fileSize)}</strong>
                  </div>
                  <div class="desktop-welcome__recent-stat">
                    <span>Status</span>
                    <strong>{document.available ? "Ready" : "Unavailable"}</strong>
                  </div>
                </button>
              )}
            </For>
          </div>
        </Show>
      </Show>
    </div>
  );
}
