import { createSignal, onCleanup, onMount } from "solid-js";
import { appWindow } from "@tauri-apps/api/window";

interface DesktopTopbarProps {
  extensionCount: number;
}

const hasTauriWindowApi = typeof window !== "undefined" && "__TAURI_IPC__" in window;

export function DesktopTopbar(props: DesktopTopbarProps) {
  const [isMaximized, setIsMaximized] = createSignal(false);
  let removeResizeListener: (() => void) | undefined;

  const syncWindowState = async () => {
    if (!hasTauriWindowApi) {
      return;
    }

    try {
      setIsMaximized(await appWindow.isMaximized());
    } catch {
      setIsMaximized(false);
    }
  };

  const handleMinimize = async () => {
    if (!hasTauriWindowApi) {
      return;
    }

    try {
      await appWindow.minimize();
    } catch {}
  };

  const handleToggleMaximize = async () => {
    if (!hasTauriWindowApi) {
      return;
    }

    try {
      const maximized = await appWindow.isMaximized();

      if (maximized) {
        await appWindow.unmaximize();
        setIsMaximized(false);
        return;
      }

      await appWindow.maximize();
      setIsMaximized(true);
    } catch {}
  };

  const handleClose = async () => {
    if (!hasTauriWindowApi) {
      return;
    }

    try {
      await appWindow.close();
    } catch {}
  };

  onMount(() => {
    if (!hasTauriWindowApi) {
      return;
    }

    void syncWindowState();
    void appWindow
      .onResized(() => {
        void syncWindowState();
      })
      .then((unlisten) => {
        removeResizeListener = unlisten;
      })
      .catch(() => undefined);
  });

  onCleanup(() => {
    removeResizeListener?.();
  });

  return (
    <header class="desktop-topbar">
      <style>{`
        .desktop-topbar {
          height: 48px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          padding: 0 0 0 18px;
          border-bottom: 1px solid #d9dde6;
          background: rgba(255, 255, 255, 0.92);
          backdrop-filter: blur(14px);
          color: #172033;
          user-select: none;
          flex-shrink: 0;
        }

        .desktop-topbar__drag-region {
          min-width: 0;
          flex: 1;
          height: 100%;
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .desktop-topbar__title {
          font-size: 0.95rem;
          font-weight: 600;
          white-space: nowrap;
        }

        .desktop-topbar__meta {
          font-size: 0.78rem;
          color: #52607a;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .desktop-topbar__actions {
          display: flex;
          align-items: center;
          gap: 10px;
          padding-right: 8px;
        }

        .desktop-topbar__status {
          padding: 6px 10px;
          border-radius: 999px;
          background: #eef3fb;
          color: #355078;
          font-size: 0.74rem;
          font-weight: 600;
          white-space: nowrap;
        }

        .desktop-topbar__controls {
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .desktop-topbar__control {
          width: 34px;
          height: 30px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border: none;
          border-radius: 10px;
          background: transparent;
          color: #52607a;
          cursor: pointer;
          font: inherit;
          transition: background-color 120ms ease, color 120ms ease;
        }

        .desktop-topbar__control:hover {
          background: #e6ebf3;
          color: #172033;
        }

        .desktop-topbar__control:focus-visible {
          outline: 2px solid #4a90d9;
          outline-offset: 2px;
        }

        .desktop-topbar__control--close:hover {
          background: #d1434320;
          color: #9d2a2a;
        }

        .desktop-topbar__glyph {
          display: block;
          line-height: 1;
          font-size: 0.9rem;
          font-weight: 700;
        }

        .desktop-topbar__glyph--minimize {
          transform: translateY(-3px);
        }

        .desktop-topbar__glyph--maximize {
          display: inline-block;
          font-size: 1.8em;
          transform: translateY(-4px);
          -webkit-text-stroke: 1px #52607a;
        }

        .desktop-topbar__control--maximize:hover .desktop-topbar__glyph--maximize,
        .desktop-topbar__glyph--maximize:hover {
          -webkit-text-stroke: 1px #172033;
        }

        .desktop-topbar__glyph--close {
          transform: translateY(-2px);
          -webkit-text-stroke: 1px #52607a;
        }

        .desktop-topbar__control--close:hover .desktop-topbar__glyph--close,
        .desktop-topbar__glyph--close:hover {
          -webkit-text-stroke: 1px #9d2a2a;
        }

        @media (max-width: 900px) {
          .desktop-topbar {
            padding-left: 12px;
          }

          .desktop-topbar__meta,
          .desktop-topbar__status {
            display: none;
          }
        }
      `}</style>
      <div
        class="desktop-topbar__drag-region"
        data-tauri-drag-region
        onDblClick={() => void handleToggleMaximize()}
      >
        <span class="desktop-topbar__title">Monoscape Desktop</span>
        <span class="desktop-topbar__meta">
          Shared editor shell below, native window chrome above.
        </span>
      </div>
      <div class="desktop-topbar__actions">
        <span class="desktop-topbar__status">
          {props.extensionCount} extensions ready
        </span>
        <div class="desktop-topbar__controls" role="group" aria-label="Desktop window controls">
          <button
            type="button"
            class="desktop-topbar__control"
            aria-label="Minimize window"
            title="Minimize"
            onClick={() => void handleMinimize()}
          >
            <span class="desktop-topbar__glyph desktop-topbar__glyph--minimize" aria-hidden="true">
              —
            </span>
          </button>
          <button
            type="button"
            class="desktop-topbar__control desktop-topbar__control--maximize"
            aria-label={isMaximized() ? "Restore window" : "Maximize window"}
            title={isMaximized() ? "Restore" : "Maximize"}
            onClick={() => void handleToggleMaximize()}
          >
            <span class="desktop-topbar__glyph" aria-hidden="true">
                {isMaximized() ? "❐" : <span class="desktop-topbar__glyph--maximize">□</span>}
            </span>
          </button>
          <button
            type="button"
            class="desktop-topbar__control desktop-topbar__control--close"
            aria-label="Close window"
            title="Close"
            onClick={() => void handleClose()}
          >
            <span class="desktop-topbar__glyph--close" aria-hidden="true">
              ✕
            </span>
          </button>
        </div>
      </div>
    </header>
  );
}
