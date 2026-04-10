# Two Agent Debate UX Pass Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Improve the current product’s usability by expanding presets, adding a Chinese/English toggle, clarifying the OpenAI-compatible provider UX, and making the research phase visibly staged with live evidence previews.

**Architecture:** Keep the existing local-first architecture and current OpenAI-compatible backend flow. Add small session-level config/state fields for language, richer preset metadata, optional role overrides, and research progress snapshots; then thread those fields through the existing form, prompt, runtime, and display layers without redesigning the orchestrator.

**Tech Stack:** Next.js, React, TypeScript, Vitest, React Testing Library, Playwright, Zod

---

## Planned File Structure

### Shared model and validation files

- Modify: `src/lib/types.ts` - add language, richer preset/session config, and research-progress view types
- Modify: `src/lib/presets.ts` - add multiple preset pairs and helper lookup utilities
- Modify: `src/lib/validators.ts` - validate language and optional custom role overrides plus session config additions

### Prompt and runtime files

- Modify: `src/server/prompts.ts` - incorporate language and role override/preset data into opening and summary prompts
- Modify: `src/server/runtime.ts` - emit research-stage progress snapshots and language-aware status content
- Modify: `src/server/orchestrator.ts` - carry progress metadata through the session lifecycle

### UI files

- Modify: `src/components/question-form.tsx` - add language toggle, richer preset selector, and custom role fields in advanced settings
- Modify: `src/components/advanced-settings.tsx` - clarify provider wording and host custom role override controls
- Modify: `src/components/session-shell.tsx` - render research activity states and evidence preview while preserving current session lifecycle
- Modify: `src/components/debate-timeline.tsx` - render language-consistent loading/progress states
- Modify: `src/components/evidence-panel.tsx` - add research preview mode and staged source visibility
- Modify: `src/components/summary-panel.tsx` - ensure language-consistent labels and stronger structured summary sections
- Modify: `src/app/page.tsx` - ensure the updated form/session payload shape is passed to `/api/session`
- Modify: `src/app/globals.css` - style the language toggle, research timeline, and preview states

### Tests

- Modify: `src/components/question-form.test.tsx` - cover language toggle, preset selection, and custom role/provider payload shape
- Modify: `src/components/session-shell.test.tsx` - cover research progress states and language-sensitive rendering
- Modify: `src/app/page.test.ts` - cover the expanded payload shape and language-aware session input
- Modify: `src/app/api/session/route.test.ts` - cover validation of the new language and custom role session inputs
- Modify: `src/server/orchestrator.test.ts` - cover progress metadata persistence and language-aware session config propagation
- Modify: `src/server/debate/summary.test.ts` - cover language-aware summary prompt behavior
- Modify: `tests/e2e/session-flow.spec.ts` - cover language toggle and visible research progress

## Task 1: Expand Session Config And Presets

**Files:**
- Modify: `src/lib/types.ts`
- Modify: `src/lib/presets.ts`
- Modify: `src/lib/validators.ts`
- Modify: `src/server/orchestrator.test.ts`
- Test: `src/server/orchestrator.test.ts`

- [ ] **Step 1: Write the failing domain config tests**

```ts
import { describe, expect, it } from "vitest";
import { ROLE_PRESETS } from "@/lib/presets";
import { createSessionInputSchema } from "@/lib/validators";

describe("ux pass session config", () => {
  it("includes multiple visible preset pairs", () => {
    expect(ROLE_PRESETS.map((preset) => preset.id)).toEqual([
      "cautious-vs-aggressive",
      "rational-vs-intuitive",
      "supporter-vs-skeptic",
      "cost-vs-benefit",
      "short-term-vs-long-term"
    ]);
  });

  it("accepts a language and optional custom role overrides", () => {
    const parsed = createSessionInputSchema.parse({
      question: "Should I move to another city for work?",
      presetId: "rational-vs-intuitive",
      language: "zh-CN",
      config: {
        providerBaseUrl: "https://example.com/v1",
        providerApiKey: "secret",
        providerModel: "demo-model"
      },
      customRoles: {
        leftTitle: "理性顾问",
        rightTitle: "直觉顾问"
      }
    });

    expect(parsed.language).toBe("zh-CN");
    expect(parsed.customRoles?.leftTitle).toBe("理性顾问");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/server/orchestrator.test.ts`
