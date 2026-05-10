import { describe, it, expect } from 'vitest';
import {
  emptyFormattingState,
  DEFAULT_TYPOGRAPHY,
  DEFAULT_LINE_SPACING,
  SHARED_FONT_CATALOG,
  FONT_SIZE_OPTIONS,
  FORMATTING_TOOLBAR_KEYTIPS,
  LINE_SPACING_OPTIONS,
  MIXED_FORMATTING_LABEL,
  buildGoogleFontStylesheetUrl,
  fontFamilyReferencesFamily,
  findFontFallback,
  normalizeFontFamilyValue,
  REQUESTED_FONT_FAMILIES,
  resolveUniformValue,
  resolveKnownFontFamily,
  createWorkspaceSeed,
  ACADEMIC_STYLE_SETS,
  type FormattingMark,
} from './index.js';

describe('emptyFormattingState', () => {
  it('returns all-false formatting state', () => {
    const state = emptyFormattingState();
    expect(state.bold).toBe(false);
    expect(state.italic).toBe(false);
    expect(state.underline).toBe(false);
    expect(state.strikethrough).toBe(false);
    expect(state.superscript).toBe(false);
    expect(state.subscript).toBe(false);
  });

  it('returns a new object on each call', () => {
    const a = emptyFormattingState();
    const b = emptyFormattingState();
    expect(a).not.toBe(b);
  });
});

describe('DEFAULT_TYPOGRAPHY', () => {
  it('has fontFamily Liberation Serif', () => {
    expect(DEFAULT_TYPOGRAPHY.fontFamily).toBe('Liberation Serif');
  });

  it('has fontSize 12', () => {
    expect(DEFAULT_TYPOGRAPHY.fontSize).toBe(12);
  });
});

describe('shared typography catalog', () => {
  it('exposes the shared mixed-selection label used by the toolbar', () => {
    expect(MIXED_FORMATTING_LABEL).toBe('Mixed');
  });

  it('includes Liberation Serif and keeps fonts alphabetized', () => {
    expect(SHARED_FONT_CATALOG.map((font) => font.family)).toContain('Liberation Serif');
    expect(SHARED_FONT_CATALOG.map((font) => font.family)).toEqual(
      [...SHARED_FONT_CATALOG.map((font) => font.family)].sort((left, right) =>
        left.localeCompare(right)
      )
    );
  });

  it('includes every requested family in the shared catalog', () => {
    const families = SHARED_FONT_CATALOG.map((font) => font.family);
    REQUESTED_FONT_FAMILIES.forEach((family) => {
      expect(families).toContain(family);
    });
  });

  it('offers the shared size ladder used by the toolbar', () => {
    expect(FONT_SIZE_OPTIONS).toContain(12);
    expect(FONT_SIZE_OPTIONS[0]).toBe(10);
    expect(FONT_SIZE_OPTIONS[FONT_SIZE_OPTIONS.length - 1]).toBe(72);
  });

  it('offers shared line spacing presets and default spacing', () => {
    expect(DEFAULT_LINE_SPACING).toBe(1.5);
    expect(LINE_SPACING_OPTIONS).toEqual([0.5, 1, 1.5, 2, 3]);
  });

  it('defines a unique Alt keytip for each top-level toolbar control', () => {
    const keytips = Object.values(FORMATTING_TOOLBAR_KEYTIPS);
    expect(new Set(keytips).size).toBe(keytips.length);
    expect(FORMATTING_TOOLBAR_KEYTIPS.fontFamily).toBe('F');
    expect(FORMATTING_TOOLBAR_KEYTIPS.color).toBe('K');
    expect(FORMATTING_TOOLBAR_KEYTIPS.styles).toBe('Y');
    expect(FORMATTING_TOOLBAR_KEYTIPS.bold).toBe('B');
    expect(FORMATTING_TOOLBAR_KEYTIPS.indent).toBe('N');
  });

  it('builds a Google Fonts stylesheet URL from the canonical family name', () => {
    expect(buildGoogleFontStylesheetUrl('Source Serif 4')).toContain('family=Source+Serif+4');
  });

  it('normalizes computed font-family values back to known catalog names', () => {
    expect(resolveKnownFontFamily('"Inter", "Segoe UI", system-ui, sans-serif', ['Inter'])).toBe(
      'Inter'
    );
    expect(normalizeFontFamilyValue('"Liberation Serif"')).toBe('Liberation Serif');
    expect(fontFamilyReferencesFamily('"Inter", "Segoe UI", system-ui, sans-serif', 'Inter')).toBe(
      true
    );
    expect(fontFamilyReferencesFamily('"Segoe UI", system-ui, sans-serif', 'Inter')).toBe(false);
  });

  it('falls back to the first available font of the same category before the default font', () => {
    const uploadedSans = {
      id: 'uploaded-alpha',
      family: 'Alpha Sans',
      category: 'custom' as const,
      source: 'uploaded' as const
    };
    const uploadedSansTwo = {
      id: 'uploaded-beta',
      family: 'Beta Sans',
      category: 'custom' as const,
      source: 'uploaded' as const
    };
    const fallback = findFontFallback(uploadedSans, [
      ...SHARED_FONT_CATALOG,
      uploadedSans,
      uploadedSansTwo
    ]);

    expect(fallback?.family).toBe('Beta Sans');
  });

  it('uses Liberation Serif across the built-in academic style presets', () => {
    expect(
      ACADEMIC_STYLE_SETS.flatMap((styleSet) => styleSet.styles.map((style) => style.typography.fontFamily))
    ).toEqual(Array(10).fill('Liberation Serif'));
  });
});

