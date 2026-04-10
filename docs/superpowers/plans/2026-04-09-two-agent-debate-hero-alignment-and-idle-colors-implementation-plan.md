# Hero Alignment And Idle Colors Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Apply the remaining visual polish: set the `乾明 / Lumina` order chip to black-with-white-text at rest, set the center `换 / swap` button to white-with-black-text at rest, and lower the hero text block slightly so it aligns more naturally with the taiji center.

**Architecture:** Keep this pass styling-only. Limit changes to the existing form component, hero shell, and the smallest focused tests needed to lock the new idle-state classes and hero alignment hook. Do not change behavior or payload flow.

**Tech Stack:** React, TypeScript, Tailwind CSS, Testing Library, Vitest

---

## File Map

- Modify: `src/components/question-form.tsx`
  - Owns the `乾明 / Lumina` order chip and center swap button idle classes.
- Modify: `src/components/session-shell.tsx`
  - Owns the hero taiji + brand lockup alignment.
- Modify: `src/components/question-form.test.tsx`
  - Verifies the idle-state class expectations.
- Modify: `src/app/page.test.ts`
  - Optionally verifies the hero text block carries the new alignment class or wrapper hook if one is added.

### Task 1: Rewrite Focused Tests For The Visual Polish

**Files:**
- Modify: `src/components/question-form.test.tsx`
- Modify: `src/app/page.test.ts` only if needed for the hero alignment hook

- [ ] **Step 1: Write the failing idle-state assertions**

Update `src/components/question-form.test.tsx` with expectations like:

```ts
it("renders the Lumina order chip black with white text at rest", () => {
  render(<QuestionForm onSubmit={vi.fn()} uiLanguage="en" />);

  const luminaCard = screen.getByText("Lumina").closest("section");
  const orderChip = within(luminaCard as HTMLElement).getByRole("button", { name: "First" });

  expect(orderChip).toHaveClass("bg-black");
  expect(orderChip).toHaveClass("text-white");
});

it("renders the center swap button white with black text at rest", () => {
  render(<QuestionForm onSubmit={vi.fn()} uiLanguage="en" />);

  const swapButton = screen.getByRole("button", { name: "Swap temperament assignment" });
  expect(swapButton).toHaveClass("bg-white");
  expect(swapButton).toHaveClass("text-black");
});
```

- [ ] **Step 2: Add a minimal hero-alignment assertion if a stable hook is introduced**

If the implementation adds a stable class or wrapper to the hero text block, reflect that in `src/app/page.test.ts`:

```ts
expect(screen.getByTestId("brand-lockup")).toHaveClass("justify-center");
```

Only add this if the implementation exposes a stable selector without making the test brittle.

- [ ] **Step 3: Run the focused test files to verify the red state**

Run:

```bash
pnpm vitest run src/components/question-form.test.tsx src/app/page.test.ts
```

Expected: FAIL on the current idle-state classes and possibly the missing hero alignment hook.

- [ ] **Step 4: Commit**

```bash
git add src/components/question-form.test.tsx src/app/page.test.ts
git commit -m "test: define hero and idle color polish"
```

### Task 2: Implement The Styling Changes

**Files:**
- Modify: `src/components/question-form.tsx`
- Modify: `src/components/session-shell.tsx`

- [ ] **Step 1: Update the Lumina order chip idle classes**

In `src/components/question-form.tsx`, change the `乾明 / Lumina` order chip to:

```tsx
className="rounded-full border border-black bg-black px-3 py-1 text-xs font-semibold text-white transition hover:bg-black/90 ..."
```

This is a styling-only change.

- [ ] **Step 2: Update the center swap button idle classes**

In `src/components/question-form.tsx`, change the center swap button to:

```tsx
className="h-[58px] w-[58px] shrink-0 rounded-full border border-black/12 bg-white p-0 text-black hover:bg-white/90 hover:text-black"
```

And ensure the visible label span uses:

```tsx
className="... text-black"
```

- [ ] **Step 3: Lower the hero text block slightly**

In `src/components/session-shell.tsx`, adjust the taiji/brand row so the text stack sits slightly lower relative to the taiji. For example:

```tsx
<div className="flex items-start gap-4">
  <div aria-hidden className="relative shrink-0">...</div>
  <div data-testid="brand-lockup" className="flex flex-col justify-center pt-2">
    ...
  </div>
</div>
```

The exact class can vary, but the intent is to move the text block down a bit without changing hero structure.

- [ ] **Step 4: Run the focused tests to verify they pass**

Run:

```bash
pnpm vitest run src/components/question-form.test.tsx src/app/page.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/question-form.tsx src/components/session-shell.tsx src/components/question-form.test.tsx src/app/page.test.ts
git commit -m "style: align hero lockup and idle control colors"
```

### Task 3: Final Focused Verification

**Files:**
- Modify: tests only if a tiny alignment update is needed

- [ ] **Step 1: Run the broader focused UI verification**

Run:

```bash
pnpm vitest run src/components/question-form.test.tsx src/components/session-shell.test.tsx src/app/page.test.ts
```

Expected: all targeted tests pass.

- [ ] **Step 2: If needed, make the smallest test-only alignment fix**

If the broader run exposes a stale assertion caused by the hero alignment or idle-color changes, limit the fix to the smallest possible test update.

- [ ] **Step 3: Re-run the broader focused UI verification**

Run:

```bash
pnpm vitest run src/components/question-form.test.tsx src/components/session-shell.test.tsx src/app/page.test.ts
```

Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add src/components/question-form.tsx src/components/session-shell.tsx src/components/question-form.test.tsx src/app/page.test.ts
git commit -m "test: verify hero and idle color polish"
```

## Self-Review

- Spec coverage:
  - Lumina order chip idle colors: Tasks 1 and 2
  - center swap button idle colors: Tasks 1 and 2
  - hero brand block lowered relative to taiji: Task 2
  - broader focused verification: Task 3
- Placeholder scan: no `TODO`, `TBD`, or vague implementation steps remain.
- Type consistency: this pass is styling-only; no payload or runtime contracts change.
