# Control Row Cleanup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refine the compact side-card controls so the speaking-order chips sit to the left of the temperament buttons, the temperament dropdown stays locally anchored without expanding the card, the center swap button becomes black with white text and no rotation, and the `坤察 / Vigila` supporting text is clearly readable.

**Architecture:** Keep the existing compact two-card structure and local dropdown state in `QuestionForm`, but tighten the row layout and dropdown positioning instead of redesigning the control model again. Limit this pass to the form component and its focused tests so behavior changes stay isolated from the runtime and shell flows.

**Tech Stack:** React, TypeScript, Tailwind CSS, Testing Library, Vitest

---

## File Map

- Modify: `src/components/question-form.tsx`
  - Owns the card-row layout, anchored dropdown behavior, speaking-order chips, swap button styling, and contrast classes.
- Modify: `src/components/question-form.test.tsx`
  - Verifies chip placement/behavior assumptions, local dropdown behavior, non-rotating swap text, and contrast-related class expectations.

### Task 1: Rewrite Focused Form Tests For The Cleanup Pass

**Files:**
- Modify: `src/components/question-form.test.tsx`

- [ ] **Step 1: Write the failing tests for the updated control row**

Update `src/components/question-form.test.tsx` to express the new behavior:

```ts
it("places the speaking-order chip before the temperament button in each card", () => {
  render(<QuestionForm onSubmit={vi.fn()} uiLanguage="zh-CN" />);

  const luminaCard = screen.getByText("乾明").closest("section");
  const luminaButtons = within(luminaCard as HTMLElement).getAllByRole("button");

  expect(luminaButtons[0]).toHaveTextContent("先");
  expect(luminaButtons[1]).toHaveTextContent("谨慎");
});

it("lets either visible order chip flip the speaking order", async () => {
  const user = userEvent.setup();
  render(<QuestionForm onSubmit={vi.fn()} uiLanguage="en" />);

  await user.click(screen.getByRole("button", { name: "Second" }));
  expect(screen.getByRole("button", { name: "Second" })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "First" })).toBeInTheDocument();
});

it("renders a black center swap button with white text and no rotation class changes", async () => {
  const user = userEvent.setup();
  render(<QuestionForm onSubmit={vi.fn()} uiLanguage="zh-CN" />);

  const swapButton = screen.getByRole("button", { name: "交换个性分配" });
  const swapText = screen.getByText("换");

  expect(swapButton).toHaveClass("bg-black");
  expect(swapButton).toHaveClass("text-white");
  expect(swapText).not.toHaveClass("rotate-180");

  await user.click(swapButton);

  expect(swapText).not.toHaveClass("rotate-180");
});
```

- [ ] **Step 2: Run the focused test file to verify it fails**

Run:

```bash
pnpm vitest run src/components/question-form.test.tsx
```

Expected: FAIL because the current row order, swap button styling, and/or rotation assumptions still reflect the previous implementation.

- [ ] **Step 3: Extend the tests for dropdown anchoring and Vigila contrast**

Add assertions that stay implementation-focused but still capture the requested behavior:

```ts
it("shows the pair menu inside the local temperament control region instead of the whole card", async () => {
  const user = userEvent.setup();
  render(<QuestionForm onSubmit={vi.fn()} uiLanguage="zh-CN" />);

  const trigger = screen.getByRole("button", { name: "谨慎" });
  await user.click(trigger);

  const menu = screen.getByRole("menu", { name: "选择性格配对" });
  expect(trigger.parentElement).toContainElement(menu);
});

it("uses white supporting text in the Vigila card", () => {
  render(<QuestionForm onSubmit={vi.fn()} uiLanguage="zh-CN" />);

  const descriptor = screen.getByText("驳论审视");
  expect(descriptor).toHaveClass("text-white");
});
```

- [ ] **Step 4: Run the focused test file again to capture the red state**

Run:

```bash
pnpm vitest run src/components/question-form.test.tsx
```

Expected: FAIL for the unimplemented cleanup behavior.

- [ ] **Step 5: Commit**

```bash
git add src/components/question-form.test.tsx
git commit -m "test: define control row cleanup behavior"
```

### Task 2: Implement The Control Row Cleanup In QuestionForm

**Files:**
- Modify: `src/components/question-form.tsx`

- [ ] **Step 1: Reorder the row controls inside each side card**

Adjust the side-card control row so the speaking-order chip is rendered before the temperament trigger:

```tsx
<div className="flex items-center justify-end gap-2">
  <button
    type="button"
    className="rounded-full ..."
    onClick={toggleSpeakingOrder}
  >
    {getOrderLabel("lumina")}
  </button>
  <div className="relative">
    <button
      type="button"
      aria-haspopup="menu"
      ...
    >
      {selectedLuminaLabel}
    </button>
    {renderPairMenu("lumina", false)}
  </div>
</div>
```

Mirror the same left-chip / right-button order in the `坤察 / Vigila` card.

- [ ] **Step 2: Make both visible order chips act as toggles**

Replace side-specific setters like `setFirstSpeaker("lumina")` with a single toggle helper:

```ts
const toggleSpeakingOrder = () => {
  setFirstSpeaker((current) => (current === "lumina" ? "vigila" : "lumina"));
};
```

Wire both order buttons to the same toggle:

```tsx
onClick={toggleSpeakingOrder}
```

This ensures either `先 / 后` or `First / Second` flips the order.

- [ ] **Step 3: Anchor the dropdown under the temperament button without affecting card size**

Keep the dropdown rendered inside the local trigger wrapper, but make the wrapper no larger than the trigger itself:

```tsx
<div
  ref={luminaPairMenuRegionRef}
  className="relative inline-flex flex-col items-end"
  onMouseEnter={() => openPairMenu("lumina")}
  onMouseLeave={() => schedulePairMenuClose("lumina")}
>
  <button ...>{selectedLuminaLabel}</button>
  {renderPairMenu("lumina", false)}
</div>
```

And tighten the menu positioning:

```tsx
className="absolute right-0 top-full z-20 mt-2 min-w-[13rem] rounded-2xl ..."
```

Do not leave the menu in normal document flow under the card.

- [ ] **Step 4: Restyle the center swap button and remove text rotation**

Update the center button:

```tsx
<Button
  type="button"
  aria-label={uiCopy.swapTemperamentAssignment}
  className="h-[58px] w-[58px] shrink-0 rounded-full border border-black bg-black p-0 text-white hover:bg-black/90"
  onClick={handleSwapTemperament}
>
  <span className="flex h-full w-full items-center justify-center text-sm font-semibold tracking-[0.04em] text-white">
    {uiCopy.swapButtonText}
  </span>
</Button>
```

Remove the `rotate-0` / `rotate-180` behavior entirely from the visible text node in this pass.

- [ ] **Step 5: Increase Vigila supporting-text contrast**

Make the lower text in the black card clearly readable:

```tsx
<div className="text-[11px] uppercase tracking-[0.16em] text-white">
  {vigilaIdentity.descriptor}
</div>
```

If any other supporting text remains inside the black card, give it `text-white` or `text-white/90`, not dim gray.

- [ ] **Step 6: Run the focused form tests to verify they pass**

Run:

```bash
pnpm vitest run src/components/question-form.test.tsx
```

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/components/question-form.tsx src/components/question-form.test.tsx
git commit -m "feat: refine control row layout and contrast"
```

### Task 3: Final Focused Verification

**Files:**
- Modify: `src/components/question-form.test.tsx` only if selector drift requires tiny alignment fixes

- [ ] **Step 1: Run the broader focused UI verification**

Run:

```bash
pnpm vitest run src/components/question-form.test.tsx src/components/session-shell.test.tsx src/app/page.test.ts
```

Expected: all targeted tests pass.

- [ ] **Step 2: If needed, make minimal assertion updates**

If the broader run reveals any stale assumption caused by the cleanup pass, limit changes to the smallest needed test updates. Do not expand scope beyond the form-row cleanup.

- [ ] **Step 3: Re-run the broader focused UI verification**

Run:

```bash
pnpm vitest run src/components/question-form.test.tsx src/components/session-shell.test.tsx src/app/page.test.ts
```

Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add src/components/question-form.tsx src/components/question-form.test.tsx
git commit -m "test: verify control row cleanup"
```

## Self-Review

- Spec coverage:
  - chip placement and toggling: Task 2
  - anchored dropdown without card resize: Task 2
  - black/white center swap button without rotation: Task 2
  - Vigila contrast fix: Task 2
  - focused verification: Task 3
- Placeholder scan: no `TODO`, `TBD`, or vague “handle appropriately” steps remain.
- Type consistency: this plan does not alter payload types or runtime interfaces; it only updates the form layout and its tests.
