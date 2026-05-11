import { createEffect, createSignal, onCleanup } from "solid-js";

interface DesktopSaveMenuProps {
  canSave: boolean;
  isBusy?: boolean;
  documentPath?: string;
  onSave: () => void;
  onSaveAs: () => void;
  onSaveCopy: () => void;
}

export function DesktopSaveMenu(props: DesktopSaveMenuProps) {
  const [isOpen, setIsOpen] = createSignal(false);
  let buttonRef: HTMLButtonElement | undefined;
  let menuRef: HTMLDivElement | undefined;

  const close = (restoreFocus = false) => {
    setIsOpen(false);
    if (restoreFocus) {
      queueMicrotask(() => buttonRef?.focus());
    }
  };

  const toggle = () => {
    if (!props.canSave || props.isBusy) return;
    setIsOpen((open) => !open);
  };

  const runAction = (action: () => void) => {
    close();
    action();
  };

  createEffect(() => {
    if (!isOpen()) return;

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node | null;
      if (!target) return;
      if (menuRef?.contains(target) || buttonRef?.contains(target)) return;
      close();
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      close(true);
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    onCleanup(() => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    });
  });

  return (
    <div class="desktop-topbar__menu">
      <button
        ref={buttonRef}
        type="button"
        class="desktop-topbar__action"
        aria-label="Open save options"
        aria-haspopup="menu"
        aria-expanded={isOpen()}
        disabled={!props.canSave || props.isBusy}
        onClick={toggle}
      >
        <span class="desktop-topbar__action-icon" aria-hidden="true">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <path d="M6 4H4a2 2 0 00-2 2v14a2 2 0 002 2h16a2 2 0 002-2V8l-4-4H6z"/>
            <path d="M10 4v4h4V4"/>
            <path d="M8 20v-6h8v6"/>
          </svg>
        </span>
        <span class="desktop-topbar__action-icon" aria-hidden="true">▾</span>
      </button>
      {isOpen() ? (
        <div ref={menuRef} class="desktop-topbar__menu-panel" role="menu" aria-label="Save options">
          <button type="button" class="desktop-topbar__menu-item" role="menuitem" onClick={() => runAction(props.onSave)}>
            <span>Save</span>
            <span>{props.documentPath ? "Current file" : "Save As if needed"}</span>
          </button>
          <button type="button" class="desktop-topbar__menu-item" role="menuitem" onClick={() => runAction(props.onSaveAs)}>
            <span>Save As</span>
            <span>Choose location</span>
          </button>
          <button type="button" class="desktop-topbar__menu-item" role="menuitem" onClick={() => runAction(props.onSaveCopy)}>
            <span>Save Copy</span>
            <span>Keep current file</span>
          </button>
        </div>
      ) : null}
    </div>
  );
}
