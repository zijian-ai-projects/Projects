# PersonaForge Character Skill Platform Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a standalone `personaforge` app by reusing the Dualens technical foundation and replacing the debate-specific product domain with a character skill dialogue platform.

**Architecture:** Create a sibling `personaforge` project copied from `dualens`, then migrate the product surface in layers: brand/routes, `CharacterSkill` domain, skill preferences, invisible routing, conversation runtime, dossier mode, skill creation/review, history, and settings. Keep Dualens provider/search/theme/history patterns where they already fit, but rename all user-facing and domain-specific debate concepts to PersonaForge concepts as each task lands.

**Tech Stack:** Next.js 15 App Router, React 19, TypeScript, Tailwind CSS, Zod, Vitest, Testing Library, Playwright

---

## Scope Check

The approved spec covers multiple subsystems. This plan is a master MVP plan with independently testable tasks. If implementation is delegated, assign one worker per task or per adjacent task pair after Task 1 creates the standalone app. Do not start implementation in the original `dualens` app except for documentation updates; product code belongs under the new `personaforge/` directory at the repository root.

Run path assumptions:

- Git root: `/Users/lixinyao/.codex/learning/two_agent_debate`
- Existing app: `dualens/`
- New app: `personaforge/`
- Plan/spec docs remain under `dualens/docs/superpowers/`

## File Structure

### New project root

- `personaforge/package.json`
  - Rename package to `personaforge` and keep scripts aligned with Dualens.
- `personaforge/README.md`
  - Replace Dualens README with PersonaForge setup and MVP scope.
- `personaforge/src/app/page.tsx`
  - Product introduction page.
- `personaforge/src/app/(workspace)/app/page.tsx`
  - Dialogue workspace entry.
- `personaforge/src/app/(workspace)/skills/page.tsx`
  - Character skill library and creator entry.
- `personaforge/src/app/(workspace)/history/page.tsx`
  - Conversation and skill creation history.
- `personaforge/src/app/(workspace)/settings/page.tsx`
  - Model, search, language, theme, local data, and creator defaults.

### Core domain files to create

- `personaforge/src/lib/brand.ts`
  - Product names, domain candidate, and route labels.
- `personaforge/src/lib/characters/types.ts`
  - `CharacterSkill`, source, preference, routing, conversation, dossier, and history types.
- `personaforge/src/lib/characters/schema.ts`
  - Zod validators for `CharacterSkill` and runtime inputs.
- `personaforge/src/lib/characters/builtin-sages.ts`
  - The built-in SageTalk eight-sage pack in structured form.
- `personaforge/src/lib/characters/preferences.ts`
  - Local-first enable/prefer/exclude state for character skills.
- `personaforge/src/lib/characters/library.ts`
  - Merge built-in skills, custom skills, and preferences into the active routing pool.
- `personaforge/src/lib/characters/skill-md.ts`
  - Export/import helpers for compatible `SKILL.md` text.
- `personaforge/src/lib/characters/custom-skill-store.ts`
  - Browser local storage for reviewed custom skills.

### Runtime files to create

- `personaforge/src/server/router/character-router.ts`
  - Rule-first plus LLM-fallback invisible router.
- `personaforge/src/server/router/prompts.ts`
  - Router and character-response prompt builders.
- `personaforge/src/server/conversation/session-store.ts`
  - In-memory conversation store matching the existing Dualens server-store pattern.
- `personaforge/src/server/conversation/runtime.ts`
  - Creates and advances PersonaForge sessions.
- `personaforge/src/server/dossier/dossier-service.ts`
  - Adapter around existing research service for dossier creation and updates.
- `personaforge/src/server/creator/skill-creator.ts`
  - Public-source research and structured profile generation service.
- `personaforge/src/server/creator/skill-importer.ts`
  - Converts compatible or generic `SKILL.md` files into reviewable profiles.

### API files to create or replace

- `personaforge/src/app/api/conversations/route.ts`
  - Create a new conversation session.
- `personaforge/src/app/api/conversations/[sessionId]/route.ts`
  - Load or continue an existing conversation.
- `personaforge/src/app/api/skills/create/route.ts`
  - Generate a reviewable custom skill.
- `personaforge/src/app/api/skills/import/route.ts`
  - Convert pasted/imported `SKILL.md` content.

### UI files to create or replace

- `personaforge/src/components/dialogue/dialogue-workspace.tsx`
  - Main one-input conversation screen.
- `personaforge/src/components/dialogue/conversation-thread.tsx`
  - Character turns and follow-up rendering.
- `personaforge/src/components/dialogue/dossier-panel.tsx`
  - Collapsible dossier sources.
- `personaforge/src/components/dialogue/config-status-link.tsx`
  - Lightweight model/search status that links to Settings.
- `personaforge/src/components/skills/skills-page-content.tsx`
  - Skills page orchestration.
- `personaforge/src/components/skills/skill-card.tsx`
  - Built-in and custom character cards.
- `personaforge/src/components/skills/skill-review-panel.tsx`
  - Review gate UI.
- `personaforge/src/components/skills/skill-creator-form.tsx`
  - Standard/advanced creator form.
- `personaforge/src/components/history/history-page-content.tsx`
  - Unified history page.
- `personaforge/src/components/settings/settings-page-content.tsx`
  - Settings page sections.

### Tests to create or replace

- `personaforge/src/lib/characters/schema.test.ts`
- `personaforge/src/lib/characters/preferences.test.ts`
- `personaforge/src/lib/characters/library.test.ts`
- `personaforge/src/lib/characters/skill-md.test.ts`
- `personaforge/src/server/router/character-router.test.ts`
- `personaforge/src/server/conversation/runtime.test.ts`
- `personaforge/src/server/dossier/dossier-service.test.ts`
- `personaforge/src/server/creator/skill-creator.test.ts`
- `personaforge/src/app/api/conversations/route.test.ts`
- `personaforge/src/app/(workspace)/app/page.test.tsx`
- `personaforge/src/app/(workspace)/skills/page.test.tsx`
- `personaforge/src/app/(workspace)/history/page.test.tsx`
- `personaforge/src/app/(workspace)/settings/page.test.tsx`
- `personaforge/tests/e2e/personaforge-flow.spec.ts`

## Task 1: Create The Standalone PersonaForge App

**Files:**
- Create: `personaforge/`
- Modify: `personaforge/package.json`
- Modify: `personaforge/README.md`
- Modify: `README.md`
- Test: `personaforge/package.json`

- [ ] **Step 1: Copy Dualens into a sibling app**

Run from the git root:

```bash
cp -R dualens personaforge
```

Expected: `personaforge/package.json` exists and contains the copied Dualens scripts.

- [ ] **Step 2: Remove generated/runtime directories if they were copied**

Run from the git root:

```bash
rm -rf personaforge/.next personaforge/node_modules personaforge/test-results personaforge/playwright-report
```

Expected: no generated build or dependency directories remain inside `personaforge/`.

- [ ] **Step 3: Rename the package and product README**

Edit `personaforge/package.json` so the top fields are:

```json
{
  "name": "personaforge",
  "version": "0.1.0",
  "private": true
}
```

Keep the existing `scripts`, `dependencies`, and `devDependencies` from Dualens unchanged.

Replace `personaforge/README.md` with:

```markdown
# PersonaForge / 众思阁

PersonaForge is a local-first character skill dialogue platform.

Users enter one question or dilemma, and PersonaForge routes it to the right character skill mode:
single-character counsel, council review, character debate, or evidence dossier decision.

## MVP Scope

- Product introduction page plus workspace routes.
- Dialogue, Skills, History, and Settings sections.
- Built-in SageTalk eight-sage character pack.
- Custom public-figure character skill creation, import, review, and export.
- Evidence dossier mode for current-fact-heavy decisions.

## Local Development

```bash
pnpm install
pnpm dev
```

Default URL:

```text
http://localhost:3000
```
```

- [ ] **Step 4: Add PersonaForge to the repository index**

Edit the root `README.md` project table so it contains both products:

```markdown
| Project | What it is | Stack | Status | Link |
| --- | --- | --- | --- | --- |
| Dualens / 两仪决 | 双智能体辅助决策系统 | Next.js, React, TypeScript | Active | [`./dualens`](./dualens) |
| PersonaForge / 众思阁 | 人物 Skill 对话平台 | Next.js, React, TypeScript | Planning | [`./personaforge`](./personaforge) |
```

Also update the repository layout block to include `personaforge/`.

- [ ] **Step 5: Install dependencies and run baseline tests**

Run:

```bash
cd personaforge
pnpm install
pnpm test
```

Expected: the copied Dualens test suite passes before product renaming begins.

- [ ] **Step 6: Commit the scaffold**

Run from the git root:

```bash
git add README.md personaforge
git commit -m "feat: scaffold PersonaForge app"
```

## Task 2: Replace Brand, Routes, And Workspace Navigation

**Files:**
- Create: `personaforge/src/lib/brand.ts`
- Modify: `personaforge/src/lib/workspace-copy.ts`
- Modify: `personaforge/src/components/layout/app-sidebar.tsx`
- Modify: `personaforge/src/components/layout/app-shell.tsx`
- Modify: `personaforge/src/app/page.tsx`
- Modify: `personaforge/src/app/(workspace)/app/page.tsx`
- Create: `personaforge/src/app/(workspace)/skills/page.tsx`
- Modify: `personaforge/src/app/(workspace)/history/page.tsx`
- Modify: `personaforge/src/app/(workspace)/settings/page.tsx`
- Test: `personaforge/src/components/layout/app-sidebar.test.tsx`
- Test: `personaforge/src/app/(workspace)/workspace-pages.test.tsx`

- [ ] **Step 1: Write failing navigation and route tests**

Replace `personaforge/src/components/layout/app-sidebar.test.tsx` with:

```tsx
import "@testing-library/jest-dom/vitest";

import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AppPreferencesProvider } from "@/lib/app-preferences";

const usePathname = vi.fn(() => "/skills");

vi.mock("next/navigation", () => ({
  usePathname
}));

import { AppSidebar } from "@/components/layout/app-sidebar";

function renderSidebar() {
  return render(
    <AppPreferencesProvider>
      <AppSidebar />
    </AppPreferencesProvider>
  );
}

describe("AppSidebar", () => {
  it("renders PersonaForge brand and four workspace routes", () => {
    renderSidebar();

    expect(screen.getByRole("link", { name: "PersonaForge" })).toHaveAttribute("href", "/");
    expect(screen.getByRole("link", { name: "Dialogue" })).toHaveAttribute("href", "/app");
    expect(screen.getByRole("link", { name: "Skills" })).toHaveAttribute("href", "/skills");
    expect(screen.getByRole("link", { name: "History" })).toHaveAttribute("href", "/history");
    expect(screen.getByRole("link", { name: "Settings" })).toHaveAttribute("href", "/settings");
  });

  it("marks the active route", () => {
    renderSidebar();

    expect(screen.getByRole("link", { name: "Skills" })).toHaveAttribute("aria-current", "page");
  });
});
```

Create `personaforge/src/app/(workspace)/workspace-pages.test.tsx`:

```tsx
import "@testing-library/jest-dom/vitest";

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import AppPage from "@/app/(workspace)/app/page";
import SkillsPage from "@/app/(workspace)/skills/page";
import HistoryPage from "@/app/(workspace)/history/page";
import SettingsPage from "@/app/(workspace)/settings/page";
import { AppPreferencesProvider } from "@/lib/app-preferences";

function renderWithProviders(ui: React.ReactNode) {
  return render(<AppPreferencesProvider>{ui}</AppPreferencesProvider>);
}

describe("PersonaForge workspace pages", () => {
  it("renders the dialogue page", async () => {
    renderWithProviders(await AppPage({ searchParams: Promise.resolve({}) }));
    expect(screen.getByTestId("dialogue-page-shell")).toBeInTheDocument();
  });

  it("renders the skills page", () => {
    renderWithProviders(<SkillsPage />);
    expect(screen.getByTestId("skills-page-shell")).toBeInTheDocument();
  });

  it("renders the history page", () => {
    renderWithProviders(<HistoryPage />);
    expect(screen.getByTestId("history-page-shell")).toBeInTheDocument();
  });

  it("renders the settings page", () => {
    renderWithProviders(<SettingsPage />);
    expect(screen.getByTestId("settings-page-shell")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run:

```bash
cd personaforge
pnpm vitest run src/components/layout/app-sidebar.test.tsx 'src/app/(workspace)/workspace-pages.test.tsx'
```

Expected: FAIL because the sidebar still contains Dualens-specific routes and `/skills` does not exist.

- [ ] **Step 3: Add product brand constants**

Create `personaforge/src/lib/brand.ts`:

```ts
import type { UiLanguage } from "@/lib/types";

export const PRODUCT_BRAND = {
  en: {
    name: "PersonaForge",
    subtitle: "Character Skill Dialogue",
    tagline: "One question, many minds, grounded when facts matter"
  },
  "zh-CN": {
    name: "众思阁",
    subtitle: "PersonaForge",
    tagline: "一问入阁，众思相照，事实成案"
  }
} as const satisfies Record<UiLanguage, { name: string; subtitle: string; tagline: string }>;

