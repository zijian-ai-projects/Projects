# Two Agent Debate System-Provided DeepSeek Models Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace user-managed model configuration with a simple built-in DeepSeek model selector, remove `Advanced settings` from the UI, and update the hero so the taiji sits with the product name as one lockup.

**Architecture:** Keep the current Next.js app shape, but change the client/server contract from “user submits provider credentials” to “user selects one built-in model.” The form becomes a product-facing workflow again, while the runtime owns the fixed DeepSeek provider config and maps the selected model to server-side credentials.

**Tech Stack:** Next.js App Router, React, TypeScript, Vitest, Playwright

---

## File Structure

### Existing files to modify

- `src/components/question-form.tsx`
  - Remove the advanced-settings path, expose a main-form DeepSeek model selector, and submit only the selected model plus the existing question/preset/language fields.
- `src/components/session-shell.tsx`
  - Keep the hero lockup coherent after the form simplification and move the taiji into the brand row to the left of the product name.
- `src/lib/types.ts`
  - Replace the user-facing provider-config input shape with a built-in selected-model shape while preserving runtime-facing provider types where still needed.
- `src/lib/ui-copy.ts`
  - Remove copy that only exists for advanced settings and add copy for the visible built-in model selector.
- `src/lib/validators.ts`
  - Update request validation to accept the simplified session payload and selected built-in DeepSeek model.
- `src/server/runtime.ts`
  - Map the selected built-in model to the fixed DeepSeek base URL and server-owned API key when creating sessions and runtime operations.
- `src/app/api/session/route.ts`
  - Accept the new session payload shape and preserve diagnosis behavior.
- `src/components/question-form.test.tsx`
  - Replace advanced-settings assertions with tests for the visible built-in model selector and simplified submission payload.
- `src/components/session-shell.test.tsx`
  - Update end-to-end form payload assertions and hero-lockup assertions.
- `src/app/page.test.ts`
  - Cover the taiji + brand lockup and the absence of advanced-settings UI.
- `tests/e2e/session-flow.spec.ts`
  - Update the browser flow to use the simplified surface, assert the model selector is visible, and verify the session payload no longer carries raw provider credentials.

### Existing files that may be removed or simplified

- `src/components/advanced-settings.tsx`
  - Remove entirely if it becomes unused, or reduce it to nothing if the repository prefers staged deletion.
- `src/app/api/runtime/test-model/route.ts`
  - Remove if no longer used anywhere after the UI simplification.
- `src/app/api/runtime/test-model/route.test.ts`
  - Remove if the endpoint is deleted.

## Task 1: Replace Advanced Settings With a Built-In Model Selector

**Files:**
- Modify: `src/components/question-form.tsx`
- Modify: `src/lib/ui-copy.ts`
- Test: `src/components/question-form.test.tsx`

- [ ] **Step 1: Write the failing UI test**

Add or replace tests in `src/components/question-form.test.tsx` so they assert:

- `Advanced settings` is not rendered
- a visible `Model` selector is rendered in the main form
- the selector options are `deepseek-chat` and `deepseek-reasoner`

Use an assertion shape like:

```tsx
it("renders a built-in DeepSeek model selector without advanced settings", () => {
  render(<QuestionForm onSubmit={vi.fn()} />);

  expect(screen.queryByText("Advanced settings")).not.toBeInTheDocument();
  expect(screen.getByLabelText("Model")).toBeInTheDocument();
  expect(screen.getByRole("option", { name: "deepseek-chat" })).toBeInTheDocument();
  expect(screen.getByRole("option", { name: "deepseek-reasoner" })).toBeInTheDocument();
});
```

- [ ] **Step 2: Run the focused test to verify it fails**

Run: `pnpm vitest run src/components/question-form.test.tsx`

Expected: FAIL because the current form still exposes `Advanced settings` and provider-config UI.

- [ ] **Step 3: Implement the minimal form/UI change**

Update `src/components/question-form.tsx` and `src/lib/ui-copy.ts` so that:

- the form no longer renders `AdvancedSettings`
- debate language stays only if you still need it for session output; do not reintroduce operator controls
- a main-form `Model` selector is visible
- the visible model options are:

```ts
const BUILT_IN_MODELS = ["deepseek-chat", "deepseek-reasoner"] as const;
```

- [ ] **Step 4: Run the focused test to verify it passes**

Run: `pnpm vitest run src/components/question-form.test.tsx`

Expected: PASS with the simplified UI covered.

## Task 2: Change the Client Payload From Provider Config to Selected Model

**Files:**
- Modify: `src/lib/types.ts`
- Modify: `src/lib/validators.ts`
- Modify: `src/components/question-form.tsx`
- Modify: `src/components/session-shell.tsx`
- Test: `src/components/question-form.test.tsx`
- Test: `src/components/session-shell.test.tsx`

- [ ] **Step 1: Write the failing payload test**

Update the existing submit assertion in `src/components/question-form.test.tsx` or `src/components/session-shell.test.tsx` so it expects:

```ts
{
  question: "Should I move to another city?",
  presetSelection: {
    pairId: "cautious-aggressive",
    luminaTemperament: "cautious"
  },
  language: "en",
  model: "deepseek-chat"
}
```

and does **not** expect:

- `config.providerBaseUrl`
- `config.providerApiKey`
- `config.providerModel`

- [ ] **Step 2: Run the focused tests to verify they fail**

Run: `pnpm vitest run src/components/question-form.test.tsx src/components/session-shell.test.tsx`

Expected: FAIL because the current payload still includes provider config.

- [ ] **Step 3: Implement the new payload contract**

Update the client-facing types and validators so the session input becomes:

```ts
export type BuiltInModel = "deepseek-chat" | "deepseek-reasoner";

export type SessionInput = {
  question: string;
  presetSelection: DebatePresetSelection;
  language: AppLanguage;
  model: BuiltInModel;
};
```

