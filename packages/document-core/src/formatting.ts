// Formatting marks, state, and alignment types

export type FormattingMark =
  | "bold"
  | "italic"
  | "underline"
  | "strikethrough"
  | "superscript"
  | "subscript";

export interface FormattingState {
  bold: boolean;
  italic: boolean;
  underline: boolean;
  strikethrough: boolean;
  superscript: boolean;
  subscript: boolean;
}

export type TextAlignment = "left" | "center" | "right" | "justify";

export const MIXED_FORMATTING_LABEL = "";

export const FORMATTING_TOOLBAR_KEYTIPS = {
  fontFamily: "F",
  fontSize: "S",
  lineSpacing: "L",
  color: "K",
  styles: "Y",
  bold: "B",
  italic: "I",
  underline: "U",
  strikethrough: "T",
  superscript: "P",
  subscript: "D",
  left: "A",
  center: "E",
  right: "R",
  justify: "J",
  indent: "N",
  outdent: "O",
  undo: "Z",
  redo: "Y",
  cut: "X",
  copy: "C",
  paste: "V"
} as const;

export function emptyFormattingState(): FormattingState {
  return {
    bold: false,
    italic: false,
    underline: false,
    strikethrough: false,
    superscript: false,
    subscript: false
  };
}

export function resolveUniformValue<T>(
  values: readonly T[],
  isEqual: (left: T, right: T) => boolean = Object.is
) {
  const [firstValue, ...restValues] = values;

  if (firstValue === undefined) {
    return null;
  }

  return restValues.every((value) => isEqual(firstValue, value)) ? firstValue : null;
}
