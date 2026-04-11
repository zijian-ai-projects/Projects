# Dualens V3 Product and Debate Modes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the product introduction surface, subtle taiji/ink background treatment, and real shared/private debate modes with analysis-first turns.

**Architecture:** Keep the existing Next.js workspace shell and local-first runtime. Add `/product` as a workspace route, use a passive background layer in `AppShell`, introduce a `DebateMode` domain type carried through form, session creation, runtime, history, and UI, then split runtime turn generation so shared mode uses a shared evidence pool and private mode uses per-side evidence pools.

**Tech Stack:** Next.js App Router, React, TypeScript, Zod, Vitest, Testing Library, existing OpenAI-compatible LLM provider and research service.

---

## File Structure

- `src/app/(workspace)/product/page.tsx` - new product introduction page.
- `src/app/(workspace)/product/page.test.tsx` - product page rendering tests.
- `src/components/layout/app-sidebar.tsx` - taiji mark link target.
- `src/components/layout/app-sidebar.test.tsx` - nav remains five items, taiji links to product.
- `src/components/layout/app-shell.tsx` - passive global ink/taiji background.
- `src/components/layout/app-shell.test.tsx` - background layer and sidebar collapse tests.
- `src/components/question-form.tsx` - debate mode switch and submission payload.
- `src/components/question-form.test.tsx` - mode switch UI and payload tests.
- `src/components/session-shell.tsx` - session view guards, workspace draft mode, history meta mode.
- `src/components/session-shell.test.tsx` - mode payload and cross-page draft persistence tests.
- `src/components/debate-timeline.tsx` - render per-turn analysis and round/side labels.
- `src/components/debate-timeline.test.tsx` - analysis display tests.
- `src/app/(workspace)/history/history-page-content.tsx` - history details show mode, analysis, private evidence.
- `src/app/(workspace)/history/page.test.tsx` - history detail tests.
- `src/lib/types.ts` - `DebateMode`, analysis, private evidence pools.
- `src/lib/validators.ts` - accept `config.debateMode`.
- `src/lib/presets.ts` - default debate mode in session defaults.
- `src/lib/ui-copy.ts` - debate-mode and analysis labels.
- `src/lib/workspace-copy.ts` - product page/history copy additions.
- `src/lib/debate-workspace-state.tsx` - persist draft debate mode while moving between first-level pages.
- `src/lib/history-file-writer.ts` and `.test.ts` - serialize mode/private evidence/analysis.
- `src/lib/history-records.ts` and `.test.ts` - tolerate old records and load new fields.
- `src/server/prompts.ts` and `.test.ts` - analysis prompt and private-visible evidence prompt helpers.
- `src/server/debate/agent.ts` and new or existing tests - analysis generation API.
- `src/server/runtime.ts` and `.test.ts` - mode-specific orchestration.
- `src/app/api/session/route.test.ts` - client boundary accepts valid debate mode and rejects invalid mode.

## Task 1: Product Page, Taiji Entry, Background Red Tests

**Files:**
- Create: `src/app/(workspace)/product/page.test.tsx`
- Modify: `src/components/layout/app-sidebar.test.tsx`
- Modify: `src/components/layout/app-shell.test.tsx`

- [ ] **Step 1: Add product page rendering test**

Add `src/app/(workspace)/product/page.test.tsx`:

```tsx
import "@testing-library/jest-dom/vitest";

import { render, screen } from "@testing-library/react";
import ProductPage from "@/app/(workspace)/product/page";
import { AppPreferencesProvider } from "@/lib/app-preferences";

describe("ProductPage", () => {
  it("introduces Dualens with the two debate modes and a debate entry", () => {
    render(
      <AppPreferencesProvider>
        <ProductPage />
      </AppPreferencesProvider>
    );

    expect(screen.getByRole("heading", { level: 1, name: "两仪决" })).toBeInTheDocument();
    expect(screen.getByText("共证衡辩")).toBeInTheDocument();
    expect(screen.getByText("隔证三辩")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "进入辩论" })).toHaveAttribute("href", "/debate");
  });
});
```

- [ ] **Step 2: Add sidebar taiji-link test without adding a nav item**

Extend `src/components/layout/app-sidebar.test.tsx` in the brand test:

```tsx
expect(brandLink).toHaveAttribute("href", "/product");
```

Also keep the existing five-item nav assertion exactly as-is:

```tsx
expect(labels).toEqual(["辩论", "辩论历史", "AI 服务商", "搜索引擎", "通用设置"]);
```

- [ ] **Step 3: Add background-layer test**

Extend `src/components/layout/app-shell.test.tsx`:

```tsx
it("adds a passive ink and taiji background layer behind the workspace", () => {
  render(
    <AppShell>
      <div>Debate content</div>
    </AppShell>
  );

  const background = screen.getByTestId("workspace-ink-background");

  expect(background).toHaveAttribute("aria-hidden", "true");
  expect(background).toHaveClass("pointer-events-none");
  expect(background).toHaveClass("absolute");
});
```

- [ ] **Step 4: Run red tests**

```bash
pnpm vitest run \
  'src/app/(workspace)/product/page.test.tsx' \
  src/components/layout/app-sidebar.test.tsx \
  src/components/layout/app-shell.test.tsx
```

