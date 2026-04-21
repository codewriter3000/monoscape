# Skill: Platform-Specific Regression Testing Gate

**Date Created:** 2026-04-21  
**Authored By:** Switch  
**Applies To:** Desktop (Tauri) + Mobile (Capacitor/Android) feature work  
**Reusability:** Cross-platform development; any feature touching native shells or diagnostics

---

## Pattern

Define a **three-tier testing gate** before implementation to catch platform-specific regressions early:

1. **Acceptance Criteria Layer** — What must be true for the feature to work?
2. **Regression Test Matrix** — What must NOT break across platforms?
3. **Known Risk Register** — What's the likelihood and mitigation?

---

## Why This Works

- **Prevents silent failures:** Platform-specific bugs hide in CI until manual QA finds them late
- **Shifts left:** Define test matrix *before* coding; implementation team knows what to avoid
- **Reduces review friction:** Reviewer can quickly verify gate coverage instead of debating test scope
- **Documents tribal knowledge:** Future maintainers know which combinations are risky

---

## When to Use

✅ **Use this for:**
- Any Tauri window feature (topbar, menu bar, custom chrome)
- Any Capacitor plugin integration (permissions, native APIs, crash handling)
- Cross-platform accessibility work (focus management, safe-area insets)
- Emulator or runtime tuning work

❌ **Don't use for:**
- Feature work entirely in shared packages (ui, kernel) with no platform-specific code
- Pure web app features with no desktop/mobile changes

---

## Structure

### 1. Acceptance Criteria (Organized by Feature)
- Segment criteria by platform or feature area
- Use checklist format; gate pass requires all items checked
- Separate "must have" (blocker) from "nice-to-have" (nice-to-have)
- Flag anti-patterns to reject

**Example:** Desktop topbar must:
- [ ] Render without duplication of Tauri's native titlebar
- [ ] Have functional minimize/maximize/close buttons on Windows
- [ ] Not trap keyboard focus (Tab must escape to editor)

### 2. Regression Test Matrix (Table Format)
- **Test name:** Short, memorable
- **Condition:** What action triggers this test?
- **Expected outcome:** What should happen?
- **Priority:** High (blocker) / Medium (nice-to-have)

| Test | Condition | Expected Outcome | Priority |
|------|-----------|------------------|----------|
| Topbar sticky | Scroll in editor | Topbar stays fixed | High |
| Window control | Click close | Window closes cleanly | High |

### 3. Known Regression Risks (Table Format)
- **Risk:** Specific failure mode
- **Severity:** High / Medium / Low
- **Mitigation:** How to prevent or detect
- **Owner:** Team member responsible for validating mitigation

**Example:**
- **Risk:** Focus trap in custom topbar breaks keyboard nav
- **Severity:** High
- **Mitigation:** Automated test verifying Tab key sequence matches expected focus order
- **Owner:** Trinity (implementation)

---

## Template (Copy This)

```markdown
# Reviewer Gate: [Feature Name]

**Scope:** [What's being added/changed]  
**Platforms:** Desktop / Mobile / Both  

## Acceptance Criteria

**[Subsystem 1]**
- [ ] Criterion 1
- [ ] Criterion 2

**Regression Test Matrix**

| Test | Condition | Expected Outcome | Priority |
|------|-----------|------------------|----------|
| Test 1 | ... | ... | High |

**Known Risks & Mitigations**

| Risk | Severity | Mitigation |
|------|----------|-----------|
| Risk 1 | High | [Action] |

**Gate Sign-Off:** All criteria checked + no blocker risks = PASS
```

---

## Key Heuristics

### "Platform-Specific" Indicators
- Feature touches Tauri APIs (`@tauri-apps/api/window`, etc.)
- Feature touches Capacitor APIs (`@capacitor/core`, etc.)
- Feature uses CSS safe-area-inset (mobile notch/keyboard avoidance)
- Feature affects topbar, menubar, or native chrome
- Feature includes emulator/simulator tuning

### Accessibility Always Matters
- Custom topbars must preserve keyboard navigation
- Focus outlines must be visible (≥2px, 3:1 contrast)
- Safe-area insets must not break layout on mobile
- WCAG 2.2 AA is baseline for this project

### Emulator/Device Stability
- Crashes shouldn't be silent (must log before death)
- Memory tuning shouldn't break developer experience
- Emulator startup time should be predictable (not flaky)
- Recovery time after crash should be < 5 seconds

---

## Checklist for Reviewers

When reviewing work against this gate, verify:

- [ ] Gate document completed before implementation started
- [ ] All acceptance criteria have implementation evidence (code, tests, screenshots)
- [ ] Regression test matrix was run; at least High priority tests passed
- [ ] Known risks were identified; mitigations are in place or explicitly deferred
- [ ] No new regressions introduced (compare against baseline from last working version)
- [ ] TypeScript clean; no console warnings
- [ ] WCAG 2.2 AA verified (if UI changes)
- [ ] Platform-specific tests run on actual hardware or emulator (not mocked)

---

## Red Flags

🚩 **Reject if:**
- Gate was skipped; reviewer forced to invent acceptance criteria
- Regression test matrix is incomplete or "TBD"
- Known risks are not documented (reviewer says "I think this might break...")
- Mobile work tested only in simulator; never on actual device
- Focus management not tested (accessibility not verified)
- Memory/performance impact not measured
- "Works on my machine" without cross-platform validation

---

## Related Skills

- `accessibility-wcag-gate` — Detailed A11y testing for any UI
- `cross-platform-testing` — General multiplatform QA strategy
- `tauri-integration` — Tauri-specific API patterns and pitfalls
- `mobile-emulator-tuning` — Android emulator configuration and stability

---

## Historical Context

First applied to: **Custom Desktop Topbar + Mobile Log Streaming + Emulator Tuning** (2026-04-21)  
Outcome: **GATE DEFINITION COMPLETE** — Ready for implementation handoff

This skill emerged from the need to coordinate three separate platforms (web via web shell, desktop via Tauri, mobile via Capacitor) with a single shared editor. Each platform has unique failure modes (focus traps, window chrome conflicts, emulator stability) that don't surface in the shared package tests. This gate catches those early.

---

## How to Apply

1. **At feature kickoff:** Copy the template; fill in [Feature Name] and [Scope]
2. **During scoping:** List all acceptance criteria and known risks
3. **Before coding:** Share gate document with implementation team for feedback
4. **After implementation:** Run regression test matrix; compare outcomes to expected outcomes
5. **At review:** Check off gate criteria; reject if incomplete or criteria unmet

---

## Examples of Good Gates

- `.squad/decisions/inbox/switch-platform-diagnostics-gate.md` — Desktop topbar + mobile logs (this project, 2026-04-21)
- `.squad/decisions.md` → Decision #9 (Runtime Execution Acceptance Gate) — Three-tier cross-platform acceptance
- `.squad/decisions.md` → Decision #6 (Base Layout Feature) — Simple but complete acceptance criteria for toolbar

Examples of bad gates (avoid):
- ❌ "Make sure it works on all platforms" (too vague; no test matrix)
- ❌ "Add topbar. No criteria." (no acceptance definition)
- ❌ "Test focus management. TBD." (incomplete; no specific tests listed)
