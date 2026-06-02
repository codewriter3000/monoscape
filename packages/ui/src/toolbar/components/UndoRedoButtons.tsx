import { For, Show } from "solid-js";
import { undoRedoActions, type ToolbarButtonId } from "../constants";

interface UndoRedoButtonProps {
    buttonRefs: Partial<Record<ToolbarButtonId, HTMLButtonElement>>;
    isKeytipMode: boolean;
    onButtonKeyDown: (event: KeyboardEvent) => void;
    renderKeytip: (target: string) => any;
    onUndo: () => void;
    onRedo: () => void;
}

export function UndoRedoButtons(props: UndoRedoButtonProps) {

    const actionHandlers: Record<string, () => void> = {
        undo: props.onUndo,
        redo: props.onRedo
    };

    return (
        <>
            <For each={undoRedoActions}>
                {(action) => (
                    <div style="position: relative; display: inline-flex;">
                        <button
                            ref={(el) => {
                                props.buttonRefs[action.id] = el;
                            }}
                            data-toolbar-button-id={action.id}
                            aria-label={action.label}
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
    )
}