Expected: FAIL because `/product` does not exist, the taiji link still targets `/debate`, and the background layer is absent.

## Task 2: Product Page, Taiji Entry, Background Implementation

**Files:**
- Create: `src/app/(workspace)/product/page.tsx`
- Modify: `src/components/layout/app-sidebar.tsx`
- Modify: `src/components/layout/app-shell.tsx`

- [ ] **Step 1: Create product page**

Create `src/app/(workspace)/product/page.tsx` as a client component using `useAppPreferences()` and `getWorkspaceCopy(language)` only if shared copy is needed. Use fixed bilingual-safe Chinese product copy for the initial implementation:

```tsx
"use client";

import Link from "next/link";

function ProductTaiji() {
  return (
    <div aria-hidden="true" className="relative h-40 w-40 rounded-full border border-black/10 bg-white shadow-[0_20px_70px_rgba(0,0,0,0.08)]">
      <div className="absolute inset-1 rounded-full bg-[conic-gradient(from_90deg,#111_0_50%,#fff_0_100%)]" />
      <div className="absolute left-1/2 top-1 h-[76px] w-[76px] -translate-x-1/2 rounded-full bg-white" />
      <div className="absolute bottom-1 left-1/2 h-[76px] w-[76px] -translate-x-1/2 rounded-full bg-black" />
      <div className="absolute left-1/2 top-8 h-5 w-5 -translate-x-1/2 rounded-full bg-black" />
      <div className="absolute bottom-8 left-1/2 h-5 w-5 -translate-x-1/2 rounded-full bg-white" />
    </div>
  );
}

export default function ProductPage() {
  return (
    <div className="space-y-8 px-6 py-8 lg:px-10 lg:py-10">
      <section className="relative overflow-hidden rounded-[28px] border border-app-line bg-app-card p-8 shadow-[0_10px_28px_rgba(0,0,0,0.03)]">
        <div className="absolute inset-0 opacity-[0.08] [background-image:radial-gradient(circle_at_20%_20%,#111_0,transparent_32%),radial-gradient(circle_at_78%_18%,#111_0,transparent_28%)]" aria-hidden="true" />
        <div className="relative grid gap-8 lg:grid-cols-[minmax(0,1fr)_220px] lg:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-app-muted">dualens</p>
            <h1 className="mt-4 text-4xl font-semibold tracking-[-0.04em] text-app-strong">两仪决</h1>
            <p className="mt-4 max-w-2xl text-base leading-8 text-app-muted">
              一个问题分成两面，让证据、反驳与结论同时留在桌面上。
            </p>
            <Link className="mt-6 inline-flex rounded-[8px] border border-black bg-black px-4 py-2 text-sm font-medium text-white" href="/debate">
              进入辩论
            </Link>
          </div>
          <div className="flex justify-center">
            <ProductTaiji />
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <article className="rounded-[8px] border border-black/8 bg-white/82 p-5">
          <h2 className="text-lg font-semibold text-app-strong">共证衡辩</h2>
          <p className="mt-3 text-sm leading-7 text-app-muted">
            双方共用同一组证据，在同一事实底座上分析、补证、交锋。
          </p>
        </article>
        <article className="rounded-[8px] border border-black/8 bg-white/82 p-5">
          <h2 className="text-lg font-semibold text-app-strong">隔证三辩</h2>
          <p className="mt-3 text-sm leading-7 text-app-muted">
            双方各自取证，三轮分析与发言逐步逼近问题的关键分歧。
          </p>
        </article>
      </section>
    </div>
  );
}
```

- [ ] **Step 2: Change only the taiji mark link target**

In `src/components/layout/app-sidebar.tsx`, keep `navItems` unchanged. Change the brand link `href` from `/debate` to `/product`. If the whole brand remains linked, do not add nav items.

- [ ] **Step 3: Add passive workspace background**

In `src/components/layout/app-shell.tsx`, make the root frame `relative overflow-hidden` and add:

```tsx
<div
  data-testid="workspace-ink-background"
  aria-hidden="true"
  className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(circle_at_84%_12%,rgba(0,0,0,0.07),transparent_24%),radial-gradient(circle_at_12%_82%,rgba(0,0,0,0.055),transparent_28%),linear-gradient(135deg,rgba(255,255,255,0.36),transparent_42%)]"
/>
```

Wrap the existing content container with `relative z-10` without changing existing width, padding, flex, or sidebar classes.

- [ ] **Step 4: Run green tests**

```bash
pnpm vitest run \
  'src/app/(workspace)/product/page.test.tsx' \
  src/components/layout/app-sidebar.test.tsx \
  src/components/layout/app-shell.test.tsx
```

Expected: PASS.

## Task 3: Debate Mode Domain and History Red Tests

**Files:**
- Modify: `src/server/orchestrator.test.ts`
- Modify: `src/app/api/session/route.test.ts`
- Modify: `src/lib/history-file-writer.test.ts`
- Modify: `src/lib/history-records.test.ts`

- [ ] **Step 1: Add validator and default-mode tests**

In `src/server/orchestrator.test.ts`, add:

