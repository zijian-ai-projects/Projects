# Two Agent Debate Diagnostics and Brand Pass Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add model-endpoint diagnostics and clearer start-flow failure reporting while upgrading the top-of-page brand hierarchy for `Dualens / 两仪决`.

**Architecture:** Keep the existing local-first Next.js app and OpenAI-compatible runtime shape. Add a narrow model-test API path plus structured error classification in the runtime/API layer, then surface those results in the existing shell and Advanced Settings before applying focused copy, layout, and taiji-brand refinements.

**Tech Stack:** Next.js App Router, React, TypeScript, Vitest, Playwright, existing UI components in `src/components`, existing runtime/API code in `src/server` and `src/app/api`

---

## File Structure

### Existing files to modify

- `src/components/advanced-settings.tsx`
  - Add the `Test model endpoint` button, result surface, and remaining localized field labels.
- `src/components/question-form.tsx`
  - Carry provider test state, wire test action inputs, and keep submit flow compatible with the diagnostics changes.
- `src/components/session-shell.tsx`
  - Render structured diagnosis details when create/continue fails and keep the short summary error.
- `src/lib/ui-copy.ts`
  - Add localized copy for diagnostics, shorter hero copy, brand hierarchy text, and remaining label cleanup.
- `src/lib/presets.ts`
  - Update the Chinese preset copy from `怀疑者` to `反对者`.
- `src/lib/types.ts`
  - Add shared types for endpoint-test results and structured runtime/session diagnostics.
- `src/server/llm/openai-compatible-provider.ts`
  - Add narrow error classification hooks around provider calls.
- `src/server/runtime.ts`
  - Expose a model-test entry point and preserve structured diagnostics for runtime failures.
- `src/app/api/session/[sessionId]/continue/route.ts`
  - Return structured error payloads for UI diagnosis.
- `src/app/api/session/route.ts`
  - Keep create-session errors aligned with the same structured error shape if needed.
- `src/app/page.tsx`
  - Adjust hero hierarchy if page-level structure participates in the top shell layout.
- `src/app/layout.tsx`
  - Update metadata text only if the hero copy changes require it.
- `src/app/globals.css`
  - Add the brand-mark sizing, spacing, and subtle taiji treatment.

### New files to create

- `src/server/diagnostics/error-classifier.ts`
  - Convert provider/runtime failures into stable categories and user-facing suggestions.
- `src/app/api/runtime/test-model/route.ts`
  - Lightweight endpoint validation route for `base URL + API key + model`.
- `src/components/model-endpoint-test-status.tsx`
  - Focused presentation component for test progress/result states.
- `src/components/session-diagnosis-panel.tsx`
  - Primary structured diagnosis UI shown when start/advance generation fails.

### Tests to modify or create

- `src/components/advanced-settings.test.tsx`
  - Add or extend tests for the test button, localized labels, and visible result states.
- `src/components/question-form.test.tsx`
  - Verify model-test wiring and Chinese label updates.
- `src/components/session-shell.test.tsx`
  - Verify structured diagnosis rendering for continue failures.
- `src/server/llm/openai-compatible-provider.test.ts`
  - Verify provider error classification inputs.
- `src/server/runtime.test.ts`
  - Verify model-test entry point and structured diagnostics shape.
- `src/app/api/runtime/test-model/route.test.ts`
  - Verify success/failure response mapping for the test-model route.
- `tests/e2e/session-flow.spec.ts`
  - Cover the updated hero hierarchy, localized labels, and diagnosis-panel behavior.

## Task 1: Define Diagnostics Types and Error Classification

**Files:**
- Create: `src/server/diagnostics/error-classifier.ts`
- Modify: `src/lib/types.ts`
- Modify: `src/server/llm/openai-compatible-provider.ts`
- Test: `src/server/llm/openai-compatible-provider.test.ts`
- Test: `src/server/runtime.test.ts`

- [ ] **Step 1: Write the failing provider-classification test**

