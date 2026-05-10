// Font catalog, categories, and font family resolution

export type FontCategory = "serif" | "sans" | "mono" | "display" | "handwriting" | "custom";
export type FontSource = "system" | "google" | "uploaded";

export interface FontCatalogEntry {
  id: string;
  family: string;
  category: FontCategory;
  source: FontSource;
  removable?: boolean;
}

const systemFontCatalogSeed: FontCatalogEntry[] = [
  { id: "liberation-serif", family: "Liberation Serif", category: "serif", source: "system" }
];

export const REQUESTED_FONT_CATALOG: FontCatalogEntry[] = [
  { id: "bungee", family: "Bungee", category: "display", source: "google" },
  { id: "caveat", family: "Caveat", category: "handwriting", source: "google" },
  { id: "fira-mono", family: "Fira Mono", category: "mono", source: "google" },
  { id: "ibm-plex-sans", family: "IBM Plex Sans", category: "sans", source: "google" },
  { id: "inter", family: "Inter", category: "sans", source: "google" },
  { id: "merriweather", family: "Merriweather", category: "serif", source: "google" },
  { id: "source-serif-4", family: "Source Serif 4", category: "serif", source: "google" },
  { id: "space-grotesk", family: "Space Grotesk", category: "sans", source: "google" }
];

export const REQUESTED_FONT_FAMILIES = REQUESTED_FONT_CATALOG.map((font) => font.family);

export const FONT_CATEGORY_LABELS: Record<FontCategory, string> = {
  custom: "Custom",
  display: "Display",
  handwriting: "Handwriting",
  mono: "Mono",
  sans: "Sans",
  serif: "Serif"
};

export function sortFontCatalog(fonts: FontCatalogEntry[]): FontCatalogEntry[] {
  return [...fonts].sort((left, right) => left.family.localeCompare(right.family));
}

export const SHARED_FONT_CATALOG = sortFontCatalog([
  ...systemFontCatalogSeed,
  ...REQUESTED_FONT_CATALOG
]);

export function buildGoogleFontStylesheetUrl(family: string) {
  return `https://fonts.googleapis.com/css2?family=${family.trim().split(/\s+/).join("+")}&display=swap`;
}

export function normalizeFontFamilyValue(value: string) {
  return value.trim().replace(/^['"]|['"]$/g, "");
}

export function resolveKnownFontFamily(fontFamilyValue: string, knownFamilies: string[]) {
  const normalizedFamilies = fontFamilyValue
    .split(",")
    .map(normalizeFontFamilyValue)
    .filter(Boolean);

  const knownFamilyLookup = new Map(
    knownFamilies.map((family) => [family.toLowerCase(), family] as const)
  );

  for (const family of normalizedFamilies) {
    const matched = knownFamilyLookup.get(family.toLowerCase());
    if (matched) {
      return matched;
    }
  }

  return normalizedFamilies[0] ?? "Liberation Serif";
}

export function fontFamilyReferencesFamily(fontFamilyValue: string, family: string) {
  const normalizedTarget = normalizeFontFamilyValue(family).toLowerCase();

  return fontFamilyValue
    .split(",")
    .map(normalizeFontFamilyValue)
    .some((candidate) => candidate.toLowerCase() === normalizedTarget);
}

export function getFontFamilyStack(font: Pick<FontCatalogEntry, "family" | "category">) {
  const fallbackByCategory: Record<FontCategory, string> = {
    custom: "sans-serif",
    display: "fantasy",
    handwriting: "cursive",
    mono: '"Cascadia Mono", "SFMono-Regular", monospace',
    sans: '"Segoe UI", system-ui, sans-serif',
    serif: 'Georgia, "Times New Roman", serif'
  };

  return `"${font.family}", ${fallbackByCategory[font.category]}`;
}

export function isFontCategory(value: string): value is FontCategory {
  return value in FONT_CATEGORY_LABELS;
}

export function findFontFallback(
  removedFont: FontCatalogEntry,
  fonts: FontCatalogEntry[],
  preferredFamily = "Liberation Serif"
) {
  return (
    sortFontCatalog(
      fonts.filter(
        (font) => font.family !== removedFont.family && font.category === removedFont.category
      )
    )[0] ??
    fonts.find((font) => font.family === preferredFamily) ??
    sortFontCatalog(fonts)[0]
  );
}
