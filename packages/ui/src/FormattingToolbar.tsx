import { createSignal, onCleanup, onMount } from "solid-js";

interface FormattingState {
  bold: boolean;
  italic: boolean;
  underline: boolean;
}

interface FormattingToolbarProps {
  editorRef: () => HTMLDivElement | undefined;
}

export function FormattingToolbar(props: FormattingToolbarProps) {
  const [state, setState] = createSignal<FormattingState>({
    bold: false,
    italic: false,
    underline: false,
  });

  let buttons: HTMLButtonElement[] = [];
  let focusedIndex = 0;

  function updateState() {
    setState({
      bold: document.queryCommandState("bold"),
      italic: document.queryCommandState("italic"),
      underline: document.queryCommandState("underline"),
    });
  }

  function execFormat(command: string) {
    const editor = props.editorRef();
    if (editor) editor.focus();
    document.execCommand(command);
    updateState();
  }

  function moveFocus(delta: number) {
    const next = (focusedIndex + delta + buttons.length) % buttons.length;
    buttons[focusedIndex].tabIndex = -1;
    buttons[next].tabIndex = 0;
    buttons[next].focus();
    focusedIndex = next;
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === "ArrowRight") {
      e.preventDefault();
      moveFocus(1);
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      moveFocus(-1);
    }
  }

  onMount(() => {
    document.addEventListener("selectionchange", updateState);
  });

  onCleanup(() => {
    document.removeEventListener("selectionchange", updateState);
  });

  const buttonStyle =
    "display:inline-flex;align-items:center;justify-content:center;" +
    "width:2rem;height:2rem;border:1px solid #ccc;border-radius:3px;" +
    "background:#f5f5f5;cursor:pointer;font-size:0.9rem;" +
    "transition:background 0.1s,border-color 0.1s;";

  const activeStyle = "background:#d0e4ff;border-color:#4a90d9;";

  return (
    <div
      role="toolbar"
      aria-label="Text formatting"
      style="display:flex;gap:4px;padding:4px 6px;border-bottom:1px solid #ddd;background:#fafafa;"
      onKeyDown={handleKeyDown}
    >
      <button
        ref={(el) => { buttons[0] = el; }}
        aria-label="Bold"
        aria-pressed={state().bold}
        title="Bold"
        tabIndex={0}
        style={buttonStyle + (state().bold ? activeStyle : "")}
        onClick={() => execFormat("bold")}
      >
        <strong>B</strong>
      </button>
      <button
        ref={(el) => { buttons[1] = el; }}
        aria-label="Italic"
        aria-pressed={state().italic}
        title="Italic"
        tabIndex={-1}
        style={buttonStyle + (state().italic ? activeStyle : "")}
        onClick={() => execFormat("italic")}
      >
        <em>I</em>
      </button>
      <button
        ref={(el) => { buttons[2] = el; }}
        aria-label="Underline"
        aria-pressed={state().underline}
        title="Underline"
        tabIndex={-1}
        style={buttonStyle + (state().underline ? activeStyle : "")}
        onClick={() => execFormat("underline")}
      >
        <span style="text-decoration:underline">U</span>
      </button>
    </div>
  );
}
