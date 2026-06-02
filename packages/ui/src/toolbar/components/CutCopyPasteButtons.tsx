import { For, Show } from "solid-js";
import { cutCopyPasteActions, type ToolbarButtonId } from "../constants";

interface CutCopyPasteButtonProps {
    buttonRefs: Partial<Record<ToolbarButtonId, HTMLButtonElement>>;
    isKeytipMode: boolean;
    onButtonKeyDown: (event: KeyboardEvent) => void;
    renderKeytip: (target: string) => any;
    onCut: () => void;
    onCopy: () => void;
    onPaste: () => void;
}

export function CutCopyPasteButtons(props: CutCopyPasteButtonProps) {
    const actionHandlers: Record<string, () => void> = {
        cut: props.onCut,
        copy: props.onCopy,
        paste: props.onPaste
    };

    return (
        <>
            <For each={cutCopyPasteActions}>
                {(action) => (
                    <div style="position: relative; display: inline-flex;">
                        <button
                            ref={(el) => {
                                props.buttonRefs[action.id] = el;
                            }}
                            data-toolbar-button-id={action.id}
                            aria-label={action.label}
                            aria-keyshortcuts={action.ariaShortcut}
                            title={`${action.label} (${action.shortcut})`}
                            tabIndex={-1}
                            class="toolbar__button"
                            onClick={() => actionHandlers[action.id]()}
                            onKeyDown={props.onButtonKeyDown}
                        >
                            {action.content}
                        </button>
                        <Show when={props.isKeytipMode}>
                            {props.renderKeytip(action.id)}
                        </Show>
                    </div>
                )}
            </For>
        </>
    );
}