# Two Agent Debate Hero and Performance Cleanup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Keep a single product-name anchor in the top hero, relocate the UI-language switch into the hero, remove duplicate form-card copy, and make the page feel lighter during language switching and scrolling while preserving the taiji visual.

**Architecture:** Keep the current Next.js front-end structure and make a focused shell/form cleanup. The hero becomes the sole brand surface, the form becomes purely task-oriented, and the performance work stays in the client/rendering layer by reducing rerender churn and expensive visual effects rather than touching runtime behavior.

**Tech Stack:** Next.js App Router, React, TypeScript, Tailwind/CSS utilities, Vitest, Playwright

---

## File Structure

### Existing files to modify

- `src/components/session-shell.tsx`
  - Make the hero the only visible brand surface, move the UI-language switch into the hero row, remove redundant hero copy, and reduce avoidable rerenders in the shell.
- `src/components/question-form.tsx`
  - Remove the duplicated product-name and description block plus the local UI-language switch from the form card, keeping only the decision workflow UI.
- `src/lib/ui-copy.ts`
  - Update copy so the visible hero name is language-specific instead of bilingual, and remove strings no longer needed by the form header.
- `src/app/globals.css`
  - Reduce expensive blur/transparency styling in the page scroll path while keeping the taiji visual language.
- `src/components/session-shell.test.tsx`
  - Assert the new hero language-toggle placement behavior and single-brand surface expectations.
- `src/components/question-form.test.tsx`
  - Assert the form no longer renders the removed duplicate title/description/toggle content.
- `src/app/page.test.ts`
  - Cover the page-level brand switching behavior if the hero text change is asserted there.
- `tests/e2e/session-flow.spec.ts`
  - Verify the new visual hierarchy and relocated UI-language switch in the browser flow.

### New files to create

- None expected for this pass.

## Task 1: Simplify Copy and Brand Ownership

**Files:**
- Modify: `src/lib/ui-copy.ts`
- Test: `src/app/page.test.ts`

- [ ] **Step 1: Write the failing brand-copy test**

```tsx
import { render, screen } from "@testing-library/react";
import HomePage from "@/app/page";

it("shows a language-specific hero brand instead of a bilingual combined title", () => {
  render(<HomePage />);

  expect(screen.getByRole("heading", { name: "Dualens" })).toBeInTheDocument();
  expect(screen.queryByRole("heading", { name: "Dualens / 两仪决" })).not.toBeInTheDocument();
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm vitest run src/app/page.test.ts`

Expected: FAIL because the current hero still renders the combined bilingual product name.

- [ ] **Step 3: Update copy ownership for the hero**

Make these copy changes:

- visible hero product name should be:
  - `Dualens` in English
  - `两仪决` in Chinese
- remove the need for the form-level duplicate title/description copy
- remove the extra hero description line:
  - `Research, debate, and summary stay visible without crowding the form.`

Keep the main value statement and only the copy still needed after the cleanup.

- [ ] **Step 4: Run the copy test to verify it passes**

Run: `pnpm vitest run src/app/page.test.ts`

Expected: PASS with language-specific hero branding covered.

## Task 2: Move the UI-Language Toggle Into the Hero and Remove the Form-Header Duplicate

**Files:**
- Modify: `src/components/session-shell.tsx`
- Modify: `src/components/question-form.tsx`
- Test: `src/components/question-form.test.tsx`
- Test: `src/components/session-shell.test.tsx`

- [ ] **Step 1: Write the failing UI-placement tests**