```ts
import { describe, expect, it } from "vitest";
import { classifyProviderError } from "@/server/diagnostics/error-classifier";

describe("classifyProviderError", () => {
  it("maps a 401 provider failure to auth diagnostics", () => {
    const result = classifyProviderError(
      new Error("OpenAI-compatible request failed with status 401"),
      {
        stage: "opening",
        step: "run-opening-round",
        baseUrl: "https://api.deepseek.com/v1",
        model: "deepseek-chat"
      }
    );

    expect(result).toMatchObject({
      category: "auth",
      stage: "opening",
      failingStep: "run-opening-round",
      providerBaseUrl: "https://api.deepseek.com/v1",
      providerModel: "deepseek-chat"
    });
    expect(result.suggestedFix).toContain("API key");
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm vitest run src/server/llm/openai-compatible-provider.test.ts src/server/runtime.test.ts`

Expected: FAIL because `classifyProviderError` and the new diagnostics types do not exist yet.

- [ ] **Step 3: Add the shared diagnostics types and classifier**

```ts
export type DiagnosticCategory =
  | "auth"
  | "model"
  | "endpoint-shape"
  | "network"
  | "timeout"
  | "unknown";

export type SessionDiagnosis = {
  stage: "research" | "opening" | "debate" | "complete";
  failingStep: string;
  providerBaseUrl: string;
  providerModel: string;
  category: DiagnosticCategory;
  summary: string;
  detail?: string;
  suggestedFix: string;
};

export function classifyProviderError(
  error: unknown,
  context: {
    stage: SessionDiagnosis["stage"];
    step: string;
    baseUrl: string;
    model: string;
  }
): SessionDiagnosis {
  const message = error instanceof Error ? error.message : "Unknown provider error";
  if (message.includes("401") || message.includes("403")) {
    return {
      stage: context.stage,
      failingStep: context.step,
      providerBaseUrl: context.baseUrl,
      providerModel: context.model,
      category: "auth",
      summary: "Authentication failed while contacting the model endpoint.",
      detail: message,
      suggestedFix: "Check the API key and confirm the endpoint accepts it."
    };
  }

  return {
    stage: context.stage,
    failingStep: context.step,
    providerBaseUrl: context.baseUrl,
    providerModel: context.model,
    category: "unknown",
    summary: "The model endpoint returned an unexpected error.",
    detail: message,
    suggestedFix: "Re-check the endpoint, model name, and provider compatibility."
  };
}
```

- [ ] **Step 4: Thread classified errors through the provider/runtime boundary**

```ts
if (!response.ok) {
  throw new Error(`OpenAI-compatible request failed with status ${response.status}`);
}
```

Update runtime-side handling so opening/debate generation failures can be converted into `SessionDiagnosis` objects with stable `stage`, `failingStep`, `providerBaseUrl`, and `providerModel` fields.

- [ ] **Step 5: Run the targeted tests to verify they pass**

Run: `pnpm vitest run src/server/llm/openai-compatible-provider.test.ts src/server/runtime.test.ts`

Expected: PASS with the new diagnostics types and provider-classification behavior covered.

## Task 2: Add the Model Endpoint Test Route

**Files:**
- Create: `src/app/api/runtime/test-model/route.ts`
- Modify: `src/server/runtime.ts`
- Modify: `src/lib/types.ts`
- Test: `src/app/api/runtime/test-model/route.test.ts`
- Test: `src/server/runtime.test.ts`

- [ ] **Step 1: Write the failing route test**

```ts
import { describe, expect, it, vi } from "vitest";
import { POST } from "@/app/api/runtime/test-model/route";

describe("POST /api/runtime/test-model", () => {
  it("returns a success result when the provider check passes", async () => {
    const request = new Request("http://localhost/api/runtime/test-model", {
      method: "POST",
      body: JSON.stringify({
        providerBaseUrl: "https://api.deepseek.com/v1",
        providerApiKey: "secret",
        providerModel: "deepseek-chat"
      })
    });

    const response = await POST(request);
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload).toMatchObject({ status: "ok" });
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm vitest run src/app/api/runtime/test-model/route.test.ts src/server/runtime.test.ts`

Expected: FAIL because the route and runtime test method do not exist yet.

- [ ] **Step 3: Implement the runtime test entry point and API route**

```ts
export type ModelEndpointTestResult =
  | { status: "ok"; summary: string; detail?: string }
  | {
      status: "error";
      category: DiagnosticCategory;
      summary: string;
      detail?: string;
      suggestedFix: string;
    };

async function testModelEndpoint(input: {
  providerBaseUrl: string;
  providerApiKey: string;
  providerModel: string;
}): Promise<ModelEndpointTestResult> {
  // Send one tiny structured completion through the existing
  // OpenAI-compatible provider contract and map the result.
}
```

