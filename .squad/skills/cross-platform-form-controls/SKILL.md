# Skill: Cross-Platform Form Controls (Dropdowns, Inputs, File Operations)

**Date Created:** 2026-04-21  
**Authored By:** Switch  
**Applies To:** Shared UI components (toolbar dropdowns, pickers, file inputs) with platform-specific fallbacks  
**Reusability:** Any feature with dropdowns/selects that needs Desktop (full), Web (limited), Mobile (read-only) variants

---

## Pattern

Design form controls (dropdowns, file inputs, search fields) with **platform-conditional rendering** to avoid silent failures on platforms that don't support a feature:

1. **Shared Component Layer** — Core dropdown/picker lives in `packages/ui`; accepts `platform` prop or reads from context
2. **Platform Guards** — Conditionally render full UI (Desktop), limited UI (Web), hidden/read-only UI (Mobile)
3. **Fallback Behavior** — Define what happens when feature is unavailable (read-only, label only, empty section)
4. **Accessibility Invariant** — All variants maintain keyboard nav + ARIA labels (no silent stripping of a11y)
5. **Validation Isolation** — Input validation same across platforms; rejection feedback consistent
6. **Capability Injection** — Keep the shared control portable by passing optional runtime capabilities (desktop search, native file affordances) into the shared component instead of importing platform APIs there

---

## Why This Works

- **Prevents silent feature loss:** Users know when a feature isn't available (labeled "Not available in web app", not hidden)
- **Reduces platform-specific bugs:** Shared component logic; only rendering differs per platform
- **Eases testing:** Test full feature once (shared component), then test 3 fallback variants (platform-specific tests)
- **Accessibility preserved:** Even read-only variants maintain focus, labels, keyboard escape routes

---

## When to Use

✅ **Use this for:**
- File upload/download (desktop only; web/mobile show "Use desktop app" message)
- Complex search pickers (e.g., Google Fonts) with network calls behind platform-specific backends
- Premium/platform-gated features (e.g., desktop Tauri integration, mobile-specific APIs)
- Form inputs with platform-specific validation (e.g., desktop file paths, mobile safe-area insets)

❌ **Don't use for:**
- Simple text inputs shared across platforms (no platform gate needed)
- Features equally supported everywhere (render full component for all)

---

## Structure

### 1. Component API Design (Shared Component Props)

```typescript
interface DropdownProps {
  value: string;
  onChange: (value: string) => void;
  
  // Platform-aware props
  platform?: 'web' | 'desktop' | 'mobile';
  mode?: 'full' | 'limited' | 'read-only'; // explicit override
  
  // Fallback content
  fallbackLabel?: string; // e.g., "System fonts only"
  fallbackMessage?: string; // e.g., "Upload fonts in desktop app"
}
```

**Why:** Explicit `platform` and `mode` props make feature gates visible in JSX; easier to audit, test, and document.

### 2. Rendering Tree (Pseudocode)

```typescript
export function FontDropdown(props: DropdownProps) {
  const isPlatformSupported = (feature: string, platform: string) => {
    // Define feature matrix
    const matrix = {
      'file-upload': ['desktop'],
      'google-fonts-search': ['desktop'],
      'custom-size-input': ['desktop', 'web'],
      'font-selection': ['desktop', 'web', 'mobile'],
    };
    return matrix[feature]?.includes(platform) ?? true;
  };

  // Platform detection (from context, prop, or navigator)
  const platform = props.platform || detectPlatform();

  if (platform === 'desktop') {
    return <DesktopFontDropdown {...props} />; // Full: dropdown + upload + search
  } else if (platform === 'web') {
    return <WebFontDropdown {...props} />; // Limited: dropdown only, no upload/search
  } else if (platform === 'mobile') {
    return <MobileFontDropdown {...props} />; // Read-only: label only or disabled select
  }
}
```

### 3. Fallback Label Strategy

Always include a user-facing label when feature is unavailable:

```typescript
// BAD: Silent feature removal
if (platform !== 'desktop') {
  return null; // User confused: where's upload?
}

// GOOD: Explicit fallback
if (platform !== 'desktop') {
  return (
    <div style="opacity: 0.6; cursor: not-allowed;">
      <label>{props.fallbackLabel}</label>
      <button disabled aria-label="Upload not available on web">
        Upload font (desktop only)
      </button>
    </div>
  );
}
```

### 3b. Optional Capability Pattern

When only one shell can supply a richer data source, inject it:

```typescript
interface TypographyCapabilities {
  searchGoogleFonts?: (query: string) => Promise<FontCatalogEntry[]>;
}

export function TextEditor(props: { fontCapabilities?: TypographyCapabilities }) {
  return <FormattingToolbar fontCapabilities={props.fontCapabilities} />;
}
```

**Why:** the toolbar stays shared, while desktop can provide Tauri-backed or server-backed search. Web/mobile simply omit the capability and the UI falls back to the shared local catalog.

### 4. Input Validation (Platform-Agnostic)

Keep validation logic shared; only UI rendering differs:

```typescript
function validateFontFile(file: File): { valid: boolean; error?: string } {
  const validTypes = ['application/x-font-ttf', 'application/font-woff', 'font/woff2'];
  const validExtensions = ['.ttf', '.otf', '.woff', '.woff2'];
  
  // Same check on all platforms
  if (!validTypes.includes(file.type) && !validExtensions.some(ext => file.name.endsWith(ext))) {
    return { valid: false, error: 'Unsupported file format. Use .ttf, .otf, .woff, or .woff2' };
  }
  
  if (file.size > 10 * 1024 * 1024) { // 10 MB
    return { valid: false, error: 'File too large. Max 10 MB.' };
  }
  
  return { valid: true };
}

// Same function used in all platform variants
```

### 5. Accessibility Across Variants

**Never strip accessibility for "limited" or "read-only" variants:**

```typescript
// All variants have aria-label + role
<select
  aria-label="Font selection" // Present in all variants
  disabled={platform === 'mobile'} // Disabled, but still accessible
  tabIndex={platform === 'mobile' ? -1 : 0} // Or left at 0 for focus visibility
>
  {/* options */}
</select>
```

---

## Test Matrix Template

For each form control, define a test matrix covering all platform combinations:

| Test | Web | Desktop | Mobile | Notes |
|------|-----|---------|--------|-------|
| **Component renders** | ✅ | ✅ | ✅ | All platforms show something |
| **Keyboard nav (Tab, Arrow)** | ✅ | ✅ | ✅ (if enabled) | Read-only variant may skip Tab |
| **File upload button** | ❌ (hidden) | ✅ (functional) | ❌ (hidden) | Desktop only shows button |
| **Upload button label** | ✅ "(Desktop only)" | ✅ "Upload" | ✅ "(Not available)" | All show feedback |
| **Search input** | ❌ (hidden) | ✅ (functional) | ❌ (hidden) | Desktop only |
| **Dropdown selectable** | ✅ | ✅ | ❌ (read-only or disabled) | Mobile can't select (or hidden) |
| **Aria labels present** | ✅ | ✅ | ✅ | All variants labeled |
| **Mobile safe-area inset** | ✅ | N/A | ✅ | Mobile respects notch/kbd |
| **WCAG AA contrast** | ✅ | ✅ | ✅ | All meet 4.5:1 (text) or 3:1 (UI) |

---

## Rejection Criteria (What Blocks Gate Approval)

🚩 **Reject if:**

