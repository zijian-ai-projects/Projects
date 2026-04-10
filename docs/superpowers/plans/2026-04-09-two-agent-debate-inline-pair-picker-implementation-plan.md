# Two Agent Debate Inline Pair Picker Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the standalone temperament-pair selector and let users choose a preset pair directly from the visible temperament labels inside the `乾明 / 坤察` modules, while keeping the central swap button as the only inversion control.

**Architecture:** Keep the existing `pairId + luminaTemperament` data model, but move pair selection into an inline popup menu attached to both visible temperament labels. Selecting a pair updates both modules together and resets orientation to the pair default; the swap button still flips `luminaTemperament` afterward.

**Tech Stack:** Next.js, React, TypeScript, Tailwind utility classes, Vitest, Testing Library, Playwright

---

## File Map

- Modify: `src/components/question-form.tsx`
  - Remove the standalone pair selector.
  - Turn both temperament labels into popup triggers.
  - Render the pair list popup and wire pair selection to `pairId` and `luminaTemperament`.
- Modify: `src/lib/ui-copy.ts`
  - Add any trigger or popup labels needed for accessibility.
- Modify: `src/components/question-form.test.tsx`
  - Replace tests that still expect the standalone selector.
  - Add coverage for popup-trigger behavior and default-orientation reset.
- Modify: `tests/e2e/session-flow.spec.ts`
  - Replace browser flow interactions that still depend on the old standalone selector.

## Task 1: Rewrite the Form Tests Around the Inline Pair Picker

**Files:**
- Modify: `src/components/question-form.test.tsx`

- [ ] **Step 1: Add a failing test that the standalone pair selector is removed**

Replace any assertion expecting the old select with a negative assertion:

```tsx
it("removes the standalone temperament pair selector", () => {
  render(<QuestionForm onSubmit={vi.fn()} uiLanguage="zh-CN" />);

  expect(screen.queryByLabelText("性格配对")).not.toBeInTheDocument();
});
```

- [ ] **Step 2: Add a failing test that the visible temperament labels are clickable triggers**

Expect each visible temperament label to be rendered as a button:

```tsx
it("uses the visible temperament labels as pair-picker triggers", () => {
  render(<QuestionForm onSubmit={vi.fn()} />);

  expect(screen.getByRole("button", { name: /Choose temperament pair/i })).toBeInTheDocument();
});
```

If you implement one trigger per side, use `getAllByRole` and assert count `2`.

- [ ] **Step 3: Add a failing test for selecting a new pair**

Assert that opening the popup and choosing a pair updates both sides to the default orientation:

```tsx
it("selecting a new pair resets mapping to the pair default", async () => {
  const user = userEvent.setup();
  render(<QuestionForm onSubmit={vi.fn()} uiLanguage="zh-CN" />);

  await user.click(screen.getAllByRole("button", { name: "选择性格配对" })[0]);
  await user.click(screen.getByRole("button", { name: "理性 / 直觉" }));

  expect(screen.getByText("乾明：理性")).toBeInTheDocument();
  expect(screen.getByText("坤察：直觉")).toBeInTheDocument();
});
```

- [ ] **Step 4: Keep swap behavior in the same test file**

After selecting a new pair, verify swap still works:

```tsx
await user.click(screen.getByRole("button", { name: "交换个性分配" }));

expect(screen.getByText("乾明：直觉")).toBeInTheDocument();
expect(screen.getByText("坤察：理性")).toBeInTheDocument();
```

- [ ] **Step 5: Update the submit test to use popup pair selection**

Replace the old select-based path:

```tsx
await user.click(screen.getAllByRole("button", { name: "Choose temperament pair" })[0]);
await user.click(screen.getByRole("button", { name: "Cost-focused / Benefit-focused" }));
await user.click(screen.getByRole("button", { name: "Swap temperament assignment" }));
```

Then keep the same payload assertion:

```tsx
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

- [ ] **Step 6: Run the focused form tests and confirm they fail**

Run:

```bash
pnpm vitest run src/components/question-form.test.tsx
```

Expected:

- FAIL because the standalone selector still exists
- FAIL because the visible labels are not popup triggers yet
- FAIL because the popup pair list is not implemented yet

- [ ] **Step 7: Commit the failing-test checkpoint**

```bash
git add src/components/question-form.test.tsx
git commit -m "test: cover inline temperament pair picker"
```

## Task 2: Implement the Inline Pair Picker in the Form

**Files:**
- Modify: `src/components/question-form.tsx`
- Modify: `src/lib/ui-copy.ts`

- [ ] **Step 1: Remove the standalone pair selector block**

Delete the current left-side block:

```tsx
<label className="space-y-2 text-sm font-medium text-ink/80">
  <span className="block">{uiCopy.temperamentPair}</span>
  <Select ...>
    ...
  </Select>
</label>
```

The row should contain only:

- Lumina module
- swap button
- Vigila module

- [ ] **Step 2: Add local popup state**

Inside `QuestionFormImpl`, add a small local state for whether the pair menu is open:

```tsx
const [pairMenuOpen, setPairMenuOpen] = useState(false);
```

If you want to remember which side opened it, only do so if necessary for focus management. Do not add extra state that doesn’t affect behavior.

- [ ] **Step 3: Make the visible temperament labels clickable**

Replace the static label rendering inside both mapping cards with a button trigger:

```tsx
<button
  type="button"
  aria-label={uiCopy.chooseTemperamentPair}
  className="rounded-full px-4 py-2 text-lg font-semibold ..."
  onClick={() => setPairMenuOpen((open) => !open)}
