// Font library management: catalog, upload, and removal

import { createMemo, createSignal, createEffect } from "solid-js";
import type { FontCatalogEntry } from "@monoscape/document-core";
import {
  SHARED_FONT_CATALOG,
  DEFAULT_TYPOGRAPHY,
  buildGoogleFontStylesheetUrl,
  fontFamilyReferencesFamily,
  findFontFallback,
  sortFontCatalog
} from "@monoscape/document-core";

const loadedGoogleFonts = new Set<string>();
const uploadedFontFaces = new Map<string, FontFace>();

function ensureGoogleFontLoaded(family: string) {
  if (loadedGoogleFonts.has(family)) {
    return;
  }

  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = buildGoogleFontStylesheetUrl(family);
  link.dataset.monoscapeFont = family;
  document.head.append(link);
  loadedGoogleFonts.add(family);
}

export interface UseFontLibraryResult {
  fonts: () => FontCatalogEntry[];
  userFonts: () => FontCatalogEntry[];
  defaultFont: () => FontCatalogEntry;
  findFont: (family: string) => FontCatalogEntry;
  addCatalogFont: (font: FontCatalogEntry) => void;
  addUploadedFonts: (fileList: FileList | null) => Promise<void>;
  removeFont: (fontId: string) => void;
  rewriteFontReferences: (removedFamily: string, fallbackFont: FontCatalogEntry) => void;
}

export function useFontLibrary(editorRef: () => HTMLDivElement | undefined): UseFontLibraryResult {
  const [userFonts, setUserFonts] = createSignal<FontCatalogEntry[]>([]);
  let uploadCounter = 0;

  const fonts = createMemo(() => sortFontCatalog([...SHARED_FONT_CATALOG, ...userFonts()]));
  
  const defaultFont = createMemo(
    () =>
      fonts().find((font) => font.family === DEFAULT_TYPOGRAPHY.fontFamily) ??
      SHARED_FONT_CATALOG[0]
  );

  const findFont = (family: string) => {
    return fonts().find((font) => font.family === family) ?? defaultFont();
  };

  createEffect(() => {
    fonts().forEach((font) => {
      if (font.source === "google") {
        ensureGoogleFontLoaded(font.family);
      }
    });
  });

  const rewriteFontReferences = (removedFamily: string, fallbackFont: FontCatalogEntry) => {
    const editor = editorRef();
    if (!editor) {
      return;
    }

    [editor, ...editor.querySelectorAll<HTMLElement>("[style]")]
      .filter((element, index, elements) => elements.indexOf(element) === index)
      .forEach((element) => {
        if (
          element.style.fontFamily &&
          fontFamilyReferencesFamily(element.style.fontFamily, removedFamily)
        ) {
          element.style.fontFamily = fallbackFont.family;
        }
      });
  };

  const addCatalogFont = (font: FontCatalogEntry) => {
    const existing = fonts().find((entry) => entry.family === font.family);

    if (!existing) {
      setUserFonts((current) =>
        sortFontCatalog([
          ...current,
          {
            ...font,
            removable: true
          }
        ])
      );
    }
  };

  const addUploadedFonts = async (fileList: FileList | null) => {
    const files = fileList ? Array.from(fileList) : [];
    if (!files.length) {
      return;
    }

    const existingFamilies = new Set(fonts().map((font) => font.family));
    const uploaded: FontCatalogEntry[] = [];

    for (const file of files) {
      const baseFamily = file.name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ").trim() || "Uploaded Font";
      let family = baseFamily;
      let duplicateIndex = 2;

      while (existingFamilies.has(family)) {
        family = `${baseFamily} ${duplicateIndex}`;
        duplicateIndex += 1;
      }

      existingFamilies.add(family);

      try {
        const fontFace = await new FontFace(family, await file.arrayBuffer()).load();
        document.fonts.add(fontFace);

        uploadCounter += 1;
        const entry: FontCatalogEntry = {
          id: `uploaded-${Date.now()}-${uploadCounter}`,
          family,
          category: "custom",
          source: "uploaded",
          removable: true
        };

        uploadedFontFaces.set(entry.id, fontFace);
        uploaded.push(entry);
      } catch (error) {
        console.warn(`Unable to load uploaded font: ${file.name}`, error);
      }
    }

    if (!uploaded.length) {
      return;
    }

    setUserFonts((current) => sortFontCatalog([...current, ...uploaded]));
  };

  const removeFont = (fontId: string) => {
    const font = userFonts().find((entry) => entry.id === fontId);
    if (!font) {
      return;
    }

    const nextUserFonts = userFonts().filter((entry) => entry.id !== fontId);
    const nextFonts = sortFontCatalog([...SHARED_FONT_CATALOG, ...nextUserFonts]);
    const fallbackFont = findFontFallback(font, nextFonts);
    
    if (fallbackFont) {
      rewriteFontReferences(font.family, fallbackFont);
    }
    
    const uploadedFace = uploadedFontFaces.get(fontId);
    if (uploadedFace) {
      document.fonts.delete(uploadedFace);
      uploadedFontFaces.delete(fontId);
    }

    setUserFonts(nextUserFonts);
  };

  return {
    fonts,
    userFonts,
    defaultFont,
    findFont,
    addCatalogFont,
    addUploadedFonts,
    removeFont,
    rewriteFontReferences
  };
}
