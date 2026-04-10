# Two Agent Debate Fixed Sides and Temperament Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the current editable `Agent A / Agent B` identity model with fixed named sides, remove the `Supporter / Skeptic` preset, and rebuild debate presets around temperament pairs plus explicit side assignment for `Lumina / 乾明`.

**Architecture:** Keep the existing local-first Next.js app and current debate orchestration flow. This pass is a product-model/UI/runtime refinement: fixed side identity becomes shared domain state, preset selection becomes `pair + Lumina assignment`, and prompt/runtime generation derives side behavior from that structured selection instead of user-edited names.

**Tech Stack:** Next.js App Router, React, TypeScript, Vitest, Playwright, existing UI components in `src/components`, shared domain types in `src/lib`, prompt/runtime code in `src/server`

---

## File Structure

### Existing files to modify

- `src/lib/types.ts`
  - Replace editable side-name fields with fixed-side temperament assignment types and shared identity metadata.
- `src/lib/presets.ts`
  - Remove `Supporter / Skeptic`, redefine the preset catalog as temperament pairs, and expose pair/mapping helpers.
- `src/lib/ui-copy.ts`
  - Add localized fixed side names and descriptors plus revised copy for the new preset controls.
- `src/components/question-form.tsx`
  - Replace the old preset selection UI with `temperament pair` and `Lumina / 乾明 receives` controls, while always showing fixed identities.
- `src/components/advanced-settings.tsx`
  - Remove editable `Agent A / Agent B name` inputs and any copy that still implies user-defined side naming.
- `src/components/session-shell.tsx`
  - Ensure the debate workspace shows fixed side identities instead of dynamic side names.
- `src/server/debate/prompt-builder.ts`
  - Stop depending on user-edited side names; derive prompts from fixed identities and mapped temperaments.
- `src/server/debate/debate-service.ts`
  - Ensure visible speaker labels align with the new fixed identities.
- `src/server/runtime.ts`
  - Keep session creation/runtime plumbing aligned with the new preset payload structure if runtime helpers depend on those fields.
- `src/app/page.tsx`
  - Update any top-level preset/identity copy if needed.

### New files to create

- `src/lib/side-identities.ts`
  - Central source of truth for `Lumina / 乾明` and `Vigila / 坤察`, including localized names and descriptors.

### Tests to modify or create

- `src/lib/presets.test.ts`
  - Cover the reduced preset set and pair-to-opposite mapping behavior.
- `src/components/question-form.test.tsx`
  - Verify fixed side identity display, new pair/mapping controls, and removal of editable agent names.
- `src/components/advanced-settings.test.tsx`
  - Verify the old agent-name fields are gone.
- `src/components/session-shell.test.tsx`
  - Verify fixed side labels appear in the workspace.
- `src/server/debate/prompt-builder.test.ts`
  - Verify prompt construction uses fixed side names and mapped temperaments.
- `tests/e2e/session-flow.spec.ts`
  - Verify the new preset interaction and visible fixed identities in the browser flow.

## Task 1: Redefine the Domain Model Around Fixed Sides

**Files:**
- Create: `src/lib/side-identities.ts`
- Modify: `src/lib/types.ts`
- Modify: `src/lib/presets.ts`
- Test: `src/lib/presets.test.ts`

- [ ] **Step 1: Write the failing preset-mapping test**

```ts
import { describe, expect, it } from "vitest";
import {
  getTemperamentPairById,
  getOppositeTemperament
} from "@/lib/presets";

describe("temperament pair mapping", () => {
  it("returns the opposite temperament for the selected pair", () => {
    const pair = getTemperamentPairById("cautious-aggressive");

    expect(pair.options).toEqual(["cautious", "aggressive"]);
    expect(getOppositeTemperament(pair, "cautious")).toBe("aggressive");
    expect(getOppositeTemperament(pair, "aggressive")).toBe("cautious");
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm vitest run src/lib/presets.test.ts`

Expected: FAIL because the new pair helpers and reduced preset model do not exist yet.

- [ ] **Step 3: Add fixed-side identity and temperament-pair types**

```ts
export type SideIdentityKey = "lumina" | "vigila";

export type TemperamentOption =
  | "cautious"
  | "aggressive"
  | "rational"
  | "intuitive"
  | "cost-focused"
  | "benefit-focused"
  | "short-term"
  | "long-term";

export type TemperamentPairId =
  | "cautious-aggressive"
  | "rational-intuitive"
  | "cost-benefit"
  | "short-long";

export type DebatePresetSelection = {
  pairId: TemperamentPairId;
  luminaTemperament: TemperamentOption;
};
```

Create a central identity source that returns:

