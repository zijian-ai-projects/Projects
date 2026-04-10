# Click-Only Dropdown Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Change the temperament picker to a stable click-only dropdown, make its menu width track the trigger button, center the option labels, and fix the `乾明 / Lumina` chip idle-state styling.

**Architecture:** Keep the existing compact side-card structure and local dropdown state in `QuestionForm`, but remove hover-open behavior entirely and rely on click + outside-click dismissal only. Limit this pass to `QuestionForm` and its focused tests so the cleanup remains isolated from shell/runtime behavior.

**Tech Stack:** React, TypeScript, Tailwind CSS, Testing Library, Vitest

---

## File Map

- Modify: `src/components/question-form.tsx`
  - Owns the click-only temperament dropdown behavior, trigger/menu width relationship, and Lumina chip idle styling.
- Modify: `src/components/question-form.test.tsx`
  - Verifies click-only open/close behavior, outside-click dismissal, local anchoring assumptions, centered option text, and the Lumina chip style fix.

### Task 1: Rewrite Focused Form Tests For Click-Only Dropdown Behavior

**Files:**
- Modify: `src/components/question-form.test.tsx`

- [ ] **Step 1: Write the failing tests for click-only behavior**

Update `src/components/question-form.test.tsx` with tests like:

```ts
it("opens the pair menu on click and keeps it closed on hover alone", async () => {
  const user = userEvent.setup();
  render(<QuestionForm onSubmit={vi.fn()} uiLanguage="en" />);

  const trigger = screen.getByRole("button", { name: "Cautious" });
  await user.hover(trigger);
  expect(screen.queryByRole("menu", { name: "Choose temperament pair" })).not.toBeInTheDocument();

  await user.click(trigger);
  expect(screen.getByRole("menu", { name: "Choose temperament pair" })).toBeInTheDocument();
});

it("closes the pair menu when the same temperament button is clicked again", async () => {
  const user = userEvent.setup();
  render(<QuestionForm onSubmit={vi.fn()} uiLanguage="en" />);

  const trigger = screen.getByRole("button", { name: "Cautious" });
  await user.click(trigger);
  expect(screen.getByRole("menu", { name: "Choose temperament pair" })).toBeInTheDocument();

  await user.click(trigger);
  expect(screen.queryByRole("menu", { name: "Choose temperament pair" })).not.toBeInTheDocument();
});

it("closes the pair menu on outside click", async () => {
  const user = userEvent.setup();
  render(<QuestionForm onSubmit={vi.fn()} uiLanguage="en" />);

  await user.click(screen.getByRole("button", { name: "Cautious" }));
  expect(screen.getByRole("menu", { name: "Choose temperament pair" })).toBeInTheDocument();

  await user.click(screen.getByLabelText("Decision question"));
  expect(screen.queryByRole("menu", { name: "Choose temperament pair" })).not.toBeInTheDocument();
});
```

- [ ] **Step 2: Add width/alignment and chip-style assertions**

Add focused DOM/class assertions:

```ts
it("anchors the pair menu to the local trigger and matches its width", async () => {
  const user = userEvent.setup();
  render(<QuestionForm onSubmit={vi.fn()} uiLanguage="en" />);

  const trigger = screen.getByRole("button", { name: "Cautious" });
  await user.click(trigger);

  const menu = screen.getByRole("menu", { name: "Choose temperament pair" });
  expect(trigger.parentElement).toContainElement(menu);
  expect(menu).toHaveClass("w-full");
});

it("centers the dropdown option labels and keeps the Lumina chip readable at rest", async () => {
  const user = userEvent.setup();
  render(<QuestionForm onSubmit={vi.fn()} uiLanguage="en" />);

  const luminaCard = screen.getByText("Lumina").closest("section");
  expect(within(luminaCard as HTMLElement).getByRole("button", { name: "First" })).toHaveClass("bg-white");
  expect(within(luminaCard as HTMLElement).getByRole("button", { name: "First" })).toHaveClass("text-black");

  await user.click(screen.getByRole("button", { name: "Cautious" }));
  const option = screen.getByRole("button", { name: "Rational / Intuitive" });
  expect(option).toHaveClass("justify-center");
});
```