Expected: FAIL because the new preset ids, language field, and custom role fields are not defined yet.

- [ ] **Step 3: Add the minimal shared config and preset model**

```ts
// src/lib/types.ts
export type AppLanguage = "zh-CN" | "en";

export type RolePreset = {
  id: string;
  label: string;
  leftTitle: string;
  rightTitle: string;
  leftPrompt: string;
  rightPrompt: string;
};

export type CustomRoleOverrides = {
  leftTitle?: string;
  rightTitle?: string;
  leftPrompt?: string;
  rightPrompt?: string;
};

export type SessionConfig = {
  sourceStrategy: SourceStrategy;
  searchDepth: "quick" | "standard" | "deep";
  roundCount: number;
  summaryStyle: SummaryStyle;
  providerBaseUrl?: string;
  providerApiKey?: string;
  providerModel?: string;
};

export type SessionRecord = {
  id: string;
  question: string;
  presetId: string;
  language: AppLanguage;
  customRoles?: CustomRoleOverrides;
  premise?: string;
  stage: SessionStage;
  config: SessionConfig;
  evidence: Evidence[];
  turns: Array<{ id: string; speaker: string; content: string }>;
  summary?: DebateSummary;
  researchProgress?: ResearchProgressView;
};
```

```ts
// src/lib/presets.ts
export const ROLE_PRESETS: RolePreset[] = [
  {
    id: "cautious-vs-aggressive",
    label: "Cautious vs Aggressive",
    leftTitle: "Cautious",
    rightTitle: "Aggressive",
    leftPrompt: "Prioritize downside protection and evidence-backed restraint.",
    rightPrompt: "Prioritize upside, timing, and action bias."
  },
  {
    id: "rational-vs-intuitive",
    label: "Rational vs Intuitive",
    leftTitle: "Rational",
    rightTitle: "Intuitive",
    leftPrompt: "Argue with structured reasoning and explicit assumptions.",
    rightPrompt: "Argue with human judgment, intuition, and qualitative tradeoffs."
  },
  {
    id: "supporter-vs-skeptic",
    label: "Supporter vs Skeptic",
    leftTitle: "Supporter",
    rightTitle: "Skeptic",
    leftPrompt: "Argue for the proposal’s strongest case.",
    rightPrompt: "Stress-test the proposal and expose weaknesses."
  },
  {
    id: "cost-vs-benefit",
    label: "Cost-focused vs Benefit-focused",
    leftTitle: "Cost-focused",
    rightTitle: "Benefit-focused",
    leftPrompt: "Focus on cost, risk, and hidden burdens.",
    rightPrompt: "Focus on gains, leverage, and strategic upside."
  },
  {
    id: "short-term-vs-long-term",
    label: "Short-term vs Long-term",
    leftTitle: "Short-term",
    rightTitle: "Long-term",
    leftPrompt: "Focus on immediate impact and near-term constraints.",
    rightPrompt: "Focus on compounding effects and long-term outcomes."
  }
];

export function getRolePresetById(id: string) {
  return ROLE_PRESETS.find((preset) => preset.id === id);
}
```

```ts
// src/lib/validators.ts
export const createSessionInputSchema = z.object({
  question: trimmedStringSchema.min(10),
  presetId: z.enum([
    "cautious-vs-aggressive",
    "rational-vs-intuitive",
    "supporter-vs-skeptic",
    "cost-vs-benefit",
    "short-term-vs-long-term"
  ]),
  language: z.enum(["zh-CN", "en"]).default("en"),
  premise: trimmedOptionalStringSchema,
  customRoles: z
    .object({
      leftTitle: trimmedOptionalStringSchema,
      rightTitle: trimmedOptionalStringSchema,
      leftPrompt: trimmedOptionalStringSchema,
      rightPrompt: trimmedOptionalStringSchema
    })
    .optional(),
  config: createSessionConfigSchema.optional()
});
```

- [ ] **Step 4: Run the config tests**

Run: `pnpm vitest run src/server/orchestrator.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/types.ts src/lib/presets.ts src/lib/validators.ts src/server/orchestrator.test.ts
git commit -m "feat: add language and richer preset config"
```

## Task 2: Add Language-Aware Prompting And Research Progress State