- `Lumina / 乾明` with descriptor `argument lead / 立论主张`
- `Vigila / 坤察` with descriptor `critical review / 驳论审视`

- [ ] **Step 4: Rewrite preset data around paired temperaments**

```ts
export const TEMPERAMENT_PAIRS = [
  {
    id: "cautious-aggressive",
    labels: { en: "Cautious / Aggressive", zh: "审慎 / 激进" },
    options: ["cautious", "aggressive"]
  }
];
```

Add helpers for:

- fetching a pair by id
- getting the opposite temperament
- localizing option labels

Remove `Supporter / Skeptic` and any remaining role-name semantics from the preset catalog.

- [ ] **Step 5: Run the targeted test to verify it passes**

Run: `pnpm vitest run src/lib/presets.test.ts`

Expected: PASS with the new pair model and opposite-mapping helpers covered.

## Task 2: Rebuild the Question Form Around Pair + Lumina Assignment

**Files:**
- Modify: `src/components/question-form.tsx`
- Modify: `src/lib/ui-copy.ts`
- Modify: `src/lib/types.ts`
- Test: `src/components/question-form.test.tsx`

- [ ] **Step 1: Write the failing form test**

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QuestionForm } from "@/components/question-form";

it("shows fixed sides and auto-updates Vigila when Lumina's temperament changes", async () => {
  const user = userEvent.setup();
  render(<QuestionForm />);

  expect(screen.getByText("Lumina")).toBeInTheDocument();
  expect(screen.getByText("Vigila")).toBeInTheDocument();

  await user.selectOptions(
    screen.getByLabelText("Temperament pair"),
    "cautious-aggressive"
  );
  await user.click(screen.getByRole("radio", { name: /Lumina.*Aggressive/i }));

  expect(screen.getByText(/Vigila.*Cautious/i)).toBeInTheDocument();
});
```

- [ ] **Step 2: Run the form test to verify it fails**

Run: `pnpm vitest run src/components/question-form.test.tsx`

Expected: FAIL because the current form still exposes the old preset model and does not show fixed identities.

- [ ] **Step 3: Replace the preset UI with the new two-part control**

Implement:

- always-visible identity cards for `Lumina / 乾明` and `Vigila / 坤察`
- a `Temperament pair` control
- a second control for `Lumina / 乾明 receives`
- automatic display of the opposite temperament for `Vigila / 坤察`

The second control should feel card-like or segmented rather than like a second dry dropdown.

- [ ] **Step 4: Remove editable side-name language from the form surface**

Ensure no form copy still suggests:

- `Agent A`
- `Agent B`
- editable side naming
- `Supporter / Skeptic`

Also update localized UI copy for:

- pair labels
- temperament option labels
- side descriptors

- [ ] **Step 5: Run the form test to verify it passes**

Run: `pnpm vitest run src/components/question-form.test.tsx`

Expected: PASS with the new controls and fixed-side display covered.

## Task 3: Remove Editable Side Names From Advanced Settings

**Files:**
- Modify: `src/components/advanced-settings.tsx`
- Test: `src/components/advanced-settings.test.tsx`

- [ ] **Step 1: Write the failing advanced-settings test**

```tsx
import { render, screen } from "@testing-library/react";
import { AdvancedSettings } from "@/components/advanced-settings";

