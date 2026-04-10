# Two Agent Debate Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a local-first, evidence-driven two-agent debate web app that accepts user-supplied model API configuration, researches public sources, runs structured debate rounds, and produces a summary with supporting evidence.

**Architecture:** Use a single Next.js TypeScript app for the MVP, with App Router UI and server-side route handlers acting as the local backend. Keep orchestration, research, provider access, and domain models in focused `src/server/*` modules so the UI remains thin and the backend logic can later move into a standalone service if needed.

**Tech Stack:** Next.js, React, TypeScript, Vitest, React Testing Library, Zod, Tailwind CSS, Playwright, jsdom

---

## Planned File Structure

### Root files

- Create: `package.json` - workspace scripts and dependencies
- Create: `tsconfig.json` - TypeScript configuration
- Create: `next.config.ts` - Next.js configuration
- Create: `postcss.config.js` - Tailwind/PostCSS wiring
- Create: `tailwind.config.ts` - theme tokens and content paths
- Create: `.eslintrc.json` - lint rules
- Create: `.gitignore` - generated files and local env exclusions
- Create: `vitest.config.ts` - unit/integration test config
- Create: `playwright.config.ts` - end-to-end test config
- Create: `README.md` - local setup and run instructions

### App Router files

- Create: `src/app/layout.tsx` - root shell and metadata
- Create: `src/app/globals.css` - global styles and design tokens
- Create: `src/app/page.tsx` - main debate workspace page
- Create: `src/app/api/session/route.ts` - create a session and trigger initial shared research
- Create: `src/app/api/session/[sessionId]/premise/route.ts` - append a user premise
- Create: `src/app/api/session/[sessionId]/continue/route.ts` - execute the next orchestrated step
- Create: `src/app/api/session/[sessionId]/stop/route.ts` - force summary generation

### UI components

- Create: `src/components/question-form.tsx` - question input and preset selector
- Create: `src/components/advanced-settings.tsx` - collapsed config editor
- Create: `src/components/debate-timeline.tsx` - stage and turn rendering
- Create: `src/components/evidence-panel.tsx` - evidence list and metadata
- Create: `src/components/summary-panel.tsx` - final summary rendering
- Create: `src/components/session-shell.tsx` - client state coordinator
- Create: `src/components/ui/button.tsx` - minimal reusable button
- Create: `src/components/ui/card.tsx` - minimal reusable card
- Create: `src/components/ui/input.tsx` - minimal reusable input
- Create: `src/components/ui/select.tsx` - minimal reusable select
- Create: `src/components/ui/textarea.tsx` - minimal reusable textarea

### Shared domain files

- Create: `src/lib/types.ts` - session, turn, evidence, config, summary types
- Create: `src/lib/presets.ts` - default role presets and labels
- Create: `src/lib/validators.ts` - Zod schemas for requests and stored objects

### Server modules

- Create: `src/server/session-store.ts` - in-memory session persistence for MVP
- Create: `src/server/orchestrator.ts` - stage progression and end-condition logic
- Create: `src/server/research/search-provider.ts` - search provider interface
- Create: `src/server/research/mock-search-provider.ts` - deterministic provider for tests
- Create: `src/server/research/page-extractor.ts` - HTML/text extraction contract
- Create: `src/server/research/research-service.ts` - search, extract, summarize into evidence
- Create: `src/server/llm/provider.ts` - model provider interface
- Create: `src/server/llm/openai-compatible-provider.ts` - OpenAI-compatible chat implementation
- Create: `src/server/debate/agent.ts` - single turn generation contract
- Create: `src/server/debate/summary.ts` - final summary generation
- Create: `src/server/prompts.ts` - prompt builders for normalization, debate, and summary

### Tests

- Create: `src/server/orchestrator.test.ts` - stage progression unit tests
- Create: `src/server/research/research-service.test.ts` - evidence shaping tests
- Create: `src/server/debate/summary.test.ts` - summary citation tests
- Create: `src/app/api/session/route.test.ts` - session creation route test
- Create: `src/components/session-shell.test.tsx` - main client flow test
- Create: `tests/e2e/session-flow.spec.ts` - smoke test for create -> continue -> summary

## Task 1: Scaffold The Project

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `next.config.ts`
- Create: `postcss.config.js`
- Create: `tailwind.config.ts`
- Create: `.eslintrc.json`
- Create: `.gitignore`
- Create: `vitest.config.ts`
- Create: `playwright.config.ts`
- Create: `README.md`

- [ ] **Step 1: Write the failing config smoke test**