**Files:**
- Modify: `src/server/prompts.ts`
- Modify: `src/server/runtime.ts`
- Modify: `src/server/orchestrator.ts`
- Modify: `src/lib/types.ts`
- Modify: `src/server/debate/summary.test.ts`
- Modify: `src/server/orchestrator.test.ts`
- Test: `src/server/debate/summary.test.ts`
- Test: `src/server/orchestrator.test.ts`

- [ ] **Step 1: Write the failing language/progress tests**

```ts
import { describe, expect, it } from "vitest";
import { buildOpeningPrompt } from "@/server/prompts";

describe("language-aware prompts", () => {
  it("includes the selected language and preset roles in the opening prompt", () => {
    const prompt = buildOpeningPrompt({
      question: "Should I move to another city?",
      presetId: "supporter-vs-skeptic",
      language: "zh-CN",
      evidence: [{ id: "e1" }],
      turns: []
    } as never);

    expect(prompt).toContain("zh-CN");
    expect(prompt).toContain("Supporter");
    expect(prompt).toContain("Skeptic");
  });
});
```

```ts
import { describe, expect, it } from "vitest";
import { createSessionStore } from "@/server/session-store";
import { createOrchestrator } from "@/server/orchestrator";

describe("research progress", () => {
  it("persists research progress metadata while moving into opening", async () => {
    const store = createSessionStore();
    const orchestrator = createOrchestrator(store, {
      runSharedResearch: async () => [{ id: "e1", title: "t", url: "u", sourceName: "n", sourceType: "news", summary: "s" }],
      runOpeningRound: async (session) => session,
      runDebateRound: async (session) => session,
      runSummary: async () => ({ strongestFor: [], strongestAgainst: [], coreDisagreement: "", keyUncertainty: "", nextAction: "" })
    });

    const created = await orchestrator.createSession({
      question: "Should I move to another city for work?",
      presetId: "supporter-vs-skeptic",
      language: "en"
    });

    const next = await orchestrator.continueSession(created.id);
    expect(next.researchProgress?.stage).toBe("preparing-opening");
    expect(next.researchProgress?.sourceCount).toBe(1);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm vitest run src/server/debate/summary.test.ts src/server/orchestrator.test.ts`
Expected: FAIL because prompts and session records do not yet carry the new language/progress behavior.

- [ ] **Step 3: Add minimal language-aware prompting and progress snapshots**

```ts
// src/lib/types.ts
export type ResearchProgressStage =
  | "preparing-query"
  | "searching-sources"
  | "reading-pages"
  | "extracting-evidence"
  | "preparing-opening";

export type ResearchPreviewItem = {
  title: string;
  sourceName: string;
  status: "found" | "read" | "used";
};

export type ResearchProgressView = {
  stage: ResearchProgressStage;
  sourceCount: number;
  evidenceCount: number;
  previewItems: ResearchPreviewItem[];
};
```

```ts
// src/server/prompts.ts
export function buildOpeningPrompt(session: SessionRecord) {
  const preset = getRolePresetById(session.presetId);
  const roles = session.customRoles ?? {};

  return [
    `Language: ${session.language}`,
    `Question: ${session.question}`,
    `Preset: ${preset?.label ?? session.presetId}`,
    `Left role: ${roles.leftTitle ?? preset?.leftTitle ?? "Agent A"}`,
    `Left role brief: ${roles.leftPrompt ?? preset?.leftPrompt ?? ""}`,
    `Right role: ${roles.rightTitle ?? preset?.rightTitle ?? "Agent B"}`,
    `Right role brief: ${roles.rightPrompt ?? preset?.rightPrompt ?? ""}`,
    `Evidence count: ${session.evidence.length}`,
    "Write the opening position in the selected language."
  ].join("\n");
}
```

```ts
// src/server/runtime.ts
function buildResearchProgress(session: SessionRecord): ResearchProgressView {
  return {
    stage: "preparing-opening",
    sourceCount: session.evidence.length,
    evidenceCount: session.evidence.length,
    previewItems: session.evidence.slice(0, 5).map((item) => ({
      title: item.title,
      sourceName: item.sourceName,
      status: "used"
    }))
  };
}
```

- [ ] **Step 4: Run the updated tests**

Run: `pnpm vitest run src/server/debate/summary.test.ts src/server/orchestrator.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/types.ts src/server/prompts.ts src/server/runtime.ts src/server/orchestrator.ts src/server/debate/summary.test.ts src/server/orchestrator.test.ts
git commit -m "feat: add language-aware prompts and research progress state"
```