- [ ] **Step 3: Run the focused test file to verify it fails**

Run:

```bash
pnpm vitest run src/components/question-form.test.tsx
```

Expected: FAIL because the current implementation still opens on hover and does not yet enforce the new width/alignment or chip-style assumptions.

- [ ] **Step 4: Commit**

```bash
git add src/components/question-form.test.tsx
git commit -m "test: define click-only dropdown behavior"
```

### Task 2: Implement Click-Only Dropdown Behavior In QuestionForm

**Files:**
- Modify: `src/components/question-form.tsx`

- [ ] **Step 1: Remove hover-open behavior**

Delete the hover handlers from the local temperament control wrappers:

```tsx
onMouseEnter={...}
onMouseLeave={...}
```

The dropdown should no longer react to pointer hover.

- [ ] **Step 2: Make the trigger toggle on click**

Replace the current click behavior with explicit toggle logic:

```ts
const togglePairMenu = (side: SpeakerSideKey) => {
  clearScheduledPairMenuClose();
  setPairMenuSide((current) => (current === side ? null : side));
};
```

Wire each temperament button to `togglePairMenu(side)` instead of always opening.

- [ ] **Step 3: Keep only the stable close paths**

Dropdown should close on:

- option selection
- outside click
- same-button click

Retain the existing `pointerdown` outside-click listener, but remove hover-only closing logic that makes the menu disappear prematurely.

- [ ] **Step 4: Make the menu width track the trigger**

Update the local control wrapper and menu classes:

```tsx
<div ref={...} className="relative inline-flex w-[7.5rem] flex-col items-stretch">
```

and:

```tsx
className="absolute right-0 top-full z-20 mt-1 w-full rounded-2xl border p-2 ..."
```

This keeps the menu width aligned with the temperament button width.

- [ ] **Step 5: Center the dropdown option labels**

Update the option button classes:

```tsx
className="flex w-full justify-center rounded-xl px-3 py-2 text-center text-sm font-medium ..."
```

- [ ] **Step 6: Fix the Lumina chip idle-state styling**

Ensure the `乾明 / Lumina` order chip renders as:

```tsx
className="rounded-full border border-black/10 bg-white px-3 py-1 text-xs font-semibold text-black ..."
```

Do not leave it with white text in idle state.

- [ ] **Step 7: Run the focused form tests to verify they pass**

Run:

```bash
pnpm vitest run src/components/question-form.test.tsx
```

Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add src/components/question-form.tsx src/components/question-form.test.tsx
git commit -m "feat: make temperament dropdown click-only"
```

### Task 3: Final Focused Verification

**Files:**
- Modify: `src/components/question-form.test.tsx` only if a tiny assertion fix is needed

- [ ] **Step 1: Run the broader focused UI verification**

Run:

```bash
pnpm vitest run src/components/question-form.test.tsx src/components/session-shell.test.tsx src/app/page.test.ts
```

Expected: all targeted tests pass.

- [ ] **Step 2: If needed, make the smallest test-only alignment fix**

If the broader run reveals a stale assumption caused by the click-only dropdown change, limit changes to the smallest necessary test update.

- [ ] **Step 3: Re-run the broader focused UI verification**

Run:

```bash
pnpm vitest run src/components/question-form.test.tsx src/components/session-shell.test.tsx src/app/page.test.ts
```

Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add src/components/question-form.tsx src/components/question-form.test.tsx
git commit -m "test: verify click-only dropdown cleanup"
```

## Self-Review

- Spec coverage:
  - click-only open/close behavior: Tasks 1 and 2
  - same-button close and outside-click close: Tasks 1 and 2
  - equal-width anchored menu: Tasks 1 and 2
  - centered option labels: Tasks 1 and 2
  - Lumina chip idle-state fix: Tasks 1 and 2
  - broader focused verification: Task 3
- Placeholder scan: no `TODO`, `TBD`, or vague implementation steps remain.
- Type consistency: this pass stays inside `QuestionForm`; no payload or runtime interfaces change.
