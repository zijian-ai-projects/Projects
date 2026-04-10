# Two Agent Debate Taiji Temperament Control Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the current temperament-assignment radio cards with a taiji-inspired binary mapping control, while removing the redundant side-copy lines and preserving the existing submission payload.

**Architecture:** Keep the current `QuestionForm` data flow intact and redesign only the assignment surface. The new control should remain semantically accessible by preserving an underlying radio-group model, while rendering a more compact taiji-inspired interaction with visible mapping labels for both sides.

**Tech Stack:** Next.js, React, TypeScript, Vitest, Testing Library, Tailwind utility classes

---

## File Map

- Modify: `src/components/question-form.tsx`
  - Replace the current assignment-card block with a taiji-inspired selector.
  - Remove the two descriptive paragraphs under the Lumina/Vigila identity cards.
  - Keep `presetSelection` submission behavior unchanged.
- Modify: `src/lib/ui-copy.ts`
  - Add any small copy strings needed for the new mapping labels if the implementation cannot reuse current strings cleanly.
- Modify: `src/components/question-form.test.tsx`
  - Replace tests that assume the old assignment-card UI.
  - Add assertions for removed copy, visible mapping labels, and unchanged submit payload.

## Task 1: Lock the Removed Copy and Mapping Behavior in Tests

**Files:**
- Modify: `src/components/question-form.test.tsx`

- [ ] **Step 1: Write failing tests for removed helper copy**

Add assertions that the old descriptive lines are absent:

```tsx
it("removes the redundant side helper copy", () => {
  render(<QuestionForm onSubmit={vi.fn()} uiLanguage="zh-CN" />);

  expect(screen.queryByText("乾明始终固定在这组配对中的建设性一侧。")).not.toBeInTheDocument();
  expect(screen.queryByText(/坤察会自动获得/)).not.toBeInTheDocument();
});
```

- [ ] **Step 2: Add failing tests for visible mapping labels**

Add a test that expects concise side mapping labels instead of the old duplicated option text:

```tsx
it("shows concise side mapping labels for the selected pair", () => {
  render(<QuestionForm onSubmit={vi.fn()} uiLanguage="zh-CN" />);

  expect(screen.getByText("乾明：谨慎")).toBeInTheDocument();
  expect(screen.getByText("坤察：激进")).toBeInTheDocument();
});
```

- [ ] **Step 3: Add a failing test for mapping reversal**

Use the new accessible control names you intend to implement and verify that flipping the selection swaps the two labels:

```tsx
it("flips the visible side mapping when the opposite temperament is selected", async () => {
  const user = userEvent.setup();
  render(<QuestionForm onSubmit={vi.fn()} />);

  await user.click(screen.getByRole("radio", { name: /Assign Aggressive to Lumina/i }));

  expect(screen.getByText("Lumina: Aggressive")).toBeInTheDocument();
  expect(screen.getByText("Vigila: Cautious")).toBeInTheDocument();
});
```

- [ ] **Step 4: Keep the submit payload assertion and adjust its interaction path**

Update the existing submit test so it uses the new control instead of the old card label text:

```tsx
await user.click(screen.getByRole("radio", { name: /Assign Benefit-focused to Lumina/i }));

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

- [ ] **Step 5: Run the focused test file and confirm failure**

Run:

```bash
pnpm vitest run src/components/question-form.test.tsx
```

Expected:

- FAIL because the old helper paragraphs still render
- FAIL because the new mapping labels and accessible radio names do not exist yet

- [ ] **Step 6: Commit the failing-test checkpoint**

```bash
git add src/components/question-form.test.tsx
git commit -m "test: cover taiji temperament control behavior"
```

## Task 2: Implement the Taiji-Inspired Assignment Control

**Files:**
- Modify: `src/components/question-form.tsx`
- Modify: `src/lib/ui-copy.ts`

- [ ] **Step 1: Remove the old helper paragraphs under the identity cards**

Delete only the descriptive `<p>` blocks under the Lumina and Vigila cards. The identity headers and pills stay in place.

Target removal in `src/components/question-form.tsx`:

```tsx
<p className="mt-3 text-sm leading-6 text-ink/68">
  {uiLanguage === "en"
    ? "Lumina stays fixed on the constructive side of the pair."
    : "乾明始终固定在这组配对中的建设性一侧。"}
</p>
```

and

```tsx
<p className="mt-3 text-sm leading-6 text-white">
  {uiLanguage === "en"
    ? `Vigila receives ${selectedVigilaLabel} automatically.`
    : `坤察会自动获得 ${selectedVigilaLabel}。`}
</p>
```

- [ ] **Step 2: Add concise mapping labels near the assignment control**

Inside the assignment fieldset, add two visible mapping labels:

```tsx
<div className="grid grid-cols-2 gap-3 text-sm">
  <div className="rounded-2xl border border-black/8 bg-white/72 px-4 py-3">
    <span className="block text-xs uppercase tracking-[0.14em] text-ink/50">
      {luminaIdentity.name}
    </span>
    <span className="mt-1 block font-medium text-ink">{selectedLuminaLabel}</span>
  </div>
  <div className="rounded-2xl border border-black bg-black px-4 py-3">
    <span className="block text-xs uppercase tracking-[0.14em] text-white/72">
      {vigilaIdentity.name}
    </span>
    <span className="mt-1 block font-medium text-white">{selectedVigilaLabel}</span>
  </div>
