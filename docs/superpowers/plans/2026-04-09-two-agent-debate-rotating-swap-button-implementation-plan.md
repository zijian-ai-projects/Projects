# Two Agent Debate Rotating Swap Button Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refine the compact temperament swap button into a black/white loop-arrow icon that rotates 180 degrees based on the current mapping state while preserving the existing swap behavior and aligned row layout.

**Architecture:** Keep the current swap-button behavior and row layout intact, and replace only the button’s inner visual with a state-derived inline SVG loop-arrow icon. The icon orientation should be computed from `luminaTemperament`, so animation and visible state remain synchronized with the actual mapping.

**Tech Stack:** Next.js, React, TypeScript, Tailwind utility classes, inline SVG, Vitest, Playwright

---

## File Map

- Modify: `src/components/question-form.tsx`
  - Replace the inner taiji mark inside the swap button with a loop-arrow SVG.
  - Add state-derived rotation classes/styles.
- Modify: `src/components/question-form.test.tsx`
  - Add or adjust assertions so the button remains accessible and the swap behavior still works.
- Optionally modify: `tests/e2e/session-flow.spec.ts`
  - Only if the browser spec needs a tighter button locator after the icon refinement.

## Task 1: Update Tests to Lock the Refined Swap Button Behavior

**Files:**
- Modify: `src/components/question-form.test.tsx`

- [ ] **Step 1: Add a test that the swap button still flips mapping labels**

Keep the behavioral expectation explicit:

```tsx
it("keeps the swap button behavior while updating the visible mapping", async () => {
  const user = userEvent.setup();
  render(<QuestionForm onSubmit={vi.fn()} />);

  expect(screen.getByText("Lumina: Cautious")).toBeInTheDocument();
  expect(screen.getByText("Vigila: Aggressive")).toBeInTheDocument();

  await user.click(screen.getByRole("button", { name: "Swap temperament assignment" }));

  expect(screen.getByText("Lumina: Aggressive")).toBeInTheDocument();
  expect(screen.getByText("Vigila: Cautious")).toBeInTheDocument();
});
```

- [ ] **Step 2: Add a failing test that the button exposes a rotatable icon container**

Assert a stable testable hook, such as a `data-testid`, exists on the icon wrapper and reflects state:

```tsx
it("derives the swap icon orientation from the current mapping", async () => {
  const user = userEvent.setup();
  render(<QuestionForm onSubmit={vi.fn()} />);

  const icon = screen.getByTestId("temperament-swap-icon");
  expect(icon).toHaveClass("rotate-0");

  await user.click(screen.getByRole("button", { name: "Swap temperament assignment" }));

  expect(icon).toHaveClass("rotate-180");
});
```

- [ ] **Step 3: Run the focused form tests and confirm the new assertion fails first**

Run:

```bash
pnpm vitest run src/components/question-form.test.tsx
```

Expected:

- FAIL because the new icon hook and rotation class are not implemented yet

- [ ] **Step 4: Commit the failing-test checkpoint**

```bash
git add src/components/question-form.test.tsx
git commit -m "test: cover rotating swap button state"
```

## Task 2: Implement the Rotating Loop-Arrow Icon

**Files:**
- Modify: `src/components/question-form.tsx`

- [ ] **Step 1: Derive a boolean for the current icon orientation**

Add a small derived value near the existing mapping label logic:

```tsx
const swapIconRotated = luminaTemperament === selectedPair.options[1];
```

This must be derived from state, not tracked separately.

- [ ] **Step 2: Replace the inner button mark with an SVG loop-arrow icon**

Inside the existing swap button, replace the current nested span/dot mark with a transformable wrapper plus SVG:

```tsx
<span
  data-testid="temperament-swap-icon"
  aria-hidden
  className={[
    "relative flex h-8 w-8 items-center justify-center transition-transform duration-200 ease-out",
    swapIconRotated ? "rotate-180" : "rotate-0"
  ].join(" ")}
>
  <svg viewBox="0 0 32 32" className="h-8 w-8" fill="none">
    <path
      d="M10 6a10 10 0 0 1 12 3"
      stroke="#151515"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M21 7h3.5v3.5"
      stroke="#151515"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M22 26a10 10 0 0 1-12-3"
      stroke="#FFFFFF"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M11 25H7.5v-3.5"
      stroke="#FFFFFF"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
</span>
```

The exact path geometry can vary, but it must read as a closed-loop exchange and preserve the black-left / white-right split.

- [ ] **Step 3: Keep the outer button footprint unchanged**

Do not change:

- button size
- button placement
- button accessibility label
- row alignment

Only the internal icon and its animation behavior should change in this pass.

- [ ] **Step 4: Ensure the button still triggers the same swap handler**

The button must continue to use the existing swap handler:

```tsx
onClick={handleSwapTemperament}
```

No data-model changes belong in this pass.

- [ ] **Step 5: Run the focused form tests and make them pass**

Run:

```bash
pnpm vitest run src/components/question-form.test.tsx
```

Expected:

- PASS

- [ ] **Step 6: Commit the implementation checkpoint**

```bash
git add src/components/question-form.tsx src/components/question-form.test.tsx
git commit -m "feat: refine rotating swap button icon"
```

## Task 3: Re-run UI and Browser Verification

**Files:**
- Test: `src/components/session-shell.test.tsx`
- Test: `src/app/page.test.ts`
- Test: `tests/e2e/session-flow.spec.ts`

- [ ] **Step 1: Run the related UI tests**

Run:

```bash
pnpm vitest run src/components/question-form.test.tsx src/components/session-shell.test.tsx src/app/page.test.ts
```

Expected:

- PASS

- [ ] **Step 2: Run the browser smoke spec**

Run:

```bash
pnpm playwright test tests/e2e/session-flow.spec.ts
```

Expected:

- PASS

- [ ] **Step 3: If the browser spec needs a tighter swap-button locator, update only that locator**

Use a scoped query like:

```ts
page.getByRole("button", { name: "交换个性分配" })
```

Do not change scenario behavior.

- [ ] **Step 4: Re-run the browser spec after any adjustment**

Run:

```bash
pnpm playwright test tests/e2e/session-flow.spec.ts
```

Expected:

- PASS

- [ ] **Step 5: Commit the verification checkpoint**

```bash
git add src/components/question-form.test.tsx src/components/session-shell.test.tsx src/app/page.test.ts tests/e2e/session-flow.spec.ts
git commit -m "test: verify rotating swap button flow"
```

## Self-Review

- Spec coverage:
  - circular button preserved: Task 2
  - loop-arrow icon with black/white split: Task 2
  - 180-degree state-derived rotation: Task 1 and Task 2
  - no independent animation state: Task 2
  - verification across form and browser: Task 3
- Placeholder scan:
  - no TODO/TBD placeholders remain
- Type consistency:
  - uses existing `luminaTemperament` and `selectedPair.options`
  - keeps `handleSwapTemperament` as the interaction source
