import { sortFontCatalog, FONT_CATEGORY_LABELS } from "@monoscape/document-core";
import type { FontCatalogEntry, FontCategory } from "@monoscape/document-core";

export type FontFilter = "all" | FontCategory;

export const FONT_CATEGORY_OPTIONS: Array<{ value: FontFilter; label: string }> = [
  { value: "all", label: "All types" },
  ...Object.entries(FONT_CATEGORY_LABELS)
    .sort((left, right) => left[1].localeCompare(right[1]))
    .map(([value, label]) => ({ value: value as FontCategory, label }))
];

export function getVisibleFonts(
  fonts: FontCatalogEntry[],
  selectedFontFamily: string | null,
  filter: FontFilter,
  searchQuery: string
): FontCatalogEntry[] {
  const currentFont = fonts.find((font) => font.family === selectedFontFamily);
  const filteredByCategory =
    filter === "all" ? fonts : fonts.filter((font) => font.category === filter);
  const query = searchQuery.trim().toLowerCase();
  const filtered = query
    ? filteredByCategory.filter((font) => font.family.toLowerCase().includes(query))
    : filteredByCategory;

  if (!currentFont || filtered.some((font) => font.family === currentFont.family)) {
    return filtered;
  }

  return sortFontCatalog([currentFont, ...filtered]);
}