```tsx
import { render, screen } from "@testing-library/react";
import { SessionShell } from "@/components/session-shell";
import { QuestionForm } from "@/components/question-form";
import { vi } from "vitest";

it("does not render a form-local UI language switch", () => {
  render(<QuestionForm onSubmit={vi.fn()} />);

  expect(screen.queryByLabelText("UI language")).not.toBeInTheDocument();
});

it("renders the UI language switch in the hero shell", () => {
  render(<SessionShell />);

  expect(screen.getByLabelText("UI language")).toBeInTheDocument();
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `pnpm vitest run src/components/question-form.test.tsx src/components/session-shell.test.tsx`

Expected: FAIL because the toggle still lives inside the form and the form still renders duplicated header content.

- [ ] **Step 3: Move the toggle and strip the form header**

Implement:

- remove the language toggle from `QuestionForm`
- remove the form-card product name and introductory description
- keep the form starting directly at the decision question and preset controls
- render the language toggle in the top hero area in `SessionShell`, visually near the taiji cluster on the right

Preserve:

- the same UI-language switching behavior
- the same session creation behavior

- [ ] **Step 4: Run the tests to verify they pass**

Run: `pnpm vitest run src/components/question-form.test.tsx src/components/session-shell.test.tsx`

Expected: PASS with the toggle placement and form-header cleanup covered.

## Task 3: Reduce Shell Rerender Churn

**Files:**
- Modify: `src/components/session-shell.tsx`
- Modify: `src/components/question-form.tsx`
- Test: `src/components/session-shell.test.tsx`

- [ ] **Step 1: Add a focused regression test for controlled language ownership**

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SessionShell } from "@/components/session-shell";

it("keeps the page-level language switch working after it moves into the shell", async () => {
  const user = userEvent.setup();
  render(<SessionShell />);

  await user.click(screen.getByRole("button", { name: "中文" }));

  expect(screen.getByText("两仪决")).toBeInTheDocument();
  expect(screen.getByLabelText("决策问题")).toBeInTheDocument();
});
```

- [ ] **Step 2: Run the test to verify it fails or exposes the current ownership issue**

Run: `pnpm vitest run src/components/session-shell.test.tsx`

Expected: FAIL or remain incomplete until the shell/form language ownership is simplified.

- [ ] **Step 3: Reduce avoidable cross-tree rerenders**

Keep this scoped and pragmatic:

- let the shell own page-level UI language state
- keep the form focused on question/preset/provider interaction state
- avoid re-rendering large shell sections due to unnecessary duplicated state paths

Do not introduce large architectural refactors. Make the smallest ownership cleanup that removes redundant render work.

- [ ] **Step 4: Run the targeted shell test to verify it passes**

Run: `pnpm vitest run src/components/session-shell.test.tsx`

Expected: PASS with language ownership still correct after the move.

## Task 4: Lighten Visual Rendering Cost While Keeping the Taiji

**Files:**
- Modify: `src/app/globals.css`
- Modify: `src/components/session-shell.tsx`

- [ ] **Step 1: Make the minimal visual-cost reduction**

Reduce rendering heaviness by:

- trimming redundant large blur layers
- reducing unnecessary `backdrop-blur` usage on frequently visible surfaces
- simplifying translucent hero/background treatments where they do not materially improve the design

Keep:

- the taiji motif
- the overall color direction

Do not flatten the page into a generic plain layout.

- [ ] **Step 2: Smoke-check the page manually in the browser test harness**

Run: `pnpm playwright test tests/e2e/session-flow.spec.ts`

Expected: PASS while the page still looks correct and no interaction regresses.

## Task 5: Update Browser Regression Coverage for the New Hero Hierarchy

**Files:**
- Modify: `tests/e2e/session-flow.spec.ts`

- [ ] **Step 1: Extend the browser assertions**

Add coverage that:

- the hero shows only the language-specific product name
- the old combined `Dualens / 两仪决` visible title is gone
- the form no longer shows duplicated introductory header copy
- the UI-language switch works from the hero location
- existing create-session flow still succeeds

- [ ] **Step 2: Run the browser test**

Run: `pnpm playwright test tests/e2e/session-flow.spec.ts`

Expected: PASS with the new hierarchy and relocated language control covered.

## Task 6: Final Verification

**Files:**
- No new files; verification only

- [ ] **Step 1: Run the targeted unit/integration suite**

Run:

```bash
pnpm vitest run \
  src/components/question-form.test.tsx \
  src/components/session-shell.test.tsx \
  src/app/page.test.ts
```

Expected: PASS with the hero/form cleanup behavior covered.

- [ ] **Step 2: Run the browser regression**

Run: `pnpm playwright test tests/e2e/session-flow.spec.ts`

Expected: PASS with the relocated language toggle and cleaned hero hierarchy stable in the browser.

- [ ] **Step 3: Search for removed duplicate surface copy**

Run:

```bash
rg -n "Dualens / 两仪决|输入一个问题，选择性格配对。|Research, debate, and summary stay visible without crowding the form." src
```

Expected:

- no remaining surface usage of the removed combined hero title
- no remaining form-card duplicate description
- no remaining extra workspace description line

- [ ] **Step 4: Note any residual performance caveats**

If the page is improved but still not fully smooth, note whether the remaining issue appears to come from:

- browser/dev-mode overhead
- still-heavy visual effects
- or runtime/session updates rather than static rendering

