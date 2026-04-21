---
skill_name: Platform-Conditional UI Rendering
domain: Cross-Platform UX
wcag_target: 2.2 AA
last_updated: 2026-04-21
maturity: Emerging (1st application in FormattingToolbar font upload)
---

# Platform-Conditional UI Rendering

A reusable pattern for hiding platform-specific UI controls in shared components based on capability flags, preventing confusion and reducing cognitive load for students working on web/mobile platforms where certain features aren''t supported.

## Problem

Shared UI packages (e.g., `packages/ui`) must work across desktop (Tauri), mobile (Capacitor), and web platforms. Some features require platform-specific APIs (file system access, native dialogs, hardware sensors) that aren''t available everywhere.

**Anti-pattern:** Showing non-functional UI on all platforms. Example: "Upload font files" button visible on web, but clicking it does nothing because web browsers don''t support local file system access in the same way desktop apps do.

**Consequences:**
- Students click buttons expecting them to work, then experience confusion when nothing happens
- Cognitive load increases (students must remember which buttons work on which platforms)
- Accessibility issue: screen readers announce controls that cannot be used
- Trust erosion: students question whether other UI is functional

## Solution: Capability Flags

Use optional boolean flags in capability objects to explicitly declare platform support. Shared components render UI conditionally based on these flags.

## Author

**Oracle** (Accessibility & UX)  
**Monoscape Squad**  
**Initial Application:** FormattingToolbar font upload (packages/ui/src/FormattingToolbar.tsx)  
**Date:** 2026-04-21