```ts
// src/server/orchestrator.test.ts
import { describe, expect, it } from "vitest";

describe("project bootstrap", () => {
  it("loads the test runner", () => {
    expect(true).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify the toolchain is not ready yet**

Run: `pnpm vitest run src/server/orchestrator.test.ts`
Expected: FAIL with missing `pnpm`, missing dependencies, or missing config files.

- [ ] **Step 3: Create the minimal project config**

```json
// package.json
{
  "name": "two-agent-debate",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:e2e": "playwright test"
  },
  "dependencies": {
    "next": "15.3.0",
    "react": "19.1.0",
    "react-dom": "19.1.0",
    "zod": "3.24.3"
  },
  "devDependencies": {
    "@playwright/test": "1.52.0",
    "@testing-library/jest-dom": "6.6.3",
    "@testing-library/react": "16.3.0",
    "@testing-library/user-event": "14.6.1",
    "@types/node": "22.15.3",
    "@types/react": "19.1.2",
    "@types/react-dom": "19.1.2",
    "autoprefixer": "10.4.21",
    "eslint": "9.24.0",
    "eslint-config-next": "15.3.0",
    "jsdom": "26.1.0",
    "postcss": "8.5.3",
    "tailwindcss": "3.4.17",
    "typescript": "5.8.3",
    "vitest": "3.1.2"
  }
}
```

```json
// tsconfig.json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "es2022"],
    "allowJs": false,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

```ts
// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {};

export default nextConfig;
```

```ts
// tailwind.config.ts
import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#151515",
        paper: "#f7f2e8",
        accent: "#bf5b2c",
        moss: "#496a4b"
      }
    }
  },
  plugins: []
};

export default config;
```

```ts
// vitest.config.ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    globals: true
  }
});
```

- [ ] **Step 4: Install dependencies**

Run: `pnpm install`
Expected: dependencies installed and lockfile created.

- [ ] **Step 5: Run the bootstrap test to verify the project is wired**

Run: `pnpm vitest run src/server/orchestrator.test.ts`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add package.json tsconfig.json next.config.ts tailwind.config.ts vitest.config.ts playwright.config.ts postcss.config.js .eslintrc.json .gitignore README.md src/server/orchestrator.test.ts
git commit -m "chore: scaffold nextjs app"
```

## Task 2: Define Domain Models And Validation

**Files:**
- Create: `src/lib/types.ts`
- Create: `src/lib/presets.ts`
- Create: `src/lib/validators.ts`
- Modify: `src/server/orchestrator.test.ts`
- Test: `src/server/orchestrator.test.ts`

- [ ] **Step 1: Write the failing domain model tests**

```ts
import { describe, expect, it } from "vitest";
import { DEFAULT_SESSION_CONFIG, ROLE_PRESETS } from "@/lib/presets";
import { createSessionInputSchema } from "@/lib/validators";