</div>
```

- [ ] **Step 3: Replace the assignment-card grid with a taiji-inspired radio control**

Implement a custom-styled control while keeping radio semantics. One workable shape is:

```tsx
<div className="flex items-center justify-center">
  <div className="relative">
    {selectedPair.options.map((temperament, index) => {
      const temperamentLabel = presetLibrary.getLocalizedTemperamentOptionLabel(temperament, uiLanguage);
      const active = temperament === luminaTemperament;
      const darkSide = index === 1;

      return (
        <label
          key={temperament}
          className={[
            "absolute inset-0 cursor-pointer rounded-full focus-within:ring-2 focus-within:ring-accent/40",
            darkSide ? "" : ""
          ].join(" ")}
          style={{
            clipPath: darkSide
              ? "path('M60,8 A52,52 0 1,1 60,112 A26,26 0 1,0 60,60 A26,26 0 1,1 60,8 Z')"
              : "path('M60,8 A52,52 0 1,0 60,112 A26,26 0 1,1 60,60 A26,26 0 1,0 60,8 Z')"
          }}
        >
          <input
            type="radio"
            name="luminaTemperament"
            value={temperament}
            checked={active}
            onChange={() => setLuminaTemperament(temperament)}
            aria-label={`Assign ${temperamentLabel} to ${luminaIdentity.name}`}
            className="sr-only"
          />
        </label>
      );
    })}
    <svg aria-hidden viewBox="0 0 120 120" className="h-28 w-28">
      {/* render light/dark taiji body and small dots here */}
    </svg>
  </div>
</div>
```

The exact SVG or overlay implementation can vary, but the result must:

- remain clickable on either side
- show the active Lumina side clearly
- preserve two radio options with stable accessible names

- [ ] **Step 4: Keep the accessible legend but tighten its visual role**

Retain the fieldset and legend so screen readers still understand the group:

```tsx
<fieldset className="space-y-4">
  <legend className="block text-sm font-medium text-ink/80">{uiCopy.luminaReceives}</legend>
  {/* mapping labels */}
  {/* taiji selector */}
</fieldset>
```

Do not keep the old duplicated label cards inside this fieldset.

- [ ] **Step 5: Add any missing copy keys only if necessary**

If the implementation needs explicit localized templates for mapping labels, add them to `src/lib/ui-copy.ts`. Prefer to reuse `luminaIdentity.name`, `vigilaIdentity.name`, and localized temperament labels before adding new strings.

- [ ] **Step 6: Run the focused tests and make them pass**

Run:

```bash
pnpm vitest run src/components/question-form.test.tsx
```

Expected:

- PASS for the form test file

- [ ] **Step 7: Commit the implementation checkpoint**

```bash
git add src/components/question-form.tsx src/lib/ui-copy.ts src/components/question-form.test.tsx
git commit -m "feat: add taiji temperament selector"
```

## Task 3: Verify the Control Still Integrates With the Page Shell

**Files:**
- Test: `src/components/question-form.test.tsx`
- Test: `src/components/session-shell.test.tsx`
- Test: `src/app/page.test.ts`

- [ ] **Step 1: Run the related shell and page tests**

Run:

```bash
pnpm vitest run src/components/question-form.test.tsx src/components/session-shell.test.tsx src/app/page.test.ts
```

Expected:

- PASS with no regressions from the new control shape

- [ ] **Step 2: If a shell test still assumes the old helper copy, update that assertion**

The shell tests should not look for:

```tsx
"乾明始终固定在这组配对中的建设性一侧。"
```

or:

```tsx
/坤察会自动获得/
```

If present, replace those assumptions with the new visible mapping labels.

- [ ] **Step 3: Re-run the shell/page suite after any needed test edits**

Run:

```bash
pnpm vitest run src/components/question-form.test.tsx src/components/session-shell.test.tsx src/app/page.test.ts
```

Expected:

- PASS for all targeted UI tests

- [ ] **Step 4: Commit the verification/test-alignment checkpoint**

```bash
git add src/components/question-form.test.tsx src/components/session-shell.test.tsx src/app/page.test.ts
git commit -m "test: align shell coverage with taiji selector"
```

## Task 4: Final Browser-Level Verification

**Files:**
- Test: `tests/e2e/session-flow.spec.ts`

- [ ] **Step 1: Run the existing session smoke flow**

Run:

```bash
pnpm playwright test tests/e2e/session-flow.spec.ts
```

Expected:

- PASS
- no breakage in question entry, language switching, model selection, or session start flow

- [ ] **Step 2: If the browser spec fails on old visible text, update only the exact expectations**

Do not broaden the scenario. Only replace stale text expectations tied to the removed helper paragraphs or the old assignment-card layout.

- [ ] **Step 3: Re-run the Playwright spec after any adjustment**

Run:

```bash
pnpm playwright test tests/e2e/session-flow.spec.ts
```

Expected:

- PASS

- [ ] **Step 4: Commit the final verification checkpoint**

```bash
git add tests/e2e/session-flow.spec.ts
git commit -m "test: verify taiji temperament selector flow"
```

## Self-Review

- Spec coverage:
  - remove redundant side copy: covered in Task 1 and Task 2
  - taiji-inspired control replacing radio cards: covered in Task 2
  - preserve payload shape: covered in Task 1 and Task 2
  - preserve accessibility: covered in Task 1 and Task 2
  - verify integration and browser flow: covered in Task 3 and Task 4
- Placeholder scan:
  - no `TODO`, `TBD`, or “similar to” placeholders remain
- Type consistency:
  - plan keeps `pairId` and `luminaTemperament`
  - plan keeps `QuestionForm` as the only component with state changes for this pass