Update form submission and shell expectations to match.

- [ ] **Step 4: Run the focused tests to verify they pass**

Run: `pnpm vitest run src/components/question-form.test.tsx src/components/session-shell.test.tsx`

Expected: PASS with the simplified payload covered.

## Task 3: Map the Selected Model to Fixed DeepSeek Runtime Config

**Files:**
- Modify: `src/server/runtime.ts`
- Modify: `src/app/api/session/route.ts`
- Modify: `src/lib/types.ts`
- Test: `src/app/api/session/route.test.ts`
- Test: `src/server/runtime.test.ts`

- [ ] **Step 1: Write the failing runtime test**

Add a test in `src/server/runtime.test.ts` or `src/app/api/session/route.test.ts` that proves the selected built-in model is translated into the fixed DeepSeek provider config server-side.

Expected provider values:

```ts
{
  baseUrl: "https://api.deepseek.com",
  model: "deepseek-chat" // or deepseek-reasoner based on selection
}
```

The API key should come from the server/runtime path and should not be asserted from any client payload.

- [ ] **Step 2: Run the focused tests to verify they fail**

Run: `pnpm vitest run src/server/runtime.test.ts src/app/api/session/route.test.ts`

Expected: FAIL because the current runtime still expects raw provider config from the client.

- [ ] **Step 3: Implement fixed DeepSeek runtime mapping**

Update session creation/runtime code so it derives provider config from the selected built-in model:

```ts
const DEEPSEEK_BASE_URL = "https://api.deepseek.com";

function resolveBuiltInProvider(model: BuiltInModel): OpenAICompatibleProviderConfig {
  return {
    baseUrl: DEEPSEEK_BASE_URL,
    apiKey: process.env.DEEPSEEK_API_KEY ?? "<fallback only if already explicitly accepted for local dev>",
    model
  };
}
```

Use the agreed system-owned secret path. Do not surface the API key back to the client.

- [ ] **Step 4: Run the focused tests to verify they pass**

Run: `pnpm vitest run src/server/runtime.test.ts src/app/api/session/route.test.ts`

Expected: PASS with the built-in model mapping covered.

## Task 4: Update the Hero Lockup to Use Taiji + Brand Name

**Files:**
- Modify: `src/components/session-shell.tsx`
- Modify: `src/app/page.test.ts`
- Test: `src/components/session-shell.test.tsx`

- [ ] **Step 1: Write the failing hero-lockup test**

Add or update assertions so the hero expects:

- taiji visible to the left of the product name
- language toggle still visible on the right
- no reintroduced duplicate product-name surface

Use a semantic assertion where possible rather than layout-path selectors.

- [ ] **Step 2: Run the focused hero tests to verify they fail**

Run: `pnpm vitest run src/app/page.test.ts src/components/session-shell.test.tsx`

Expected: FAIL because the current hero does not yet treat the taiji + title as one left-side lockup.

- [ ] **Step 3: Implement the minimal hero-layout change**

Update `src/components/session-shell.tsx` so the hero row reads as:

- left cluster: taiji + `Dualens` / `两仪决`
- right cluster: `UI language` control

Keep the existing value statement below the lockup if it still fits the current concise hierarchy.

- [ ] **Step 4: Run the focused hero tests to verify they pass**

Run: `pnpm vitest run src/app/page.test.ts src/components/session-shell.test.tsx`

Expected: PASS with the new hero lockup covered.

## Task 5: Remove Unused Advanced-Settings/Test-Endpoint Paths and Refresh Browser Coverage

**Files:**
- Modify or delete: `src/components/advanced-settings.tsx`
- Modify or delete: `src/app/api/runtime/test-model/route.ts`
- Modify or delete: `src/app/api/runtime/test-model/route.test.ts`
- Modify: `tests/e2e/session-flow.spec.ts`

- [ ] **Step 1: Write the failing browser regression expectations**

Update the browser flow so it expects:

- no `Advanced settings`
- visible built-in `Model` selector
- no base URL/API key fields
- submitted session payload includes `model`
- submitted session payload no longer includes raw provider credentials

- [ ] **Step 2: Run the browser spec to verify it fails**

Run: `pnpm playwright test tests/e2e/session-flow.spec.ts`

Expected: FAIL because the current browser spec still assumes advanced settings and provider config fields.

- [ ] **Step 3: Remove or simplify unused operator paths**

After the UI no longer uses them:

- delete the `AdvancedSettings` path if fully unused
- delete `/api/runtime/test-model` and its test if it is no longer part of the product surface

Only keep code that still serves the current product behavior.

- [ ] **Step 4: Run the browser spec to verify it passes**

Run: `pnpm playwright test tests/e2e/session-flow.spec.ts`

Expected: PASS with the simplified product surface covered.

## Task 6: Final Verification

**Files:**
- No new code expected

- [ ] **Step 1: Run the targeted Vitest suite**

Run:

```bash
pnpm vitest run \
  src/app/page.test.ts \
  src/components/question-form.test.tsx \
  src/components/session-shell.test.tsx \
  src/server/runtime.test.ts \
  src/app/api/session/route.test.ts
```

Expected: PASS with all updated unit tests green.

- [ ] **Step 2: Run the browser regression**

Run:

```bash
pnpm playwright test tests/e2e/session-flow.spec.ts
```

Expected: PASS.

- [ ] **Step 3: Verify stale operator copy is gone**

Run:

```bash
rg -n "Advanced settings|API key|Base URL|Test model endpoint" src tests
```

Expected:

- no product-surface occurrences remain for removed UI
- any remaining matches are only in intentional negative assertions or internal runtime/diagnosis code that still has a valid reason to exist

