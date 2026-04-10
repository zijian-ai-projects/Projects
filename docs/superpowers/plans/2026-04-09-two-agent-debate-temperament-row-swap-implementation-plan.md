# Two Agent Debate Temperament Row Swap Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the current taiji assignment selector with a compact aligned row containing the temperament-pair selector, two mapping cards, and a central taiji-themed swap button that flips `luminaTemperament`.

**Architecture:** Keep the current `QuestionForm` state shape and submission contract, but simplify the assignment UI from a stacked selector into a single-row layout. The new swap button becomes the only interaction on the right side, and it mutates `luminaTemperament` by swapping to the opposite temperament in the currently selected pair.

**Tech Stack:** Next.js, React, TypeScript, Tailwind utility classes, Vitest, Testing Library, Playwright

---

## File Map

- Modify: `src/components/question-form.tsx`
  - Remove the lower taiji selector block.
  - Align the pair selector and the assignment section as one compact row.
  - Add a taiji-themed swap button between the two mapping cards.
- Modify: `src/lib/ui-copy.ts`
  - Add localized swap-button accessible text only if needed.
- Modify: `src/components/question-form.test.tsx`
  - Replace tests that assume radio-based temperament selection with swap-button behavior.
  - Add assertions for compact row behavior and payload preservation.
- Modify: `tests/e2e/session-flow.spec.ts`
  - Replace browser interactions that still target the removed taiji selector/radio path.

## Task 1: Rewrite the Form Tests Around Swap Behavior

**Files:**
- Modify: `src/components/question-form.test.tsx`

- [ ] **Step 1: Replace the old radio-selection interaction tests with swap-button tests**

Update the current behavior tests so they click a swap button instead of a radio input.

Add or adapt a test like:

```tsx
it("flips the visible side mapping when the swap button is pressed", async () => {
  const user = userEvent.setup();
  render(<QuestionForm onSubmit={vi.fn()} />);

  expect(screen.getByText("Lumina: Cautious")).toBeInTheDocument();
  expect(screen.getByText("Vigila: Aggressive")).toBeInTheDocument();

  await user.click(screen.getByRole("button", { name: "Swap temperament assignment" }));

  expect(screen.getByText("Lumina: Aggressive")).toBeInTheDocument();
  expect(screen.getByText("Vigila: Cautious")).toBeInTheDocument();
});
```

- [ ] **Step 2: Add a failing test that the lower taiji selector is gone**

Write an assertion that the old `Assign ... to Lumina` radio controls are no longer present:

```tsx
it("removes the old taiji selector radios", () => {
  render(<QuestionForm onSubmit={vi.fn()} />);

  expect(screen.queryByRole("radio", { name: /Assign .* to Lumina/i })).not.toBeInTheDocument();
});
```

- [ ] **Step 3: Add a failing test for the swap button and mapping cards**

Assert the compact row exposes one button and two mapping labels:

```tsx
it("renders a compact mapping row with a central swap button", () => {
  render(<QuestionForm onSubmit={vi.fn()} uiLanguage="zh-CN" />);

  expect(screen.getByText("乾明：谨慎")).toBeInTheDocument();
  expect(screen.getByText("坤察：激进")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "交换个性分配" })).toBeInTheDocument();
});
```

- [ ] **Step 4: Update the submit test to use the swap button**

Change the payload test so it flips by pressing the button instead of targeting a radio:

```tsx
await user.selectOptions(screen.getByLabelText("Temperament pair"), "cost-benefit");
await user.click(screen.getByRole("button", { name: "Swap temperament assignment" }));

expect(onSubmit).toHaveBeenCalledWith({
  question: "Should I move to another city?",
  presetSelection: {
    pairId: "cost-benefit",
    luminaTemperament: "benefit-focused"
  },
  language: "en",
  model: "deepseek-reasoner"
});
```

- [ ] **Step 5: Run the focused form tests and confirm they fail**

Run:

```bash
pnpm vitest run src/components/question-form.test.tsx
```

Expected:

- FAIL because the old radio-based selector still exists
- FAIL because the swap button does not exist yet

- [ ] **Step 6: Commit the failing-test checkpoint**

```bash
git add src/components/question-form.test.tsx
git commit -m "test: cover temperament swap row behavior"
```

## Task 2: Implement the Compact Row and Swap Button

**Files:**
- Modify: `src/components/question-form.tsx`
- Modify: `src/lib/ui-copy.ts`

- [ ] **Step 1: Add a local swap helper inside `QuestionFormImpl`**

Implement a small helper that flips `luminaTemperament` using the current pair:

```tsx
function swapLuminaTemperament() {
  setLuminaTemperament(
    presetLibrary.getOppositeTemperament(selectedPair, luminaTemperament)
  );
}
```

If needed, inline it as a button handler instead of adding a separate top-level function.

- [ ] **Step 2: Remove the entire lower taiji selector block**

Delete the block that currently renders:

- the large circular taiji visual
- the hidden radio inputs
- the half-disc labels

This means removing the entire `div` that begins with:

```tsx
<div className="flex justify-center">
```

and ends after the mapped `selectedPair.options.map(...)` label structure.

- [ ] **Step 3: Replace the right-side fieldset content with a single aligned row**

Implement the right side as:

