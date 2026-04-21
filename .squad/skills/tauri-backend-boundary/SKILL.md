---
name: "tauri-backend-boundary"
description: "Isolate secrets and filesystem access inside Tauri commands while keeping shared UI runtime-agnostic."
domain: "architecture"
confidence: "medium"
source: "earned"
tools:
  - name: "apply_patch"
    description: "Add Tauri commands and desktop-only wrappers without touching shared UI."
    when: "When introducing secure desktop-only capabilities"
---

## Context
Use this when a desktop-only feature needs secrets, network access, or filesystem writes that must not leak into shared web/mobile code.

## Patterns
- Put API calls and file writes inside Tauri commands in `apps/desktop/src-tauri`.
- Load secrets from environment on the Rust side (e.g., dotenv in dev), never in frontend JS.
- Return minimal metadata and relative paths so the frontend can load assets without full filesystem disclosure.
- Add thin desktop-only wrappers in `apps/desktop/src` that guard on `__TAURI_IPC__`.
- Keep invoke command names in a single desktop adapter module; app surfaces should import the adapter instead of hard-coding invoke strings.
- Export desktop capability bundles (for example `desktopFontCapabilities`) from that adapter so app shells pass one pre-wired object into shared UI rather than rebuilding platform contracts inline.

## Examples
- `apps/desktop/src-tauri/src/main.rs` exposes `google_fonts_search` and `google_fonts_download` using `GOOGLE_WEBFONTSDEVAPI`.
- `apps/desktop/src/fontSources.ts` wraps Tauri invokes and returns empty results on web/mobile.
- `apps/desktop/src/App.tsx` should consume the adapter's exported capability object instead of constructing font search callbacks itself.

## Anti-Patterns
- Calling external APIs with secrets from browser JS.
- Writing downloads to temp directories instead of app data storage.
- Importing Tauri APIs directly in shared packages.

