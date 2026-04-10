# Compact Cards And Speaking Order Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the current temperament row with compact side cards, anchored local pair dropdowns, a text-based swap button, and an independent speaking-order toggle that flows through form submission.

**Architecture:** Keep the existing `QuestionForm` as the single UI/state owner for temperament pair, orientation, and model selection, then add a new `firstSpeaker` state alongside the existing preset-selection state. Limit this pass to form rendering, session-input typing, and test coverage so the backend contract only expands by one field.

**Tech Stack:** React, TypeScript, Testing Library, Playwright, Vitest, Tailwind CSS

---

## File Map

- Modify: `src/components/question-form.tsx`
  - Owns the compact side-card layout, local dropdown behavior, swap button, and speaking-order state.
- Modify: `src/components/question-form.test.tsx`
  - Unit coverage for the new compact layout, anchored dropdown behavior, and `firstSpeaker` submission.
- Modify: `src/components/session-shell.tsx`
  - Accepts and forwards `firstSpeaker` through the create-session request.
- Modify: `src/components/session-shell.test.tsx`
  - Confirms the shell submits the expanded payload.
- Modify: `src/lib/ui-copy.ts`
  - Adds localized copy for `First`, `Second`, `先`, `后`, `swap`, and any new aria labels.
- Modify: `src/lib/types.ts`
  - Extends the client-side session input types with `firstSpeaker`.
- Modify: `src/lib/validators.ts`
  - Extends request parsing/validation to allow the new `firstSpeaker` field.
- Modify: `src/app/api/session/route.test.ts`
  - Verifies the route accepts and preserves `firstSpeaker`.
- Modify: `tests/e2e/session-flow.spec.ts`
  - Covers the compact row interaction and confirms the payload contains `firstSpeaker`.

### Task 1: Expand Types And Validation For Speaking Order

**Files:**
- Modify: `src/lib/types.ts`
- Modify: `src/lib/validators.ts`
- Modify: `src/app/api/session/route.test.ts`

- [ ] **Step 1: Write the failing route/validator test**

Add a test case to `src/app/api/session/route.test.ts` asserting the request body now includes `firstSpeaker: "vigila"` and the parsed payload preserves it:

```ts
it("accepts firstSpeaker in the simplified session payload", async () => {
  const request = new Request("http://localhost/api/session", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      question: "Should I move to another city for work?",
      presetSelection: {
        pairId: "cautious-aggressive",
        luminaTemperament: "aggressive"
      },
      firstSpeaker: "vigila",
      language: "en",
      model: "deepseek-chat"
    })
  });

  const response = await POST(request);
  expect(response.status).not.toBe(400);
});
```

- [ ] **Step 2: Run the route test to verify it fails**

Run:

```bash
pnpm vitest run src/app/api/session/route.test.ts
```

Expected: FAIL because `firstSpeaker` is not yet part of the accepted payload shape.

- [ ] **Step 3: Add the minimal type and validator support**

In `src/lib/types.ts`, add a reusable speaker-side type:

```ts
export type SpeakerSide = "lumina" | "vigila";
```

Extend the session-input-facing type to carry it:

```ts
export type SessionPayload = {
  question: string;
  presetSelection: {
    pairId: TemperamentPairId;
    luminaTemperament: TemperamentOption;
  };
  firstSpeaker: SpeakerSide;
  language: UiLanguage;
  model: BuiltInModel;
};
```

In `src/lib/validators.ts`, extend the schema and return value:

```ts
const speakerSideSchema = z.enum(["lumina", "vigila"]);

const sessionInputSchema = z.object({
  question: z.string().min(10),
  presetSelection: z.object({
    pairId: temperamentPairIdSchema,
    luminaTemperament: temperamentOptionSchema
  }),
  firstSpeaker: speakerSideSchema,
  language: uiLanguageSchema,
  model: builtInModelSchema
});
```

- [ ] **Step 4: Run the route test to verify it passes**

Run:

```bash
pnpm vitest run src/app/api/session/route.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/types.ts src/lib/validators.ts src/app/api/session/route.test.ts
git commit -m "feat: add first-speaker session input"
```

### Task 2: Rewrite QuestionForm Tests Around The Compact Cards