## Task 3: Expand Form UX For Language, Presets, And Custom Roles

**Files:**
- Modify: `src/components/question-form.tsx`
- Modify: `src/components/advanced-settings.tsx`
- Modify: `src/components/question-form.test.tsx`
- Modify: `src/components/session-shell.tsx`
- Modify: `src/app/page.test.ts`
- Test: `src/components/question-form.test.tsx`
- Test: `src/app/page.test.ts`

- [ ] **Step 1: Write the failing form UX tests**

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { QuestionForm } from "@/components/question-form";

describe("QuestionForm UX pass", () => {
  it("submits language, preset, and advanced role/provider values", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);

    render(<QuestionForm onSubmit={onSubmit} />);

    await user.type(screen.getByLabelText("Decision question"), "Should I move to another city?");
    await user.selectOptions(screen.getByLabelText("Debate preset"), "supporter-vs-skeptic");
    await user.click(screen.getByText("Advanced settings"));
    await user.type(screen.getByLabelText("Base URL"), "https://example.com/v1");
    await user.type(screen.getByLabelText("API key"), "secret");
    await user.type(screen.getByLabelText("Model name"), "gpt-demo");
    await user.type(screen.getByLabelText("Agent A title"), "Supporter");

    await user.click(screen.getByRole("button", { name: "Start debate" }));

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        language: "en",
        presetId: "supporter-vs-skeptic",
        config: expect.objectContaining({
          providerBaseUrl: "https://example.com/v1",
          providerApiKey: "secret",
          providerModel: "gpt-demo"
        }),
        customRoles: expect.objectContaining({
          leftTitle: "Supporter"
        })
      })
    );
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm vitest run src/components/question-form.test.tsx src/app/page.test.ts`
Expected: FAIL because the current form does not submit the expanded language/preset/custom-role payload.

- [ ] **Step 3: Add the minimal UX fields and payload wiring**

```tsx
// src/components/question-form.tsx
export type QuestionFormSubmission = {
  question: string;
  presetId: string;
  language: AppLanguage;
  config: {
    providerBaseUrl: string;
    providerApiKey: string;
    providerModel: string;
  };
  customRoles?: {
    leftTitle?: string;
    rightTitle?: string;
    leftPrompt?: string;
    rightPrompt?: string;
  };
};
```

```tsx
// src/components/advanced-settings.tsx
export function AdvancedSettings({
  language,
  onLanguageChange
}: {
  language: AppLanguage;
  onLanguageChange(language: AppLanguage): void;
}) {
  return (
    <details>
      <summary>Advanced settings</summary>
      <label htmlFor="language">Language</label>
      <select id="language" name="language" value={language} onChange={(event) => onLanguageChange(event.currentTarget.value as AppLanguage)}>
        <option value="en">English</option>
        <option value="zh-CN">中文</option>
      </select>
      <label htmlFor="providerBaseUrl">Base URL</label>
      <input id="providerBaseUrl" name="providerBaseUrl" />
      <label htmlFor="providerApiKey">API key</label>
      <input id="providerApiKey" name="providerApiKey" />
      <label htmlFor="providerModel">Model name</label>
      <input id="providerModel" name="providerModel" />
      <label htmlFor="leftTitle">Agent A title</label>
      <input id="leftTitle" name="leftTitle" />
      <label htmlFor="rightTitle">Agent B title</label>
      <input id="rightTitle" name="rightTitle" />
    </details>
  );
}
```

- [ ] **Step 4: Run the form/page tests**

Run: `pnpm vitest run src/components/question-form.test.tsx src/app/page.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/question-form.tsx src/components/advanced-settings.tsx src/components/question-form.test.tsx src/components/session-shell.tsx src/app/page.test.ts
git commit -m "feat: add language and richer preset form controls"
```

## Task 4: Render Research Progress And Evidence Preview

**Files:**
- Modify: `src/components/session-shell.tsx`
- Modify: `src/components/evidence-panel.tsx`
- Modify: `src/components/debate-timeline.tsx`
- Modify: `src/components/summary-panel.tsx`
- Modify: `src/app/globals.css`
- Modify: `src/components/session-shell.test.tsx`
- Modify: `tests/e2e/session-flow.spec.ts`
- Test: `src/components/session-shell.test.tsx`
- Test: `tests/e2e/session-flow.spec.ts`

- [ ] **Step 1: Write the failing research UX tests**

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SessionShell } from "@/components/session-shell";

describe("SessionShell research progress", () => {
  it("shows activity stages and evidence previews during research", () => {
    render(
      <SessionShell
        createSession={async () => ({
          id: "s1",
          stage: "research",
          question: "Should I move?",
          presetId: "supporter-vs-skeptic",
          language: "en",
          evidence: [],
          turns: [],
          researchProgress: {
            stage: "reading-pages",
            sourceCount: 3,
            evidenceCount: 1,
            previewItems: [{ title: "Housing market outlook", sourceName: "Example News", status: "read" }]
          }
        })}
      />
    );

    expect(screen.getByText("Reading pages")).toBeInTheDocument();
    expect(screen.getByText("Housing market outlook")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm vitest run src/components/session-shell.test.tsx`