describe('resolveUniformValue', () => {
  it('returns the shared value when every sample matches', () => {
    expect(resolveUniformValue(['Inter', 'Inter', 'Inter'])).toBe('Inter');
    expect(resolveUniformValue([12, 12, 12])).toBe(12);
  });

  it('returns null when samples are mixed or missing', () => {
    expect(resolveUniformValue(['Inter', 'Merriweather'])).toBeNull();
    expect(resolveUniformValue<number>([])).toBeNull();
  });

  it('accepts a custom equality function', () => {
    const comparison = resolveUniformValue(
      ['Inter', 'inter', 'INTER'],
      (left, right) => left.toLowerCase() === right.toLowerCase()
    );

    expect(comparison).toBe('Inter');
  });
});

describe('FormattingMark type', () => {
  it('covers inline text style values', () => {
    const marks: FormattingMark[] = [
      'bold',
      'italic',
      'underline',
      'strikethrough',
      'superscript',
      'subscript'
    ];
    expect(marks).toHaveLength(6);
    expect(marks).toContain('bold');
    expect(marks).toContain('italic');
    expect(marks).toContain('underline');
    expect(marks).toContain('strikethrough');
    expect(marks).toContain('superscript');
    expect(marks).toContain('subscript');
  });
});

describe('createWorkspaceSeed (regression)', () => {
  it('returns a seed with the given title and mode', () => {
    const seed = createWorkspaceSeed('My Essay', 'essay');
    expect(seed.title).toBe('My Essay');
    expect(seed.mode).toBe('essay');
  });

  it('populates a non-empty checklist for essay mode', () => {
    const seed = createWorkspaceSeed('Test', 'essay');
    expect(seed.checklist.length).toBeGreaterThan(0);
  });

  it('populates a non-empty checklist for notes mode', () => {
    const seed = createWorkspaceSeed('Test', 'notes');
    expect(seed.checklist.length).toBeGreaterThan(0);
  });

  it('populates a non-empty checklist for quick-capture mode', () => {
    const seed = createWorkspaceSeed('Test', 'quick-capture');
    expect(seed.checklist.length).toBeGreaterThan(0);
  });
});
