---
name: "thin-runtime-entrypoints"
description: "Boot the same shared SolidJS surface in multiple client shells without leaking runtime glue into shared UI."
domain: "frontend architecture"
confidence: "high"
source: "earned"
tools:
  - name: "view"
    description: "Read shared UI exports, app entrypoints, and runtime decisions before wiring new shells."
    when: "Before changing any app boot path"
  - name: "apply_patch"
    description: "Add per-app HTML, renderer, and runtime config files while keeping shared editor code untouched."
    when: "When multiple clients need to mount the same editor surface"
---

## Context
Use this when a SolidJS monorepo has shared editor UI in packages and separate shells for web, mobile, and desktop. The goal is to make every client boot cleanly without promoting runtime-specific code into shared packages.

## Patterns
- Give each app its own `index.html`, renderer entry, and runtime config (`vite.config.ts`, `capacitor.config.ts`, `src-tauri`).
- Keep app `App.tsx` files thin and use them only for shell-local tweaks like safe-area padding or desktop sizing.
- Mount shared components from `packages/ui` directly so platform behavior stays aligned.
- Treat the browser build as the canonical frontend artifact, then let native shells wrap that pattern locally.

## Anti-Patterns
- Importing Capacitor or Tauri APIs inside shared editor components.
- Rebuilding the editor layout separately per platform.
- Hiding runtime boot logic inside shared packages.

## Examples
- `apps/mobile/src/main.ts` renders `MobileApp` into `#app` and leaves touch-specific padding local to the mobile shell.
- `apps/desktop/src/main.ts` renders `DesktopApp` while Tauri owns window creation in `src-tauri`.
- `apps/web`, `apps/mobile`, and `apps/desktop` each keep parallel Vite entry files so runtime boundaries stay obvious.