```tsx
<fieldset className="space-y-2 text-sm font-medium text-ink/80">
  <legend className="block">{uiCopy.luminaReceives}</legend>
  <div className="flex h-[52px] items-stretch gap-3">
    <div className="flex min-w-0 flex-1 items-center rounded-2xl border border-black/8 bg-white/72 px-4">
      <span className="truncate font-medium text-ink">{luminaMappingLabel}</span>
    </div>
    <Button
      type="button"
      variant="ghost"
      aria-label={uiCopy.swapTemperamentAssignment}
      className="h-[52px] w-[52px] rounded-full border border-black/12 bg-white/80 p-0 hover:bg-white"
      onClick={swapLuminaTemperament}
    >
      {/* compact taiji svg */}
    </Button>
    <div className="flex min-w-0 flex-1 items-center rounded-2xl border border-black bg-black px-4">
      <span className="truncate font-medium text-white">{vigilaMappingLabel}</span>
    </div>
  </div>
</fieldset>
```

This is the main layout change: one row, equal heights, vertically centered content.

- [ ] **Step 4: Align the left selector block with the right row**

Adjust the surrounding two-column layout so the left select control and the right swap row visually align.

Recommended shape:

```tsx
<div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-end">
  <label className="space-y-2 text-sm font-medium text-ink/80">
    <span className="block">{uiCopy.temperamentPair}</span>
    <Select className="h-[52px]">
      ...
    </Select>
  </label>
  <fieldset className="space-y-2">
    ...
  </fieldset>
</div>
```

If `Select` does not accept `className`, align via surrounding wrappers and padding instead. The requirement is visual alignment, not a specific prop.

- [ ] **Step 5: Add localized swap-button copy if needed**

If no suitable string exists yet, add:

```ts
swapTemperamentAssignment: "Swap temperament assignment"
```

and:

```ts
swapTemperamentAssignment: "交换个性分配"
```

to `src/lib/ui-copy.ts`, plus the type field.

- [ ] **Step 6: Run the focused form tests and make them pass**

Run:

```bash
pnpm vitest run src/components/question-form.test.tsx
```

Expected:

- PASS

- [ ] **Step 7: Commit the implementation checkpoint**

```bash
git add src/components/question-form.tsx src/lib/ui-copy.ts src/components/question-form.test.tsx
git commit -m "feat: add temperament swap row"
```

## Task 3: Re-verify Related UI Tests

**Files:**
- Test: `src/components/session-shell.test.tsx`
- Test: `src/app/page.test.ts`

- [ ] **Step 1: Run the related UI suite**

Run:

```bash
pnpm vitest run src/components/question-form.test.tsx src/components/session-shell.test.tsx src/app/page.test.ts
```

Expected:

- PASS

- [ ] **Step 2: If any assertion still assumes the old selector, update only that assertion**

Examples of stale assumptions to remove:

```tsx
screen.getByRole("radio", { name: /Assign .* to Lumina/i })
```

or layout expectations tied to the deleted lower taiji block.

- [ ] **Step 3: Re-run the UI suite after any test-only fix**

Run:

```bash
pnpm vitest run src/components/question-form.test.tsx src/components/session-shell.test.tsx src/app/page.test.ts
```

Expected:

- PASS

- [ ] **Step 4: Commit the UI verification checkpoint**

```bash
git add src/components/question-form.test.tsx src/components/session-shell.test.tsx src/app/page.test.ts
git commit -m "test: align UI coverage with temperament swap row"
```

## Task 4: Update Browser Flow Verification

**Files:**
- Modify: `tests/e2e/session-flow.spec.ts`

- [ ] **Step 1: Replace the old mapping interaction with the swap button path**

Update the Chinese flow so it uses the new button:

```ts
await page.getByRole("button", { name: "交换个性分配" }).click();
await expect(page.getByText("乾明：激进")).toBeVisible();
await expect(page.getByText("坤察：谨慎")).toBeVisible();
```

Remove any browser assumptions tied to:

- the deleted lower taiji selector
- radio-driven assignment interaction

- [ ] **Step 2: Run the browser spec**

Run:

```bash
pnpm playwright test tests/e2e/session-flow.spec.ts
```

Expected:

- PASS

- [ ] **Step 3: If the browser spec fails on strict selectors, narrow the locator rather than weakening the behavior**

Use scoped locators such as:

```ts
heroForm.getByRole("button", { name: "交换个性分配" })
```

or scoped card locators for repeated side names.

- [ ] **Step 4: Re-run the browser spec**

Run:

```bash
pnpm playwright test tests/e2e/session-flow.spec.ts
```

Expected:

- PASS

- [ ] **Step 5: Commit the browser verification checkpoint**

```bash
git add tests/e2e/session-flow.spec.ts
git commit -m "test: verify temperament swap row flow"
```

## Self-Review

- Spec coverage:
  - aligned pair row and assignment row: covered in Task 2
  - remove lower taiji selector: covered in Task 2
  - add central taiji swap button: covered in Task 2
  - preserve payload behavior: covered in Task 1 and Task 2
  - browser validation in Chinese UI: covered in Task 4
- Placeholder scan:
  - no TODO/TBD placeholders remain
- Type consistency:
  - keeps `pairId` and `luminaTemperament`
  - swap button updates only `luminaTemperament`