```ts
it("defaults sessions to shared-evidence debate mode", async () => {
  const store = createSessionStore();
  const orchestrator = createOrchestrator(store, {
    runSharedResearch: async () => [],
    runOpeningRound: async (session) => session,
    runDebateRound: async (session) => session,
    runSummary: async () => ({
      strongestFor: [],
      strongestAgainst: [],
      coreDisagreement: "",
      keyUncertainty: "",
      nextAction: ""
    })
  });

  const session = await orchestrator.createSession(createSessionInput());

  expect(session.debateMode).toBe("shared-evidence");
  expect(session.config.debateMode).toBe("shared-evidence");
});
```

In the `accepts a language and structured preset selection` test, include:

```ts
config: {
  roundCount: 2,
  debateMode: "private-evidence"
}
```

and assert:

```ts
expect(parsed.config?.debateMode).toBe("private-evidence");
```

- [ ] **Step 2: Add API boundary tests**

In `src/app/api/session/route.test.ts`, add:

```ts
it("accepts a valid debate mode in session config", async () => {
  const response = await POST(
    new Request("http://localhost/api/session", {
      method: "POST",
      body: JSON.stringify(
        createSessionBody({
          config: { debateMode: "private-evidence" }
        })
      )
    })
  );

  const payload = await response.json();

  expect(response.status).toBe(201);
  expect(payload.debateMode).toBe("private-evidence");
});

it("rejects an invalid debate mode in session config", async () => {
  const response = await POST(
    new Request("http://localhost/api/session", {
      method: "POST",
      body: JSON.stringify(
        createSessionBody({
          config: { debateMode: "invented-mode" }
        })
      )
    })
  );

  expect(response.status).toBe(400);
});
```

- [ ] **Step 3: Add history serialization and load tests**

In `src/lib/history-file-writer.test.ts`, extend the serialized payload test session:

```ts
debateMode: "private-evidence",
privateEvidence: {
  lumina: [
    {
      id: "lumina-e1",
      title: "Lumina source",
      url: "https://example.com/lumina",
      sourceName: "Lumina Source",
      sourceType: "report",
      summary: "Lumina private evidence."
    }
  ]
},
turns: [
  {
    id: "t1",
    speaker: "乾明",
    side: "lumina",
    round: 1,
    content: "先看证据。",
    referencedEvidenceIds: ["lumina-e1"],
    privateEvidenceIds: ["lumina-e1"],
    analysis: {
      factualIssues: ["无上一轮事实可查。"],
      logicalIssues: [],
      valueIssues: [],
      searchFocus: "开场取证"
    }
  }
]
```

Assert:

```ts
expect(payload.debateMode).toBe("private-evidence");
expect(payload.privateEvidence?.lumina?.[0]?.id).toBe("lumina-e1");
expect(payload.turns[0]?.analysis?.searchFocus).toBe("开场取证");
```

In `src/lib/history-records.test.ts`, add a legacy test asserting records without `debateMode`, `privateEvidence`, or `analysis` load with:

```ts
expect(result.records[0]?.debateMode).toBe("shared-evidence");
expect(result.records[0]?.privateEvidence).toEqual({});
```

- [ ] **Step 4: Run red tests**

```bash
pnpm vitest run \
  src/server/orchestrator.test.ts \
  src/app/api/session/route.test.ts \
  src/lib/history-file-writer.test.ts \
  src/lib/history-records.test.ts
```

Expected: FAIL because `DebateMode`, config validation, top-level session mode, private evidence, and history fields do not exist.

## Task 4: Debate Mode Domain and History Implementation

**Files:**
- Modify: `src/lib/types.ts`
- Modify: `src/lib/presets.ts`
- Modify: `src/lib/validators.ts`
- Modify: `src/server/orchestrator.ts`
- Modify: `src/server/runtime.ts`
- Modify: `src/components/session-shell.tsx`
- Modify: `src/lib/history-file-writer.ts`
- Modify: `src/lib/history-records.ts`

- [ ] **Step 1: Extend shared types**

In `src/lib/types.ts`, add:

```ts
export type DebateMode = "shared-evidence" | "private-evidence";

export type DebateTurnAnalysis = {
  factualIssues: string[];
  logicalIssues: string[];
  valueIssues: string[];
  searchFocus: string;
};

export type PrivateEvidencePools = Partial<Record<SpeakerSideKey, Evidence[]>>;
```

Add to `SessionConfig`:

```ts
debateMode: DebateMode;
```

Add to `SessionCreateInput.config` through the existing `Partial<SessionConfig>` path.

Extend `DebateTurn`:

```ts
side?: SpeakerSideKey;
round?: number;
analysis?: DebateTurnAnalysis;
privateEvidenceIds?: string[];
```

Extend `SessionRecord`:

```ts
debateMode: DebateMode;
privateEvidence?: PrivateEvidencePools;
```

- [ ] **Step 2: Add default and validator**

In `src/lib/presets.ts`, include:

```ts
debateMode: "shared-evidence",
```

In `src/lib/validators.ts`, extend `sessionConfigSchema`:

```ts
debateMode: z.enum(["shared-evidence", "private-evidence"]).optional(),
```

- [ ] **Step 3: Set session mode in orchestrator**

In `src/server/orchestrator.ts`, derive:

```ts
const config = { ...DEFAULT_SESSION_CONFIG, ...parsed.config } as SessionRecord["config"];
```

and create sessions with:

```ts
debateMode: config.debateMode,
config,
privateEvidence: {},
```

Keep existing `stage`, `evidence`, and `turns` behavior unchanged.