it("does not render editable side name inputs", () => {
  render(<AdvancedSettings />);

  expect(screen.queryByLabelText(/Agent A/i)).not.toBeInTheDocument();
  expect(screen.queryByLabelText(/Agent B/i)).not.toBeInTheDocument();
  expect(screen.queryByLabelText(/智能体A名字/i)).not.toBeInTheDocument();
  expect(screen.queryByLabelText(/智能体B名字/i)).not.toBeInTheDocument();
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm vitest run src/components/advanced-settings.test.tsx`

Expected: FAIL because the old name fields still exist.

- [ ] **Step 3: Remove the old inputs and related props/state**

Delete:

- `Agent A title`
- `Agent B title`
- any corresponding local state or payload fields used only for editable names

Keep Advanced Settings focused on runtime/model configuration, not side identity.

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm vitest run src/components/advanced-settings.test.tsx`

Expected: PASS with the old fields removed.

## Task 4: Update Prompt Building and Runtime Payload Shape

**Files:**
- Modify: `src/server/debate/prompt-builder.ts`
- Modify: `src/server/debate/debate-service.ts`
- Modify: `src/server/runtime.ts`
- Modify: `src/lib/types.ts`
- Test: `src/server/debate/prompt-builder.test.ts`
- Test: `src/server/runtime.test.ts`

- [ ] **Step 1: Write the failing prompt-builder test**

```ts
import { describe, expect, it } from "vitest";
import { buildOpeningRoundPrompt } from "@/server/debate/prompt-builder";

describe("buildOpeningRoundPrompt", () => {
  it("uses fixed side names and mapped temperaments", () => {
    const prompt = buildOpeningRoundPrompt({
      language: "en",
      presetSelection: {
        pairId: "rational-intuitive",
        luminaTemperament: "rational"
      }
    });

    expect(prompt).toContain("Lumina");
    expect(prompt).toContain("Vigila");
    expect(prompt).toContain("rational");
    expect(prompt).toContain("intuitive");
  });
});
```

- [ ] **Step 2: Run the prompt/runtime tests to verify they fail**

Run: `pnpm vitest run src/server/debate/prompt-builder.test.ts src/server/runtime.test.ts`

Expected: FAIL because prompt construction still depends on the old side-name/preset model.

- [ ] **Step 3: Derive speaker identity and temperament from the new selection model**

Prompt construction should now use:

- localized fixed names from `side-identities.ts`
- selected pair from `presets.ts`
- `luminaTemperament`
- auto-derived opposite temperament for `vigila`

Remove dependencies on any user-edited side titles.

- [ ] **Step 4: Keep runtime/session payloads aligned**

Ensure create-session payload parsing and runtime helpers accept the new structured preset selection and no longer require editable side-name fields.

- [ ] **Step 5: Run the targeted tests to verify they pass**

Run: `pnpm vitest run src/server/debate/prompt-builder.test.ts src/server/runtime.test.ts`

Expected: PASS with prompt generation and runtime payload alignment covered.

## Task 5: Update Workspace Rendering for Fixed Identities

**Files:**
- Modify: `src/components/session-shell.tsx`
- Test: `src/components/session-shell.test.tsx`

- [ ] **Step 1: Write the failing workspace test**

```tsx
import { render, screen } from "@testing-library/react";
import { SessionShell } from "@/components/session-shell";

it("renders fixed side identities in the debate workspace", () => {
  render(<SessionShell initialSession={makeSession()} />);

  expect(screen.getByText("Lumina")).toBeInTheDocument();
  expect(screen.getByText("Vigila")).toBeInTheDocument();
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm vitest run src/components/session-shell.test.tsx`

Expected: FAIL because the workspace still renders old side labels or dynamic naming fields.

- [ ] **Step 3: Update visible side identity blocks in the shell**

Ensure the workspace consistently shows:

- `Lumina / Vigila` in English UI
- `乾明 / 坤察` in Chinese UI

along with the short descriptors:

- `argument lead / critical review`
- `立论主张 / 驳论审视`

This should apply in the debate area and any local identity summary around the preset/result surfaces.

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm vitest run src/components/session-shell.test.tsx`

Expected: PASS with the fixed-side workspace presentation covered.

## Task 6: End-to-End Regression Coverage for the New Preset Model

**Files:**
- Modify: `tests/e2e/session-flow.spec.ts`

- [ ] **Step 1: Extend the browser flow to cover the new preset interaction**

Add an assertion sequence that:

- confirms the fixed side names are visible
- selects a temperament pair
- assigns a temperament to `Lumina / 乾明`
- verifies the opposite temperament is shown for `Vigila / 坤察`
- confirms no editable `Agent A / Agent B` name controls remain

- [ ] **Step 2: Run the end-to-end test**

Run: `pnpm playwright test tests/e2e/session-flow.spec.ts`

Expected: PASS with the new fixed-side preset interaction covered in the browser.

## Task 7: Final Verification

**Files:**
- No new files; verification only

- [ ] **Step 1: Run the targeted unit/integration test suite**

Run:

```bash
pnpm vitest run \
  src/lib/presets.test.ts \
  src/components/question-form.test.tsx \
  src/components/advanced-settings.test.tsx \
  src/components/session-shell.test.tsx \
  src/server/debate/prompt-builder.test.ts \
  src/server/runtime.test.ts
```

Expected: PASS with all targeted behavior for fixed identities and temperament mapping covered.

- [ ] **Step 2: Run the browser regression**

Run: `pnpm playwright test tests/e2e/session-flow.spec.ts`

Expected: PASS with the revised preset flow and fixed-side presentation stable in the browser.

- [ ] **Step 3: Smoke-check for removed legacy copy**

Search for stale surface copy:

```bash
rg "Supporter|Skeptic|Agent A|Agent B|智能体A|智能体B" src
```

Expected: no remaining surface/UI usage other than tests that explicitly assert removal or internal migration comments that are still justified.

- [ ] **Step 4: Summarize any remaining follow-up work**

If any internal legacy naming remains for non-user-facing technical reasons, note it explicitly before claiming the pass is fully complete.