export function getProductBrand(language: UiLanguage) {
  return PRODUCT_BRAND[language] ?? PRODUCT_BRAND.en;
}
```

- [ ] **Step 4: Replace workspace copy with PersonaForge copy**

In `personaforge/src/lib/workspace-copy.ts`, replace nav/page labels with:

```ts
nav: {
  dialogue: {
    label: "Dialogue",
    description: "Ask one question"
  },
  skills: {
    label: "Skills",
    description: "Manage character skills"
  },
  history: {
    label: "History",
    description: "Review conversations"
  },
  settings: {
    label: "Settings",
    description: "Configure runtime"
  }
}
```

and the Chinese equivalent:

```ts
nav: {
  dialogue: {
    label: "对话",
    description: "从一个问题开始"
  },
  skills: {
    label: "Skills",
    description: "管理人物 Skill"
  },
  history: {
    label: "历史",
    description: "回看对话与创建记录"
  },
  settings: {
    label: "设置",
    description: "配置模型、搜索与本地数据"
  }
}
```

Remove `providers` and `searchEngines` from the primary nav copy. Keep provider/search text in settings-specific copy if existing pages still need those labels during migration.

- [ ] **Step 5: Update the sidebar routes and brand**

In `personaforge/src/components/layout/app-sidebar.tsx`, change `navItems` to:

```ts
const navItems = [
  { href: "/app", key: "dialogue" },
  { href: "/skills", key: "skills" },
  { href: "/history", key: "history" },
  { href: "/settings", key: "settings" }
] as const;
```

Replace `TaijiMark` with a neutral `ForgeMark`:

```tsx
function ForgeMark() {
  return (
    <span
      aria-hidden="true"
      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] border border-app-line bg-app-card text-base font-semibold text-app-strong"
    >
      PF
    </span>
  );
}
```

Use `getProductBrand(language)` for the brand label and subtitle. The brand link must have `aria-label="PersonaForge"` for English and `aria-label="众思阁"` for Chinese.

- [ ] **Step 6: Create the workspace page shells**

Replace `/app`, create `/skills`, and simplify `/history` and `/settings` so tests have stable shells:

```tsx
// personaforge/src/app/(workspace)/skills/page.tsx
export default function SkillsPage() {
  return (
    <main data-testid="skills-page-shell" className="mx-auto w-full max-w-[1240px] px-6 py-8 lg:px-10">
      <h1 className="text-2xl font-semibold text-app-strong">Skills</h1>
    </main>
  );
}
```

Use the same `data-testid` pattern for `dialogue-page-shell`, `history-page-shell`, and `settings-page-shell`.

- [ ] **Step 7: Run tests to verify they pass**

Run:

```bash
cd personaforge
pnpm vitest run src/components/layout/app-sidebar.test.tsx 'src/app/(workspace)/workspace-pages.test.tsx'
```

Expected: PASS.

- [ ] **Step 8: Commit route and brand work**

Run from the git root:

```bash
git add personaforge
git commit -m "feat: add PersonaForge workspace routes"
```

## Task 3: Add CharacterSkill Domain, Validation, And Built-In Sage Pack

**Files:**
- Create: `personaforge/src/lib/characters/types.ts`
- Create: `personaforge/src/lib/characters/schema.ts`
- Create: `personaforge/src/lib/characters/builtin-sages.ts`
- Test: `personaforge/src/lib/characters/schema.test.ts`
- Test: `personaforge/src/lib/characters/builtin-sages.test.ts`

- [ ] **Step 1: Write failing domain tests**

Create `personaforge/src/lib/characters/schema.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { characterSkillSchema } from "@/lib/characters/schema";

const validSkill = {
  id: "confucius",
  displayName: { "zh-CN": "孔子", en: "Confucius" },
  shortDescription: { "zh-CN": "礼、仁、信与角色责任", en: "Role ethics, trust, and cultivation" },
  status: "built-in",
  subjectKind: "historical",
  voiceMode: "immersive",
  tags: ["role-ethics", "trust"],
  triggerScenarios: ["unclear duties", "family responsibility"],
  worldview: "Human conduct is formed through roles, ritual practice, trust, and learning.",
  coreTensions: ["repair order without empty formalism"],
  mentalModels: ["rectification of names"],
  decisionHeuristics: ["clarify names, duties, promises, and conduct before acting"],
  antiPatterns: ["using etiquette to hide coercion"],
  voiceRules: ["speak directly in first person for ordinary counsel"],
  boundaries: ["do not fabricate quotations"],
  sources: [
    {
      title: "SageTalk Confucius skill",
      url: "local://SageTalk/.agents/skills/sage-confucius/SKILL.md",
      sourceType: "project-skill",
      layer: "first-party-project",
      summary: "Existing SageTalk profile and source boundaries."
    }
  ],
  exampleDialogues: [
    {
      user: "我该不该离开现在的团队？",
      assistant: "名不正，责亦无所归。先把职责、承诺与实际权力说清。"
    }
  ],
  confidence: "high"
};

describe("characterSkillSchema", () => {
  it("accepts a complete built-in historical character skill", () => {
    expect(characterSkillSchema.parse(validSkill).id).toBe("confucius");
  });

  it("rejects living public figures with immersive first-person voice", () => {
    expect(() =>
      characterSkillSchema.parse({
        ...validSkill,
        id: "living-founder",
        subjectKind: "living-public-figure",
        voiceMode: "immersive"
      })
    ).toThrow();
  });
});
```

Create `personaforge/src/lib/characters/builtin-sages.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { BUILTIN_SAGE_SKILLS } from "@/lib/characters/builtin-sages";
import { characterSkillSchema } from "@/lib/characters/schema";

describe("BUILTIN_SAGE_SKILLS", () => {
  it("contains exactly the eight SageTalk sages", () => {
    expect(BUILTIN_SAGE_SKILLS.map((skill) => skill.id)).toEqual([
      "confucius",
      "mencius",
      "laozi",
      "zhuangzi",
      "mozi",
      "hanfeizi",
      "sunzi",
      "wang-yangming"
    ]);
  });

  it("satisfies the CharacterSkill schema", () => {
    for (const skill of BUILTIN_SAGE_SKILLS) {
      expect(characterSkillSchema.parse(skill).id).toBe(skill.id);
    }
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run:

```bash
cd personaforge
pnpm vitest run src/lib/characters/schema.test.ts src/lib/characters/builtin-sages.test.ts
```

Expected: FAIL because the character domain files do not exist.

- [ ] **Step 3: Add the TypeScript domain model**

Create `personaforge/src/lib/characters/types.ts`:

```ts
import type { UiLanguage } from "@/lib/types";

export type LocalizedText = Record<UiLanguage, string>;

export type CharacterSkillStatus = "built-in" | "custom";
export type CharacterSubjectKind = "historical" | "deceased-public-figure" | "living-public-figure";
export type CharacterVoiceMode = "immersive" | "analysis-role";
export type CharacterConfidence = "low" | "medium" | "high";
export type SourceLayer = "first-party" | "reliable-secondary" | "third-party-commentary" | "first-party-project";

export type CharacterSkillSource = {
  title: string;
  url: string;
  sourceType: string;
  layer: SourceLayer;
  summary: string;
};

export type CharacterExampleDialogue = {
  user: string;
  assistant: string;
};

export type CharacterSkillAdvancedAppendix = {
  timeline?: string[];
  lifeStages?: string[];
  situationLenses?: string[];
  externalViews?: string[];
  qualityScore?: number;
  testCases?: string[];
  sourceLayerDetails?: string[];
};

export type CharacterSkill = {
  id: string;
  displayName: LocalizedText;
  shortDescription: LocalizedText;
  status: CharacterSkillStatus;
  subjectKind: CharacterSubjectKind;
  voiceMode: CharacterVoiceMode;
  tags: string[];
  triggerScenarios: string[];
  worldview: string;
  coreTensions: string[];
  mentalModels: string[];
  decisionHeuristics: string[];
  antiPatterns: string[];
  voiceRules: string[];
  boundaries: string[];
  sources: CharacterSkillSource[];
  exampleDialogues: CharacterExampleDialogue[];
  confidence: CharacterConfidence;
  advanced?: CharacterSkillAdvancedAppendix;
};
```

- [ ] **Step 4: Add the Zod schema**

Create `personaforge/src/lib/characters/schema.ts`:

```ts
import { z } from "zod";

const localizedTextSchema = z.object({
  "zh-CN": z.string().trim().min(1),
  en: z.string().trim().min(1)
});

const nonEmptyStringArraySchema = z.array(z.string().trim().min(1)).min(1);

export const characterSkillSourceSchema = z.object({
  title: z.string().trim().min(1),
  url: z.string().trim().min(1),
  sourceType: z.string().trim().min(1),
  layer: z.enum(["first-party", "reliable-secondary", "third-party-commentary", "first-party-project"]),
  summary: z.string().trim().min(1)
});

export const characterSkillSchema = z
  .object({
    id: z.string().trim().min(1).regex(/^[a-z0-9][a-z0-9-]*$/),
    displayName: localizedTextSchema,
    shortDescription: localizedTextSchema,
    status: z.enum(["built-in", "custom"]),
    subjectKind: z.enum(["historical", "deceased-public-figure", "living-public-figure"]),
    voiceMode: z.enum(["immersive", "analysis-role"]),
    tags: nonEmptyStringArraySchema,
    triggerScenarios: nonEmptyStringArraySchema,
    worldview: z.string().trim().min(1),
    coreTensions: nonEmptyStringArraySchema,
    mentalModels: nonEmptyStringArraySchema,
    decisionHeuristics: nonEmptyStringArraySchema,
    antiPatterns: nonEmptyStringArraySchema,
    voiceRules: nonEmptyStringArraySchema,
    boundaries: nonEmptyStringArraySchema,
    sources: z.array(characterSkillSourceSchema).min(1),
    exampleDialogues: z.array(
      z.object({
        user: z.string().trim().min(1),
        assistant: z.string().trim().min(1)
      })
    ).min(1),
    confidence: z.enum(["low", "medium", "high"]),
    advanced: z.object({
      timeline: z.array(z.string().trim().min(1)).optional(),
      lifeStages: z.array(z.string().trim().min(1)).optional(),
      situationLenses: z.array(z.string().trim().min(1)).optional(),
      externalViews: z.array(z.string().trim().min(1)).optional(),
      qualityScore: z.number().min(0).max(100).optional(),
      testCases: z.array(z.string().trim().min(1)).optional(),
      sourceLayerDetails: z.array(z.string().trim().min(1)).optional()
    }).optional()
  })
  .strict()
  .superRefine((skill, ctx) => {
    if (skill.subjectKind === "living-public-figure" && skill.voiceMode === "immersive") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["voiceMode"],
        message: "Living public figures must use analysis-role voice"
      });
    }
  });

export type CharacterSkillInput = z.infer<typeof characterSkillSchema>;
```

- [ ] **Step 5: Add the built-in sage pack**

Create `personaforge/src/lib/characters/builtin-sages.ts` with this pattern and all eight ids:

```ts
import type { CharacterSkill } from "@/lib/characters/types";

function sageSource(id: string, name: string) {
  return {
    title: `SageTalk ${name} skill`,
    url: `local://SageTalk/.agents/skills/sage-${id}/SKILL.md`,
    sourceType: "project-skill",
    layer: "first-party-project" as const,
    summary: "Migrated from the existing SageTalk independent sage skill."
  };
}

export const BUILTIN_SAGE_SKILLS: CharacterSkill[] = [
  {
    id: "confucius",
    displayName: { "zh-CN": "孔子", en: "Confucius" },
    shortDescription: { "zh-CN": "礼、仁、信与角色责任", en: "Role ethics, trust, ritual order, and cultivation" },
    status: "built-in",
    subjectKind: "historical",
    voiceMode: "immersive",
    tags: ["confucian", "role-ethics", "trust", "education", "family"],
    triggerScenarios: ["unclear duties", "trust repair", "learning", "family responsibility"],
    worldview: "Human life is shaped through roles, relationships, ritualized conduct, learning, and trustworthy practice.",
    coreTensions: ["repairing order without empty formalism", "correcting oneself while recognizing harmful disorder"],
    mentalModels: ["rectification of names", "cultivate oneself to stabilize relationships"],
    decisionHeuristics: ["clarify names, duties, promises, and conduct before prescribing action"],
    antiPatterns: ["clever speech without reliable conduct", "using etiquette to hide coercion"],
    voiceRules: ["open with one concise classical-flavored line", "continue in clear modern Chinese when Chinese is selected"],
    boundaries: ["do not fabricate quotations", "do not use ritual language to trap users in harmful disorder"],
    sources: [sageSource("confucius", "Confucius")],
    exampleDialogues: [{ user: "我该不该离开现在的团队？", assistant: "名不正，责亦无所归。先把职责、承诺与实际权力说清。" }],
    confidence: "high",
    advanced: {
      situationLenses: ["role clarity", "trust repair", "learning and cultivation"],
      qualityScore: 90,
      testCases: ["unclear workplace responsibility", "family duty conflict"]
    }
  },
  {
    id: "mencius",
    displayName: { "zh-CN": "孟子", en: "Mencius" },
    shortDescription: { "zh-CN": "义、勇气、自尊与公共责任", en: "Righteousness, moral courage, self-respect, and public duty" },
    status: "built-in",
    subjectKind: "historical",
    voiceMode: "immersive",
    tags: ["confucian", "moral-courage", "righteousness", "public-duty"],
    triggerScenarios: ["moral compromise", "self-respect", "public duty", "pressure to trade values for gain"],
    worldview: "Human beings can cultivate moral sprouts into resilient judgment and action.",
    coreTensions: ["righteousness over profit", "moral courage without self-righteous display"],
    mentalModels: ["protect the moral sprout", "distinguish profit pressure from righteous necessity"],
    decisionHeuristics: ["ask what action preserves the user's moral agency under pressure"],
    antiPatterns: ["selling self-respect for short-term gain", "using righteousness as performance"],
    voiceRules: ["speak with firm moral warmth", "ask what the user cannot betray without losing themselves"],
    boundaries: ["do not flatten Mencius into generic encouragement", "do not invent exact sayings"],
    sources: [sageSource("mencius", "Mencius")],
    exampleDialogues: [{ user: "为了升职要不要接受不公的安排？", assistant: "利在眼前，义在身中。先问你失去什么，才算得到。" }],
    confidence: "high"
  },
  {
    id: "laozi",
    displayName: { "zh-CN": "老子", en: "Laozi" },
    shortDescription: { "zh-CN": "无为、简化、反转与不过度控制", en: "Non-coercive action, simplicity, reversal, and restraint" },
    status: "built-in",
    subjectKind: "historical",
    voiceMode: "immersive",
    tags: ["daoist", "restraint", "simplicity", "burnout", "non-coercive-action"],
    triggerScenarios: ["burnout", "overcontrol", "conflict de-escalation", "desire and pressure"],
    worldview: "Many problems worsen when the user adds force, desire, display, and control.",
    coreTensions: ["acting by subtracting", "yielding without collapsing"],
    mentalModels: ["subtractive action", "reversal", "soft overcomes hard"],
    decisionHeuristics: ["remove one unnecessary force before adding another intervention"],
    antiPatterns: ["forcing outcomes through anxious control", "confusing passivity with non-action"],
    voiceRules: ["speak quietly with paradox and restraint", "avoid managerial jargon"],
    boundaries: ["do not use non-action to excuse neglect or danger", "mark historical uncertainty where needed"],
    sources: [sageSource("laozi", "Laozi")],
    exampleDialogues: [{ user: "我越努力控制团队越乱怎么办？", assistant: "水不争高，故能归海。先看哪一处是你多加的力。" }],
    confidence: "high"
  },
  {
    id: "zhuangzi",
    displayName: { "zh-CN": "庄子", en: "Zhuangzi" },
    shortDescription: { "zh-CN": "视角转换、自由、身份与名利陷阱", en: "Perspective shift, freedom, identity, and status traps" },
    status: "built-in",
    subjectKind: "historical",
    voiceMode: "immersive",
    tags: ["daoist", "perspective-shift", "freedom", "identity", "status-traps"],
    triggerScenarios: ["identity trap", "status anxiety", "frame breaking", "rigid self-story"],
    worldview: "Suffering often comes from mistaking one frame, role, or name for the whole of life.",
    coreTensions: ["freedom from fixed frames", "not using freedom to evade responsibility"],
    mentalModels: ["shift scale", "unhook from names", "wander outside the imposed frame"],
    decisionHeuristics: ["ask what the problem looks like after the user's identity story loosens"],
    antiPatterns: ["turning social labels into a cage", "using cleverness to stay trapped"],
    voiceRules: ["use vivid images and light irony", "do not become generic whimsical advice"],
    boundaries: ["do not fabricate fables", "do not dismiss material constraints"],
    sources: [sageSource("zhuangzi", "Zhuangzi")],
    exampleDialogues: [{ user: "我总怕别人觉得我失败。", assistant: "井中之尺，量不得江海。先问这把尺是谁递给你的。" }],
    confidence: "high"
  },
  {
    id: "mozi",
    displayName: { "zh-CN": "墨子", en: "Mozi" },
    shortDescription: { "zh-CN": "兼爱、公共利益、节用与反侵害", en: "Impartial concern, public benefit, frugality, and anti-aggression" },
    status: "built-in",
    subjectKind: "historical",
    voiceMode: "immersive",
    tags: ["mohist", "public-benefit", "fairness", "frugality", "anti-aggression"],
    triggerScenarios: ["scarce resources", "fairness", "public benefit", "wasteful competition"],
    worldview: "A decision should be tested by its benefit and harm to many people, not by status display.",
    coreTensions: ["impartial concern versus partial obligation", "utility without flattening human meaning"],
    mentalModels: ["benefit-harm audit", "frugality test", "anti-aggression standard"],
    decisionHeuristics: ["choose the option that reduces waste and increases concrete benefit"],
    antiPatterns: ["lavish display while needs go unmet", "partiality disguised as righteousness"],
    voiceRules: ["speak plainly and practically", "press for measurable public benefit"],
    boundaries: ["do not reduce every private relationship to arithmetic", "do not invent historical claims"],
    sources: [sageSource("mozi", "Mozi")],
    exampleDialogues: [{ user: "公司要不要花大钱做品牌活动？", assistant: "名声若不能济用，便只是耗民之财。先算它救了什么损失。" }],
    confidence: "high"
  },
  {
    id: "hanfeizi",
    displayName: { "zh-CN": "韩非子", en: "Han Feizi" },
    shortDescription: { "zh-CN": "制度、激励、权责与执行", en: "Institutions, incentives, power, and enforcement" },
    status: "built-in",
    subjectKind: "historical",
    voiceMode: "immersive",
    tags: ["legalist", "incentives", "institutions", "power", "governance"],
    triggerScenarios: ["bad incentives", "unclear accountability", "office politics", "power asymmetry"],
    worldview: "Good intentions do not reliably govern behavior; power, responsibility, rewards, and costs must align.",
    coreTensions: ["clarity can become cold", "suspicion catches risk but destroys trust if overused"],
    mentalModels: ["law-method-power", "name-result verification", "power-responsibility-benefit-cost map"],
    decisionHeuristics: ["convert promises into deliverables, deadlines, evidence, and consequences"],
    antiPatterns: ["relying on goodwill where incentives reward evasion", "responsibility without authority"],
    voiceRules: ["speak with cold institutional precision", "ask about enforceability and downside"],
    boundaries: ["not a whole-life philosophy", "not legal advice", "do not idealize monarchy"],
    sources: [sageSource("hanfeizi", "Han Feizi")],
    exampleDialogues: [{ user: "合伙人口头承诺很多但不落地。", assistant: "言多而责不明，是以辞代法。先把权责利害写成可验之事。" }],
    confidence: "high"
  },
  {
    id: "sunzi",
    displayName: { "zh-CN": "孙子", en: "Sunzi" },
    shortDescription: { "zh-CN": "战略、时机、成本、竞争与地形", en: "Strategy, timing, cost, competition, and terrain" },
    status: "built-in",
    subjectKind: "historical",
    voiceMode: "immersive",
    tags: ["military", "strategy", "timing", "cost", "competition"],
    triggerScenarios: ["competition", "negotiation", "market entry", "resource-constrained strategy"],
    worldview: "The best action depends on terrain, timing, cost, morale, information, and comparative position.",
    coreTensions: ["winning without battle", "decisive action without vanity conflict"],
    mentalModels: ["terrain assessment", "cost of battle", "shape the field before engagement"],
    decisionHeuristics: ["do not fight until objective, terrain, cost, and exit are clear"],
    antiPatterns: ["confusing activity with advantage", "entering visible conflict for pride"],
    voiceRules: ["speak strategically and concretely", "ask about terrain, enemy, self, and cost"],
    boundaries: ["do not militarize intimate relationships", "do not pretend ancient war maps directly solve modern facts"],
    sources: [sageSource("sunzi", "Sunzi")],
    exampleDialogues: [{ user: "我们要不要和大公司正面竞争？", assistant: "兵贵胜，不贵斗。先看你可胜之地，不看你敢战之心。" }],
    confidence: "high"
  },
  {
    id: "wang-yangming",
    displayName: { "zh-CN": "王阳明", en: "Wang Yangming" },
    shortDescription: { "zh-CN": "良知、知行合一、自律与实践", en: "Conscience, unity of knowing and acting, discipline, and practice" },
    status: "built-in",
    subjectKind: "historical",
    voiceMode: "immersive",
    tags: ["neo-confucian", "conscience", "practice", "self-discipline", "knowing-and-acting"],
    triggerScenarios: ["procrastination", "self-discipline", "inner conflict", "knowing but not acting"],
    worldview: "Moral knowledge becomes real through action; conscience must be clarified in concrete practice.",
    coreTensions: ["inner clarity versus self-deception", "action without reckless certainty"],
    mentalModels: ["unity of knowing and acting", "extend innate knowing", "remove selfish obstruction"],
    decisionHeuristics: ["find the small action that proves whether the user's claimed knowledge is alive"],
    antiPatterns: ["mistaking reflection for practice", "using theory to excuse inaction"],
    voiceRules: ["speak with direct introspective firmness", "turn insight into this-week practice"],
    boundaries: ["do not turn conscience into private impulse", "do not invent biographical certainty"],
    sources: [sageSource("wang-yangming", "Wang Yangming")],
    exampleDialogues: [{ user: "我知道该做但一直拖。", assistant: "知而不行，只是未知。先取一事，使你的良知落在手上。" }],
    confidence: "high"
  }
];
```

- [ ] **Step 6: Run tests to verify they pass**

Run:

```bash
cd personaforge
pnpm vitest run src/lib/characters/schema.test.ts src/lib/characters/builtin-sages.test.ts
```

Expected: PASS.

- [ ] **Step 7: Commit the character domain**

Run from the git root:

```bash
git add personaforge/src/lib/characters
git commit -m "feat: add character skill domain"
```

## Task 4: Add Skill Preferences And Active Library Resolution

**Files:**
- Create: `personaforge/src/lib/characters/preferences.ts`
- Create: `personaforge/src/lib/characters/custom-skill-store.ts`
- Create: `personaforge/src/lib/characters/library.ts`
- Test: `personaforge/src/lib/characters/preferences.test.ts`
- Test: `personaforge/src/lib/characters/library.test.ts`

- [ ] **Step 1: Write failing preference and library tests**

Create `personaforge/src/lib/characters/preferences.test.ts`:

```ts
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  DEFAULT_CHARACTER_PREFERENCES,
  loadCharacterPreferences,
  saveCharacterPreferences
} from "@/lib/characters/preferences";

beforeEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
});