- [ ] **Step 4: Expose new fields to the client**

In `src/components/session-shell.tsx`, update `SessionView` to pick:

```ts
"id" | "debateMode" | "stage" | "evidence" | "privateEvidence" | "turns" | "summary" | "researchProgress" | "diagnosis"
```

Add guards for `DebateTurnAnalysis`, optional `side`, optional `round`, optional `privateEvidenceIds`, and private evidence pools. Require `debateMode` to be either `"shared-evidence"` or `"private-evidence"` in `isSessionViewResponse`.

- [ ] **Step 5: Serialize and load history fields**

In `src/lib/history-file-writer.ts`, add to the serialized payload:

```ts
debateMode: session.debateMode,
privateEvidence: session.privateEvidence ?? {},
```

In `src/lib/history-records.ts`, add `debateMode` and `privateEvidence` to `HistoryListRecord`, parse them tolerantly, default missing mode to `"shared-evidence"`, default missing private evidence to `{}`, and keep old records loadable.

- [ ] **Step 6: Run green tests**

```bash
pnpm vitest run \
  src/server/orchestrator.test.ts \
  src/app/api/session/route.test.ts \
  src/lib/history-file-writer.test.ts \
  src/lib/history-records.test.ts
```

Expected: PASS.

## Task 5: Debate Mode Switch UI

**Files:**
- Modify: `src/components/question-form.test.tsx`
- Modify: `src/components/session-shell.test.tsx`
- Modify: `src/lib/debate-workspace-state.tsx`
- Modify: `src/components/question-form.tsx`
- Modify: `src/components/session-shell.tsx`
- Modify: `src/lib/ui-copy.ts`

- [ ] **Step 1: Add failing QuestionForm mode-switch test**

In `src/components/question-form.test.tsx`, add the missing import:

```tsx
import userEvent from "@testing-library/user-event";
```

Then add:

```tsx
it("shows the current debate mode and submits the selected mode", async () => {
  const user = userEvent.setup();
  const onSubmit = vi.fn();

  render(<QuestionForm onSubmit={onSubmit} uiLanguage="zh-CN" />);

  expect(screen.getByRole("button", { name: /共证衡辩/ })).toBeInTheDocument();

  await user.click(screen.getByRole("button", { name: /共证衡辩/ }));
  expect(screen.getByRole("button", { name: /隔证三辩/ })).toBeInTheDocument();

  await user.type(screen.getByLabelText("决策问题"), "我应该为了工作搬到另一个城市吗？");
  await user.click(screen.getByRole("button", { name: "开始辩论" }));

  expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({
    debateMode: "private-evidence"
  }));
});
```

- [ ] **Step 2: Add failing SessionShell payload/persistence test**

In `src/components/session-shell.test.tsx`, first update `buildSession()` so existing tests do not need to repeat the default mode:

```ts
function buildSession(overrides: Partial<SessionView> & Pick<SessionView, "id" | "stage">): SessionView {
  return {
    id: overrides.id,
    debateMode: overrides.debateMode ?? "shared-evidence",
    stage: overrides.stage,
    evidence: overrides.evidence ?? [],
    privateEvidence: overrides.privateEvidence ?? {},
    turns: overrides.turns ?? [],
    summary: overrides.summary,
    researchProgress: overrides.researchProgress,
    diagnosis: overrides.diagnosis
  };
}
```

Then add:

```tsx
it("submits and preserves the selected debate mode across workspace page switches", async () => {
  const user = setupUser();
  const createSession = vi.fn().mockResolvedValue(buildSession({
    id: "s-mode",
    debateMode: "private-evidence",
    stage: "research"
  }));

  function Harness() {
    const [route, setRoute] = useState<"debate" | "other">("debate");

    return (
      <DebateWorkspaceStateProvider>
        {route === "debate" ? (
          <SessionShell uiLanguage="zh-CN" createSession={createSession} continueSession={vi.fn()} />
        ) : (
          <button type="button" onClick={() => setRoute("debate")}>回到辩论</button>
        )}
        <button type="button" onClick={() => setRoute("other")}>离开辩论</button>
      </DebateWorkspaceStateProvider>
    );
  }

  render(<Harness />);

  await user.click(screen.getByRole("button", { name: /共证衡辩/ }));
  await user.click(screen.getByRole("button", { name: "离开辩论" }));
  await user.click(screen.getByRole("button", { name: "回到辩论" }));

  expect(screen.getByRole("button", { name: /隔证三辩/ })).toBeInTheDocument();

  await user.type(screen.getByLabelText("决策问题"), "我应该为了工作搬到另一个城市吗？");
  await user.click(screen.getByRole("button", { name: "开始辩论" }));

  expect(createSession).toHaveBeenCalledWith(expect.objectContaining({
    debateMode: "private-evidence"
  }));
});
```

- [ ] **Step 3: Run red UI tests**

```bash
pnpm vitest run src/components/question-form.test.tsx src/components/session-shell.test.tsx
```

Expected: FAIL because the mode control and `debateMode` payload do not exist.

- [ ] **Step 4: Implement mode state and compact switch**

In `src/lib/debate-workspace-state.tsx`, add:

```ts
draftDebateMode: DebateMode | null;
setDraftDebateMode: Dispatch<SetStateAction<DebateMode | null>>;
```