Expected: FAIL because the current research state rendering is too shallow.

- [ ] **Step 3: Add the minimal staged research UI**

```tsx
// src/components/session-shell.tsx
function ResearchStatus({
  progress
}: {
  progress?: SessionView["researchProgress"];
}) {
  if (!progress) {
    return <p>Preparing query</p>;
  }

  return (
    <section aria-label="Research progress">
      <p>{progress.stage}</p>
      <p>{progress.sourceCount} sources found</p>
      <p>{progress.evidenceCount} evidence items extracted</p>
    </section>
  );
}
```

```tsx
// src/components/evidence-panel.tsx
export function EvidencePanel({
  evidence,
  previewItems
}: {
  evidence: Evidence[];
  previewItems?: ResearchPreviewItem[];
}) {
  const items = previewItems?.length ? previewItems : evidence.map((item) => ({
    title: item.title,
    sourceName: item.sourceName,
    status: "used" as const
  }));

  return (
    <section aria-label="Evidence panel">
      {items.map((item) => (
        <article key={`${item.sourceName}-${item.title}`}>
          <h3>{item.title}</h3>
          <p>{item.sourceName}</p>
          <span>{item.status}</span>
        </article>
      ))}
    </section>
  );
}
```

- [ ] **Step 4: Run unit and e2e research tests**

Run: `pnpm vitest run src/components/session-shell.test.tsx`
Expected: PASS

Run: `pnpm playwright test tests/e2e/session-flow.spec.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/session-shell.tsx src/components/evidence-panel.tsx src/components/debate-timeline.tsx src/components/summary-panel.tsx src/app/globals.css src/components/session-shell.test.tsx tests/e2e/session-flow.spec.ts
git commit -m "feat: show staged research progress"
```

## Self-Review

### Spec coverage

- Preset variety: covered by Task 1 and Task 3.
- Optional custom role overrides: covered by Task 1 and Task 3.
- Chinese/English toggle and language-driven visible output: covered by Task 1, Task 2, and Task 3.
- Provider wording remains OpenAI-compatible rather than multi-provider: covered by Task 3.
- Research activity timeline and evidence preview: covered by Task 2 and Task 4.
- Keep current architecture and avoid full provider-family/i18n rewrite: preserved by all tasks.

### Placeholder scan

- No `TODO`, `TBD`, or unresolved placeholders remain.
- Every task has exact file paths and commands.
- Every implementation step includes concrete code, not high-level gestures.

### Type consistency

- `AppLanguage`, `CustomRoleOverrides`, and `ResearchProgressView` are introduced before later tasks use them.
- The preset ids used in validators, tests, and prompts match the preset list introduced in Task 1.
- The form payload shape introduced in Task 3 matches the session-validation and runtime expectations from Tasks 1 and 2.

## Notes Before Execution

- This is a follow-up UX plan on top of the existing implementation; it should not be merged into the original implementation plan.
- The current workspace is not a git repository, so commit steps will remain aspirational unless the repository is initialized first.
- The plan intentionally avoids full localization infrastructure. Use compact inline copy branching rather than a new translation framework in this pass.

Plan complete and saved to `docs/superpowers/plans/2026-04-07-two-agent-debate-ux-pass-implementation-plan.md`. Two execution options:

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

**Which approach?**