1. Feature silently removed on some platforms (no label, no disabled state, no message)
2. Keyboard escape route broken in read-only variant (Tab trap, Escape doesn't work)
3. Aria labels stripped or conditional (should be present in all variants)
4. Validation differs per platform ("file-size-limit-10mb on desktop, no limit on web")
5. Fallback message not user-facing ("Internal: not available" instead of "Use desktop app")
6. Mobile shows desktop-only UI (file picker, network search) without gate
7. Web shows platform-specific features (Tauri APIs, native file dialog)
8. No contrast check on disabled/read-only state (might be unreadable)
9. Mobile safe-area inset ignored (dropdown hidden under notch)

---

## Implementation Checklist

- [ ] Component accepts `platform` prop (or reads from context/config)
- [ ] Three rendering branches: Desktop (full) → Web (limited) → Mobile (read-only)
- [ ] Fallback labels included (not silent removal)
- [ ] Validation logic is platform-agnostic (same function for all)
- [ ] Aria labels present in all variants (including read-only)
- [ ] Keyboard navigation tested on all platforms (Tab, Arrow, Escape)
- [ ] Mobile safe-area inset applied (if layout affects bottom/sides)
- [ ] WCAG AA contrast verified in disabled/read-only state
- [ ] Error handling shows user-facing message (not console error)
- [ ] TypeScript: no `any` types; platform prop is typed union ('web' | 'desktop' | 'mobile')

---

## Code Example: Font Size Dropdown

```typescript
interface FontSizeDropdownProps {
  value: number;
  onChange: (size: number) => void;
  platform?: 'web' | 'desktop' | 'mobile';
}

export function FontSizeDropdown(props: FontSizeDropdownProps) {
  const platform = props.platform || 'web';
  const preset = [8, 10, 12, 14, 16, 18, 20, 24, 28, 32];
  
  // Desktop: full dropdown + custom input
  if (platform === 'desktop') {
    return (
      <div role="group" aria-label="Font size">
        <select
          value={props.value}
          onChange={(e) => props.onChange(parseInt(e.currentTarget.value))}
          aria-label="Font size preset"
        >
          {preset.map(size => (
            <option key={size} value={size}>{size}pt</option>
          ))}
        </select>
        <input
          type="number"
          min="4"
          max="72"
          value={props.value}
          onChange={(e) => {
            const v = parseInt(e.currentTarget.value);
            if (v >= 4 && v <= 72) props.onChange(v);
            else e.currentTarget.style.borderColor = 'red'; // Visual error
          }}
          placeholder="Custom (4–72)"
          aria-label="Custom font size"
        />
      </div>
    );
  }
  
  // Web: dropdown only (no custom input)
  if (platform === 'web') {
    return (
      <select
        value={props.value}
        onChange={(e) => props.onChange(parseInt(e.currentTarget.value))}
        aria-label="Font size (system only)"
      >
        {preset.filter(s => s >= 8 && s <= 28).map(size => (
          <option key={size} value={size}>{size}pt</option>
        ))}
      </select>
    );
  }
  
  // Mobile: read-only display
  return (
    <div
      role="region"
      aria-label="Current font size"
      style="opacity: 0.6; user-select: none;"
    >
      <span>{props.value}pt (cannot change on mobile)</span>
    </div>
  );
}
```

---

## Related Skills

- `.squad/skills/platform-regression-testing/SKILL.md` — Test matrix for platform-specific features
- `.squad/skills/accessibility-wcag-gate/SKILL.md` — A11y verification for all UI variants
- `.squad/skills/tauri-integration/SKILL.md` — Backend API calls for desktop features (no client-side leaks)

---

## Historical Context

First applied to: **Font Controls Feature** (2026-04-21)  
Outcome: **IMPLEMENTED** — shared typography controls now use a common catalog, optional desktop capability injection for validated Google Fonts lookup, and removable user-added fonts without leaking runtime APIs into `packages/ui`

---

## How to Apply

1. **At feature kickoff:** Decide which platforms support which features (matrix)
2. **During component design:** Add `platform` prop; define three rendering branches
3. **During implementation:** Use validation function shared across all variants; fallback labels explicit
4. **During testing:** Run test matrix for each platform; verify Tab/Arrow/Escape in all variants
5. **At review:** Check for silent feature removal; ensure a11y present; verify fallback labels user-facing