```ts
export async function POST(request: Request) {
  const body = await request.json();
  const result = await runtime.testModelEndpoint(body);
  return Response.json(result, { status: result.status === "ok" ? 200 : 400 });
}
```

- [ ] **Step 4: Add category-specific mapping**

Implement route/runtime behavior so these user-visible categories are supported:

- `auth`
- `model`
- `endpoint-shape`
- `network`
- `timeout`
- `unknown`

and keep the route honest that it validates only the model endpoint, not search.

- [ ] **Step 5: Run the targeted tests to verify they pass**

Run: `pnpm vitest run src/app/api/runtime/test-model/route.test.ts src/server/runtime.test.ts`

Expected: PASS with both success and failure responses covered.

## Task 3: Add the Advanced Settings Test Control and Result Surface

**Files:**
- Create: `src/components/model-endpoint-test-status.tsx`
- Modify: `src/components/advanced-settings.tsx`
- Modify: `src/components/question-form.tsx`
- Modify: `src/lib/ui-copy.ts`
- Test: `src/components/advanced-settings.test.tsx`
- Test: `src/components/question-form.test.tsx`

- [ ] **Step 1: Write the failing UI tests**

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { QuestionForm } from "@/components/question-form";

describe("QuestionForm model endpoint test", () => {
  it("lets the user trigger a model endpoint test from advanced settings", async () => {
    const user = userEvent.setup();
    render(<QuestionForm onSubmit={vi.fn()} />);

    await user.click(screen.getByText("Advanced settings"));
    expect(
      screen.getByRole("button", { name: "Test model endpoint" })
    ).toBeInTheDocument();
  });

  it("shows Chinese labels for agent titles and supporter/opposer preset copy", async () => {
    const user = userEvent.setup();
    render(<QuestionForm onSubmit={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: "中文" }));
    await user.click(screen.getByText("高级设置"));

    expect(screen.getByLabelText("智能体A名字")).toBeInTheDocument();
    expect(screen.getByLabelText("智能体B名字")).toBeInTheDocument();
    expect(screen.getAllByText("支持者 vs 反对者").length).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `pnpm vitest run src/components/advanced-settings.test.tsx src/components/question-form.test.tsx`

Expected: FAIL because the test button, localized labels, and revised preset copy are not all implemented yet.

- [ ] **Step 3: Add the UI control, state, and localized copy**

```tsx
<Button
  type="button"
  variant="secondary"
  disabled={isTestingModelEndpoint}
  onClick={onTestModelEndpoint}
>
  {isTestingModelEndpoint ? copy.testingModelEndpoint : copy.testModelEndpoint}
</Button>
```

```tsx
<label>
  <span>{copy.agentATitle}</span>
  <Input name="leftTitle" placeholder={copy.agentATitlePlaceholder} />
</label>
```

Update `ui-copy.ts` with:

- `testModelEndpoint`
- `testingModelEndpoint`
- `modelEndpointTestSuccess`
- localized field labels for `智能体A名字` and `智能体B名字`
- shorter top copy strings needed later by the brand pass

Update `presets.ts` so Chinese visible copy uses `支持者 vs 反对者`.

- [ ] **Step 4: Wire the question form to the new test route**

```ts
async function testModelEndpoint(input: {
  providerBaseUrl: string;
  providerApiKey: string;
  providerModel: string;
}) {
  const response = await fetch("/api/runtime/test-model", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input)
  });

  return (await response.json()) as ModelEndpointTestResult;
}
```

Keep this separate from the start-debate submit path.

- [ ] **Step 5: Run the targeted tests to verify they pass**

Run: `pnpm vitest run src/components/advanced-settings.test.tsx src/components/question-form.test.tsx`

Expected: PASS with the test control and Chinese label cleanup covered.

## Task 4: Add the Structured Diagnosis Panel to the Session Shell

**Files:**
- Create: `src/components/session-diagnosis-panel.tsx`
- Modify: `src/components/session-shell.tsx`
- Modify: `src/lib/ui-copy.ts`
- Modify: `src/app/api/session/[sessionId]/continue/route.ts`
- Modify: `src/app/api/session/route.ts`
- Test: `src/components/session-shell.test.tsx`

- [ ] **Step 1: Write the failing diagnosis-panel test**

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { SessionShell } from "@/components/session-shell";

describe("SessionShell diagnosis panel", () => {
  it("shows structured diagnostics when opening generation fails", async () => {
    const user = userEvent.setup();
    const createSession = vi.fn().mockResolvedValue({
      id: "s1",
      stage: "research",
      evidence: [],
      turns: [],
      summary: undefined
    });
    const continueSession = vi
      .fn()
      .mockResolvedValueOnce({
        id: "s1",
        stage: "opening",
        evidence: [],
        turns: [],
        summary: undefined
      })
      .mockRejectedValueOnce(
        Object.assign(new Error("OpenAI-compatible request failed with status 401"), {
          diagnosis: {
            stage: "opening",
            failingStep: "run-opening-round",
            providerBaseUrl: "https://api.deepseek.com/v1",
            providerModel: "deepseek-chat",
            category: "auth",
            summary: "Authentication failed while contacting the model endpoint.",
            suggestedFix: "Check the API key and confirm the endpoint accepts it."
          }
        })
      );

    render(<SessionShell createSession={createSession} continueSession={continueSession} />);

    await user.click(screen.getByText("Advanced settings"));
    await user.type(screen.getByLabelText("API key"), "bad-key");
    await user.type(screen.getByLabelText("Decision question"), "Should I move to another city?");
    await user.click(screen.getByRole("button", { name: "Start debate" }));

    expect(await screen.findByText("Unable to advance debate.")).toBeInTheDocument();
    expect(screen.getByText("Authentication failed while contacting the model endpoint.")).toBeInTheDocument();
    expect(screen.getByText("run-opening-round")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm vitest run src/components/session-shell.test.tsx`

Expected: FAIL because the diagnosis panel and structured error handling do not exist yet.

- [ ] **Step 3: Implement the diagnosis panel and route payload shape**

```tsx
<SessionDiagnosisPanel
  diagnosis={diagnosis}
  copy={uiCopy}
/>
```

```ts
return Response.json(
  {
    error: diagnosis.summary,
    diagnosis
  },
  { status: 500 }
);
```

Update session-shell fetch helpers so failed create/continue calls preserve both:

- the short summary string
- the optional structured `diagnosis`

- [ ] **Step 4: Render stage-specific labels**

Make the UI describe second-continue generation failures with stage-aware language equivalent to:

- `Generation failed while preparing opening arguments`

without implying search failure when the failure was provider-side.

- [ ] **Step 5: Run the targeted tests to verify they pass**

Run: `pnpm vitest run src/components/session-shell.test.tsx`

Expected: PASS with both the short error and the structured diagnosis surface rendered.

## Task 5: Apply the Brand Hierarchy and Taiji Visual Pass

**Files:**
- Modify: `src/components/question-form.tsx`
- Modify: `src/components/session-shell.tsx`
- Modify: `src/lib/ui-copy.ts`
- Modify: `src/app/page.tsx`
- Modify: `src/app/layout.tsx`
- Modify: `src/app/globals.css`
- Test: `src/app/page.test.ts`
- Test: `tests/e2e/session-flow.spec.ts`

- [ ] **Step 1: Write the failing brand/layout tests**

```ts
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Page from "@/app/page";

describe("Page brand hierarchy", () => {
  it("renders Dualens as the primary visible brand anchor", () => {
    render(<Page />);
    expect(screen.getByText("Dualens")).toHaveClass("brand-mark");
  });
});
```

```ts
test("Chinese UI shows 两仪决 and the updated supporting copy", async ({ page }) => {
  await page.goto("/", { waitUntil: "load" });
  await page.getByRole("button", { name: "中文" }).click();
  await expect(page.getByText("两仪决")).toBeVisible();
  await expect(page.getByText("为艰难决策而设的结构化辩证工作区")).toBeVisible();
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `pnpm vitest run src/app/page.test.ts && pnpm playwright test tests/e2e/session-flow.spec.ts`

Expected: FAIL because the brand hierarchy, compressed copy, and taiji treatment are not implemented yet.

- [ ] **Step 3: Implement the stronger hero hierarchy and shorter copy**

```tsx
<div className="brand-lockup">
  <div className="brand-mark-wrap" aria-hidden="true">
    <span className="taiji-mark" />
  </div>
  <div>
    <p className="brand-mark">{uiCopy.appTitle}</p>
    <h1 className="hero-title">{uiCopy.workspaceTitle}</h1>
    <p className="hero-subtitle">{uiCopy.workspaceDescription}</p>
  </div>
</div>
```

Update `ui-copy.ts` to keep the top copy concise and layered instead of paragraph-heavy.

- [ ] **Step 4: Add the restrained taiji treatment**

```css
.taiji-mark {
  width: 3rem;
  height: 3rem;
  border-radius: 9999px;
  background:
    radial-gradient(circle at 50% 25%, rgba(15, 23, 42, 0.9) 0 8%, transparent 8.5%),
    radial-gradient(circle at 50% 75%, rgba(255, 255, 255, 0.95) 0 8%, transparent 8.5%),
    linear-gradient(180deg, rgba(15, 23, 42, 0.14) 0 50%, rgba(255, 255, 255, 0.55) 50% 100%);
  box-shadow: inset 0 0 0 1px rgba(15, 23, 42, 0.1);
}
```

Add a low-contrast background variation behind the hero/workspace area without covering the form controls.

- [ ] **Step 5: Run the targeted tests to verify they pass**

Run: `pnpm vitest run src/app/page.test.ts src/components/question-form.test.tsx && pnpm playwright test tests/e2e/session-flow.spec.ts`

Expected: PASS with the updated brand hierarchy, Chinese copy, and layout behavior covered.

## Task 6: Full Regression Verification

**Files:**
- Test only: no production code changes

- [ ] **Step 1: Run the full targeted unit/integration suite**

Run:

```bash
pnpm vitest run \
  src/components/advanced-settings.test.tsx \
  src/components/question-form.test.tsx \
  src/components/session-shell.test.tsx \
  src/app/page.test.ts \
  src/app/api/runtime/test-model/route.test.ts \
  src/server/llm/openai-compatible-provider.test.ts \
  src/server/runtime.test.ts
```

Expected: PASS with all diagnostics, localization, and hero-layout tests green.

- [ ] **Step 2: Run the browser verification**

Run:

```bash
pnpm playwright test tests/e2e/session-flow.spec.ts
```

Expected: PASS with Chinese UI coverage, test-control presence, and diagnosis flow checks.

- [ ] **Step 3: Smoke-check the manual behaviors**

Run: `pnpm dev`

Manual checks:

- Open `http://localhost:3000`
- Verify `Dualens` is the first visual anchor in English
- Switch to `中文` and verify `两仪决` remains the first visual anchor
- Open Advanced Settings and verify:
  - `智能体A名字`
  - `智能体B名字`
  - `支持者 vs 反对者`
  - `Test model endpoint`
- Trigger a failed model test with an invalid key and confirm a categorized failure result appears
- Trigger a failed start flow and confirm the diagnosis panel shows category, stage, failing step, and suggested fix

Expected: manual behavior matches the spec and does not imply real search validation.

- [ ] **Step 4: Commit**

```bash
git add src/components src/lib src/server src/app docs/superpowers
git commit -m "feat: add diagnostics and brand pass"
```

Only do this if the directory has been initialized as a git repository. If it is still not a git repo, skip this step and note that explicitly in the final handoff.

## Self-Review

Spec coverage check:

- `Test model endpoint`: Tasks 2 and 3
- structured diagnosis panel and stage-aware error mapping: Tasks 1 and 4
- stronger `Dualens / 两仪决` hierarchy: Task 5
- shorter hero copy: Task 5
- taiji visual motif: Task 5
- Chinese label cleanup including `支持者 vs 反对者`: Task 3 and Task 5
- explicit non-goal of real search support: Tasks 2, 4, and 6 all preserve model-only wording

Placeholder scan:

- No `TBD`, `TODO`, or deferred implementation markers remain.
- Each task includes concrete file paths, concrete test targets, and execution commands.

Type consistency check:

- Shared diagnostics are named `SessionDiagnosis`.
- Model-test route result is named `ModelEndpointTestResult`.
- Classification categories remain consistent across the plan:
  - `auth`
  - `model`
  - `endpoint-shape`
  - `network`
  - `timeout`
  - `unknown`
