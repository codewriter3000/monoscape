import { FormattingToolbar } from "./FormattingToolbar";

export function TextEditor() {
  let editorRef: HTMLDivElement | undefined;

  return (
    <div
      style={
        "border:1px solid #ccc;border-radius:4px;overflow:hidden;" +
        "display:flex;flex-direction:column;background:#fff;"
      }
    >
      <style>{`
        .monoscape-editor:focus {
          outline: none;
          box-shadow: 0 0 0 2px #4a90d9;
        }
        .monoscape-editor:focus-visible {
          box-shadow: 0 0 0 2px #4a90d9;
        }
        .monoscape-toolbar button:focus-visible {
          outline: 2px solid #4a90d9;
          outline-offset: 1px;
        }
      `}</style>
      <div class="monoscape-toolbar">
        <FormattingToolbar editorRef={() => editorRef} />
      </div>
      <div
        ref={editorRef}
        contentEditable={true}
        role="textbox"
        aria-multiline="true"
        aria-label="Document editor"
        class="monoscape-editor"
        style={
          "font-family:'Liberation Serif',serif;font-size:12pt;line-height:1.5;" +
          "min-height:300px;padding:16px;flex:1;" +
          "white-space:pre-wrap;word-break:break-word;"
        }
      />
    </div>
  );
}
