// Academic style-set presets (APA v7, MLA) and block style types

import type { TypographySettings } from "./typography";
import type { TextAlignment } from "./formatting";

export type AcademicStyleSetId = "apa-v7" | "mla";
export type AcademicBlockStyleId = "body" | "heading-1" | "heading-2" | "heading-3" | "blockquote";

export interface AcademicBlockStyle {
  id: AcademicBlockStyleId;
  label: string;
  typography: TypographySettings;
  alignment: TextAlignment;
  lineSpacing: number;
  marginBefore?: number; // in points
  marginAfter?: number;  // in points
  indent?: number;       // in points
}

export interface AcademicStyleSet {
  id: AcademicStyleSetId;
  label: string;
  description: string;
  styles: AcademicBlockStyle[];
}

// APA v7 style set
const apaV7Styles: AcademicBlockStyle[] = [
  {
    id: "body",
    label: "Body Text",
    typography: { fontFamily: "Liberation Serif", fontSize: 12 },
    alignment: "left",
    lineSpacing: 2,
    marginBefore: 0,
    marginAfter: 0,
    indent: 0
  },
  {
    id: "heading-1",
    label: "Heading 1",
    typography: { fontFamily: "Liberation Serif", fontSize: 12 },
    alignment: "center",
    lineSpacing: 2,
    marginBefore: 12,
    marginAfter: 0,
    indent: 0
  },
  {
    id: "heading-2",
    label: "Heading 2",
    typography: { fontFamily: "Liberation Serif", fontSize: 12 },
    alignment: "left",
    lineSpacing: 2,
    marginBefore: 12,
    marginAfter: 0,
    indent: 0
  },
  {
    id: "heading-3",
    label: "Heading 3",
    typography: { fontFamily: "Liberation Serif", fontSize: 12 },
    alignment: "left",
    lineSpacing: 2,
    marginBefore: 12,
    marginAfter: 0,
    indent: 18
  },
  {
    id: "blockquote",
    label: "Block Quote",
    typography: { fontFamily: "Liberation Serif", fontSize: 12 },
    alignment: "left",
    lineSpacing: 2,
    marginBefore: 0,
    marginAfter: 0,
    indent: 18
  }
];

// MLA style set
const mlaStyles: AcademicBlockStyle[] = [
  {
    id: "body",
    label: "Body Text",
    typography: { fontFamily: "Liberation Serif", fontSize: 12 },
    alignment: "left",
    lineSpacing: 2,
    marginBefore: 0,
    marginAfter: 0,
    indent: 0
  },
  {
    id: "heading-1",
    label: "Heading 1",
    typography: { fontFamily: "Liberation Serif", fontSize: 12 },
    alignment: "center",
    lineSpacing: 2,
    marginBefore: 12,
    marginAfter: 0,
    indent: 0
  },
  {
    id: "heading-2",
    label: "Heading 2",
    typography: { fontFamily: "Liberation Serif", fontSize: 12 },
    alignment: "left",
    lineSpacing: 2,
    marginBefore: 12,
    marginAfter: 0,
    indent: 0
  },
  {
    id: "heading-3",
    label: "Heading 3",
    typography: { fontFamily: "Liberation Serif", fontSize: 12 },
    alignment: "left",
    lineSpacing: 2,
    marginBefore: 12,
    marginAfter: 0,
    indent: 18
  },
  {
    id: "blockquote",
    label: "Block Quote",
    typography: { fontFamily: "Liberation Serif", fontSize: 12 },
    alignment: "left",
    lineSpacing: 2,
    marginBefore: 0,
    marginAfter: 0,
    indent: 36
  }
];

export const ACADEMIC_STYLE_SETS: AcademicStyleSet[] = [
  {
    id: "apa-v7",
    label: "APA v7",
    description: "American Psychological Association (7th edition)",
    styles: apaV7Styles
  },
  {
    id: "mla",
    label: "MLA",
    description: "Modern Language Association",
    styles: mlaStyles
  }
];

export function getStyleSet(id: AcademicStyleSetId): AcademicStyleSet | undefined {
  return ACADEMIC_STYLE_SETS.find((set) => set.id === id);
}

export function getBlockStyle(
  styleSetId: AcademicStyleSetId,
  blockStyleId: AcademicBlockStyleId
): AcademicBlockStyle | undefined {
  const styleSet = getStyleSet(styleSetId);
  return styleSet?.styles.find((style) => style.id === blockStyleId);
}

export function getDefaultStyleSet(): AcademicStyleSet {
  return ACADEMIC_STYLE_SETS[0];
}