>
  {selectedLuminaLabel}
</button>
```

Do the equivalent inside the dark `坤察 / Vigila` card.

Keep the label visually prominent and vertically centered.

- [ ] **Step 4: Render the pair-list popup**

Add a compact popup anchored to the temperament row:

```tsx
{pairMenuOpen ? (
  <div className="absolute right-0 top-full z-20 mt-2 w-56 rounded-2xl border border-black/10 bg-white shadow-[0_18px_44px_rgba(21,21,21,0.12)]">
    <div className="p-2">
      {presetLibrary.TEMPERAMENT_PAIRS.map((pair) => (
        <button
          key={pair.id}
          type="button"
          className="flex w-full items-center rounded-xl px-3 py-2 text-left text-sm hover:bg-black/5"
          onClick={() => {
            setTemperamentPairId(pair.id);
            setLuminaTemperament(pair.options[0]);
            setPairMenuOpen(false);
          }}
        >
          {presetLibrary.getLocalizedTemperamentPairLabel(pair, uiLanguage)}
        </button>
      ))}
    </div>
  </div>
) : null}
```

This is the core rule of the pass:

- selecting a pair sets `pairId`
- selecting a pair resets `luminaTemperament` to the pair’s first option

- [ ] **Step 5: Keep the swap button unchanged in behavior**

The central swap button must continue to:

```tsx
onClick={handleSwapTemperament}
```

No logic changes there.

- [ ] **Step 6: Add any needed localized trigger label**

If needed, extend `src/lib/ui-copy.ts` with:

```ts
chooseTemperamentPair: "Choose temperament pair"
```

and:

```ts
chooseTemperamentPair: "选择性格配对"
```

Use this only for accessible naming or small popup labels. Keep visible UI minimal.

- [ ] **Step 7: Run the focused form tests and make them pass**

Run:

```bash
pnpm vitest run src/components/question-form.test.tsx
```

Expected:

- PASS

- [ ] **Step 8: Commit the implementation checkpoint**

```bash
git add src/components/question-form.tsx src/lib/ui-copy.ts src/components/question-form.test.tsx
git commit -m "feat: add inline temperament pair picker"
```

## Task 3: Re-run Related UI Tests

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

- [ ] **Step 2: If any test still assumes the old standalone selector, update only that expectation**

Examples of stale assumptions:

```tsx
screen.getByLabelText("Temperament pair")
```

or:

```tsx
page.getByLabel("性格配对")
```

Replace them with the new inline-trigger path.

- [ ] **Step 3: Re-run the UI suite after any test-only changes**

Run:

```bash
pnpm vitest run src/components/question-form.test.tsx src/components/session-shell.test.tsx src/app/page.test.ts
```

Expected:

- PASS

- [ ] **Step 4: Commit the UI verification checkpoint**

```bash
git add src/components/question-form.test.tsx src/components/session-shell.test.tsx src/app/page.test.ts
git commit -m "test: align UI coverage with inline pair picker"
```

## Task 4: Update Browser Flow Verification

**Files:**
- Modify: `tests/e2e/session-flow.spec.ts`

- [ ] **Step 1: Replace the old standalone selector path with the popup trigger path**

Update the browser scenario to:

```ts
await page.getByRole("button", { name: "选择性格配对" }).first().click();
await page.getByRole("button", { name: "谨慎 / 激进" }).click();
```

or the English equivalents in the English flow.

- [ ] **Step 2: Keep the swap step after pair selection**

The Chinese flow should still include:

```ts
await page.getByRole("button", { name: "交换个性分配" }).click();
await expect(page.getByText("乾明：激进")).toBeVisible();
await expect(page.getByText("坤察：谨慎")).toBeVisible();
```

- [ ] **Step 3: Run the browser spec**

Run:

```bash
pnpm playwright test tests/e2e/session-flow.spec.ts
```

Expected:

- PASS

- [ ] **Step 4: If selectors are ambiguous, scope them rather than weakening assertions**

Use locators such as:

```ts
heroForm.getByRole("button", { name: "选择性格配对" }).first()
```

and scoped popup locators if needed.

- [ ] **Step 5: Re-run the browser spec**

Run:

```bash
pnpm playwright test tests/e2e/session-flow.spec.ts
```

Expected:

- PASS

- [ ] **Step 6: Commit the browser verification checkpoint**

```bash
git add tests/e2e/session-flow.spec.ts
git commit -m "test: verify inline temperament pair picker flow"
```

## Self-Review

- Spec coverage:
  - standalone selector removed: Task 1 and Task 2
  - visible temperament labels become triggers: Task 1 and Task 2
  - popup shows only pair list: Task 2
  - choosing a pair resets to default orientation: Task 1 and Task 2
  - swap still inverts afterward: Task 1, Task 2, Task 4
- Placeholder scan:
  - no TODO/TBD placeholders remain
- Type consistency:
  - still uses `pairId` and `luminaTemperament`
  - pair selection sets `pairId` plus `pair.options[0]`
  - swap still flips only `luminaTemperament`
