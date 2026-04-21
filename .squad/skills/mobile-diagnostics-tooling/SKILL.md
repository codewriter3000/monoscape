---
name: "mobile-diagnostics-tooling"
description: "Provide mobile logging controls and emulator tuning without expanding the shared kernel."
domain: "diagnostics"
confidence: "medium"
source: "earned"
tools:
  - name: "apply_patch"
    description: "Add lightweight logging utilities and emulator launcher scripts."
    when: "When mobile runtime diagnostics need to stay in app-shell tooling."
---

## Context
Use this when the mobile runtime is unstable and you need fast diagnostics without changing shared kernel behavior. The goal is to keep observability and emulator tuning inside the mobile shell boundary.

## Patterns
- Add a mobile logger that exposes runtime log-level control via a window-scoped API and persists the level in localStorage.
- Stream logs to the console and capture unhandled errors/rejections for crash clues.
- Provide a Node-based emulator launcher that accepts memory, core count, and GPU flags with passthrough args.
- Document the tuning workflow in the root README and root npm scripts.

## Examples
- `apps/mobile/src/logging.ts` for log streaming and runtime level control.
- `apps/mobile/scripts/launch-emulator.mjs` for Pixel_9a tuning flags.
- `package.json` scripts: `android:emulator` + `android:emulator:high`.

## Anti-Patterns
- Adding logging dependencies to shared packages when the issue is mobile-only.
- Baking emulator flags into Gradle or kernel code paths.
- Hiding log level changes behind rebuild-only environment flags.
