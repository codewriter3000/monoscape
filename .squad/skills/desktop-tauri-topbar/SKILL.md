---
name: "desktop-tauri-topbar"
description: "Add native-feeling Tauri window chrome without polluting the shared editor shell."
domain: "frontend-architecture"
confidence: "high"
source: "earned"
tools:
  - name: "view"
    description: "Read shared shell and desktop shell files before placing custom chrome."
    when: "Before adding app-specific topbars over shared UI"
  - name: "apply_patch"
    description: "Add a local topbar component and wire Tauri config with surgical edits."
    when: "When desktop runtime needs real window chrome"
---

## Context
Use this when Monoscape needs desktop-only chrome in the Tauri shell but the actual editor frame should remain reusable across web and desktop.

## Patterns
- Keep `MonoscapeShell` and editor layout in `packages/ui`.
- Put Tauri-specific topbar UI in `apps/desktop/src/*`.
- Disable native window decorations in `apps/desktop/src-tauri/tauri.conf.json` so the custom topbar becomes real chrome.
- Use a drag region for the title area and keep window-control buttons outside it.
- Wire minimize / maximize / close through `@tauri-apps/api/window`.

## Examples
- `apps/desktop/src/DesktopTopbar.tsx` owns the drag region, extension status chip, and native window controls.
- `apps/desktop/src/App.tsx` stacks the local topbar above the shared `MonoscapeShell`.
- `apps/desktop/src-tauri/tauri.conf.json` turns off decorations and allowlists the window APIs used by the custom chrome.

## Anti-Patterns
- Moving Tauri windowing behavior into `packages/ui`.
- Replacing the shared shell just to get desktop chrome.
- Putting interactive window-control buttons inside the drag region.