**Files:**
- Modify: `src/components/question-form.test.tsx`

- [ ] **Step 1: Write failing tests for the new layout and behavior**

Add or rewrite tests in `src/components/question-form.test.tsx` to cover:

```ts
it("removes the old mapping labels and helper heading", () => {
  render(<QuestionForm onSubmit={vi.fn()} uiLanguage="zh-CN" />);

  expect(screen.queryByText("乾明个性")).not.toBeInTheDocument();
  expect(screen.queryByText("乾明：谨慎")).not.toBeInTheDocument();
  expect(screen.queryByText("坤察：激进")).not.toBeInTheDocument();
});

it("shows speaking-order chips in Chinese", () => {
  render(<QuestionForm onSubmit={vi.fn()} uiLanguage="zh-CN" />);

  expect(screen.getByRole("button", { name: "切换发言顺序" })).toBeInTheDocument();
  expect(screen.getByText("先")).toBeInTheDocument();
  expect(screen.getByText("后")).toBeInTheDocument();
});

it("submits firstSpeaker with the selected side", async () => {
  const user = userEvent.setup();
  const onSubmit = vi.fn().mockResolvedValue(undefined);

  render(<QuestionForm onSubmit={onSubmit} />);

  await user.type(screen.getByLabelText("Decision question"), "Should I move to another city?");
  await user.click(screen.getByRole("button", { name: "Toggle speaking order" }));
  await user.click(screen.getByRole("button", { name: "Start debate" }));

  expect(onSubmit).toHaveBeenCalledWith(
    expect.objectContaining({
      firstSpeaker: "vigila"
    })
  );
});
```

- [ ] **Step 2: Run the form test file to verify it fails**

Run:

```bash
pnpm vitest run src/components/question-form.test.tsx
```

Expected: FAIL because the current component still renders the old mapping labels and has no speaking-order control.

- [ ] **Step 3: Implement only the test updates needed for the new behavior target**

Rewrite the existing stale assertions so they reflect the intended compact-card UI:

- remove checks for `乾明个性`, `乾明：...`, `坤察：...`
- add checks for the new order chips and localized swap text
- add checks that the pair list opens from the local temperament button and closes after selection

Keep the submit assertion explicit:

```ts
expect(onSubmit).toHaveBeenCalledWith({
  question: "Should I move to another city?",
  presetSelection: {
    pairId: "cautious-aggressive",
    luminaTemperament: "cautious"
  },
  firstSpeaker: "vigila",
  language: "en",
  model: "deepseek-chat"
});
```

- [ ] **Step 4: Run the form test file to capture the expected red state**

Run:

```bash
pnpm vitest run src/components/question-form.test.tsx
```

Expected: FAIL on missing compact-card and speaking-order behavior.

- [ ] **Step 5: Commit**

```bash
git add src/components/question-form.test.tsx
git commit -m "test: define compact card temperament interaction"
```

### Task 3: Implement The Compact Side Cards And Local Dropdown

**Files:**
- Modify: `src/components/question-form.tsx`
- Modify: `src/lib/ui-copy.ts`

- [ ] **Step 1: Implement the minimal localized copy additions**

In `src/lib/ui-copy.ts`, add localized strings for:

```ts
swapText: "swap"
swapTextZh: "换"
firstSpeaker: "First"
secondSpeaker: "Second"
firstSpeakerZh: "先"
secondSpeakerZh: "后"
toggleSpeakingOrder: "Toggle speaking order"
toggleSpeakingOrderZh: "切换发言顺序"
```

Use the project’s existing `getUiCopy()` structure rather than introducing a new copy file.

- [ ] **Step 2: Add component state for speaking order and local dropdown anchoring**

In `src/components/question-form.tsx`, add:

```ts
const [firstSpeaker, setFirstSpeaker] = useState<SpeakerSide>("lumina");
const [pairMenuAnchor, setPairMenuAnchor] = useState<"lumina" | "vigila" | null>(null);
```

Derive:

```ts
const pairMenuOpen = pairMenuAnchor !== null;
```

and use helper callbacks:

```ts
const openPairMenu = (anchor: SpeakerSide) => setPairMenuAnchor(anchor);
const closePairMenu = () => setPairMenuAnchor(null);
const toggleSpeakingOrder = () =>
  setFirstSpeaker((current) => (current === "lumina" ? "vigila" : "lumina"));
```

- [ ] **Step 3: Replace the current card body with the compact layout**

In `src/components/question-form.tsx`, change each side card to:

```tsx
<section className="rounded-3xl border ... p-3 shadow-sm">
  <div className="flex min-h-[56px] items-center justify-between gap-3">
    <div className="min-w-0">
      <div className="text-sm font-semibold ...">{luminaIdentity.name}</div>
      <div className="text-[11px] uppercase tracking-[0.16em] ...">
        {luminaIdentity.descriptor}
      </div>
    </div>
    <div className="flex items-center gap-2">
      <button
        type="button"
        aria-label={uiCopy.toggleSpeakingOrder}
        className="rounded-full ..."
        onClick={toggleSpeakingOrder}
      >
        {firstSpeaker === "lumina" ? uiCopy.firstSpeaker : uiCopy.secondSpeaker}
      </button>
      <div
        className="relative"
        onMouseLeave={closePairMenu}
      >
        <button
          type="button"
          aria-label={uiCopy.chooseTemperamentPair}
          aria-haspopup="menu"
          aria-expanded={pairMenuAnchor === "lumina"}
          onMouseEnter={() => openPairMenu("lumina")}
          onClick={() => openPairMenu("lumina")}
          className="rounded-full ..."
        >
          {selectedLuminaLabel}
        </button>
        {pairMenuAnchor === "lumina" ? <PairMenu /> : null}
      </div>
    </div>
  </div>
</section>
```

Mirror the same structure for `vigila`, using inverted colors and the opposite order-chip label.

Remove entirely:

- `乾明个性`
- `乾明：...`
- `坤察：...`
- the old row-level `relative` popup placement
- the arrow-based swap icon

- [ ] **Step 4: Replace the central swap button content**

Keep the central circular button, but change the visible content to localized text:

```tsx
<Button
  type="button"
  variant="ghost"
  aria-label={uiCopy.swapTemperamentAssignment}
  className="h-[64px] w-[64px] rounded-full ..."
  onClick={handleSwapTemperament}
>
  <span className="text-sm font-semibold uppercase tracking-[0.08em]">
    {uiLanguage === "zh-CN" ? "换" : "swap"}
  </span>
</Button>
```

Do not keep the old SVG arrows in this pass.

- [ ] **Step 5: Implement the local dropdown so it anchors to the clicked/hovered button**

Render the menu inside each temperament-button wrapper instead of below the full row:

```tsx
{pairMenuAnchor === "lumina" ? (
  <div
    id="temperament-pair-menu"
    role="menu"
    aria-label={uiCopy.chooseTemperamentPair}
    className="absolute right-0 top-full z-20 mt-2 w-max min-w-[12rem] rounded-2xl border border-black/10 bg-white p-2 shadow-xl"
    onMouseEnter={() => openPairMenu("lumina")}
  >
    {presetLibrary.TEMPERAMENT_PAIRS.map((pair) => (
      <button
        key={pair.id}
        type="button"
        className="flex w-full rounded-xl px-3 py-2 text-left text-sm hover:bg-black/5"
        onClick={() => {
          setTemperamentPairId(pair.id);
          setLuminaTemperament(pair.options[0]);
          closePairMenu();
        }}
      >
        {presetLibrary.getLocalizedTemperamentPairLabel(pair.id, uiLanguage)}
      </button>
    ))}
  </div>
) : null}
```

Mirror for `vigila`, but keep the same orientation reset rule.

- [ ] **Step 6: Include `firstSpeaker` in form submission**

Update the `SessionInput` payload creation in `src/components/question-form.tsx`:

```ts
const input: SessionInput = {
  question: trimmedQuestion,
  presetSelection: {
    pairId: temperamentPairId,
    luminaTemperament
  },
  firstSpeaker,
  language: uiLanguage,
  model
};
```

- [ ] **Step 7: Run the form tests to verify they pass**

Run:

