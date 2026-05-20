// Typography settings, defaults, and size/line-spacing options

export interface TypographySettings {
  fontFamily: string;
  fontSize: number; // in points
}

export type TypographyPatch = Partial<TypographySettings>;

export const DEFAULT_TYPOGRAPHY: TypographySettings = {
  fontFamily: 'Liberation Serif',
  fontSize: 12,
};

export const FONT_SIZE_OPTIONS = [10, 11, 12, 14, 16, 18, 20, 24, 28, 32, 36, 48, 60, 72];
export const DEFAULT_LINE_SPACING = 1;
export const LINE_SPACING_OPTIONS = [0.5, 1, 1.5, 2, 3];