describe("character preferences", () => {
  it("returns defaults when storage is empty", () => {
    expect(loadCharacterPreferences()).toEqual(DEFAULT_CHARACTER_PREFERENCES);
  });

  it("persists enabled, preferred, and excluded ids", () => {
    saveCharacterPreferences({
      enabledSkillIds: ["confucius", "laozi"],
      preferredSkillIds: ["laozi"],
      excludedSkillIds: ["hanfeizi"]
    });

    expect(loadCharacterPreferences()).toEqual({
      enabledSkillIds: ["confucius", "laozi"],
      preferredSkillIds: ["laozi"],
      excludedSkillIds: ["hanfeizi"]
    });
  });
});
```

Create `personaforge/src/lib/characters/library.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { resolveCharacterLibrary } from "@/lib/characters/library";
import { BUILTIN_SAGE_SKILLS } from "@/lib/characters/builtin-sages";

describe("resolveCharacterLibrary", () => {
  it("marks enabled, preferred, and excluded skills", () => {
    const library = resolveCharacterLibrary({
      builtInSkills: BUILTIN_SAGE_SKILLS,
      customSkills: [],
      preferences: {
        enabledSkillIds: ["confucius", "laozi"],
        preferredSkillIds: ["laozi"],
        excludedSkillIds: ["hanfeizi"]
      }
    });

    expect(library.activeSkills.map((skill) => skill.id)).toEqual(["confucius", "laozi"]);
    expect(library.items.find((item) => item.skill.id === "laozi")?.preference).toEqual({
      enabled: true,
      preferred: true,
      excluded: false
    });
    expect(library.items.find((item) => item.skill.id === "hanfeizi")?.preference.excluded).toBe(true);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run:

```bash
cd personaforge
pnpm vitest run src/lib/characters/preferences.test.ts src/lib/characters/library.test.ts
```

Expected: FAIL because preferences and library resolution do not exist.

- [ ] **Step 3: Implement local preference storage**

Create `personaforge/src/lib/characters/preferences.ts`:

```ts
export type CharacterPreferences = {
  enabledSkillIds: string[];
  preferredSkillIds: string[];
  excludedSkillIds: string[];
};

export const DEFAULT_CHARACTER_PREFERENCES: CharacterPreferences = {
  enabledSkillIds: [
    "confucius",
    "mencius",
    "laozi",
    "zhuangzi",
    "mozi",
    "hanfeizi",
    "sunzi",
    "wang-yangming"
  ],
  preferredSkillIds: [],
  excludedSkillIds: []
};

const STORAGE_KEY = "personaforge.characterPreferences.v1";

function uniqueStrings(values: unknown): string[] {
  if (!Array.isArray(values)) {
    return [];
  }

  return [...new Set(values.filter((value): value is string => typeof value === "string" && value.trim().length > 0))];
}

export function loadCharacterPreferences(): CharacterPreferences {
  if (typeof localStorage === "undefined") {
    return DEFAULT_CHARACTER_PREFERENCES;
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return DEFAULT_CHARACTER_PREFERENCES;
    }

    const parsed = JSON.parse(raw) as Record<string, unknown>;
    return {
      enabledSkillIds: uniqueStrings(parsed.enabledSkillIds),
      preferredSkillIds: uniqueStrings(parsed.preferredSkillIds),
      excludedSkillIds: uniqueStrings(parsed.excludedSkillIds)
    };
  } catch {
    return DEFAULT_CHARACTER_PREFERENCES;
  }
}

export function saveCharacterPreferences(preferences: CharacterPreferences) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
}
```

- [ ] **Step 4: Implement custom skill storage**

Create `personaforge/src/lib/characters/custom-skill-store.ts`:

```ts
import { characterSkillSchema } from "@/lib/characters/schema";
import type { CharacterSkill } from "@/lib/characters/types";

const STORAGE_KEY = "personaforge.customSkills.v1";

export function loadCustomSkills(): CharacterSkill[] {
  if (typeof localStorage === "undefined") {
    return [];
  }

  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]") as unknown;
    return Array.isArray(parsed)
      ? parsed.map((item) => characterSkillSchema.safeParse(item)).filter((result) => result.success).map((result) => result.data)
      : [];
  } catch {
    return [];
  }
}

export function saveCustomSkills(skills: CharacterSkill[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(skills));
}
```

- [ ] **Step 5: Implement active library resolution**

Create `personaforge/src/lib/characters/library.ts`:

```ts
import type { CharacterPreferences } from "@/lib/characters/preferences";
import type { CharacterSkill } from "@/lib/characters/types";

export type CharacterLibraryItem = {
  skill: CharacterSkill;
  preference: {
    enabled: boolean;
    preferred: boolean;
    excluded: boolean;
  };
};

export function resolveCharacterLibrary({
  builtInSkills,
  customSkills,
  preferences
}: {
  builtInSkills: CharacterSkill[];
  customSkills: CharacterSkill[];
  preferences: CharacterPreferences;
}) {
  const enabled = new Set(preferences.enabledSkillIds);
  const preferred = new Set(preferences.preferredSkillIds);
  const excluded = new Set(preferences.excludedSkillIds);
  const byId = new Map<string, CharacterSkill>();

  for (const skill of [...builtInSkills, ...customSkills]) {
    byId.set(skill.id, skill);
  }

  const items: CharacterLibraryItem[] = [...byId.values()].map((skill) => ({
    skill,
    preference: {
      enabled: enabled.has(skill.id),
      preferred: preferred.has(skill.id),
      excluded: excluded.has(skill.id)
    }
  }));

  return {
    items,
    activeSkills: items
      .filter((item) => item.preference.enabled && !item.preference.excluded)
      .map((item) => item.skill)
  };
}
```

- [ ] **Step 6: Run tests to verify they pass**

Run:

```bash
cd personaforge
pnpm vitest run src/lib/characters/preferences.test.ts src/lib/characters/library.test.ts
```

Expected: PASS.

- [ ] **Step 7: Commit preference and library work**

Run from the git root:

```bash
git add personaforge/src/lib/characters
git commit -m "feat: add character skill library preferences"
```

## Task 5: Implement The Invisible Character Router

**Files:**
- Create: `personaforge/src/server/router/character-router.ts`
- Create: `personaforge/src/server/router/prompts.ts`
- Test: `personaforge/src/server/router/character-router.test.ts`

- [ ] **Step 1: Write failing router tests**

Create `personaforge/src/server/router/character-router.test.ts`:

```ts
import { describe, expect, it, vi } from "vitest";
import { routeCharacterRequest } from "@/server/router/character-router";
import { BUILTIN_SAGE_SKILLS } from "@/lib/characters/builtin-sages";

const basePreferences = {
  enabledSkillIds: BUILTIN_SAGE_SKILLS.map((skill) => skill.id),
  preferredSkillIds: [],
  excludedSkillIds: []
};

describe("routeCharacterRequest", () => {
  it("uses explicit named characters even when they are excluded", async () => {
    const result = await routeCharacterRequest({
      prompt: "请让韩非子说说这个组织激励问题",
      skills: BUILTIN_SAGE_SKILLS,
      preferences: { ...basePreferences, excludedSkillIds: ["hanfeizi"] },
      llmRouter: undefined
    });

    expect(result.mode).toBe("single");
    expect(result.selectedSkillIds).toEqual(["hanfeizi"]);
    expect(result.debug.explicitOverride).toBe(true);
  });

  it("routes current-fact-heavy decisions to dossier mode", async () => {
    const result = await routeCharacterRequest({
      prompt: "我是否应该现在进入 AI 搜索产品市场？请结合市场资料判断",
      skills: BUILTIN_SAGE_SKILLS,
      preferences: basePreferences,
      llmRouter: undefined
    });

    expect(result.mode).toBe("dossier");
    expect(result.requiresDossier).toBe(true);
    expect(result.responseDepth).toBe("full");
  });

  it("uses LLM fallback for ambiguous prompts", async () => {
    const llmRouter = vi.fn().mockResolvedValue({
      mode: "council",
      selectedSkillIds: ["laozi", "confucius"],
      requiresDossier: false,
      responseDepth: "short",
      rationale: "The prompt mixes burnout and duty."
    });

    const result = await routeCharacterRequest({
      prompt: "我最近有点卡住，不知道是坚持还是放下",
      skills: BUILTIN_SAGE_SKILLS,
      preferences: basePreferences,
      llmRouter
    });

    expect(llmRouter).toHaveBeenCalled();
    expect(result.selectedSkillIds).toEqual(["laozi", "confucius"]);
    expect(result.debug.rationale).toContain("burnout");
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run:

```bash
cd personaforge
pnpm vitest run src/server/router/character-router.test.ts
```

Expected: FAIL because router files do not exist.

- [ ] **Step 3: Add router prompt builders**

Create `personaforge/src/server/router/prompts.ts`:

```ts
import type { CharacterSkill } from "@/lib/characters/types";

export function buildRouterPrompt(prompt: string, skills: CharacterSkill[]) {
  return [
    "You are PersonaForge's invisible routing classifier.",
    "Return only JSON with mode, selectedSkillIds, requiresDossier, responseDepth, and rationale.",
    "Modes: single, council, debate, dossier.",
    "Response depth: short or full.",
    "Use dossier only when current external facts materially affect judgment.",
    "Available skills:",
    ...skills.map((skill) => `- ${skill.id}: ${skill.displayName.en}; tags=${skill.tags.join(", ")}; triggers=${skill.triggerScenarios.join(", ")}`),
    `User prompt: ${prompt}`
  ].join("\n");
}
```

- [ ] **Step 4: Implement rule-first routing**

Create `personaforge/src/server/router/character-router.ts`:

```ts
import type { CharacterPreferences } from "@/lib/characters/preferences";
import type { CharacterSkill } from "@/lib/characters/types";

export type PersonaForgeMode = "single" | "council" | "debate" | "dossier";
export type ResponseDepth = "short" | "full";

export type RouterResult = {
  mode: PersonaForgeMode;
  selectedSkillIds: string[];
  requiresDossier: boolean;
  responseDepth: ResponseDepth;
  debug: {
    strategy: "rules" | "llm";
    rationale: string;
    explicitOverride: boolean;
  };
};

type LlmRouterResult = {
  mode: PersonaForgeMode;
  selectedSkillIds: string[];
  requiresDossier: boolean;
  responseDepth: ResponseDepth;
  rationale: string;
};

const DOSSIER_TERMS = [
  "市场",
  "投资",
  "政策",
  "法律",
  "趋势",
  "资料",
  "调研",
  "数据",
  "market",
  "investment",
  "policy",
  "law",
  "research",
  "data",
  "trend"
];

const DEBATE_TERMS = ["互辩", "辩论", "反驳", "debate", "argue"];
const COUNCIL_TERMS = ["群贤", "会审", "都说说", "council", "panel"];

function normalize(value: string) {
  return value.toLowerCase();
}

function findExplicitSkills(prompt: string, skills: CharacterSkill[]) {
  const normalized = normalize(prompt);
  return skills.filter((skill) => {
    const names = [skill.id, skill.displayName.en, skill.displayName["zh-CN"]];
    return names.some((name) => normalized.includes(normalize(name)));
  });
}

function getRoutableSkills(skills: CharacterSkill[], preferences: CharacterPreferences, explicitIds: Set<string>) {
  const enabled = new Set(preferences.enabledSkillIds);
  const excluded = new Set(preferences.excludedSkillIds);

  return skills.filter((skill) => {
    if (explicitIds.has(skill.id)) {
      return true;
    }

    return enabled.has(skill.id) && !excluded.has(skill.id);
  });
}

function pickBestByKeywords(prompt: string, skills: CharacterSkill[], preferences: CharacterPreferences, count: number) {
  const normalized = normalize(prompt);
  const preferred = new Set(preferences.preferredSkillIds);

  return skills
    .map((skill) => {
      const text = [...skill.tags, ...skill.triggerScenarios, skill.worldview].join(" ").toLowerCase();
      const score = text.split(/\s+/).reduce((sum, token) => sum + (normalized.includes(token) ? 1 : 0), 0) + (preferred.has(skill.id) ? 2 : 0);
      return { skill, score };
    })
    .sort((a, b) => b.score - a.score || a.skill.id.localeCompare(b.skill.id))
    .slice(0, count)
    .map((item) => item.skill.id);
}

export async function routeCharacterRequest({
  prompt,
  skills,
  preferences,
  llmRouter
}: {
  prompt: string;
  skills: CharacterSkill[];
  preferences: CharacterPreferences;
  llmRouter?: (prompt: string, skills: CharacterSkill[]) => Promise<LlmRouterResult>;
}): Promise<RouterResult> {
  const explicitSkills = findExplicitSkills(prompt, skills);
  const explicitIds = new Set(explicitSkills.map((skill) => skill.id));
  const routableSkills = getRoutableSkills(skills, preferences, explicitIds);
  const normalized = normalize(prompt);

  if (explicitSkills.length === 1) {
    return {
      mode: "single",
      selectedSkillIds: [explicitSkills[0].id],
      requiresDossier: false,
      responseDepth: "short",
      debug: {
        strategy: "rules",
        rationale: "User explicitly named one character.",
        explicitOverride: preferences.excludedSkillIds.includes(explicitSkills[0].id)
      }
    };
  }

  if (DOSSIER_TERMS.some((term) => normalized.includes(term))) {
    return {
      mode: "dossier",
      selectedSkillIds: pickBestByKeywords(prompt, routableSkills, preferences, 3),
      requiresDossier: true,
      responseDepth: "full",
      debug: {
        strategy: "rules",
        rationale: "Prompt asks for current facts, market, policy, data, or research.",
        explicitOverride: false
      }
    };
  }

  if (DEBATE_TERMS.some((term) => normalized.includes(term))) {
    return {
      mode: "debate",
      selectedSkillIds: pickBestByKeywords(prompt, routableSkills, preferences, 2),
      requiresDossier: false,
      responseDepth: "full",
      debug: {
        strategy: "rules",
        rationale: "Prompt explicitly asks for debate or rebuttal.",
        explicitOverride: false
      }
    };
  }

  if (COUNCIL_TERMS.some((term) => normalized.includes(term))) {
    return {
      mode: "council",
      selectedSkillIds: pickBestByKeywords(prompt, routableSkills, preferences, 3),
      requiresDossier: false,
      responseDepth: "short",
      debug: {
        strategy: "rules",
        rationale: "Prompt explicitly asks for a council or multiple voices.",
        explicitOverride: false
      }
    };
  }

  if (llmRouter) {
    const routed = await llmRouter(prompt, routableSkills);
    return {
      mode: routed.mode,
      selectedSkillIds: routed.selectedSkillIds.filter((id) => routableSkills.some((skill) => skill.id === id)),
      requiresDossier: routed.requiresDossier,
      responseDepth: routed.responseDepth,
      debug: {
        strategy: "llm",
        rationale: routed.rationale,
        explicitOverride: false
      }
    };
  }

  return {
    mode: "single",
    selectedSkillIds: pickBestByKeywords(prompt, routableSkills, preferences, 1),
    requiresDossier: false,
    responseDepth: "short",
    debug: {
      strategy: "rules",
      rationale: "Defaulted to best-fit single-character counsel.",
      explicitOverride: false
    }
  };
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run:

```bash
cd personaforge
pnpm vitest run src/server/router/character-router.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit router work**

Run from the git root:

```bash
git add personaforge/src/server/router
git commit -m "feat: add PersonaForge character router"
```

## Task 6: Build Conversation Runtime And API

**Files:**
- Create: `personaforge/src/server/conversation/session-store.ts`
- Create: `personaforge/src/server/conversation/runtime.ts`
- Create: `personaforge/src/server/conversation/prompts.ts`
- Create: `personaforge/src/app/api/conversations/route.ts`
- Create: `personaforge/src/app/api/conversations/[sessionId]/route.ts`
- Test: `personaforge/src/server/conversation/runtime.test.ts`
- Test: `personaforge/src/app/api/conversations/route.test.ts`

- [ ] **Step 1: Extend character types for conversations**

Add these exports to `personaforge/src/lib/characters/types.ts`:

```ts
export type PersonaForgeMode = "single" | "council" | "debate" | "dossier";
export type PersonaForgeStage = "routing" | "dossier" | "responding" | "complete" | "failed";

export type DossierEvidence = {
  id: string;
  title: string;
  url: string;
  sourceName: string;
  summary: string;
  dataPoints: string[];
};

export type CharacterTurn = {
  id: string;
  characterId: string;
  characterName: string;
  content: string;
  referencedDossierIds: string[];
};

export type ConversationDebug = {
  routingStrategy: "rules" | "llm";
  routingRationale: string;
  explicitOverride: boolean;
};

export type PersonaForgeSession = {
  id: string;
  createdAt: string;
  updatedAt: string;
  prompt: string;
  language: AppLanguage;
  mode: PersonaForgeMode;
  stage: PersonaForgeStage;
  selectedSkillIds: string[];
  dossier: DossierEvidence[];
  turns: CharacterTurn[];
  debug: ConversationDebug;
};
```

Also import `AppLanguage` at the top of that file:

```ts
import type { AppLanguage, UiLanguage } from "@/lib/types";
```

- [ ] **Step 2: Write failing runtime and API tests**

Create `personaforge/src/server/conversation/runtime.test.ts`:

```ts
import { describe, expect, it, vi } from "vitest";
import { createConversationRuntime } from "@/server/conversation/runtime";
import { createConversationSessionStore } from "@/server/conversation/session-store";
import { BUILTIN_SAGE_SKILLS } from "@/lib/characters/builtin-sages";

describe("createConversationRuntime", () => {
  it("creates a session with selected characters and generated turns", async () => {
    const runtime = createConversationRuntime({
      store: createConversationSessionStore(),
      skills: BUILTIN_SAGE_SKILLS,
      preferences: {
        enabledSkillIds: BUILTIN_SAGE_SKILLS.map((skill) => skill.id),
        preferredSkillIds: [],
        excludedSkillIds: []
      },
      generateCharacterTurn: vi.fn().mockResolvedValue({
        content: "名不正，责亦无所归。先把角色和责任说清。",
        referencedDossierIds: []
      }),
      buildDossier: vi.fn()
    });

    const session = await runtime.createSession({
      prompt: "我该不该离开现在的团队？",
      language: "zh-CN"
    });

    expect(session.stage).toBe("complete");
    expect(session.turns).toHaveLength(1);
    expect(session.turns[0].characterId).toBeTruthy();
  });
});
```

Create `personaforge/src/app/api/conversations/route.test.ts`:

```ts
import { describe, expect, it, vi } from "vitest";

vi.mock("@/server/conversation/runtime", () => ({
  runtime: {
    createSession: vi.fn().mockResolvedValue({
      id: "session-1",
      createdAt: "2026-04-23T00:00:00.000Z",
      updatedAt: "2026-04-23T00:00:00.000Z",
      prompt: "是否要创业",
      language: "zh-CN",
      mode: "single",
      stage: "complete",
      selectedSkillIds: ["confucius"],
      dossier: [],
      turns: [],
      debug: {
        routingStrategy: "rules",
        routingRationale: "test",
        explicitOverride: false
      }
    })
  }
}));

import { POST } from "@/app/api/conversations/route";

describe("POST /api/conversations", () => {
  it("creates a PersonaForge conversation session", async () => {
    const response = await POST(
      new Request("http://localhost/api/conversations", {
        method: "POST",
        body: JSON.stringify({ prompt: "是否要创业", language: "zh-CN" })
      })
    );

    const payload = await response.json();

    expect(response.status).toBe(201);
    expect(payload.id).toBe("session-1");
  });

  it("rejects empty prompts", async () => {
    const response = await POST(
      new Request("http://localhost/api/conversations", {
        method: "POST",
        body: JSON.stringify({ prompt: "", language: "zh-CN" })
      })
    );

    expect(response.status).toBe(400);
  });
});
```

- [ ] **Step 3: Run tests to verify they fail**

Run:

```bash
cd personaforge
pnpm vitest run src/server/conversation/runtime.test.ts src/app/api/conversations/route.test.ts
```

Expected: FAIL because conversation runtime and API files do not exist.

- [ ] **Step 4: Implement session store**

Create `personaforge/src/server/conversation/session-store.ts`:

```ts
import type { PersonaForgeSession } from "@/lib/characters/types";

export function createConversationSessionStore() {
  const sessions = new Map<string, PersonaForgeSession>();

  return {
    get(id: string) {
      return sessions.get(id);
    },
    save(session: PersonaForgeSession) {
      sessions.set(session.id, structuredClone(session));
      return structuredClone(session);
    }
  };
}
```

- [ ] **Step 5: Implement character response prompt builder**

Create `personaforge/src/server/conversation/prompts.ts`:

```ts
import type { CharacterSkill, DossierEvidence } from "@/lib/characters/types";

export function buildCharacterTurnPrompt({
  prompt,
  skill,
  dossier
}: {
  prompt: string;
  skill: CharacterSkill;
  dossier: DossierEvidence[];
}) {
  return [
    `User prompt: ${prompt}`,
    `Character: ${skill.displayName["zh-CN"]} / ${skill.displayName.en}`,
    `Voice mode: ${skill.voiceMode}`,
    `Worldview: ${skill.worldview}`,
    `Mental models: ${skill.mentalModels.join(" | ")}`,
    `Decision heuristics: ${skill.decisionHeuristics.join(" | ")}`,
    `Boundaries: ${skill.boundaries.join(" | ")}`,
    dossier.length
      ? [
          "Dossier:",
          ...dossier.map((item, index) => `- Dossier ${index + 1} | id=${item.id} | title=${item.title} | summary=${item.summary}`)
        ].join("\n")
      : "Dossier: none",
    "Return only valid JSON.",
    'Use this shape: {"content":"<character response>","referencedDossierIds":["<dossier id>"]}.',
    "If the character uses current factual claims, it must cite dossier ids. If dossier evidence is insufficient, say so in content."
  ].join("\n");
}
```

- [ ] **Step 6: Implement runtime**

Create `personaforge/src/server/conversation/runtime.ts`:

```ts
import { randomUUID } from "node:crypto";
import { BUILTIN_SAGE_SKILLS } from "@/lib/characters/builtin-sages";
import { DEFAULT_CHARACTER_PREFERENCES, type CharacterPreferences } from "@/lib/characters/preferences";
import type { CharacterSkill, DossierEvidence, PersonaForgeSession } from "@/lib/characters/types";
import { routeCharacterRequest } from "@/server/router/character-router";
import { createConversationSessionStore } from "@/server/conversation/session-store";

export type CharacterTurnGeneration = {
  content: string;
  referencedDossierIds: string[];
};

export function createConversationRuntime({
  store,
  skills,
  preferences,
  generateCharacterTurn,
  buildDossier
}: {
  store: ReturnType<typeof createConversationSessionStore>;
  skills: CharacterSkill[];
  preferences: CharacterPreferences;
  generateCharacterTurn: (input: {
    prompt: string;
    skill: CharacterSkill;
    dossier: DossierEvidence[];
  }) => Promise<CharacterTurnGeneration>;
  buildDossier: (prompt: string) => Promise<DossierEvidence[]>;
}) {
  return {
    async createSession(input: { prompt: string; language?: "zh-CN" | "en" }) {
      const prompt = input.prompt.trim();
      if (!prompt) {
        throw new Error("Prompt is required");
      }

      const routed = await routeCharacterRequest({
        prompt,
        skills,
        preferences,
        llmRouter: undefined
      });

      const selectedSkills = routed.selectedSkillIds
        .map((id) => skills.find((skill) => skill.id === id))
        .filter((skill): skill is CharacterSkill => Boolean(skill));
      const dossier = routed.requiresDossier ? await buildDossier(prompt) : [];
      const turns = [];

      for (const skill of selectedSkills) {
        const generated = await generateCharacterTurn({ prompt, skill, dossier });
        turns.push({
          id: randomUUID(),
          characterId: skill.id,
          characterName: skill.displayName[input.language ?? "zh-CN"],
          content: generated.content,
          referencedDossierIds: generated.referencedDossierIds
        });
      }

      const now = new Date().toISOString();
      const session: PersonaForgeSession = {
        id: randomUUID(),
        createdAt: now,
        updatedAt: now,
        prompt,
        language: input.language ?? "zh-CN",
        mode: routed.mode,
        stage: "complete",
        selectedSkillIds: selectedSkills.map((skill) => skill.id),
        dossier,
        turns,
        debug: {
          routingStrategy: routed.debug.strategy,
          routingRationale: routed.debug.rationale,
          explicitOverride: routed.debug.explicitOverride
        }
      };

      return store.save(session);
    },
    getSession(id: string) {
      return store.get(id);
    }
  };
}

const store = createConversationSessionStore();

export const runtime = createConversationRuntime({
  store,
  skills: BUILTIN_SAGE_SKILLS,
  preferences: DEFAULT_CHARACTER_PREFERENCES,
  generateCharacterTurn: async ({ skill }) => ({
    content: `${skill.displayName["zh-CN"]}暂以此问开端：请先补充一个最关键的事实。`,
    referencedDossierIds: []
  }),
  buildDossier: async () => []
});
```

- [ ] **Step 7: Implement API routes**

Create `personaforge/src/app/api/conversations/route.ts`:

```ts
import { NextResponse } from "next/server";
import { z } from "zod";
import { runtime } from "@/server/conversation/runtime";

const createConversationInputSchema = z.object({
  prompt: z.string().trim().min(1),
  language: z.enum(["zh-CN", "en"]).optional()
}).strict();

export async function POST(request: Request) {
  try {
    const input = createConversationInputSchema.parse(await request.json());
    const session = await runtime.createSession(input);
    return NextResponse.json(session, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError || error instanceof SyntaxError) {
      return NextResponse.json({ error: "Invalid conversation input" }, { status: 400 });
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unexpected error" },
      { status: 500 }
    );
  }
}
```

Create `personaforge/src/app/api/conversations/[sessionId]/route.ts`:

```ts
import { NextResponse } from "next/server";
import { runtime } from "@/server/conversation/runtime";

export async function GET(
  _request: Request,
  context: { params: Promise<{ sessionId: string }> }
) {
  const { sessionId } = await context.params;
  const session = runtime.getSession(sessionId);

  if (!session) {
    return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
  }

  return NextResponse.json(session);
}
```

- [ ] **Step 8: Run tests to verify they pass**

Run:

```bash
cd personaforge
pnpm vitest run src/server/conversation/runtime.test.ts src/app/api/conversations/route.test.ts
```

Expected: PASS.

- [ ] **Step 9: Commit conversation runtime**

Run from the git root:

```bash
git add personaforge/src/lib/characters/types.ts personaforge/src/server/conversation personaforge/src/app/api/conversations
git commit -m "feat: add PersonaForge conversation runtime"
```

## Task 7: Build The Minimal Dialogue Workspace

**Files:**
- Create: `personaforge/src/components/dialogue/dialogue-workspace.tsx`
- Create: `personaforge/src/components/dialogue/conversation-thread.tsx`
- Create: `personaforge/src/components/dialogue/config-status-link.tsx`
- Modify: `personaforge/src/app/(workspace)/app/page.tsx`
- Test: `personaforge/src/app/(workspace)/app/page.test.tsx`

- [ ] **Step 1: Write failing dialogue UI tests**

Replace `personaforge/src/app/(workspace)/app/page.test.tsx` with:

```tsx
import "@testing-library/jest-dom/vitest";

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import AppPage from "@/app/(workspace)/app/page";
import { AppPreferencesProvider } from "@/lib/app-preferences";

describe("PersonaForge dialogue page", () => {
  it("starts a conversation from one input box", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        id: "session-1",
        prompt: "是否要创业",
        mode: "single",
        stage: "complete",
        selectedSkillIds: ["confucius"],
        dossier: [],
        turns: [
          {
            id: "turn-1",
            characterId: "confucius",
            characterName: "孔子",
            content: "名不正，责亦无所归。",
            referencedDossierIds: []
          }
        ],
        debug: {
          routingStrategy: "rules",
          routingRationale: "test",
          explicitOverride: false
        }
      })
    }));

    render(
      <AppPreferencesProvider>
        {await AppPage({ searchParams: Promise.resolve({}) })}
      </AppPreferencesProvider>
    );

    await userEvent.type(screen.getByLabelText("Ask PersonaForge"), "是否要创业");
    await userEvent.click(screen.getByRole("button", { name: "Ask" }));

    await waitFor(() => {
      expect(screen.getByText("名不正，责亦无所归。")).toBeInTheDocument();
    });
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run:

```bash
cd personaforge
pnpm vitest run 'src/app/(workspace)/app/page.test.tsx'
```

Expected: FAIL because the dialogue components do not exist.

- [ ] **Step 3: Implement the conversation thread**

Create `personaforge/src/components/dialogue/conversation-thread.tsx`:

```tsx
import type { CharacterTurn } from "@/lib/characters/types";

export function ConversationThread({ turns }: { turns: CharacterTurn[] }) {
  if (turns.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4" data-testid="conversation-thread">
      {turns.map((turn) => (
        <article key={turn.id} className="rounded-[8px] border border-app-line bg-app-card p-5">
          <h2 className="text-sm font-semibold text-app-strong">{turn.characterName}</h2>
          <p className="mt-3 whitespace-pre-wrap text-base leading-7 text-app-foreground">{turn.content}</p>
        </article>
      ))}
    </div>
  );
}
```

- [ ] **Step 4: Implement lightweight configuration status**

Create `personaforge/src/components/dialogue/config-status-link.tsx`:

```tsx
import Link from "next/link";

export function ConfigStatusLink() {
  return (
    <Link
      href="/settings"
      className="rounded-[8px] border border-app-line bg-app-card px-3 py-2 text-xs font-medium text-app-muted transition hover:text-app-strong"
    >
      Runtime settings
    </Link>
  );
}
```

- [ ] **Step 5: Implement the one-input dialogue workspace**

Create `personaforge/src/components/dialogue/dialogue-workspace.tsx`:

```tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ConfigStatusLink } from "@/components/dialogue/config-status-link";
import { ConversationThread } from "@/components/dialogue/conversation-thread";
import { useAppPreferences } from "@/lib/app-preferences";
import type { PersonaForgeSession } from "@/lib/characters/types";

export function DialogueWorkspace() {
  const { language } = useAppPreferences();
  const [prompt, setPrompt] = useState("");
  const [session, setSession] = useState<PersonaForgeSession | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isChinese = language === "zh-CN";

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedPrompt = prompt.trim();
    if (!trimmedPrompt) {
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/conversations", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ prompt: trimmedPrompt, language })
      });

      if (!response.ok) {
        throw new Error(isChinese ? "对话启动失败" : "Failed to start conversation");
      }

      setSession((await response.json()) as PersonaForgeSession);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : isChinese ? "对话启动失败" : "Failed to start conversation");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section data-testid="dialogue-page-shell" className="mx-auto flex min-h-screen w-full max-w-[980px] flex-col px-6 py-10">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-app-strong">{isChinese ? "众思阁" : "PersonaForge"}</h1>
          <p className="mt-2 text-sm text-app-muted">
            {isChinese ? "输入一个问题，让合适的人物自然接话。" : "Ask one question and let the right character skill respond."}
          </p>
        </div>
        <ConfigStatusLink />
      </div>

      <form onSubmit={handleSubmit} className="rounded-[8px] border border-app-line bg-app-card p-4">
        <Textarea
          aria-label="Ask PersonaForge"
          value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
          placeholder={isChinese ? "把你的困惑、问题或决策写在这里……" : "Write your question, dilemma, or decision here..."}
          className="min-h-[128px]"
        />
        <div className="mt-4 flex items-center justify-end">
          <Button type="submit" disabled={isSubmitting || prompt.trim().length === 0}>
            {isSubmitting ? (isChinese ? "思考中…" : "Thinking...") : isChinese ? "提问" : "Ask"}
          </Button>
        </div>
      </form>

      {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}
      <div className="mt-8">
        <ConversationThread turns={session?.turns ?? []} />
      </div>
    </section>
  );
}
```

- [ ] **Step 6: Wire `/app` to the dialogue workspace**

Replace `personaforge/src/app/(workspace)/app/page.tsx` with:

```tsx
import { DialogueWorkspace } from "@/components/dialogue/dialogue-workspace";

type AppPageProps = {
  searchParams?: Promise<{
    lang?: string | string[];
  }>;
};

export default async function AppPage(_props: AppPageProps) {
  return <DialogueWorkspace />;
}
```

- [ ] **Step 7: Run tests to verify they pass**

Run:

```bash
cd personaforge
pnpm vitest run 'src/app/(workspace)/app/page.test.tsx'
```

Expected: PASS.

- [ ] **Step 8: Commit dialogue workspace**

Run from the git root:

```bash
git add personaforge/src/components/dialogue personaforge/src/app/'(workspace)'/app
git commit -m "feat: add PersonaForge dialogue workspace"
```

## Task 8: Add Dossier Mode Service And Collapsible UI

**Files:**
- Create: `personaforge/src/server/dossier/dossier-service.ts`
- Modify: `personaforge/src/server/conversation/runtime.ts`
- Create: `personaforge/src/components/dialogue/dossier-panel.tsx`
- Modify: `personaforge/src/components/dialogue/dialogue-workspace.tsx`
- Test: `personaforge/src/server/dossier/dossier-service.test.ts`
- Test: `personaforge/src/components/dialogue/dossier-panel.test.tsx`

- [ ] **Step 1: Write failing dossier tests**

Create `personaforge/src/server/dossier/dossier-service.test.ts`:

```ts
import { describe, expect, it, vi } from "vitest";
import { createDossierService } from "@/server/dossier/dossier-service";

describe("createDossierService", () => {
  it("maps research evidence into dossier evidence", async () => {
    const service = createDossierService({
      buildSharedEvidence: vi.fn().mockResolvedValue([
        {
          id: "e1",
          title: "Market report",
          url: "https://example.com/report",
          sourceName: "Example",
          sourceType: "report",
          summary: "AI search demand is growing.",
          dataPoints: ["42% growth"]
        }
      ])
    });

    const dossier = await service.buildDossier("AI search market");

    expect(dossier).toEqual([
      {
        id: "e1",
        title: "Market report",
        url: "https://example.com/report",
        sourceName: "Example",
        summary: "AI search demand is growing.",
        dataPoints: ["42% growth"]
      }
    ]);
  });
});
```

Create `personaforge/src/components/dialogue/dossier-panel.test.tsx`:

```tsx
import "@testing-library/jest-dom/vitest";

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { DossierPanel } from "@/components/dialogue/dossier-panel";

describe("DossierPanel", () => {
  it("is collapsed by default and expands sources on click", async () => {
    render(
      <DossierPanel
        dossier={[
          {
            id: "e1",
            title: "Market report",
            url: "https://example.com/report",
            sourceName: "Example",
            summary: "AI search demand is growing.",
            dataPoints: ["42% growth"]
          }
        ]}
      />
    );

    expect(screen.queryByText("AI search demand is growing.")).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Dossier" }));
    expect(screen.getByText("AI search demand is growing.")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run:

```bash
cd personaforge
pnpm vitest run src/server/dossier/dossier-service.test.ts src/components/dialogue/dossier-panel.test.tsx
```

Expected: FAIL because dossier files do not exist.

- [ ] **Step 3: Implement dossier service**

Create `personaforge/src/server/dossier/dossier-service.ts`:

```ts
import type { DossierEvidence } from "@/lib/characters/types";
import type { Evidence } from "@/lib/types";

type ResearchLikeService = {
  buildSharedEvidence(question: string): Promise<Evidence[]>;
};

export function createDossierService(researchService: ResearchLikeService) {
  return {
    async buildDossier(question: string): Promise<DossierEvidence[]> {
      const evidence = await researchService.buildSharedEvidence(question);

      return evidence.map((item) => ({
        id: item.id,
        title: item.title,
        url: item.url,
        sourceName: item.sourceName,
        summary: item.summary,
        dataPoints: item.dataPoints ?? []
      }));
    }
  };
}
```

- [ ] **Step 4: Implement collapsible dossier panel**

Create `personaforge/src/components/dialogue/dossier-panel.tsx`:

```tsx
"use client";

import { useState } from "react";
import type { DossierEvidence } from "@/lib/characters/types";

export function DossierPanel({ dossier }: { dossier: DossierEvidence[] }) {
  const [open, setOpen] = useState(false);

  if (dossier.length === 0) {
    return null;
  }

  return (
    <section className="rounded-[8px] border border-app-line bg-app-card">
      <button
        type="button"
        className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-semibold text-app-strong"
        onClick={() => setOpen((current) => !current)}
      >
        <span>Dossier</span>
        <span className="text-xs text-app-muted">{dossier.length} sources</span>
      </button>
      {open ? (
        <div className="space-y-3 border-t border-app-line px-4 py-4">
          {dossier.map((item) => (
            <article key={item.id} className="rounded-[8px] bg-app-soft p-3">
              <a href={item.url} className="text-sm font-medium text-app-strong underline-offset-4 hover:underline">
                {item.title}
              </a>
              <p className="mt-2 text-sm leading-6 text-app-muted">{item.summary}</p>
              {item.dataPoints.length ? (
                <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-app-muted">
                  {item.dataPoints.map((point) => (
                    <li key={point}>{point}</li>
                  ))}
                </ul>
              ) : null}
            </article>
          ))}
        </div>
      ) : null}
    </section>
  );
}
```

- [ ] **Step 5: Render dossier panel in the dialogue workspace**

In `personaforge/src/components/dialogue/dialogue-workspace.tsx`, import and render the panel before turns:

```tsx
import { DossierPanel } from "@/components/dialogue/dossier-panel";
```

```tsx
<div className="mt-8 space-y-6">
  <DossierPanel dossier={session?.dossier ?? []} />
  <ConversationThread turns={session?.turns ?? []} />
</div>
```

- [ ] **Step 6: Run tests to verify they pass**

Run:

```bash
cd personaforge
pnpm vitest run src/server/dossier/dossier-service.test.ts src/components/dialogue/dossier-panel.test.tsx 'src/app/(workspace)/app/page.test.tsx'
```

Expected: PASS.

- [ ] **Step 7: Commit dossier mode surface**

Run from the git root:

```bash
git add personaforge/src/server/dossier personaforge/src/components/dialogue
git commit -m "feat: add evidence dossier mode"
```

## Task 9: Build Skills Page, Import/Export, And Review Gate

**Files:**
- Create: `personaforge/src/lib/characters/skill-md.ts`
- Create: `personaforge/src/components/skills/skill-card.tsx`
- Create: `personaforge/src/components/skills/skill-review-panel.tsx`
- Create: `personaforge/src/components/skills/skills-page-content.tsx`
- Modify: `personaforge/src/app/(workspace)/skills/page.tsx`
- Test: `personaforge/src/lib/characters/skill-md.test.ts`
- Test: `personaforge/src/app/(workspace)/skills/page.test.tsx`

- [ ] **Step 1: Write failing skill import/export and page tests**

Create `personaforge/src/lib/characters/skill-md.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { exportCharacterSkillMarkdown } from "@/lib/characters/skill-md";
import { BUILTIN_SAGE_SKILLS } from "@/lib/characters/builtin-sages";

describe("exportCharacterSkillMarkdown", () => {
  it("exports a compatible SKILL.md document", () => {
    const markdown = exportCharacterSkillMarkdown(BUILTIN_SAGE_SKILLS[0]);

    expect(markdown).toContain("name: character-confucius");
    expect(markdown).toContain("# Confucius");
    expect(markdown).toContain("## Boundaries");
  });
});
```

Create `personaforge/src/app/(workspace)/skills/page.test.tsx`:

```tsx
import "@testing-library/jest-dom/vitest";

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import SkillsPage from "@/app/(workspace)/skills/page";
import { AppPreferencesProvider } from "@/lib/app-preferences";

describe("SkillsPage", () => {
  it("renders built-in sage skills and preference controls", () => {
    render(
      <AppPreferencesProvider>
        <SkillsPage />
      </AppPreferencesProvider>
    );

    expect(screen.getByTestId("skills-page-shell")).toBeInTheDocument();
    expect(screen.getByText("Confucius")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Prefer Confucius" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Exclude Confucius" })).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run:

```bash
cd personaforge
pnpm vitest run src/lib/characters/skill-md.test.ts 'src/app/(workspace)/skills/page.test.tsx'
```

Expected: FAIL because skill markdown helpers and skills UI do not exist.

- [ ] **Step 3: Add `SKILL.md` export helper**

Create `personaforge/src/lib/characters/skill-md.ts`:

```ts
import type { CharacterSkill } from "@/lib/characters/types";

function list(items: string[]) {
  return items.map((item) => `- ${item}`).join("\n");
}

export function exportCharacterSkillMarkdown(skill: CharacterSkill) {
  return [
    "---",
    `name: character-${skill.id}`,
    `description: ${skill.shortDescription.en}`,
    "---",
    "",
    `# ${skill.displayName.en}`,
    "",
    skill.shortDescription.en,
    "",
    "## Trigger Scenarios",
    list(skill.triggerScenarios),
    "",
    "## Worldview",
    skill.worldview,
    "",
    "## Mental Models",
    list(skill.mentalModels),
    "",
    "## Decision Heuristics",
    list(skill.decisionHeuristics),
    "",
    "## Voice Rules",
    list(skill.voiceRules),
    "",
    "## Boundaries",
    list(skill.boundaries)
  ].join("\n");
}
```

- [ ] **Step 4: Add skill card UI**

Create `personaforge/src/components/skills/skill-card.tsx`:

```tsx
import type { CharacterSkill } from "@/lib/characters/types";

export function SkillCard({ skill }: { skill: CharacterSkill }) {
  return (
    <article className="rounded-[8px] border border-app-line bg-app-card p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-app-strong">{skill.displayName.en}</h2>
          <p className="mt-1 text-sm text-app-muted">{skill.displayName["zh-CN"]}</p>
          <p className="mt-3 text-sm leading-6 text-app-muted">{skill.shortDescription.en}</p>
        </div>
        <span className="rounded-full border border-app-line px-2.5 py-1 text-xs text-app-muted">
          {skill.status}
        </span>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <button type="button" className="rounded-[8px] border border-app-line px-3 py-1.5 text-xs text-app-strong">
          Enable {skill.displayName.en}
        </button>
        <button type="button" className="rounded-[8px] border border-app-line px-3 py-1.5 text-xs text-app-strong">
          Prefer {skill.displayName.en}
        </button>
        <button type="button" className="rounded-[8px] border border-app-line px-3 py-1.5 text-xs text-app-strong">
          Exclude {skill.displayName.en}
        </button>
      </div>
    </article>
  );
}
```

- [ ] **Step 5: Add review panel shell**

Create `personaforge/src/components/skills/skill-review-panel.tsx`:

```tsx
import type { CharacterSkill } from "@/lib/characters/types";

export function SkillReviewPanel({ skill }: { skill: CharacterSkill }) {
  return (
    <section className="rounded-[8px] border border-app-line bg-app-card p-5">
      <h2 className="text-lg font-semibold text-app-strong">Review {skill.displayName.en}</h2>
      <p className="mt-2 text-sm leading-6 text-app-muted">{skill.worldview}</p>
      <div className="mt-4">
        <h3 className="text-sm font-semibold text-app-strong">Boundaries</h3>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-app-muted">
          {skill.boundaries.map((boundary) => (
            <li key={boundary}>{boundary}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}
```

- [ ] **Step 6: Add skills page content**

Create `personaforge/src/components/skills/skills-page-content.tsx`:

```tsx
"use client";

import { SkillCard } from "@/components/skills/skill-card";
import { BUILTIN_SAGE_SKILLS } from "@/lib/characters/builtin-sages";

export function SkillsPageContent() {
  return (
    <main data-testid="skills-page-shell" className="mx-auto w-full max-w-[1240px] space-y-6 px-6 py-8 lg:px-10">
      <div>
        <h1 className="text-2xl font-semibold text-app-strong">Skills</h1>
        <p className="mt-2 text-sm text-app-muted">Manage built-in and custom character skills.</p>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        {BUILTIN_SAGE_SKILLS.map((skill) => (
          <SkillCard key={skill.id} skill={skill} />
        ))}
      </div>
    </main>
  );
}
```

Replace `personaforge/src/app/(workspace)/skills/page.tsx`:

```tsx
import { SkillsPageContent } from "@/components/skills/skills-page-content";

export default function SkillsPage() {
  return <SkillsPageContent />;
}
```

- [ ] **Step 7: Run tests to verify they pass**

Run:

```bash
cd personaforge
pnpm vitest run src/lib/characters/skill-md.test.ts 'src/app/(workspace)/skills/page.test.tsx'
```

Expected: PASS.

- [ ] **Step 8: Commit skills library UI**

Run from the git root:

```bash
git add personaforge/src/lib/characters/skill-md.ts personaforge/src/components/skills personaforge/src/app/'(workspace)'/skills
git commit -m "feat: add character skills library"
```

## Task 10: Add Skill Creator, Import API, And Review Records

**Files:**
- Create: `personaforge/src/server/creator/skill-creator.ts`
- Create: `personaforge/src/server/creator/skill-importer.ts`
- Create: `personaforge/src/app/api/skills/create/route.ts`
- Create: `personaforge/src/app/api/skills/import/route.ts`
- Create: `personaforge/src/components/skills/skill-creator-form.tsx`
- Modify: `personaforge/src/components/skills/skills-page-content.tsx`
- Test: `personaforge/src/server/creator/skill-creator.test.ts`
- Test: `personaforge/src/app/api/skills/create/route.test.ts`

- [ ] **Step 1: Write failing creator tests**

Create `personaforge/src/server/creator/skill-creator.test.ts`:

```ts
import { describe, expect, it, vi } from "vitest";
import { createSkillCreator } from "@/server/creator/skill-creator";

describe("createSkillCreator", () => {
  it("generates a reviewable standard character skill", async () => {
    const creator = createSkillCreator({
      generateProfile: vi.fn().mockResolvedValue({
        id: "ada-lovelace",
        displayName: { "zh-CN": "Ada Lovelace", en: "Ada Lovelace" },
        shortDescription: { "zh-CN": "计算想象力与形式推理", en: "Computational imagination and formal reasoning" },
        status: "custom",
        subjectKind: "deceased-public-figure",
        voiceMode: "immersive",
        tags: ["computing", "imagination"],
        triggerScenarios: ["creative technical work"],
        worldview: "Formal systems and imagination can cooperate.",
        coreTensions: ["poetry and precision"],
        mentalModels: ["symbolic abstraction"],
        decisionHeuristics: ["separate mechanical execution from conceptual design"],
        antiPatterns: ["mistaking calculation for imagination"],
        voiceRules: ["speak precisely"],
        boundaries: ["do not fabricate private claims"],
        sources: [{ title: "User source", url: "https://example.com", sourceType: "web", layer: "reliable-secondary", summary: "Biography" }],
        exampleDialogues: [{ user: "How should I think about creative code?", assistant: "Begin with the relation, not the machine." }],
        confidence: "medium"
      })
    });

    const result = await creator.createReviewDraft({
      name: "Ada Lovelace",
      depth: "standard",
      materials: ["https://example.com"]
    });

    expect(result.reviewStatus).toBe("pending");
    expect(result.skill.id).toBe("ada-lovelace");
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run:

```bash
cd personaforge
pnpm vitest run src/server/creator/skill-creator.test.ts
```

Expected: FAIL because creator files do not exist.

- [ ] **Step 3: Implement the creator service**

Create `personaforge/src/server/creator/skill-creator.ts`:

```ts
import { randomUUID } from "node:crypto";
import { characterSkillSchema } from "@/lib/characters/schema";
import type { CharacterSkill } from "@/lib/characters/types";

export type SkillCreatorDepth = "standard" | "advanced";

export type SkillReviewDraft = {
  id: string;
  createdAt: string;
  reviewStatus: "pending";
  depth: SkillCreatorDepth;
  skill: CharacterSkill;
  materials: string[];
};

export function createSkillCreator({
  generateProfile
}: {
  generateProfile: (input: {
    name: string;
    depth: SkillCreatorDepth;
    materials: string[];
  }) => Promise<CharacterSkill>;
}) {
  return {
    async createReviewDraft(input: { name: string; depth: SkillCreatorDepth; materials: string[] }): Promise<SkillReviewDraft> {
      const skill = characterSkillSchema.parse(await generateProfile(input));

      return {
        id: randomUUID(),
        createdAt: new Date().toISOString(),
        reviewStatus: "pending",
        depth: input.depth,
        skill,
        materials: input.materials
      };
    }
  };
}
```

- [ ] **Step 4: Implement importer service**

Create `personaforge/src/server/creator/skill-importer.ts`:

```ts
import { characterSkillSchema } from "@/lib/characters/schema";
import type { CharacterSkill } from "@/lib/characters/types";

export function tryParseCharacterSkillJson(value: string): CharacterSkill | null {
  try {
    const parsed = JSON.parse(value) as unknown;
    const result = characterSkillSchema.safeParse(parsed);
    return result.success ? result.data : null;
  } catch {
    return null;
  }
}

export function isPotentialCharacterSkillMarkdown(markdown: string) {
  const requiredTerms = ["worldview", "mental", "boundaries"];
  const normalized = markdown.toLowerCase();

  return requiredTerms.every((term) => normalized.includes(term));
}
```

- [ ] **Step 5: Add create API route**

Create `personaforge/src/app/api/skills/create/route.ts`:

```ts
import { NextResponse } from "next/server";
import { z } from "zod";
import { createSkillCreator } from "@/server/creator/skill-creator";

const createSkillInputSchema = z.object({
  name: z.string().trim().min(1),
  depth: z.enum(["standard", "advanced"]).default("standard"),
  materials: z.array(z.string().trim().min(1)).default([])
}).strict();

const creator = createSkillCreator({
  generateProfile: async ({ name }) => {
    const id = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "custom-character";

    return {
      id,
      displayName: { "zh-CN": name, en: name },
      shortDescription: { "zh-CN": "待审核的人物 Skill 草稿", en: "Reviewable character skill draft" },
      status: "custom",
      subjectKind: "deceased-public-figure",
      voiceMode: "immersive",
      tags: ["custom"],
      triggerScenarios: ["user-created character counsel"],
      worldview: "Generated draft awaiting user review.",
      coreTensions: ["source confidence versus usefulness"],
      mentalModels: ["source-grounded character model"],
      decisionHeuristics: ["state uncertainty clearly"],
      antiPatterns: ["unsupported private claims"],
      voiceRules: ["stay within public-source boundaries"],
      boundaries: ["do not fabricate quotes, events, or private psychology"],
      sources: [{ title: "User request", url: "local://creator/user-request", sourceType: "user-input", layer: "third-party-commentary", summary: `Draft requested for ${name}` }],
      exampleDialogues: [{ user: "How would this character approach my question?", assistant: "I would begin from the public-source model and state uncertainty clearly." }],
      confidence: "low"
    };
  }
});

export async function POST(request: Request) {
  try {
    const input = createSkillInputSchema.parse(await request.json());
    const draft = await creator.createReviewDraft(input);
    return NextResponse.json(draft, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError || error instanceof SyntaxError) {
      return NextResponse.json({ error: "Invalid skill creation input" }, { status: 400 });
    }

    return NextResponse.json({ error: "Skill creation failed" }, { status: 500 });
  }
}
```

- [ ] **Step 6: Add import API route**

Create `personaforge/src/app/api/skills/import/route.ts`:

```ts
import { NextResponse } from "next/server";
import { z } from "zod";
import { isPotentialCharacterSkillMarkdown, tryParseCharacterSkillJson } from "@/server/creator/skill-importer";

const importSkillInputSchema = z.object({
  content: z.string().trim().min(1)
}).strict();

export async function POST(request: Request) {
  try {
    const input = importSkillInputSchema.parse(await request.json());
    const parsed = tryParseCharacterSkillJson(input.content);

    if (parsed) {
      return NextResponse.json({ status: "converted", skill: parsed }, { status: 201 });
    }

    if (isPotentialCharacterSkillMarkdown(input.content)) {
      return NextResponse.json({ status: "needs-conversion", content: input.content }, { status: 202 });
    }

    return NextResponse.json({ error: "This SKILL.md does not look like a character skill" }, { status: 422 });
  } catch (error) {
    if (error instanceof z.ZodError || error instanceof SyntaxError) {
      return NextResponse.json({ error: "Invalid skill import input" }, { status: 400 });
    }

    return NextResponse.json({ error: "Skill import failed" }, { status: 500 });
  }
}
```

- [ ] **Step 7: Add creator form shell to Skills page**

Create `personaforge/src/components/skills/skill-creator-form.tsx`:

```tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function SkillCreatorForm() {
  const [name, setName] = useState("");
  const [advanced, setAdvanced] = useState(false);

  return (
    <form className="rounded-[8px] border border-app-line bg-app-card p-5">
      <h2 className="text-lg font-semibold text-app-strong">Create character skill</h2>
      <label className="mt-4 block text-sm font-medium text-app-strong" htmlFor="skill-name">
        Public figure name
      </label>
      <Input
        id="skill-name"
        value={name}
        onChange={(event) => setName(event.target.value)}
        placeholder="Ada Lovelace"
        className="mt-2"
      />
      <label className="mt-4 flex items-center gap-2 text-sm text-app-muted">
        <input type="checkbox" checked={advanced} onChange={(event) => setAdvanced(event.target.checked)} />
        Advanced research appendix
      </label>
      <Button type="button" className="mt-4" disabled={name.trim().length === 0}>
        Create draft
      </Button>
    </form>
  );
}
```

Import and render `<SkillCreatorForm />` above the built-in grid in `skills-page-content.tsx`.

- [ ] **Step 8: Run creator tests and skills page tests**

Run:

```bash
cd personaforge
pnpm vitest run src/server/creator/skill-creator.test.ts 'src/app/(workspace)/skills/page.test.tsx'
```

Expected: PASS.

- [ ] **Step 9: Commit creator APIs and UI**

Run from the git root:

```bash
git add personaforge/src/server/creator personaforge/src/app/api/skills personaforge/src/components/skills
git commit -m "feat: add character skill creator review flow"
```

## Task 11: Replace History And Settings With PersonaForge Records

**Files:**
- Create: `personaforge/src/lib/personaforge-history.ts`
- Modify: `personaforge/src/lib/history-file-writer.ts`
- Create: `personaforge/src/components/history/history-page-content.tsx`
- Modify: `personaforge/src/app/(workspace)/history/page.tsx`
- Create: `personaforge/src/components/settings/settings-page-content.tsx`
- Modify: `personaforge/src/app/(workspace)/settings/page.tsx`
- Test: `personaforge/src/app/(workspace)/history/page.test.tsx`
- Test: `personaforge/src/app/(workspace)/settings/page.test.tsx`

- [ ] **Step 1: Write failing history/settings tests**

Create `personaforge/src/app/(workspace)/history/page.test.tsx`:

```tsx
import "@testing-library/jest-dom/vitest";

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import HistoryPage from "@/app/(workspace)/history/page";
import { AppPreferencesProvider } from "@/lib/app-preferences";

describe("HistoryPage", () => {
  it("shows conversation and skill creation history categories", () => {
    render(
      <AppPreferencesProvider>
        <HistoryPage />
      </AppPreferencesProvider>
    );

    expect(screen.getByTestId("history-page-shell")).toBeInTheDocument();
    expect(screen.getByText("Conversations")).toBeInTheDocument();
    expect(screen.getByText("Skill creation")).toBeInTheDocument();
  });
});
```

Create `personaforge/src/app/(workspace)/settings/page.test.tsx`:

```tsx
import "@testing-library/jest-dom/vitest";

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import SettingsPage from "@/app/(workspace)/settings/page";
import { AppPreferencesProvider } from "@/lib/app-preferences";

describe("SettingsPage", () => {
  it("shows runtime and local data configuration sections", () => {
    render(
      <AppPreferencesProvider>
        <SettingsPage />
      </AppPreferencesProvider>
    );

    expect(screen.getByTestId("settings-page-shell")).toBeInTheDocument();
    expect(screen.getByText("Model provider")).toBeInTheDocument();
    expect(screen.getByText("Search provider")).toBeInTheDocument();
    expect(screen.getByText("Local data")).toBeInTheDocument();
    expect(screen.getByText("Creator defaults")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run:

```bash
cd personaforge
pnpm vitest run 'src/app/(workspace)/history/page.test.tsx' 'src/app/(workspace)/settings/page.test.tsx'
```

Expected: FAIL because pages still carry Dualens-specific history/settings content.

- [ ] **Step 3: Add history record types**

Create `personaforge/src/lib/personaforge-history.ts`:

```ts
import type { PersonaForgeSession } from "@/lib/characters/types";
import type { SkillReviewDraft } from "@/server/creator/skill-creator";

export type PersonaForgeHistoryRecord =
  | {
      type: "conversation";
      id: string;
      createdAt: string;
      session: PersonaForgeSession;
    }
  | {
      type: "skill-creation";
      id: string;
      createdAt: string;
      draft: SkillReviewDraft;
    };

export function buildConversationHistoryRecord(session: PersonaForgeSession): PersonaForgeHistoryRecord {
  return {
    type: "conversation",
    id: session.id,
    createdAt: session.createdAt,
    session
  };
}
```

- [ ] **Step 4: Add history page content**

Create `personaforge/src/components/history/history-page-content.tsx`:

```tsx
export function HistoryPageContent() {
  return (
    <main data-testid="history-page-shell" className="mx-auto w-full max-w-[1240px] space-y-6 px-6 py-8 lg:px-10">
      <div>
        <h1 className="text-2xl font-semibold text-app-strong">History</h1>
        <p className="mt-2 text-sm text-app-muted">Review conversations, dossiers, routing records, and skill creation drafts.</p>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-[8px] border border-app-line bg-app-card p-5">
          <h2 className="text-lg font-semibold text-app-strong">Conversations</h2>
          <p className="mt-2 text-sm text-app-muted">Conversation records will include turns, dossiers, and hidden routing rationale.</p>
        </section>
        <section className="rounded-[8px] border border-app-line bg-app-card p-5">
          <h2 className="text-lg font-semibold text-app-strong">Skill creation</h2>
          <p className="mt-2 text-sm text-app-muted">Skill records will include source lists, review state, and quality score.</p>
        </section>
      </div>
    </main>
  );
}
```

Replace `personaforge/src/app/(workspace)/history/page.tsx`:

```tsx
import { HistoryPageContent } from "@/components/history/history-page-content";

export default function HistoryPage() {
  return <HistoryPageContent />;
}
```

- [ ] **Step 5: Add settings page content**

Create `personaforge/src/components/settings/settings-page-content.tsx`:

```tsx
const sections = [
  {
    title: "Model provider",
    description: "Configure OpenAI-compatible base URL, API key, and model name."
  },
  {
    title: "Search provider",
    description: "Configure dossier search provider, endpoint, API key, and source depth."
  },
  {
    title: "Language and theme",
    description: "Switch Chinese/English copy and light/dark/system appearance."
  },
  {
    title: "Local data",
    description: "Manage conversation history, skill library storage, import, export, and backup."
  },
  {
    title: "Creator defaults",
    description: "Choose standard or advanced default generation and example dialogue behavior."
  }
];

export function SettingsPageContent() {
  return (
    <main data-testid="settings-page-shell" className="mx-auto w-full max-w-[1240px] space-y-6 px-6 py-8 lg:px-10">
      <div>
        <h1 className="text-2xl font-semibold text-app-strong">Settings</h1>
        <p className="mt-2 text-sm text-app-muted">Configure runtime, local data, and creator defaults.</p>
      </div>
      <div className="space-y-4">
        {sections.map((section) => (
          <section key={section.title} className="rounded-[8px] border border-app-line bg-app-card p-5">
            <h2 className="text-lg font-semibold text-app-strong">{section.title}</h2>
            <p className="mt-2 text-sm text-app-muted">{section.description}</p>
          </section>
        ))}
      </div>
    </main>
  );
}
```

Replace `personaforge/src/app/(workspace)/settings/page.tsx`:

```tsx
import { SettingsPageContent } from "@/components/settings/settings-page-content";

export default function SettingsPage() {
  return <SettingsPageContent />;
}
```

- [ ] **Step 6: Run tests to verify they pass**

Run:

```bash
cd personaforge
pnpm vitest run 'src/app/(workspace)/history/page.test.tsx' 'src/app/(workspace)/settings/page.test.tsx'
```

Expected: PASS.

- [ ] **Step 7: Commit history and settings**

Run from the git root:

```bash
git add personaforge/src/lib/personaforge-history.ts personaforge/src/components/history personaforge/src/components/settings personaforge/src/app/'(workspace)'/history personaforge/src/app/'(workspace)'/settings
git commit -m "feat: add PersonaForge history and settings pages"
```

## Task 12: Wire Provider-Backed Generation For Dialogue And Skill Creation

**Files:**
- Create: `personaforge/src/server/provider-config.ts`
- Create: `personaforge/src/server/conversation/generation.ts`
- Create: `personaforge/src/server/creator/profile-generator.ts`
- Create: `personaforge/src/server/creator/prompts.ts`
- Modify: `personaforge/src/server/conversation/runtime.ts`
- Modify: `personaforge/src/app/api/skills/create/route.ts`
- Test: `personaforge/src/server/provider-config.test.ts`
- Test: `personaforge/src/server/conversation/generation.test.ts`
- Test: `personaforge/src/server/creator/profile-generator.test.ts`

- [ ] **Step 1: Write failing provider and generation tests**

Create `personaforge/src/server/provider-config.test.ts`:

```ts
import { afterEach, describe, expect, it, vi } from "vitest";
import { resolveProviderConfigFromEnv } from "@/server/provider-config";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("resolveProviderConfigFromEnv", () => {
  it("reads OpenAI-compatible provider config from env", () => {
    vi.stubEnv("OPENAI_API_KEY", "test-key");
    vi.stubEnv("OPENAI_BASE_URL", "https://api.openai.com/v1");
    vi.stubEnv("OPENAI_MODEL", "gpt-4.1-mini");

    expect(resolveProviderConfigFromEnv()).toEqual({
      apiKey: "test-key",
      baseUrl: "https://api.openai.com/v1",
      model: "gpt-4.1-mini"
    });
  });

  it("throws when no API key is configured", () => {
    vi.stubEnv("OPENAI_API_KEY", "");
    vi.stubEnv("DEEPSEEK_API_KEY", "");

    expect(() => resolveProviderConfigFromEnv()).toThrow("Provider API key is required");
  });
});
```

Create `personaforge/src/server/conversation/generation.test.ts`:

```ts
import { describe, expect, it, vi } from "vitest";
import { createCharacterTurnGenerator } from "@/server/conversation/generation";
import { BUILTIN_SAGE_SKILLS } from "@/lib/characters/builtin-sages";

describe("createCharacterTurnGenerator", () => {
  it("uses the structured completion provider and preserves dossier references", async () => {
    const complete = vi.fn().mockResolvedValue({
      content: "案卷不足以判断市场规模，但可以先看组织能力。",
      referencedDossierIds: ["d1"]
    });
    const generator = createCharacterTurnGenerator({ complete });

    const result = await generator({
      prompt: "是否进入 AI 搜索市场？",
      skill: BUILTIN_SAGE_SKILLS[5],
      dossier: [
        {
          id: "d1",
          title: "Market report",
          url: "https://example.com/report",
          sourceName: "Example",
          summary: "Market is growing.",
          dataPoints: ["42% growth"]
        }
      ]
    });

    expect(complete).toHaveBeenCalledWith(expect.any(Array), "CharacterTurn");
    expect(result.referencedDossierIds).toEqual(["d1"]);
  });
});
```

Create `personaforge/src/server/creator/profile-generator.test.ts`:

```ts
import { describe, expect, it, vi } from "vitest";
import { createProfileGenerator } from "@/server/creator/profile-generator";

describe("createProfileGenerator", () => {
  it("validates the generated profile before returning it", async () => {
    const complete = vi.fn().mockResolvedValue({
      id: "ada-lovelace",
      displayName: { "zh-CN": "Ada Lovelace", en: "Ada Lovelace" },
      shortDescription: { "zh-CN": "计算想象力与形式推理", en: "Computational imagination and formal reasoning" },
      status: "custom",
      subjectKind: "deceased-public-figure",
      voiceMode: "immersive",
      tags: ["computing", "imagination"],
      triggerScenarios: ["creative technical work"],
      worldview: "Formal systems and imagination can cooperate.",
      coreTensions: ["poetry and precision"],
      mentalModels: ["symbolic abstraction"],
      decisionHeuristics: ["separate mechanical execution from conceptual design"],
      antiPatterns: ["mistaking calculation for imagination"],
      voiceRules: ["speak precisely"],
      boundaries: ["do not fabricate private claims"],
      sources: [{ title: "User source", url: "https://example.com", sourceType: "web", layer: "reliable-secondary", summary: "Biography" }],
      exampleDialogues: [{ user: "How should I think about creative code?", assistant: "Begin with the relation, not the machine." }],
      confidence: "medium"
    });

    const generator = createProfileGenerator({ complete });
    const skill = await generator({ name: "Ada Lovelace", depth: "standard", materials: ["https://example.com"] });

    expect(skill.id).toBe("ada-lovelace");
    expect(complete).toHaveBeenCalledWith(expect.any(Array), "CharacterSkill");
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run:

```bash
cd personaforge
pnpm vitest run src/server/provider-config.test.ts src/server/conversation/generation.test.ts src/server/creator/profile-generator.test.ts
```

Expected: FAIL because provider-backed generation files do not exist.

- [ ] **Step 3: Add provider config resolution**

Create `personaforge/src/server/provider-config.ts`:

```ts
import type { OpenAICompatibleProviderConfig } from "@/lib/types";

const API_KEY_ENV_KEYS = ["OPENAI_API_KEY", "DEEPSEEK_API_KEY", "OPENAI_COMPATIBLE_API_KEY", "API_KEY"] as const;
const BASE_URL_ENV_KEYS = ["OPENAI_BASE_URL", "DEEPSEEK_BASE_URL", "OPENAI_COMPATIBLE_BASE_URL", "BASE_URL"] as const;
const MODEL_ENV_KEYS = ["OPENAI_MODEL", "DEEPSEEK_MODEL", "OPENAI_COMPATIBLE_MODEL", "MODEL"] as const;

function firstEnv(keys: readonly string[]) {
  for (const key of keys) {
    const value = process.env[key]?.trim();
    if (value) {
      return value;
    }
  }

  return undefined;
}

export function resolveProviderConfigFromEnv(): OpenAICompatibleProviderConfig {
  const apiKey = firstEnv(API_KEY_ENV_KEYS);
  if (!apiKey) {
    throw new Error("Provider API key is required");
  }

  return {
    apiKey,
    baseUrl: firstEnv(BASE_URL_ENV_KEYS) ?? "https://api.deepseek.com",
    model: firstEnv(MODEL_ENV_KEYS) ?? "deepseek-chat"
  };
}
```

- [ ] **Step 4: Add character turn generator**

Create `personaforge/src/server/conversation/generation.ts`:

```ts
import type { CharacterSkill, DossierEvidence } from "@/lib/characters/types";
import type { StructuredCompletion } from "@/server/llm/provider";
import { buildCharacterTurnPrompt } from "@/server/conversation/prompts";

type CharacterTurnCompletion = {
  content: string;
  referencedDossierIds: string[];
};

export function createCharacterTurnGenerator(completion: StructuredCompletion<CharacterTurnCompletion>) {
  return async function generateCharacterTurn(input: {
    prompt: string;
    skill: CharacterSkill;
    dossier: DossierEvidence[];
  }) {
    return completion.complete(
      [
        {
          role: "user",
          content: buildCharacterTurnPrompt(input)
        }
      ],
      "CharacterTurn"
    );
  };
}
```

- [ ] **Step 5: Add creator prompt and profile generator**

Create `personaforge/src/server/creator/prompts.ts`:

```ts
import type { SkillCreatorDepth } from "@/server/creator/skill-creator";

export function buildProfileGenerationPrompt(input: {
  name: string;
  depth: SkillCreatorDepth;
  materials: string[];
}) {
  return [
    "Generate a PersonaForge CharacterSkill JSON object.",
    "Use only public or user-provided material. Mark low confidence when sources are thin.",
    "Living public figures must use subjectKind living-public-figure and voiceMode analysis-role.",
    "Historical or deceased public figures may use immersive voice.",
    "Required fields: id, displayName, shortDescription, status, subjectKind, voiceMode, tags, triggerScenarios, worldview, coreTensions, mentalModels, decisionHeuristics, antiPatterns, voiceRules, boundaries, sources, exampleDialogues, confidence.",
    input.depth === "advanced"
      ? "Also include advanced with timeline, situationLenses or lifeStages, externalViews, qualityScore, testCases, and sourceLayerDetails when supported."
      : "Do not include advanced unless the supplied material clearly supports it.",
    `Person name: ${input.name}`,
    "Materials:",
    input.materials.length ? input.materials.map((item) => `- ${item}`).join("\n") : "- User supplied no additional material"
  ].join("\n");
}
```

Create `personaforge/src/server/creator/profile-generator.ts`:

```ts
import { characterSkillSchema } from "@/lib/characters/schema";
import type { CharacterSkill } from "@/lib/characters/types";
import type { StructuredCompletion } from "@/server/llm/provider";
import type { SkillCreatorDepth } from "@/server/creator/skill-creator";
import { buildProfileGenerationPrompt } from "@/server/creator/prompts";

export function createProfileGenerator(completion: StructuredCompletion<unknown>) {
  return async function generateProfile(input: {
    name: string;
    depth: SkillCreatorDepth;
    materials: string[];
  }): Promise<CharacterSkill> {
    const generated = await completion.complete(
      [
        {
          role: "user",
          content: buildProfileGenerationPrompt(input)
        }
      ],
      "CharacterSkill"
    );

    return characterSkillSchema.parse(generated);
  };
}
```

- [ ] **Step 6: Wire exported runtime to the provider-backed turn generator**

In `personaforge/src/server/conversation/runtime.ts`, replace the exported `runtime` construction with:

```ts
import { createOpenAICompatibleProvider } from "@/server/llm/openai-compatible-provider";
import { resolveProviderConfigFromEnv } from "@/server/provider-config";
import { createCharacterTurnGenerator } from "@/server/conversation/generation";
```

```ts
const store = createConversationSessionStore();

function createDefaultTurnGenerator() {
  const providerConfig = resolveProviderConfigFromEnv();
  return createCharacterTurnGenerator(
    createOpenAICompatibleProvider<CharacterTurnGeneration>(providerConfig)
  );
}

export const runtime = createConversationRuntime({
  store,
  skills: BUILTIN_SAGE_SKILLS,
  preferences: DEFAULT_CHARACTER_PREFERENCES,
  generateCharacterTurn: async (input) => createDefaultTurnGenerator()(input),
  buildDossier: async () => []
});
```

Keep the injectable `createConversationRuntime` tests unchanged so tests do not require a real API key.

- [ ] **Step 7: Wire skill creation API to provider-backed profile generation**

In `personaforge/src/app/api/skills/create/route.ts`, replace the inline low-confidence generator with:

```ts
import { createOpenAICompatibleProvider } from "@/server/llm/openai-compatible-provider";
import { resolveProviderConfigFromEnv } from "@/server/provider-config";
import { createProfileGenerator } from "@/server/creator/profile-generator";
```

```ts
function createDefaultSkillCreator() {
  const providerConfig = resolveProviderConfigFromEnv();
  return createSkillCreator({
    generateProfile: createProfileGenerator(createOpenAICompatibleProvider<unknown>(providerConfig))
  });
}
```

Inside `POST`, call:

```ts
const draft = await createDefaultSkillCreator().createReviewDraft(input);
```

When `resolveProviderConfigFromEnv()` throws, return status `500` with `{ error: "Provider API key is required" }` so the UI can point users to Settings.

- [ ] **Step 8: Run generation tests**

Run:

```bash
cd personaforge
pnpm vitest run src/server/provider-config.test.ts src/server/conversation/generation.test.ts src/server/creator/profile-generator.test.ts src/server/conversation/runtime.test.ts
```

Expected: PASS.

- [ ] **Step 9: Commit provider-backed generation**

Run from the git root:

```bash
git add personaforge/src/server personaforge/src/app/api/skills/create/route.ts
git commit -m "feat: wire PersonaForge provider-backed generation"
```

## Task 13: Final Cleanup, E2E Smoke Test, And Build Verification

**Files:**
- Modify: `personaforge/src/app/layout.tsx`
- Modify: `personaforge/src/app/globals.css`
- Modify: `personaforge/src/locales/zh-CN.ts`
- Modify: `personaforge/src/locales/en-US.ts`
- Create: `personaforge/tests/e2e/personaforge-flow.spec.ts`
- Modify: `personaforge/README.md`

- [ ] **Step 1: Write Playwright smoke test**

Create `personaforge/tests/e2e/personaforge-flow.spec.ts`:

```ts
import { expect, test } from "@playwright/test";

test("PersonaForge primary routes render", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText(/PersonaForge|众思阁/)).toBeVisible();

  await page.goto("/app");
  await expect(page.getByTestId("dialogue-page-shell")).toBeVisible();

  await page.goto("/skills");
  await expect(page.getByTestId("skills-page-shell")).toBeVisible();
  await expect(page.getByText("Confucius")).toBeVisible();

  await page.goto("/history");
  await expect(page.getByTestId("history-page-shell")).toBeVisible();

  await page.goto("/settings");
  await expect(page.getByTestId("settings-page-shell")).toBeVisible();
});
```

- [ ] **Step 2: Replace metadata**

In `personaforge/src/app/layout.tsx`, set metadata to:

```ts
export const metadata: Metadata = {
  title: "PersonaForge / 众思阁",
  description: "A local-first character skill dialogue platform."
};
```

- [ ] **Step 3: Remove Dualens-specific product copy from visible routes**

Run:

```bash
cd personaforge
rg "Dualens|两仪决|乾明|坤察|辩论历史|太极|dualens" src README.md
```

Expected: output only appears in compatibility comments, old test names being actively replaced, or migration notes. Remove any visible product copy found in pages, nav, metadata, and README.

- [ ] **Step 4: Run unit tests**

Run:

```bash
cd personaforge
pnpm test
```

Expected: PASS.

- [ ] **Step 5: Run build**

Run:

```bash
cd personaforge
pnpm build
```

Expected: PASS with Next.js production build completed.

- [ ] **Step 6: Run e2e smoke test**

Run:

```bash
cd personaforge
pnpm test:e2e
```

Expected: PASS for `personaforge-flow.spec.ts`.

- [ ] **Step 7: Commit final cleanup**

Run from the git root:

```bash
git add personaforge
git commit -m "chore: verify PersonaForge MVP scaffold"
```

## Self-Review Checklist

- Spec coverage:
  - Standalone `personaforge` app: Task 1.
  - Product intro plus workspace routes: Task 2 and Task 12.
  - One-input dialogue workspace: Task 7.
  - Four invisible modes and router debug record: Task 5 and Task 6.
  - Built-in SageTalk eight-sage pack: Task 3.
  - Skills page preferences and custom library foundation: Task 4 and Task 9.
  - Skill creator, import, review gate: Task 10.
  - Dossier mode with collapsible sources: Task 8.
  - History and settings: Task 11.
  - Brand, visual direction, and i18n cleanup: Task 2 and Task 12.
- Provider-backed dialogue and skill creation generation are covered by Task 12. Full visual refinement and account/cloud sync remain outside MVP.
- Every task has a test-first step, implementation step, verification command, and commit command.