In `QuestionForm`, add controlled props:

```ts
debateModeValue?: DebateMode;
onDebateModeChange?: (mode: DebateMode) => void;
```

Add `debateMode` to `SessionInput`.

Use a compact button that toggles between modes:

```tsx
<button
  type="button"
  data-testid="debate-mode-switch"
  className="absolute right-0 top-full mt-2 rounded-[8px] border border-black/10 bg-white px-3 py-1.5 text-xs font-medium text-black"
  onClick={() => setDebateMode(debateMode === "shared-evidence" ? "private-evidence" : "shared-evidence")}
>
  {modeLabel}
</button>
```

Place it in a `relative` wrapper around the existing action row so the existing model/search/start controls remain in the same flex/grid flow. Do not change existing runtime tile classes or start button wrapper classes.

In `SessionShell`, pass workspace draft mode into `QuestionForm`, include `debateMode` in payload, and include it in `historyMeta`.

When `SessionInput` gains `debateMode`, update existing session-shell assertions that check exact `createSession` payloads so they include:

```ts
debateMode: "shared-evidence"
```

- [ ] **Step 5: Run green UI tests**

```bash
pnpm vitest run src/components/question-form.test.tsx src/components/session-shell.test.tsx
```

Expected: PASS.

## Task 6: Prompt and Agent Analysis API

**Files:**
- Modify: `src/server/prompts.test.ts`
- Modify: `src/server/orchestrator.test.ts`
- Modify: `src/server/prompts.ts`
- Modify: `src/server/debate/agent.ts`

- [ ] **Step 1: Add analysis prompt tests**

In `src/server/prompts.test.ts`, add a helper near existing prompt fixtures:

```ts
function createPromptSession(overrides: Partial<SessionRecord> = {}): SessionRecord {
  return {
    id: "prompt-session",
    debateMode: "shared-evidence",
    question: "Should I move?",
    presetSelection: { pairId: "cautious-aggressive", luminaTemperament: "cautious" },
    firstSpeaker: "lumina",
    language: "en",
    stage: "debate",
    config: {
      debateMode: "shared-evidence",
      sourceStrategy: "credible-first",
      searchDepth: "standard",
      roundCount: 3,
      summaryStyle: "balanced",
      provider: { baseUrl: "https://example.com", apiKey: "key", model: "demo" }
    },
    evidence: [],
    privateEvidence: {},
    turns: [],
    ...overrides
  };
}
```

Then add:

```ts
it("builds a structured analysis prompt for the opponent's previous turn", () => {
  const prompt = buildTurnAnalysisPrompt(
    createPromptSession({
      turns: [
        { id: "t1", speaker: "Vigila", content: "Rent always falls after a move.", referencedEvidenceIds: [] }
      ]
    }),
    "lumina",
    []
  );

  expect(prompt).toContain("factualIssues");
  expect(prompt).toContain("logicalIssues");
  expect(prompt).toContain("valueIssues");
  expect(prompt).toContain("Rent always falls after a move.");
});
```

Add a private evidence visibility test:

```ts
it("limits private-mode turn prompts to the speaking side's private evidence", () => {
  const session = createPromptSession({
    debateMode: "private-evidence",
    privateEvidence: {
      lumina: [{ id: "lumina-e1", title: "Lumina evidence", url: "https://example.com/l", sourceName: "L", sourceType: "report", summary: "Visible to Lumina." }],
      vigila: [{ id: "vigila-e1", title: "Vigila evidence", url: "https://example.com/v", sourceName: "V", sourceType: "report", summary: "Hidden from Lumina." }]
    }
  });

  const prompt = buildOpeningPrompt({ ...session, evidence: session.privateEvidence?.lumina ?? [] });

  expect(prompt).toContain("Lumina evidence");
  expect(prompt).not.toContain("Vigila evidence");
});
```

- [ ] **Step 2: Add agent analysis API test**

In `src/server/orchestrator.test.ts`, add a small helper near the existing `SessionRecord` prompt test:

```ts
function createAnalysisSession(): SessionRecord {
  return {
    id: "analysis-session",
    debateMode: "shared-evidence",
    question: "Should I move to another city for a job?",
    presetSelection: {
      pairId: "cautious-aggressive",
      luminaTemperament: "cautious"
    },
    firstSpeaker: "lumina",
    language: "en",
    stage: "debate",
    config: {
      debateMode: "shared-evidence",
      sourceStrategy: "credible-first",
      searchDepth: "standard",
      roundCount: 3,
      summaryStyle: "balanced",
      provider: providerConfig
    },
    evidence: [],
    privateEvidence: {},
    turns: [
      {
        id: "t1",
        speaker: "Vigila",
        content: "Rent always falls after a move.",
        referencedEvidenceIds: []
      }
    ]
  };
}
```

Then add a `createDebateAgent` test:

```ts
it("can request structured pre-speech analysis", async () => {
  let schemaName = "";
  const agent = createDebateAgent({
    complete: async (_messages, nextSchemaName) => {
      schemaName = nextSchemaName;
      return {
        factualIssues: ["Unsupported rent claim."],
        logicalIssues: [],
        valueIssues: [],
        searchFocus: "rent trend data"
      } as never;
    }
  });

  const analysis = await agent.createTurnAnalysis(createAnalysisSession(), "lumina", []);

  expect(schemaName).toBe("DebateTurnAnalysis");
  expect(analysis.searchFocus).toBe("rent trend data");
});
```

