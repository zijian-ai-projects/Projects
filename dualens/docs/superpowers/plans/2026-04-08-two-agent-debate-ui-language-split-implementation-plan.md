# Two Agent Debate UI Language Split Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Separate frontend UI localization from debate-output language so the app can switch all visible product copy between Chinese and English while keeping debate language as an independent session setting.

**Architecture:** Keep the current runtime and orchestration flow. Add a lightweight frontend-owned `uiLanguage` state and small translation dictionary for product chrome, while renaming the session language field in the product to `debateLanguage` and defaulting it to follow the current UI language unless the user overrides it in Advanced Settings.

**Tech Stack:** Next.js, React, TypeScript, Vitest, React Testing Library, Playwright

---

## Planned File Structure

### Shared UI copy and types

- Create: `src/lib/ui-copy.ts` - small bilingual dictionary and helpers for UI-facing text
- Modify: `src/lib/types.ts` - separate `UiLanguage` and `DebateLanguage` naming if needed without breaking existing runtime types

### Form and shell files

- Modify: `src/components/question-form.tsx` - add header-level UI language switch, rename `Language` to `Debate language`, and implement default-follow behavior
- Modify: `src/components/advanced-settings.tsx` - accept UI copy and expose `Debate language` copy instead of generic `Language`
- Modify: `src/components/session-shell.tsx` - own the `uiLanguage` state or receive it from page and thread translated labels through the visible workspace
- Modify: `src/app/page.tsx` - set browser page title and top-level app wiring for UI language

### Display components

- Modify: `src/components/debate-timeline.tsx` - localize section titles and empty/progress states
- Modify: `src/components/evidence-panel.tsx` - localize section titles and research-preview labels
- Modify: `src/components/summary-panel.tsx` - localize section titles and structured summary labels

### Tests

- Modify: `src/components/question-form.test.tsx` - cover UI language switch, debate-language default-follow, and manual override behavior
- Modify: `src/components/session-shell.test.tsx` - cover localized panel copy and session flow under both UI languages
- Modify: `src/app/page.test.ts` - cover page-title and top-level wiring for UI language
- Modify: `tests/e2e/session-flow.spec.ts` - cover header language switch and visible Chinese/English product copy

## Task 1: Introduce UI Copy Dictionary And Language Model

**Files:**
- Create: `src/lib/ui-copy.ts`
- Modify: `src/lib/types.ts`
- Modify: `src/components/question-form.test.tsx`
- Test: `src/components/question-form.test.tsx`

- [ ] **Step 1: Write the failing tests for visible language labels**

```ts
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QuestionForm } from "@/components/question-form";

describe("QuestionForm ui language", () => {
  it("renders English copy by default and switches visible labels to Chinese", async () => {
    const user = userEvent.setup();
    render(<QuestionForm onSubmit={vi.fn()} />);

    expect(screen.getByText("Two Agent Debate")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "中文" }));

    expect(screen.getByText("双 Agent 辩论")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "开始辩论" })).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm vitest run src/components/question-form.test.tsx`
Expected: FAIL because no UI language toggle or localized copy exists yet.

- [ ] **Step 3: Add a minimal UI copy dictionary and language types**

```ts
// src/lib/ui-copy.ts
export type UiLanguage = "en" | "zh";

export const UI_COPY = {
  en: {
    appTitle: "Two Agent Debate",
    startDebate: "Start debate",
    decisionQuestion: "Decision question",
    advancedSettings: "Advanced settings",
    debateLanguage: "Debate language"
  },
  zh: {
    appTitle: "双 Agent 辩论",
    startDebate: "开始辩论",
    decisionQuestion: "决策问题",
    advancedSettings: "高级设置",
    debateLanguage: "辩论语言"
  }
} as const;

export function getUiCopy(language: UiLanguage) {
  return UI_COPY[language];
}
```

```ts
// src/lib/types.ts
export type DebateLanguage = "en" | "zh-CN";
```

- [ ] **Step 4: Run the targeted test**

