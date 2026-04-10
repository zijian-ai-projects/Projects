# Two Agent Debate Hero and Performance Cleanup Design

Date: 2026-04-09

## Purpose

This pass cleans up the top-of-page product presentation and addresses the new front-end lag without removing the taiji visual language.

The target outcome is:

- one clear product-name anchor
- less duplicated copy
- a better-placed UI-language toggle
- noticeably lighter interaction and scrolling behavior

## Why This Pass Exists

The current page has drifted in two ways:

1. Product naming is duplicated across the hero and the form card, which weakens hierarchy.
2. The page now feels heavy during both UI-language switching and overall scrolling/rendering.

This pass tightens the hierarchy and removes avoidable rendering cost while preserving the product’s visual identity.

## Goals

- Keep only one visible product name on the page.
- Put that product name in the top hero only.
- Make the visible product name switch by UI language:
  - English UI: `Dualens`
  - Chinese UI: `两仪决`
- Remove duplicated descriptive copy from the form card.
- Move the UI-language toggle out of the form card and into the hero area.
- Keep the taiji motif.
- Improve perceived smoothness for:
  - clicking controls
  - switching language
  - scrolling

## Non-Goals

- Rebranding the product again
- Removing the taiji visual system
- Redesigning the debate workflow
- Reworking research/runtime behavior
- Full performance profiling infrastructure

## Design Decisions

### 1. Single Brand Anchor

The hero becomes the only place where the product name is shown.

Visible behavior:

- English UI shows `Dualens`
- Chinese UI shows `两仪决`

The mixed bilingual display `Dualens / 两仪决` should be removed from the surface UI for this pass.

### 2. Remove Duplicate Form-Card Header Content

The form card should no longer repeat product-level identity copy.

Remove from the form card:

- product name
- `输入一个问题，选择性格配对。`
- the local UI-language toggle

The form should start directly from the decision question and preset controls.

### 3. Move the UI-Language Toggle to the Hero

The UI-language switch should move to the higher-level hero block.

Placement:

- in the hero’s top row
- visually aligned to the right side
- positioned near the taiji visual cluster, not inside the form card

This keeps language switching as a page-level control instead of making it look like a form-local option.

### 4. Remove the Extra Workspace Description Line

Delete:

- `Research, debate, and summary stay visible without crowding the form.`

The hero should keep a tighter hierarchy:

- product name
- main value statement
- optional one supporting line only if still needed after cleanup

### 5. Performance Strategy

This pass should optimize for both interaction smoothness and scrolling smoothness.

#### Interaction Lag

The likely issue is excessive rerendering when local form state changes or when UI language switches.

The fix direction is:

- reduce unnecessary rerenders across the shell
- keep page-level state from forcing large subtree rerenders where avoidable
- keep form-local interaction state local

#### Scrolling / Rendering Heaviness

The likely issue is visual cost from layered transparency and blur effects.

The fix direction is:

- reduce redundant `blur-3xl`-style decorative layers
- reduce unnecessary `backdrop-blur` usage in the scroll path
- simplify translucent surfaces where they do not materially help the design
- keep the taiji motif, but make it cheaper rather than removing it

### 6. Taiji Constraint

The taiji visual should remain part of the hero.

Allowed change:

- simplify its surrounding glow/blur treatment

Not allowed:

- removing the taiji motif entirely

## Implementation Boundary

This pass is expected to touch mainly:

- `src/components/session-shell.tsx`
- `src/components/question-form.tsx`
- `src/app/globals.css`
- possibly small supporting copy in `src/lib/ui-copy.ts`

It should not require backend/runtime changes.

## Testing Focus

This pass should verify:

- only one visible product-name anchor remains
- the visible product name follows UI language
- the form card no longer contains the removed header copy
- the UI-language switch still works after relocation
- existing session creation behavior remains intact

Performance validation for this pass is pragmatic rather than benchmark-heavy:

- no obvious lag when switching UI language
- no obvious heavy repaint feel during scrolling relative to the current baseline