- [ ] **Step 3: Run red prompt tests**

```bash
pnpm vitest run src/server/prompts.test.ts src/server/orchestrator.test.ts
```

Expected: FAIL because analysis prompt and agent method do not exist.

- [ ] **Step 4: Implement prompt and agent methods**

In `src/server/prompts.ts`, export:

```ts
export function buildTurnAnalysisPrompt(
  session: SessionRecord,
  analyzingSide: SpeakerSideKey,
  visibleEvidence: Evidence[]
) {
  const language = session.language ?? "en";
  const previousTurn = session.turns.at(-1);

  return [
    `Language: ${language}`,
    `Question: ${session.question}`,
    `Analyzing side: ${analyzingSide}`,
    previousTurn ? `Opponent previous turn: ${previousTurn.speaker}: ${previousTurn.content}` : "Opponent previous turn: none",
    ...formatEvidenceContext(visibleEvidence, language),
    "Check the opponent's previous turn before speaking.",
    "Identify factual problems, logical problems, and value problems.",
    "Return only valid JSON.",
    'Use this JSON object shape exactly: {"factualIssues":["<issue>"],"logicalIssues":["<issue>"],"valueIssues":["<issue>"],"searchFocus":"<query focus>"}.' ,
    "Use empty arrays when no issue is found."
  ].join("\n");
}
```

Update `buildOpeningPrompt` to include `turn.analysis` when present in turn context or add an `analysis` argument to a new `buildTurnPrompt` helper. Keep existing `createOpeningTurn` callers working.

In `src/server/debate/agent.ts`, widen the generic completion type to a union-compatible local interface and add:

```ts
async createTurnAnalysis(session: SessionRecord, side: SpeakerSideKey, visibleEvidence: Evidence[]) {
  return analysisLlm.complete(
    [{ role: "user", content: buildTurnAnalysisPrompt(session, side, visibleEvidence) }],
    "DebateTurnAnalysis"
  );
}
```

- [ ] **Step 5: Run green prompt tests**

```bash
pnpm vitest run src/server/prompts.test.ts src/server/orchestrator.test.ts
```

Expected: PASS.

## Task 7: Runtime Shared and Private Debate Flow

**Files:**
- Modify: `src/server/runtime.test.ts`
- Modify: `src/server/runtime.ts`

- [ ] **Step 1: Add shared mode analysis-first runtime test**

In `src/server/runtime.test.ts`, update `createOpenAIResponse()` so existing tests that trigger analysis still receive valid JSON:

```ts
function createOpenAIResponse(schemaName = "DebateTurn") {
  const content =
    schemaName === "DebateTurnAnalysis"
      ? {
          factualIssues: [],
          logicalIssues: [],
          valueIssues: [],
          searchFocus: "general follow-up"
        }
      : schemaName === "DebateSummary"
        ? {
            strongestFor: [],
            strongestAgainst: [],
            coreDisagreement: "Disagreement.",
            keyUncertainty: "Uncertainty.",
            nextAction: "Next."
          }
        : {
            speaker: "Lumina",
            content: "Argument",
            referencedEvidenceIds: []
          };

  return new Response(
    JSON.stringify({
      choices: [{ message: { content: JSON.stringify(content) } }]
    }),
    { status: 200, headers: { "Content-Type": "application/json" } }
  );
}
```

For existing `fetchMock` implementations that call `createOpenAIResponse()` without inspecting the body, change them to:

```ts
const body = JSON.parse(String(init?.body ?? "{}"));
return createOpenAIResponse(body?.metadata?.schemaName);
```

Then add:

```ts
it("adds analysis before follow-up turns in shared-evidence mode", async () => {
  const fetchMock = vi.spyOn(globalThis, "fetch").mockImplementation(async (_input, init) => {
    const body = JSON.parse(String(init?.body));
    const schemaName = body?.metadata?.schemaName;

    if (schemaName === "DebateTurnAnalysis") {
      return new Response(JSON.stringify({ choices: [{ message: { content: JSON.stringify({
        factualIssues: ["Rent claim needs data."],
        logicalIssues: [],
        valueIssues: [],
        searchFocus: "rent data"
      }) } }] }), { status: 200, headers: { "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({ choices: [{ message: { content: JSON.stringify({
      speaker: "Lumina",
      content: "Argument with analysis.",
      referencedEvidenceIds: []
    }) } }] }), { status: 200, headers: { "Content-Type": "application/json" } });
  });

  const session = await runtime.createSession(createSessionInput());

  await runtime.continueSession(session.id);
  await runtime.continueSession(session.id);
  const debated = await runtime.continueSession(session.id);

  expect(debated.turns[1]?.analysis?.factualIssues).toContain("Rent claim needs data.");

  fetchMock.mockRestore();
});
```

- [ ] **Step 2: Add private mode three-round evidence isolation test**

In `src/server/runtime.test.ts`, add:

```ts
it("runs private-evidence mode as three rounds with side-specific evidence pools", async () => {
  const prompts: string[] = [];
  const fetchMock = vi.spyOn(globalThis, "fetch").mockImplementation(async (_input, init) => {
    const body = JSON.parse(String(init?.body));
    const prompt = String(body?.messages?.[0]?.content ?? "");
    prompts.push(prompt);

    if (body?.metadata?.schemaName === "DebateTurnAnalysis") {
      return new Response(JSON.stringify({ choices: [{ message: { content: JSON.stringify({
        factualIssues: [],
        logicalIssues: ["Causality needs checking."],
        valueIssues: [],
        searchFocus: "private follow-up evidence"
      }) } }] }), { status: 200, headers: { "Content-Type": "application/json" } });
    }

    if (body?.metadata?.schemaName === "DebateSummary") {
      return new Response(JSON.stringify({ choices: [{ message: { content: JSON.stringify({
        strongestFor: [],
        strongestAgainst: [],
        coreDisagreement: "Disagreement.",
        keyUncertainty: "Uncertainty.",
        nextAction: "Next."
      }) } }] }), { status: 200, headers: { "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({ choices: [{ message: { content: JSON.stringify({
      speaker: prompt.includes("Speaker: Lumina") ? "Lumina" : "Vigila",
      content: "Private-mode argument.",
      referencedEvidenceIds: []
    }) } }] }), { status: 200, headers: { "Content-Type": "application/json" } });
  });

  let session = await runtime.createSession(createSessionInput({
    config: { debateMode: "private-evidence" }
  }));

  while (session.stage !== "complete") {
    session = await runtime.continueSession(session.id);
  }

  expect(session.debateMode).toBe("private-evidence");
  expect(session.turns).toHaveLength(6);
  expect(session.turns.map((turn) => turn.round)).toEqual([1, 1, 2, 2, 3, 3]);
  expect(session.privateEvidence?.lumina?.length).toBeGreaterThan(0);
  expect(session.privateEvidence?.vigila?.length).toBeGreaterThan(0);

  const luminaPrompt = prompts.find((prompt) => prompt.includes("Speaker: Lumina") && prompt.includes("Evidence context:"));
  expect(luminaPrompt).not.toContain("Vigila private");

  fetchMock.mockRestore();
});
```

- [ ] **Step 3: Run red runtime tests**

```bash
pnpm vitest run src/server/runtime.test.ts
```

Expected: FAIL because runtime does not generate analysis or private evidence flows.

- [ ] **Step 4: Implement mode helpers**

In `src/server/runtime.ts`, add helpers:

```ts
function getSessionDebateMode(session: SessionRecord) {
  return session.debateMode ?? session.config.debateMode ?? "shared-evidence";
}

function getSideForTurnIndex(session: SessionRecord, index = session.turns.length): SpeakerSideKey {
  const [firstSpeaker, secondSpeaker] = getSpeakerOrder(session);
  return index % 2 === 0 ? firstSpeaker : secondSpeaker;
}

function getRoundForTurnIndex(index: number) {
  return Math.floor(index / 2) + 1;
}

function getVisibleEvidence(session: SessionRecord, side: SpeakerSideKey) {
  return getSessionDebateMode(session) === "private-evidence"
    ? session.privateEvidence?.[side] ?? []
    : session.evidence;
}
```

- [ ] **Step 5: Implement analysis generation**

Add:

```ts
async function generateAnalysis(session: SessionRecord, side: SpeakerSideKey) {
  if (session.turns.length === 0) {
    return undefined;
  }

  const agent = createDebateAgent(createTurnCompletion(session));
  return agent.createTurnAnalysis(session, side, getVisibleEvidence(session, side));
}
```

If TypeScript needs separate structured completions for turn and analysis, create `createAnalysisCompletion(session)` with `createOpenAICompatibleProvider<DebateTurnAnalysis>()`.

- [ ] **Step 6: Implement private evidence research**

Add:

```ts
async function buildPrivateEvidenceForSide(sessionId: string, session: SessionRecord, side: SpeakerSideKey, searchFocus?: string) {
  const { service: researchService } = getResearchService(session.config.searchProvider);
  const existing = session.privateEvidence?.[side] ?? [];
  const query = searchFocus?.trim()
    ? `Question: ${session.question}\nSearch focus: ${searchFocus}`
    : session.question;
  const incoming = await researchService.buildSharedEvidence(query);
  return mergeEvidence(existing, incoming);
}
```

- [ ] **Step 7: Split `advanceSessionStep` by mode**

For `shared-evidence`:

- keep initial research stage;
- in opening/debate, compute `side`, `round`, `analysis`;
- search shared evidence using `analysis?.searchFocus` or existing claim query;
- generate one turn with shared visible evidence;
- attach `side`, `round`, and `analysis`.

For `private-evidence`:

- skip initial shared research by moving from `research` to `opening` with empty shared evidence and empty private pools;
- force effective round count to 3 for this mode even if client config supplies another `roundCount`;
- each opening/debate continuation generates exactly one turn;
- before turn, analyze previous turn when present;
- research only for the speaking side;
- generate the turn using only that side's private evidence;
- attach `side`, `round`, `analysis`, and `privateEvidenceIds`;
- when `turns.length >= 6`, run summary and complete.

- [ ] **Step 8: Run green runtime tests**

```bash
pnpm vitest run src/server/runtime.test.ts
```

Expected: PASS.

## Task 8: Timeline and History Full Process Display

