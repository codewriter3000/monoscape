interface DesktopWindowControlsProps {
  isMaximized: boolean;
  onMinimize: () => void;
  onToggleMaximize: () => void;
  onClose: () => void;
}

export function DesktopWindowControls(props: DesktopWindowControlsProps) {
  return (
    <div class="desktop-topbar__controls" role="group" aria-label="Desktop window controls">
      <button
        type="button"
        class="desktop-topbar__control"
        aria-label="Minimize window"
        title="Minimize"
        onClick={props.onMinimize}
      >
        <span class="desktop-topbar__glyph desktop-topbar__glyph--minimize" aria-hidden="true">
          —
        </span>
      </button>
      <button
        type="button"
        class="desktop-topbar__control desktop-topbar__control--maximize"
        aria-label={props.isMaximized ? "Restore window" : "Maximize window"}
        title={props.isMaximized ? "Restore" : "Maximize"}
        onClick={props.onToggleMaximize}
      >
        <span class="desktop-topbar__glyph" aria-hidden="true">
          {props.isMaximized ? "❐" : <span class="desktop-topbar__glyph--maximize">□</span>}
        </span>
      </button>
      <button
        type="button"
        class="desktop-topbar__control desktop-topbar__control--close"
        aria-label="Close window"
        title="Close"
        onClick={props.onClose}
      >
        <span class="desktop-topbar__glyph--close" aria-hidden="true">✕</span>
      </button>
    </div>
  );
}
