# Work Routing

How to decide who handles what.

## Routing Table

| Work Type | Route To | Examples |
|-----------|----------|----------|
| Architecture, scope, and cross-cutting trade-offs | Neo | Editor platform boundaries, document model direction, major reviews |
| SolidJS UI, responsive layout, app shell | Trinity | Toolbar flows, editor chrome, mobile and desktop interactions |
| Core platform, microkernel, extension APIs | Morpheus | Plugin lifecycle, service boundaries, persistence and integration seams |
| Accessibility and student experience | Oracle | WCAG 2.2 review, keyboard flows, readability, study workflow design |
| Testing and reviewer gates | Switch | Regression coverage, edge cases, cross-device checks, rejection reviews |
| Code review | Neo | Review PRs, check quality, suggest improvements |
| Testing | Switch | Write tests, find edge cases, verify fixes |
| Scope & priorities | Neo | What to build next, trade-offs, decisions |
| Session logging | Scribe | Automatic — never needs routing |

## Issue Routing

| Label | Action | Who |
|-------|--------|-----|
| `squad` | Triage: analyze issue, assign `squad:{member}` label | Neo |
| `squad:neo` | Pick up issue and complete the work | Neo |
| `squad:trinity` | Pick up issue and complete the work | Trinity |
| `squad:morpheus` | Pick up issue and complete the work | Morpheus |
| `squad:oracle` | Pick up issue and complete the work | Oracle |
| `squad:switch` | Pick up issue and complete the work | Switch |

### How Issue Assignment Works

1. When a GitHub issue gets the `squad` label, the **Lead** triages it — analyzing content, assigning the right `squad:{member}` label, and commenting with triage notes.
2. When a `squad:{member}` label is applied, that member picks up the issue in their next session.
3. Members can reassign by removing their label and adding another member's label.
4. The `squad` label is the inbox — untriaged issues waiting for Lead review.

## Rules

1. **Eager by default** — spawn all agents who could usefully start work, including anticipatory downstream work.
2. **Scribe always runs** after substantial work, always as `mode: "background"`. Never blocks.
3. **Quick facts → coordinator answers directly.** Don't spawn an agent for simple status or repo questions.
4. **When two agents could handle it**, pick the one whose domain is the primary concern.
5. **"Team, ..." → fan-out.** Spawn all relevant agents in parallel as `mode: "background"`.
6. **Anticipate downstream work.** If a feature is being built, spawn Switch to write test cases from requirements at the same time.
7. **Accessibility is a first-class concern.** Route keyboard, contrast, semantics, and student workflow questions to Oracle early.