**Files:**
- Modify: `src/components/debate-timeline.test.tsx`
- Modify: `src/app/(workspace)/history/page.test.tsx`
- Modify: `src/components/debate-timeline.tsx`
- Modify: `src/app/(workspace)/history/history-page-content.tsx`
- Modify: `src/lib/workspace-copy.ts`
- Modify: `src/lib/ui-copy.ts`

- [ ] **Step 1: Add timeline analysis display test**

In `src/components/debate-timeline.test.tsx`, extend or add:

```tsx
it("shows analysis before a debate turn when analysis is saved", () => {
  render(
    <DebateTimeline
      language="zh-CN"
      evidence={[]}
      turns={[
        {
          id: "t1",
          speaker: "乾明",
          side: "lumina",
          round: 2,
          content: "继续推进。",
          referencedEvidenceIds: [],
          analysis: {
            factualIssues: ["数据来源不足。"],
            logicalIssues: ["因果链条不完整。"],
            valueIssues: ["忽略长期风险。"],
            searchFocus: "长期风险数据"
          }
        }
      ]}
    />
  );

  expect(screen.getByText("分析")).toBeInTheDocument();
  expect(screen.getByText("数据来源不足。")).toBeInTheDocument();
  expect(screen.getByText("第 2 轮")).toBeInTheDocument();
});
```

- [ ] **Step 2: Add history detail analysis/private evidence test**

In `src/app/(workspace)/history/page.test.tsx`, make `createHistoryRecord()` include:

```ts
debateMode: "private-evidence",
privateEvidence: {
  lumina: [
    {
      id: "lumina-e1",
      title: "乾明私有证据",
      url: "https://example.com/lumina",
      sourceName: "Lumina Research",
      sourceType: "report",
      summary: "乾明单独搜索到的证据。"
    }
  ]
}
```

Add to one turn:

```ts
side: "lumina",
round: 2,
privateEvidenceIds: ["lumina-e1"],
analysis: {
  factualIssues: ["数据来源不足。"],
  logicalIssues: ["因果链条不完整。"],
  valueIssues: [],
  searchFocus: "长期风险数据"
}
```

Assert in the detail dialog:

```tsx
expect(within(dialog).getByText("隔证三辩")).toBeInTheDocument();
expect(within(dialog).getByText("乾明私有证据")).toBeInTheDocument();
expect(within(dialog).getByText("数据来源不足。")).toBeInTheDocument();
expect(within(dialog).getByText("长期风险数据")).toBeInTheDocument();
```

- [ ] **Step 3: Run red display tests**

```bash
pnpm vitest run src/components/debate-timeline.test.tsx 'src/app/(workspace)/history/page.test.tsx'
```

Expected: FAIL because timeline/history do not render analysis, mode names, or private evidence.

- [ ] **Step 4: Render analysis in timeline**

In `src/components/debate-timeline.tsx`, before `turn.content`, render if `turn.analysis` exists:

```tsx
<div className="mb-3 rounded-[8px] border border-black/8 bg-paper px-3 py-3">
  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ink/55">{copy.turnAnalysisTitle}</p>
  <ul className="mt-2 list-disc space-y-1 pl-4 text-xs leading-5 text-ink/65">
    {[...turn.analysis.factualIssues, ...turn.analysis.logicalIssues, ...turn.analysis.valueIssues].map((issue) => (
      <li key={issue}>{issue}</li>
    ))}
  </ul>
  <p className="mt-2 text-xs text-ink/55">{copy.turnAnalysisSearchFocus}: {turn.analysis.searchFocus}</p>
</div>
```

Also show `turn.round` as `第 N 轮` / `Round N` without changing the outer card layout.

- [ ] **Step 5: Render mode/private evidence in history dialog**

In `src/app/(workspace)/history/history-page-content.tsx`, add mode metadata, private evidence sections, and analysis blocks inside turn entries.

Use `record.privateEvidence` flattened by side for private evidence display. Keep older shared evidence display unchanged.

- [ ] **Step 6: Run green display tests**

```bash
pnpm vitest run src/components/debate-timeline.test.tsx 'src/app/(workspace)/history/page.test.tsx'
```

Expected: PASS.

## Task 9: Final Verification and Commit

**Files:**
- All modified source, test, spec, and plan files.

- [ ] **Step 1: Run focused suite**

```bash
pnpm vitest run \
  'src/app/(workspace)/product/page.test.tsx' \
  src/components/layout/app-sidebar.test.tsx \
  src/components/layout/app-shell.test.tsx \
  src/components/question-form.test.tsx \
  src/components/session-shell.test.tsx \
  src/server/prompts.test.ts \
  src/server/orchestrator.test.ts \
  src/server/runtime.test.ts \
  src/components/debate-timeline.test.tsx \
  'src/app/(workspace)/history/page.test.tsx' \
  src/lib/history-file-writer.test.ts \
  src/lib/history-records.test.ts \
  src/app/api/session/route.test.ts
```

Expected: all pass.

- [ ] **Step 2: Run full tests**

```bash
pnpm test
```

Expected: all test files pass.

- [ ] **Step 3: Run build**

```bash
pnpm build
```

Expected: exits 0.

- [ ] **Step 4: Check diff and commit**

```bash
git diff --check
git status --short
git add dualens
git commit -m "feat: add product page and debate modes"
```

Expected: no whitespace errors, only intended files are staged, commit succeeds.