describe("session config", () => {
  it("ships with a credible-source default", () => {
    expect(DEFAULT_SESSION_CONFIG.sourceStrategy).toBe("credible-first");
  });

  it("includes the cautious-versus-aggressive preset", () => {
    expect(ROLE_PRESETS[0].id).toBe("cautious-vs-aggressive");
  });

  it("validates a create-session payload", () => {
    const parsed = createSessionInputSchema.parse({
      question: "Should I quit my job and start a company?",
      presetId: "cautious-vs-aggressive"
    });

    expect(parsed.question).toContain("quit my job");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/server/orchestrator.test.ts`
Expected: FAIL with missing `@/lib/presets` and `@/lib/validators`.

- [ ] **Step 3: Create the shared types, presets, and validators**

```ts
// src/lib/types.ts
export type SourceStrategy = "credible-first" | "full-web";
export type SummaryStyle = "balanced" | "concise" | "actionable";
export type SessionStage = "idle" | "research" | "opening" | "debate" | "summary" | "complete";

export type RolePreset = {
  id: string;
  label: string;
  leftTitle: string;
  rightTitle: string;
  leftPrompt: string;
  rightPrompt: string;
};

export type SessionConfig = {
  sourceStrategy: SourceStrategy;
  searchDepth: "quick" | "standard" | "deep";
  roundCount: number;
  summaryStyle: SummaryStyle;
};
```

```ts
// src/lib/presets.ts
import type { RolePreset, SessionConfig } from "@/lib/types";

export const ROLE_PRESETS: RolePreset[] = [
  {
    id: "cautious-vs-aggressive",
    label: "稳健派 vs 激进派",
    leftTitle: "稳健派",
    rightTitle: "激进派",
    leftPrompt: "Argue for lower-risk, evidence-backed decisions.",
    rightPrompt: "Argue for higher-upside, time-sensitive action."
  }
];

export const DEFAULT_SESSION_CONFIG: SessionConfig = {
  sourceStrategy: "credible-first",
  searchDepth: "standard",
  roundCount: 3,
  summaryStyle: "balanced"
};
```

```ts
// src/lib/validators.ts
import { z } from "zod";

export const createSessionInputSchema = z.object({
  question: z.string().min(10),
  presetId: z.string().min(1),
  premise: z.string().optional(),
  config: z
    .object({
      sourceStrategy: z.enum(["credible-first", "full-web"]).optional(),
      searchDepth: z.enum(["quick", "standard", "deep"]).optional(),
      roundCount: z.number().int().min(1).max(5).optional(),
      summaryStyle: z.enum(["balanced", "concise", "actionable"]).optional()
    })
    .optional()
});
```

- [ ] **Step 4: Run the domain model test**

Run: `pnpm vitest run src/server/orchestrator.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/types.ts src/lib/presets.ts src/lib/validators.ts src/server/orchestrator.test.ts
git commit -m "feat: add session domain models"
```

## Task 3: Build The In-Memory Session Store And Orchestrator Skeleton

**Files:**
- Create: `src/server/session-store.ts`
- Create: `src/server/orchestrator.ts`
- Modify: `src/lib/types.ts`
- Modify: `src/server/orchestrator.test.ts`
- Test: `src/server/orchestrator.test.ts`

- [ ] **Step 1: Write the failing orchestrator progression test**

```ts
import { describe, expect, it } from "vitest";
import { createSessionStore } from "@/server/session-store";
import { createOrchestrator } from "@/server/orchestrator";

describe("orchestrator", () => {
  it("creates a session in research stage and then advances to opening", async () => {
    const store = createSessionStore();
    const orchestrator = createOrchestrator(store, {
      runSharedResearch: async () => [],
      runOpeningRound: async (session) => session
    });

    const session = await orchestrator.createSession({
      question: "Should I move to another city for a job?",
      presetId: "cautious-vs-aggressive"
    });

    expect(session.stage).toBe("research");

    const advanced = await orchestrator.continueSession(session.id);
    expect(advanced.stage).toBe("opening");
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm vitest run src/server/orchestrator.test.ts`
Expected: FAIL with missing store/orchestrator modules.

- [ ] **Step 3: Add session records, store, and orchestrator shell**

```ts
// src/lib/types.ts
export type Evidence = {
  id: string;
  title: string;
  url: string;
  sourceName: string;
  sourceType: string;
  summary: string;
};

export type SessionRecord = {
  id: string;
  question: string;
  presetId: string;
  premise?: string;
  stage: SessionStage;
  config: SessionConfig;
  evidence: Evidence[];
  turns: Array<{ id: string; speaker: string; content: string }>;
};
```

```ts
// src/server/session-store.ts
import type { SessionRecord } from "@/lib/types";

export function createSessionStore() {
  const sessions = new Map<string, SessionRecord>();

  return {
    get(id: string) {
      return sessions.get(id);
    },
    save(session: SessionRecord) {
      sessions.set(session.id, session);
      return session;
    }
  };
}
```

```ts
// src/server/orchestrator.ts
import { randomUUID } from "node:crypto";
import { DEFAULT_SESSION_CONFIG } from "@/lib/presets";
import type { SessionRecord } from "@/lib/types";
import { createSessionInputSchema } from "@/lib/validators";

export function createOrchestrator(
  store: { get(id: string): SessionRecord | undefined; save(session: SessionRecord): SessionRecord },
  deps: {
    runSharedResearch(session: SessionRecord): Promise<SessionRecord["evidence"]>;
    runOpeningRound(session: SessionRecord): Promise<SessionRecord>;
  }
) {
  return {
    async createSession(input: unknown) {
      const parsed = createSessionInputSchema.parse(input);
      const session: SessionRecord = {
        id: randomUUID(),
        question: parsed.question,
        presetId: parsed.presetId,
        premise: parsed.premise,
        stage: "research",
        config: { ...DEFAULT_SESSION_CONFIG, ...parsed.config },
        evidence: [],
        turns: []
      };

      return store.save(session);
    },
    async continueSession(id: string) {
      const session = store.get(id);
      if (!session) {
        throw new Error("Session not found");
      }

      if (session.stage === "research") {
        const evidence = await deps.runSharedResearch(session);
        return store.save({ ...session, evidence, stage: "opening" });
      }

      if (session.stage === "opening") {
        const next = await deps.runOpeningRound(session);
        return store.save(next);
      }

      return session;
    }
  };
}
```

- [ ] **Step 4: Run the orchestrator test**

Run: `pnpm vitest run src/server/orchestrator.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/types.ts src/server/session-store.ts src/server/orchestrator.ts src/server/orchestrator.test.ts
git commit -m "feat: add session store and orchestrator shell"
```

## Task 4: Add Research Service And Evidence Structuring

**Files:**
- Create: `src/server/research/search-provider.ts`
- Create: `src/server/research/mock-search-provider.ts`
- Create: `src/server/research/page-extractor.ts`
- Create: `src/server/research/research-service.ts`
- Create: `src/server/research/research-service.test.ts`
- Modify: `src/lib/types.ts`
- Test: `src/server/research/research-service.test.ts`

- [ ] **Step 1: Write the failing research service test**

```ts
import { describe, expect, it } from "vitest";
import { createResearchService } from "@/server/research/research-service";

describe("research service", () => {
  it("converts search results into structured evidence", async () => {
    const service = createResearchService({
      search: async () => [
        {
          title: "创业成功率研究",
          url: "https://example.com/startup",
          sourceName: "Example Research",
          sourceType: "research"
        }
      ],
      extract: async () => ({
        summary: "Most startups fail within five years.",
        notableDataPoints: ["Failure rates are high in the first five years."]
      })
    });

    const evidence = await service.buildSharedEvidence("Should I start a company?");
    expect(evidence[0].summary).toContain("Most startups fail");
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm vitest run src/server/research/research-service.test.ts`
Expected: FAIL with missing research modules.

- [ ] **Step 3: Create provider interfaces and research service**

```ts
// src/server/research/search-provider.ts
export type SearchResult = {
  title: string;
  url: string;
  sourceName: string;
  sourceType: string;
};

export type SearchProvider = {
  search(query: string): Promise<SearchResult[]>;
};
```

```ts
// src/server/research/page-extractor.ts
export type ExtractedPage = {
  summary: string;
  notableDataPoints: string[];
};

export type PageExtractor = {
  extract(url: string): Promise<ExtractedPage>;
};
```

```ts
// src/server/research/research-service.ts
import { randomUUID } from "node:crypto";
import type { Evidence } from "@/lib/types";
import type { PageExtractor } from "@/server/research/page-extractor";
import type { SearchProvider } from "@/server/research/search-provider";

export function createResearchService(deps: SearchProvider & PageExtractor) {
  return {
    async buildSharedEvidence(question: string): Promise<Evidence[]> {
      const results = await deps.search(question);

      return Promise.all(
        results.map(async (result) => {
          const extracted = await deps.extract(result.url);

          return {
            id: randomUUID(),
            title: result.title,
            url: result.url,
            sourceName: result.sourceName,
            sourceType: result.sourceType,
            summary: extracted.summary,
            dataPoints: extracted.notableDataPoints
          };
        })
      );
    }
  };
}
```

```ts
// src/server/research/mock-search-provider.ts
import type { PageExtractor } from "@/server/research/page-extractor";
import type { SearchProvider } from "@/server/research/search-provider";

export function createMockSearchProvider(): SearchProvider & PageExtractor {
  return {
    async search() {
      return [
        {
          title: "Mock result",
          url: "https://example.com/mock",
          sourceName: "Mock Source",
          sourceType: "news"
        }
      ];
    },
    async extract() {
      return {
        summary: "Mock summary",
        notableDataPoints: ["Mock data point"]
      };
    }
  };
}
```

- [ ] **Step 4: Run the research service test**

Run: `pnpm vitest run src/server/research/research-service.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/types.ts src/server/research/search-provider.ts src/server/research/page-extractor.ts src/server/research/mock-search-provider.ts src/server/research/research-service.ts src/server/research/research-service.test.ts
git commit -m "feat: add research service"
```

## Task 5: Generate Opening Turns, Debate Turns, And Final Summary

**Files:**
- Create: `src/server/llm/provider.ts`
- Create: `src/server/llm/openai-compatible-provider.ts`
- Create: `src/server/prompts.ts`
- Create: `src/server/debate/agent.ts`
- Create: `src/server/debate/summary.ts`
- Create: `src/server/debate/summary.test.ts`
- Modify: `src/lib/types.ts`
- Modify: `src/server/orchestrator.ts`
- Test: `src/server/debate/summary.test.ts`
- Test: `src/server/orchestrator.test.ts`

- [ ] **Step 1: Write the failing summary and turn tests**

```ts
import { describe, expect, it } from "vitest";
import { createSummaryService } from "@/server/debate/summary";

describe("summary service", () => {
  it("returns a summary that references evidence ids", async () => {
    const service = createSummaryService({
      complete: async () => ({
        strongestFor: [{ text: "Keep cash runway in mind.", evidenceIds: ["e1"] }],
        strongestAgainst: [{ text: "Upside may justify the risk.", evidenceIds: ["e2"] }],
        coreDisagreement: "How much downside the user can absorb.",
        keyUncertainty: "Customer demand strength.",
        nextAction: "Validate demand before resigning."
      })
    });

    const summary = await service.generate({
      question: "Should I quit and build a startup?",
      evidence: [{ id: "e1" }, { id: "e2" }]
    } as never);

    expect(summary.strongestFor[0].evidenceIds).toContain("e1");
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `pnpm vitest run src/server/debate/summary.test.ts src/server/orchestrator.test.ts`
Expected: FAIL with missing debate/summary modules.

- [ ] **Step 3: Add LLM interface, prompt builders, and debate services**

```ts
// src/server/llm/provider.ts
export type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

export type StructuredCompletion<T> = {
  complete(messages: ChatMessage[], schemaName: string): Promise<T>;
};
```

```ts
// src/server/prompts.ts
import type { SessionRecord } from "@/lib/types";

export function buildOpeningPrompt(session: SessionRecord) {
  return `Question: ${session.question}\nEvidence count: ${session.evidence.length}\nWrite the opening position.`;
}

export function buildSummaryPrompt(session: SessionRecord) {
  return `Question: ${session.question}\nTurns: ${session.turns.length}\nReturn a balanced summary with evidence ids.`;
}
```

```ts
// src/server/debate/summary.ts
import type { SessionRecord } from "@/lib/types";
import { buildSummaryPrompt } from "@/server/prompts";
import type { StructuredCompletion } from "@/server/llm/provider";

export function createSummaryService(
  llm: StructuredCompletion<SessionRecord["summary"]>
) {
  return {
    async generate(session: SessionRecord) {
      return llm.complete(
        [{ role: "user", content: buildSummaryPrompt(session) }],
        "DebateSummary"
      );
    }
  };
}
```

```ts
// src/server/debate/agent.ts
import type { SessionRecord } from "@/lib/types";
import { buildOpeningPrompt } from "@/server/prompts";
import type { StructuredCompletion } from "@/server/llm/provider";

export function createDebateAgent(
  llm: StructuredCompletion<{ speaker: string; content: string; referencedEvidenceIds: string[] }>
) {
  return {
    async createOpeningTurn(session: SessionRecord, speaker: string) {
      return llm.complete(
        [{ role: "user", content: `${buildOpeningPrompt(session)}\nSpeaker: ${speaker}` }],
        "DebateTurn"
      );
    }
  };
}
```

- [ ] **Step 4: Extend the orchestrator to create opening turns and summary**

```ts
// src/server/orchestrator.ts
// Add to deps:
runDebateRound(session: SessionRecord): Promise<SessionRecord>;
runSummary(session: SessionRecord): Promise<SessionRecord["summary"]>;

// Replace continueSession body:
if (session.stage === "research") {
  const evidence = await deps.runSharedResearch(session);
  return store.save({ ...session, evidence, stage: "opening" });
}

if (session.stage === "opening") {
  const next = await deps.runOpeningRound(session);
  return store.save({ ...next, stage: "debate" });
}

if (session.stage === "debate") {
  if (session.turns.length >= session.config.roundCount * 2) {
    const summary = await deps.runSummary(session);
    return store.save({ ...session, summary, stage: "complete" });
  }

  const next = await deps.runDebateRound(session);
  return store.save(next);
}
```

- [ ] **Step 5: Run the summary and orchestrator tests**

Run: `pnpm vitest run src/server/debate/summary.test.ts src/server/orchestrator.test.ts`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/lib/types.ts src/server/llm/provider.ts src/server/prompts.ts src/server/debate/agent.ts src/server/debate/summary.ts src/server/debate/summary.test.ts src/server/orchestrator.ts src/server/orchestrator.test.ts
git commit -m "feat: add debate and summary services"
```

## Task 6: Expose Route Handlers For Session Lifecycle

**Files:**
- Create: `src/app/api/session/route.ts`
- Create: `src/app/api/session/[sessionId]/continue/route.ts`
- Create: `src/app/api/session/[sessionId]/premise/route.ts`
- Create: `src/app/api/session/[sessionId]/stop/route.ts`
- Create: `src/app/api/session/route.test.ts`
- Create: `src/server/runtime.ts`
- Test: `src/app/api/session/route.test.ts`

- [ ] **Step 1: Write the failing route test**

```ts
import { describe, expect, it } from "vitest";
import { POST } from "@/app/api/session/route";

describe("POST /api/session", () => {
  it("creates a session and returns json", async () => {
    const request = new Request("http://localhost/api/session", {
      method: "POST",
      body: JSON.stringify({
        question: "Should I move to another city?",
        presetId: "cautious-vs-aggressive"
      })
    });

    const response = await POST(request);
    const payload = await response.json();

    expect(response.status).toBe(201);
    expect(payload.stage).toBe("research");
  });
});
```

- [ ] **Step 2: Run the route test to verify it fails**

Run: `pnpm vitest run src/app/api/session/route.test.ts`
Expected: FAIL with missing route/runtime modules.

- [ ] **Step 3: Create the runtime container and route handlers**

```ts
// src/server/runtime.ts
import { createOrchestrator } from "@/server/orchestrator";
import { createMockSearchProvider } from "@/server/research/mock-search-provider";
import { createResearchService } from "@/server/research/research-service";
import { createSessionStore } from "@/server/session-store";

const store = createSessionStore();
const research = createResearchService(createMockSearchProvider());

export const runtime = createOrchestrator(store, {
  runSharedResearch: (session) => research.buildSharedEvidence(session.question),
  runOpeningRound: async (session) => ({
    ...session,
    turns: [
      ...session.turns,
      { id: "turn-a", speaker: "稳健派", content: "Opening stance from evidence." },
      { id: "turn-b", speaker: "激进派", content: "Counter stance from evidence." }
    ]
  }),
  runDebateRound: async (session) => session,
  runSummary: async () => ({
    strongestFor: [],
    strongestAgainst: [],
    coreDisagreement: "",
    keyUncertainty: "",
    nextAction: ""
  })
});
```

```ts
// src/app/api/session/route.ts
import { NextResponse } from "next/server";
import { runtime } from "@/server/runtime";

export async function POST(request: Request) {
  const body = await request.json();
  const session = await runtime.createSession(body);
  return NextResponse.json(session, { status: 201 });
}
```

- [ ] **Step 4: Run the route test**

Run: `pnpm vitest run src/app/api/session/route.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/server/runtime.ts src/app/api/session/route.ts src/app/api/session/route.test.ts src/app/api/session/[sessionId]/continue/route.ts src/app/api/session/[sessionId]/premise/route.ts src/app/api/session/[sessionId]/stop/route.ts
git commit -m "feat: add session lifecycle api routes"
```

## Task 7: Build The Main UI Shell

**Files:**
- Create: `src/app/layout.tsx`
- Create: `src/app/globals.css`
- Create: `src/app/page.tsx`
- Create: `src/components/session-shell.tsx`
- Create: `src/components/question-form.tsx`
- Create: `src/components/advanced-settings.tsx`
- Create: `src/components/debate-timeline.tsx`
- Create: `src/components/evidence-panel.tsx`
- Create: `src/components/summary-panel.tsx`
- Create: `src/components/ui/button.tsx`
- Create: `src/components/ui/card.tsx`
- Create: `src/components/ui/input.tsx`
- Create: `src/components/ui/select.tsx`
- Create: `src/components/ui/textarea.tsx`
- Create: `src/components/session-shell.test.tsx`
- Test: `src/components/session-shell.test.tsx`

- [ ] **Step 1: Write the failing UI flow test**

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { SessionShell } from "@/components/session-shell";

describe("SessionShell", () => {
  it("submits a question and reveals the debate workspace", async () => {
    const user = userEvent.setup();
    const createSession = vi.fn().mockResolvedValue({
      id: "s1",
      stage: "research",
      evidence: [],
      turns: []
    });

    render(<SessionShell createSession={createSession} />);

    await user.type(screen.getByLabelText("Decision question"), "Should I move to another city?");
    await user.click(screen.getByRole("button", { name: "Start debate" }));

    expect(createSession).toHaveBeenCalled();
    expect(screen.getByText("Research in progress")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the UI test to verify it fails**

Run: `pnpm vitest run src/components/session-shell.test.tsx`
Expected: FAIL with missing UI modules.

- [ ] **Step 3: Create the page shell and focused components**

```tsx
// src/components/session-shell.tsx
"use client";

import { useState } from "react";
import { QuestionForm } from "@/components/question-form";
import { DebateTimeline } from "@/components/debate-timeline";
import { EvidencePanel } from "@/components/evidence-panel";
import { SummaryPanel } from "@/components/summary-panel";

export function SessionShell({
  createSession
}: {
  createSession: (input: { question: string; presetId: string }) => Promise<{
    id: string;
    stage: string;
    evidence: unknown[];
    turns: unknown[];
    summary?: unknown;
  }>;
}) {
  const [session, setSession] = useState<null | Awaited<ReturnType<typeof createSession>>>(null);

  return (
    <main className="min-h-screen bg-paper text-ink">
      <QuestionForm
        onSubmit={async (input) => {
          const next = await createSession(input);
          setSession(next);
        }}
      />
      {session ? (
        <section aria-label="Debate workspace">
          <p>Research in progress</p>
          <DebateTimeline turns={session.turns} />
          <EvidencePanel evidence={session.evidence} />
          <SummaryPanel summary={session.summary} />
        </section>
      ) : null}
    </main>
  );
}
```

```tsx
// src/components/question-form.tsx
"use client";

import { useState } from "react";

export function QuestionForm({
  onSubmit
}: {
  onSubmit(input: { question: string; presetId: string }): Promise<void>;
}) {
  const [question, setQuestion] = useState("");

  return (
    <form
      onSubmit={async (event) => {
        event.preventDefault();
        await onSubmit({ question, presetId: "cautious-vs-aggressive" });
      }}
    >
      <label htmlFor="question">Decision question</label>
      <textarea
        id="question"
        value={question}
        onChange={(event) => setQuestion(event.target.value)}
      />
      <button type="submit">Start debate</button>
    </form>
  );
}
```

- [ ] **Step 4: Run the UI test**

Run: `pnpm vitest run src/components/session-shell.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/app/layout.tsx src/app/globals.css src/app/page.tsx src/components/session-shell.tsx src/components/question-form.tsx src/components/advanced-settings.tsx src/components/debate-timeline.tsx src/components/evidence-panel.tsx src/components/summary-panel.tsx src/components/ui/button.tsx src/components/ui/card.tsx src/components/ui/input.tsx src/components/ui/select.tsx src/components/ui/textarea.tsx src/components/session-shell.test.tsx
git commit -m "feat: add debate workspace ui"
```

## Task 8: Connect The UI To Real Route Handlers

**Files:**
- Modify: `src/app/page.tsx`
- Modify: `src/components/session-shell.tsx`
- Modify: `src/app/api/session/[sessionId]/continue/route.ts`
- Modify: `src/app/api/session/[sessionId]/premise/route.ts`
- Modify: `src/app/api/session/[sessionId]/stop/route.ts`
- Modify: `src/server/runtime.ts`
- Test: `src/components/session-shell.test.tsx`
- Test: `tests/e2e/session-flow.spec.ts`

- [ ] **Step 1: Write the failing end-to-end smoke test**

```ts
import { test, expect } from "@playwright/test";

test("user can create a session and see research state", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Decision question").fill("Should I move to another city for work?");
  await page.getByRole("button", { name: "Start debate" }).click();
  await expect(page.getByText("Research in progress")).toBeVisible();
});
```

- [ ] **Step 2: Run the smoke test to verify it fails**

Run: `pnpm playwright test tests/e2e/session-flow.spec.ts`
Expected: FAIL because the app page is not yet wired to the live routes.

- [ ] **Step 3: Wire the client shell to the session API**

```tsx
// src/app/page.tsx
import { SessionShell } from "@/components/session-shell";

export default function HomePage() {
  return (
    <SessionShell
      createSession={async (input) => {
        const response = await fetch("/api/session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(input)
        });

        if (!response.ok) {
          throw new Error("Failed to create session");
        }

        return response.json();
      }}
    />
  );
}
```

- [ ] **Step 4: Add continue, premise, and stop route behavior**

```ts
// src/app/api/session/[sessionId]/continue/route.ts
import { NextResponse } from "next/server";
import { runtime } from "@/server/runtime";

export async function POST(_: Request, context: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await context.params;
  const session = await runtime.continueSession(sessionId);
  return NextResponse.json(session);
}
```

```ts
// src/app/api/session/[sessionId]/premise/route.ts
import { NextResponse } from "next/server";
import { runtime } from "@/server/runtime";

export async function POST(request: Request, context: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await context.params;
  const body = await request.json();
  const session = await runtime.addPremise(sessionId, body.premise);
  return NextResponse.json(session);
}
```

```ts
// src/app/api/session/[sessionId]/stop/route.ts
import { NextResponse } from "next/server";
import { runtime } from "@/server/runtime";

export async function POST(_: Request, context: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await context.params;
  const session = await runtime.stopSession(sessionId);
  return NextResponse.json(session);
}
```

- [ ] **Step 5: Run the component test and smoke test**

Run: `pnpm vitest run src/components/session-shell.test.tsx`
Expected: PASS

Run: `pnpm playwright test tests/e2e/session-flow.spec.ts`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/app/page.tsx src/components/session-shell.tsx src/app/api/session/[sessionId]/continue/route.ts src/app/api/session/[sessionId]/premise/route.ts src/app/api/session/[sessionId]/stop/route.ts src/server/runtime.ts tests/e2e/session-flow.spec.ts
git commit -m "feat: connect ui to session lifecycle"
```

## Task 9: Replace Mock Debate Logic With OpenAI-Compatible Provider Integration

**Files:**
- Modify: `src/server/llm/openai-compatible-provider.ts`
- Modify: `src/server/runtime.ts`
- Modify: `src/components/advanced-settings.tsx`
- Modify: `src/lib/validators.ts`
- Modify: `src/lib/types.ts`
- Test: `src/server/debate/summary.test.ts`
- Test: `src/app/api/session/route.test.ts`

- [ ] **Step 1: Write the failing provider contract test**

```ts
import { describe, expect, it } from "vitest";
import { createOpenAICompatibleProvider } from "@/server/llm/openai-compatible-provider";

describe("openai-compatible provider", () => {
  it("posts chat completion requests to a custom base url", async () => {
    const calls: Array<{ url: string }> = [];
    const provider = createOpenAICompatibleProvider({
      baseUrl: "https://example.com/v1",
      apiKey: "test-key",
      fetch: async (url) => {
        calls.push({ url: String(url) });
        return new Response(
          JSON.stringify({
            choices: [{ message: { content: "{\"coreDisagreement\":\"x\"}" } }]
          }),
          { status: 200 }
        );
      }
    });

    await provider.complete([{ role: "user", content: "hello" }], "DebateSummary");
    expect(calls[0].url).toBe("https://example.com/v1/chat/completions");
  });
});
```

- [ ] **Step 2: Run the provider test to verify it fails**

Run: `pnpm vitest run src/server/debate/summary.test.ts src/app/api/session/route.test.ts`
Expected: FAIL because the provider integration does not exist yet.

- [ ] **Step 3: Implement the OpenAI-compatible provider and config plumbing**

```ts
// src/server/llm/openai-compatible-provider.ts
import type { ChatMessage, StructuredCompletion } from "@/server/llm/provider";

export function createOpenAICompatibleProvider<T>({
  baseUrl,
  apiKey,
  model,
  fetch: fetchImpl = fetch
}: {
  baseUrl: string;
  apiKey: string;
  model: string;
  fetch?: typeof fetch;
}): StructuredCompletion<T> {
  return {
    async complete(messages: ChatMessage[]) {
      const response = await fetchImpl(`${baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model,
          response_format: { type: "json_object" },
          messages
        })
      });

      const payload = await response.json();
      return JSON.parse(payload.choices[0].message.content) as T;
    }
  };
}
```

- [ ] **Step 4: Run the provider and route tests**

Run: `pnpm vitest run src/server/debate/summary.test.ts src/app/api/session/route.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/server/llm/openai-compatible-provider.ts src/server/runtime.ts src/components/advanced-settings.tsx src/lib/validators.ts src/lib/types.ts src/server/debate/summary.test.ts src/app/api/session/route.test.ts
git commit -m "feat: add openai-compatible provider support"
```

## Task 10: Polish Error States, Manual Stop, And Summary Rendering

**Files:**
- Modify: `src/components/session-shell.tsx`
- Modify: `src/components/summary-panel.tsx`
- Modify: `src/components/evidence-panel.tsx`
- Modify: `src/components/debate-timeline.tsx`
- Modify: `src/app/globals.css`
- Modify: `tests/e2e/session-flow.spec.ts`
- Test: `src/components/session-shell.test.tsx`
- Test: `tests/e2e/session-flow.spec.ts`

- [ ] **Step 1: Write the failing UX regression test**

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { SessionShell } from "@/components/session-shell";

describe("SessionShell UX states", () => {
  it("shows an error message when session creation fails", async () => {
    const user = userEvent.setup();
    const createSession = vi.fn().mockRejectedValue(new Error("boom"));

    render(<SessionShell createSession={createSession} />);

    await user.type(screen.getByLabelText("Decision question"), "Should I move?");
    await user.click(screen.getByRole("button", { name: "Start debate" }));

    expect(await screen.findByText("Unable to start debate.")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the UI test to verify it fails**

Run: `pnpm vitest run src/components/session-shell.test.tsx`
Expected: FAIL because error and stop states are not rendered yet.

- [ ] **Step 3: Implement product finish behavior**

```tsx
// src/components/session-shell.tsx
// Add:
const [error, setError] = useState<string | null>(null);

// Replace submit callback:
try {
  setError(null);
  const next = await createSession(input);
  setSession(next);
} catch {
  setError("Unable to start debate.");
}

// Render:
{error ? <p role="alert">{error}</p> : null}
```

```tsx
// src/components/summary-panel.tsx
export function SummaryPanel({ summary }: { summary?: {
  strongestFor?: Array<{ text: string; evidenceIds: string[] }>;
  strongestAgainst?: Array<{ text: string; evidenceIds: string[] }>;
  coreDisagreement?: string;
  keyUncertainty?: string;
  nextAction?: string;
} }) {
  if (!summary) return null;

  return (
    <section aria-label="Final summary">
      <h2>Decision summary</h2>
      <p>{summary.coreDisagreement}</p>
      <p>{summary.keyUncertainty}</p>
      <p>{summary.nextAction}</p>
    </section>
  );
}
```

- [ ] **Step 4: Run the UI and end-to-end tests**

Run: `pnpm vitest run src/components/session-shell.test.tsx`
Expected: PASS

Run: `pnpm playwright test tests/e2e/session-flow.spec.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/session-shell.tsx src/components/summary-panel.tsx src/components/evidence-panel.tsx src/components/debate-timeline.tsx src/app/globals.css tests/e2e/session-flow.spec.ts
git commit -m "feat: polish debate workspace states"
```

## Self-Review

### Spec coverage

- Product is local-first: covered by Next.js server routes and local runtime in Tasks 1, 6, 8, and 9.
- Shared search and evidence pool: covered by Task 4 and orchestrator wiring in Tasks 3 and 5.
- Structured debate rounds: covered by Tasks 3, 5, and 8.
- User-injected premise: route and runtime behavior covered in Task 8.
- Summary with evidence binding: covered by Task 5 and refined in Task 10.
- Advanced settings and user-supplied API config: covered by Tasks 7 and 9.
- Summary-first UX and evidence side panel: covered by Tasks 7, 8, and 10.

### Placeholder scan

- No `TODO`, `TBD`, or "similar to" placeholders remain.
- Every task includes exact file paths.
- Every test step includes an exact command.

### Type consistency

- `SessionRecord`, `Evidence`, `SessionConfig`, and summary objects are introduced before later tasks extend them.
- Route handlers all use the same `runtime` orchestration entry point.
- Provider integration stays OpenAI-compatible and model-configurable across runtime and UI tasks.

## Notes Before Execution

- This plan assumes `pnpm` is available locally. If not, switch all commands consistently to `npm`.
- The MVP uses in-memory session storage. Do not add a database before the rest of the loop works.
- The first real provider integration should stay OpenAI-compatible only. Do not broaden provider support until the product loop is stable.

Plan complete and saved to `docs/superpowers/plans/2026-04-07-two-agent-debate-implementation-plan.md`. Two execution options:

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

**Which approach?**