Run: `pnpm vitest run src/components/question-form.test.tsx`
Expected: PASS or fail only on the remaining unimplemented wiring, with the new copy/types available.

- [ ] **Step 5: Commit**

```bash
git add src/lib/ui-copy.ts src/lib/types.ts src/components/question-form.test.tsx
git commit -m "feat: add ui language copy model"
```

## Task 2: Add Header UI Language Switch And Debate-Language Follow Behavior

**Files:**
- Modify: `src/components/question-form.tsx`
- Modify: `src/components/advanced-settings.tsx`
- Modify: `src/components/question-form.test.tsx`
- Test: `src/components/question-form.test.tsx`

- [ ] **Step 1: Write the failing behavior tests**

```ts
it("defaults debate language to the selected ui language", async () => {
  const user = userEvent.setup();
  const onSubmit = vi.fn().mockResolvedValue(undefined);

  render(<QuestionForm onSubmit={onSubmit} />);

  await user.click(screen.getByRole("button", { name: "中文" }));
  await user.click(screen.getByText("高级设置"));
  expect(screen.getByLabelText("辩论语言")).toHaveValue("zh-CN");
});

it("keeps a manually overridden debate language when ui language changes later", async () => {
  const user = userEvent.setup();
  render(<QuestionForm onSubmit={vi.fn()} />);

  await user.click(screen.getByText("Advanced settings"));
  await user.selectOptions(screen.getByLabelText("Debate language"), "zh-CN");
  await user.click(screen.getByRole("button", { name: "中文" }));

  expect(screen.getByLabelText("辩论语言")).toHaveValue("zh-CN");
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm vitest run src/components/question-form.test.tsx`
Expected: FAIL because the form does not yet track a separate UI language or follow/override rules.

- [ ] **Step 3: Implement the language split in the form and advanced settings**

```ts
// src/components/question-form.tsx
const [uiLanguage, setUiLanguage] = useState<UiLanguage>("en");
const [debateLanguage, setDebateLanguage] = useState<DebateLanguage>("en");
const [isDebateLanguageDirty, setIsDebateLanguageDirty] = useState(false);

function handleUiLanguageChange(next: UiLanguage) {
  setUiLanguage(next);
  if (!isDebateLanguageDirty) {
    setDebateLanguage(next === "zh" ? "zh-CN" : "en");
  }
}

function handleDebateLanguageChange(next: DebateLanguage) {
  setIsDebateLanguageDirty(true);
  setDebateLanguage(next);
}
```

```tsx
// render shape
<div role="group" aria-label="UI language">
  <Button type="button" onClick={() => handleUiLanguageChange("zh")}>中文</Button>
  <Button type="button" onClick={() => handleUiLanguageChange("en")}>English</Button>
</div>
<AdvancedSettings
  uiLanguage={uiLanguage}
  debateLanguage={debateLanguage}
  onDebateLanguageChange={handleDebateLanguageChange}
/>
```

- [ ] **Step 4: Run the targeted tests**

Run: `pnpm vitest run src/components/question-form.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/question-form.tsx src/components/advanced-settings.tsx src/components/question-form.test.tsx
git commit -m "feat: split ui language from debate language"
```

## Task 3: Localize Visible Product Chrome And Panel Copy

**Files:**
- Modify: `src/components/session-shell.tsx`
- Modify: `src/components/debate-timeline.tsx`
- Modify: `src/components/evidence-panel.tsx`
- Modify: `src/components/summary-panel.tsx`
- Modify: `src/app/page.tsx`
- Modify: `src/components/session-shell.test.tsx`
- Modify: `src/app/page.test.ts`
- Test: `src/components/session-shell.test.tsx`
- Test: `src/app/page.test.ts`

- [ ] **Step 1: Write the failing UI-localization tests**

```ts
it("renders workspace section titles in Chinese when the ui language is zh", () => {
  render(<SessionShell initialUiLanguage="zh" />);

  expect(screen.getByText("辩论过程")).toBeInTheDocument();
  expect(screen.getByText("证据")).toBeInTheDocument();
  expect(screen.getByText("总结")).toBeInTheDocument();
});
```

