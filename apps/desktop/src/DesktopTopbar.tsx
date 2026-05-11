import { createSignal, onCleanup, onMount } from "solid-js";
import { appWindow } from "@tauri-apps/api/window";
import "./topbar/desktopTopbar.css";
import { DesktopSaveMenu } from "./topbar/DesktopSaveMenu";
import { DesktopWindowControls } from "./topbar/DesktopWindowControls";

interface DesktopTopbarProps {
  extensionCount: number;
  viewMode: "welcome" | "editor";
  documentTitle?: string;
  documentMode?: string;
  documentPath?: string;
  isBusy?: boolean;
  isDocumentDirty?: boolean;
  canSave: boolean;
  canExport: boolean;
  canPrint: boolean;
  onNew: () => void;
  onOpen: () => void;
  onSave: () => void;
  onSaveAs: () => void;
  onSaveCopy: () => void;
  onExportPdf: () => void;
  onPrint: () => void;
}

const hasTauriWindowApi = typeof window !== "undefined" && "__TAURI_IPC__" in window;

export function DesktopTopbar(props: DesktopTopbarProps) {
  const [isMaximized, setIsMaximized] = createSignal(false);
  let removeResizeListener: (() => void) | undefined;

  const documentMeta = () => {
    if (props.viewMode === "welcome") {
      return "Choose a blank document, a workflow preset, or a recent file.";
    }
    if (props.documentPath) {
      return props.documentPath;
    }
    return `${props.documentMode ?? "draft"} draft in memory`;
  };

  const syncWindowState = async () => {
    if (!hasTauriWindowApi) return;
    try {
      setIsMaximized(await appWindow.isMaximized());
    } catch {
      setIsMaximized(false);
    }
  };

  const handleMinimize = async () => {
    if (!hasTauriWindowApi) return;
    try { await appWindow.minimize(); } catch {}
  };

  const handleToggleMaximize = async () => {
    if (!hasTauriWindowApi) return;
    try {
      const maximized = await appWindow.isMaximized();
      if (maximized) {
        await appWindow.unmaximize();
        setIsMaximized(false);
      } else {
        await appWindow.maximize();
        setIsMaximized(true);
      }
    } catch {}
  };

  const handleClose = async () => {
    if (!hasTauriWindowApi) return;
    try { await appWindow.close(); } catch {}
  };

  onMount(() => {
    if (!hasTauriWindowApi) return;
    void syncWindowState();
    void appWindow
      .onResized(() => { void syncWindowState(); })
      .then((unlisten) => { removeResizeListener = unlisten; })
      .catch(() => undefined);
  });

  onCleanup(() => { removeResizeListener?.(); });

  const statusText = () => {
    if (props.isBusy) return "Working...";
    if (props.viewMode === "editor") return props.isDocumentDirty ? "Unsaved changes" : "Draft ready";
    return `${props.extensionCount} extensions ready`;
  };

  const statusClass = () =>
    `desktop-topbar__status${props.isBusy ? " desktop-topbar__status--busy" : props.isDocumentDirty ? " desktop-topbar__status--dirty" : ""}`;

  return (
    <header
      class="desktop-topbar"
      data-tauri-drag-region
      onDblClick={(e) => {
        const target = e.target as HTMLElement;
        if (target.closest("button, input, select, [role='menuitem']")) return;
        void handleToggleMaximize();
      }}
    >
      <div class="desktop-topbar__drag-region" data-tauri-drag-region>
        <span class="desktop-topbar__title">{props.documentTitle ?? "Monoscape Desktop"}</span>
        <span class="desktop-topbar__meta">{documentMeta()}</span>
      </div>

      <div class="desktop-topbar__center" data-tauri-drag-region>
        <div class="desktop-topbar__action-group" role="group" aria-label="Document actions">
          <button type="button" class="desktop-topbar__action" aria-label="Open the new document welcome screen" aria-pressed={props.viewMode === "welcome"} disabled={props.isBusy} onClick={props.onNew}>
            <span class="desktop-topbar__action-icon" aria-hidden="true">+</span>
          </button>
          <button type="button" class="desktop-topbar__action" aria-label="Open a document" disabled={props.isBusy} onClick={props.onOpen}>
            <span class="desktop-topbar__action-icon" aria-hidden="true">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                <path d="M5 4H4a2 2 0 00-2 2v11a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2h-7L9 4H5z"/>
                <path d="M2 12h20"/>
              </svg>
            </span>
          </button>
          <DesktopSaveMenu canSave={props.canSave} isBusy={props.isBusy} documentPath={props.documentPath} onSave={props.onSave} onSaveAs={props.onSaveAs} onSaveCopy={props.onSaveCopy} />
          <button type="button" class="desktop-topbar__action" aria-label="Export document to PDF" disabled={!props.canExport || props.isBusy} onClick={props.onExportPdf}>
            <span class="desktop-topbar__action-icon" aria-hidden="true">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                <path d="M14 3H6a2 2 0 00-2 2v14a2 2 0 002 2h12a2 2 0 002-2V9l-6-6z"/>
                <path d="M14 3v6h6"/>
                <path d="M12 13v6M9 16l3 3 3-3"/>
              </svg>
            </span>
          </button>
          <button type="button" class="desktop-topbar__action" aria-label="Print document" disabled={!props.canPrint || props.isBusy} onClick={props.onPrint}>
            <span class="desktop-topbar__action-icon" aria-hidden="true">&#9113;</span>
          </button>
        </div>
      </div>

      <div class="desktop-topbar__utility-group">
        <span class={statusClass()}>{statusText()}</span>
        <DesktopWindowControls
          isMaximized={isMaximized()}
          onMinimize={() => void handleMinimize()}
          onToggleMaximize={() => void handleToggleMaximize()}
          onClose={() => void handleClose()}
        />
      </div>
    </header>
  );
}
