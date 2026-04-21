import { describe, it, expect } from 'vitest';
import {
  emptyFormattingState,
  DEFAULT_TYPOGRAPHY,
  createWorkspaceSeed,
  type FormattingMark,
} from './index.js';

describe('emptyFormattingState', () => {
  it('returns all-false formatting state', () => {
    const state = emptyFormattingState();
    expect(state.bold).toBe(false);
    expect(state.italic).toBe(false);
    expect(state.underline).toBe(false);
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

describe('FormattingMark type', () => {
  it('covers bold, italic, underline values', () => {
    const marks: FormattingMark[] = ['bold', 'italic', 'underline'];
    expect(marks).toHaveLength(3);
    expect(marks).toContain('bold');
    expect(marks).toContain('italic');
    expect(marks).toContain('underline');
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