```ts
it("sets the page title from the selected ui language", () => {
  render(<Home />);
  expect(document.title).toContain("Two Agent Debate");
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `pnpm vitest run src/components/session-shell.test.tsx src/app/page.test.ts`
Expected: FAIL because section labels and page metadata are not UI-language aware yet.

- [ ] **Step 3: Implement localized product chrome**

```ts
// session-shell/page wiring shape
const copy = getUiCopy(uiLanguage);
useEffect(() => {
  document.title = copy.appTitle;
}, [copy.appTitle]);
```

```tsx
// component props shape
<DebateTimeline title={copy.debateSectionTitle} ... />
<EvidencePanel title={copy.evidenceSectionTitle} ... />
<SummaryPanel title={copy.summarySectionTitle} ... />
```

- [ ] **Step 4: Run the targeted tests**

Run: `pnpm vitest run src/components/session-shell.test.tsx src/app/page.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/session-shell.tsx src/components/debate-timeline.tsx src/components/evidence-panel.tsx src/components/summary-panel.tsx src/app/page.tsx src/components/session-shell.test.tsx src/app/page.test.ts
git commit -m "feat: localize visible product chrome"
```

## Task 4: Verify Session Submission And Browser Flow Under Both Languages

**Files:**
- Modify: `src/components/question-form.test.tsx`
- Modify: `tests/e2e/session-flow.spec.ts`
- Test: `src/components/question-form.test.tsx`
- Test: `tests/e2e/session-flow.spec.ts`

- [ ] **Step 1: Write the failing submission/e2e coverage**

```ts
it("submits debateLanguage while uiLanguage stays frontend-only", async () => {
  const user = userEvent.setup();
  const onSubmit = vi.fn().mockResolvedValue(undefined);
  render(<QuestionForm onSubmit={onSubmit} />);

  await user.click(screen.getByRole("button", { name: "中文" }));
  await user.click(screen.getByText("高级设置"));
  await user.type(screen.getByLabelText("API key"), "secret");
  await user.type(screen.getByLabelText("决策问题"), "我要不要换城市工作？");
  await user.click(screen.getByRole("button", { name: "开始辩论" }));

  expect(onSubmit).toHaveBeenCalledWith(
    expect.objectContaining({
      language: "zh-CN"
    })
  );
});
```

```ts
test("user can switch the interface language before starting a debate", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "中文" }).click();
  await expect(page.getByText("双 Agent 辩论")).toBeVisible();
  await expect(page.getByRole("button", { name: "开始辩论" })).toBeVisible();
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `pnpm vitest run src/components/question-form.test.tsx`
Expected: FAIL until the final submission payload and labels fully match the split model.

Run: `pnpm playwright test tests/e2e/session-flow.spec.ts`
Expected: FAIL until the browser flow shows the language switch and localized copy.

- [ ] **Step 3: Finalize payload and browser behavior**

```ts
// submission shape
await onSubmit({
  question,
  presetId,
  language: debateLanguage,
  config,
  customRoles
});
```

```ts
// e2e assertions
await expect(page).toHaveTitle(/双 Agent 辩论|Two Agent Debate/);
```

- [ ] **Step 4: Run final verification**

Run: `pnpm vitest run src/components/question-form.test.tsx src/components/session-shell.test.tsx src/app/page.test.ts`
Expected: PASS

Run: `pnpm playwright test tests/e2e/session-flow.spec.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/question-form.test.tsx tests/e2e/session-flow.spec.ts
git commit -m "test: cover ui language split flow"
```

## Self-Review

- Spec coverage: This plan covers the new header-level UI language switch, renaming session language to debate language in product copy, default-follow behavior, localized product chrome, and browser/title coverage.
- Placeholder scan: No `TODO`, `TBD`, or unresolved implementation placeholders are left in task descriptions.
- Type consistency: The plan uses `UiLanguage` for frontend copy and `DebateLanguage` for generated output, while keeping the submitted session payload on the debate-language field only.

