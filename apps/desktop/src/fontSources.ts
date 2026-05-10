import { invoke } from "@tauri-apps/api/tauri";
import {
  REQUESTED_FONT_FAMILIES,
  SHARED_FONT_CATALOG,
  type FontCatalogEntry,
  type FontCategory,
  type FontSource
} from "@monoscape/document-core";

export interface GoogleFontSummary {
  family: string;
  category: FontCategory;
  variants: string[];
  subsets: string[];
}

export interface GoogleFontResolution {
  family: string;
  category: FontCategory;
}

export interface GoogleFontResolutionResult {
  resolved: GoogleFontResolution[];
  missing: string[];
}

export interface DownloadedFont {
  family: string;
  category: FontCategory;
  variant: string;
  relativePath: string;
}

export interface UploadedFont {
  family: string;
  relativePath: string;
}

const hasTauri = typeof window !== "undefined" && "__TAURI_IPC__" in window;
const DESKTOP_FONT_COMMANDS = {
  searchGoogleFonts: "google_fonts_search",
  resolveRequestedGoogleFonts: "google_fonts_resolve_families",
  downloadGoogleFont: "google_fonts_download",
  uploadFontFile: "import_font_file"
} as const;

function toFontId(family: string) {
  return family
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function isDesktopFontApiAvailable() {
  return hasTauri;
}

export async function searchGoogleFonts(query: string, limit?: number): Promise<FontCatalogEntry[]> {
  if (!hasTauri) {
    return [];
  }

  const results = await invoke<GoogleFontSummary[]>(DESKTOP_FONT_COMMANDS.searchGoogleFonts, {
    query,
    limit
  });
  return results.map((font) => ({
    id: `google-${toFontId(font.family)}`,
    family: font.family,
    category: font.category,
    source: "google"
  }));
}

export async function resolveRequestedGoogleFonts() {
  if (!hasTauri) {
    return { resolved: [], missing: REQUESTED_FONT_FAMILIES } satisfies GoogleFontResolutionResult;
  }

  return invoke<GoogleFontResolutionResult>(DESKTOP_FONT_COMMANDS.resolveRequestedGoogleFonts, {
    families: REQUESTED_FONT_FAMILIES
  });
}

export async function downloadGoogleFont(family: string, variant?: string) {
  if (!hasTauri) {
    return null;
  }

  return invoke<DownloadedFont>(DESKTOP_FONT_COMMANDS.downloadGoogleFont, { family, variant });
}

export async function uploadFontFile(sourcePath: string) {
  if (!hasTauri) {
    return null;
  }

  return invoke<UploadedFont>(DESKTOP_FONT_COMMANDS.uploadFontFile, { sourcePath });
}

export const desktopFontCapabilities = {
  searchGoogleFonts,
  uploadFonts: true
} as const;

export async function buildDesktopFontCatalog(): Promise<FontCatalogEntry[]> {
  if (!hasTauri) {
    return SHARED_FONT_CATALOG;
  }

  try {
    const resolution = await resolveRequestedGoogleFonts();
    const resolvedFamilies = new Map(
      resolution.resolved.map((font) => [font.family.toLowerCase(), font])
    );

    return SHARED_FONT_CATALOG.filter(
      (font) => font.source !== "google" || resolvedFamilies.has(font.family.toLowerCase())
    ).map((font) => {
      const resolved = resolvedFamilies.get(font.family.toLowerCase());
      if (!resolved) {
        return font;
      }
      return {
        ...font,
        family: resolved.family,
        category: resolved.category,
        source: (font.source === "google" ? "google" : font.source) as FontSource
      };
    });
  } catch {
    return SHARED_FONT_CATALOG;
  }
}