```bash
pnpm vitest run src/components/question-form.test.tsx
```

Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add src/components/question-form.tsx src/lib/ui-copy.ts src/components/question-form.test.tsx
git commit -m "feat: add compact temperament cards and speaking order"
```

### Task 4: Thread `firstSpeaker` Through The Shell

**Files:**
- Modify: `src/components/session-shell.tsx`
- Modify: `src/components/session-shell.test.tsx`

- [ ] **Step 1: Write the failing shell test**

Add a test in `src/components/session-shell.test.tsx` that submits a session with `firstSpeaker: "vigila"` and asserts the fetch body preserves it:

```ts
expect(fetchMock).toHaveBeenCalledWith(
  "/api/session",
  expect.objectContaining({
    body: JSON.stringify(
      expect.objectContaining({
        firstSpeaker: "vigila"
      })
    )
  })
);
```

- [ ] **Step 2: Run the shell test to verify it fails**

Run:

```bash
pnpm vitest run src/components/session-shell.test.tsx
```

Expected: FAIL because `firstSpeaker` is not yet forwarded through the shell request path.

- [ ] **Step 3: Update the shell request payload**

In `src/components/session-shell.tsx`, extend the local session-input/request type and request body:

```ts
const payload = {
  question: input.question,
  presetSelection: input.presetSelection,
  firstSpeaker: input.firstSpeaker,
  language: input.language,
  model: input.model
};
```

- [ ] **Step 4: Run the shell test to verify it passes**

Run:

```bash
pnpm vitest run src/components/session-shell.test.tsx
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/session-shell.tsx src/components/session-shell.test.tsx
git commit -m "feat: forward first-speaker session payload"
```

### Task 5: Update The Browser Flow And Final Verification

**Files:**
- Modify: `tests/e2e/session-flow.spec.ts`

- [ ] **Step 1: Update the e2e test to use the new compact controls**

In `tests/e2e/session-flow.spec.ts`, replace old assertions/interactions with:

```ts
await expect(page.getByText("乾明个性")).toHaveCount(0);
await expect(page.getByText("乾明：谨慎")).toHaveCount(0);
await expect(page.getByText("坤察：激进")).toHaveCount(0);

await page.getByRole("button", { name: "选择性格配对" }).first().hover();
await page.getByRole("button", { name: "谨慎 / 激进" }).click();
await page.getByRole("button", { name: "切换发言顺序" }).first().click();
```

and assert the request body includes:

```ts
expect(createSessionBody).toMatchObject({
  firstSpeaker: "vigila"
});
```

- [ ] **Step 2: Run the browser spec to verify it fails**

Run:

```bash
pnpm playwright test tests/e2e/session-flow.spec.ts
```

Expected: FAIL until the new control names and payload are fully wired.

- [ ] **Step 3: Make the minimal spec-alignment adjustments**

If the browser test reveals locator drift, update only the selector text or sequencing needed to match the implemented compact layout. Do not expand scope beyond this pass.

- [ ] **Step 4: Run the full targeted verification**

Run:

```bash
pnpm vitest run src/components/question-form.test.tsx src/components/session-shell.test.tsx src/app/page.test.ts src/app/api/session/route.test.ts
pnpm playwright test tests/e2e/session-flow.spec.ts
```

Expected:

- Vitest: all targeted tests pass
- Playwright: `2/2` specs pass

- [ ] **Step 5: Commit**

```bash
git add tests/e2e/session-flow.spec.ts src/components/question-form.test.tsx src/components/session-shell.test.tsx src/app/api/session/route.test.ts
git commit -m "test: cover compact cards and speaking order flow"
```

## Self-Review

- Spec coverage:
  - compact side cards: Task 3
  - local hover/click dropdown: Task 3
  - text-based swap button: Task 3
  - speaking-order toggle: Tasks 1, 3, 4, 5
  - payload adds `firstSpeaker`: Tasks 1, 4, 5
- Placeholder scan: no `TODO`, `TBD`, or underspecified “handle appropriately” steps remain.
- Type consistency:
  - `firstSpeaker` is consistently `"lumina" | "vigila"`
  - existing `presetSelection.pairId` and `presetSelection.luminaTemperament` names are preserved
