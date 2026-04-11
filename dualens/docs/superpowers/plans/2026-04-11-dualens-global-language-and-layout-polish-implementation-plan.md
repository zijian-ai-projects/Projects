# Dualens Global Language And Layout Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Polish the Dualens workspace with global Settings-controlled language, tighter debate-entry UI, quieter selection lists, and an integrated rotating sidebar brand.

**Architecture:** Add a lightweight client-side app preferences provider in the workspace shell, plus a focused workspace copy map for page/sidebar text. Keep session language immutable by passing the preference into `SessionInput.language` at submit time and preserving that value in history snapshots.

**Tech Stack:** Next.js App Router, React client components, TypeScript, Tailwind CSS, Vitest, Testing Library.

---

## File Structure

- Create: `src/lib/app-preferences.tsx` for `AppPreferencesProvider`, `useAppPreferences`, storage helpers, and validation.
- Create: `src/lib/workspace-copy.ts` for sidebar/page/settings/provider/search-engine copy keyed by `UiLanguage`.
- Modify: `src/components/layout/app-shell.tsx` to wrap workspace UI with `AppPreferencesProvider`.
- Modify: `src/components/layout/app-sidebar.tsx` to read global language, render integrated brand copy, and apply rotating taiji class.
- Modify: `src/app/globals.css` to add the slow counterclockwise taiji animation.
- Modify: `src/app/(workspace)/settings/page.tsx` to add the global language control above the history-folder card.
- Modify: `src/app/(workspace)/debate/page.tsx` to remove local language state and use global preferences.
- Modify: `src/components/question-form.tsx` to tighten role cards and action section.
- Modify: `src/components/common/selection-card-item.tsx` to remove list status text/tags.
- Modify: `src/app/(workspace)/history/page.tsx`, `src/app/(workspace)/providers/page.tsx`, `src/app/(workspace)/search-engines/page.tsx` to use workspace copy where visible text is part of page chrome and forms.
- Test: update existing page/component tests and add `src/lib/app-preferences.test.tsx`.

---

### Task 1: Global App Preferences

**Files:**
- Create: `src/lib/app-preferences.tsx`
- Test: `src/lib/app-preferences.test.tsx`
- Modify: `src/components/layout/app-shell.tsx`

- [ ] **Step 1: Write the failing provider test**

Add tests that render a consumer inside `AppPreferencesProvider`, verify default Chinese, verify clicking a setter changes to English, verify the value is stored under `dualens:app-language`, and verify invalid stored values fall back to Chinese.

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/lib/app-preferences.test.tsx`

Expected: FAIL because `src/lib/app-preferences.tsx` does not exist.

- [ ] **Step 3: Implement minimal provider**

Implement:

```tsx
"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode
} from "react";
import type { UiLanguage } from "@/lib/types";

export const APP_LANGUAGE_STORAGE_KEY = "dualens:app-language";
const DEFAULT_LANGUAGE: UiLanguage = "zh-CN";

export function isUiLanguage(value: unknown): value is UiLanguage {
  return value === "zh-CN" || value === "en";
}

export function readStoredLanguage(storage: Pick<Storage, "getItem">): UiLanguage {
  try {
    const stored = storage.getItem(APP_LANGUAGE_STORAGE_KEY);
    return isUiLanguage(stored) ? stored : DEFAULT_LANGUAGE;
  } catch {
    return DEFAULT_LANGUAGE;
  }
}

export function writeStoredLanguage(storage: Pick<Storage, "setItem">, language: UiLanguage) {
  try {
    storage.setItem(APP_LANGUAGE_STORAGE_KEY, language);
  } catch {
    return;
  }
}

type AppPreferencesValue = {
  language: UiLanguage;
  setLanguage(language: UiLanguage): void;
};

const AppPreferencesContext = createContext<AppPreferencesValue | null>(null);

export function AppPreferencesProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<UiLanguage>(DEFAULT_LANGUAGE);

  useEffect(() => {
    setLanguageState(readStoredLanguage(window.localStorage));
  }, []);

  const value = useMemo<AppPreferencesValue>(
    () => ({
      language,
      setLanguage(nextLanguage) {
        setLanguageState(nextLanguage);
        writeStoredLanguage(window.localStorage, nextLanguage);
      }
    }),
    [language]
  );

  return (
    <AppPreferencesContext.Provider value={value}>
      {children}
    </AppPreferencesContext.Provider>
  );
}

export function useAppPreferences() {
  const value = useContext(AppPreferencesContext);

  if (!value) {
    throw new Error("useAppPreferences must be used within AppPreferencesProvider");
  }

  return value;
}
```

Wrap `AppShell` content with `AppPreferencesProvider`.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run src/lib/app-preferences.test.tsx`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/app-preferences.tsx src/lib/app-preferences.test.tsx src/components/layout/app-shell.tsx
git commit -m "feat: add global app preferences"
```

---

### Task 2: Settings Language Control

**Files:**
- Modify: `src/app/(workspace)/settings/page.tsx`
- Modify: `src/app/(workspace)/settings/page.test.tsx`
- Create: `src/lib/workspace-copy.ts`

- [ ] **Step 1: Write failing Settings tests**

Update the settings test to assert that:

- The page renders a `语言设置` section.
- It has `中文` and `English` buttons.
- Clicking `English` updates page chrome to English, including `General settings`.
- The history-folder card still renders after language changes.

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run 'src/app/(workspace)/settings/page.test.tsx'`

Expected: FAIL because Settings does not expose language controls.

- [ ] **Step 3: Add workspace copy and Settings language controls**

Create `workspace-copy.ts` with `getWorkspaceCopy(language)` and Chinese/English strings for page headers, nav labels, settings language controls, and history-folder copy. Use `useAppPreferences()` in Settings, render a small segmented language control inside the main settings card area, and keep the history-folder card as the other core setting.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run 'src/app/(workspace)/settings/page.test.tsx'`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/app/\(workspace\)/settings/page.tsx src/app/\(workspace\)/settings/page.test.tsx src/lib/workspace-copy.ts
git commit -m "feat: move language control to settings"
```

---

### Task 3: Global Language Wiring Across Workspace

**Files:**
- Modify: `src/app/(workspace)/debate/page.tsx`
- Modify: `src/app/(workspace)/history/page.tsx`
- Modify: `src/app/(workspace)/providers/page.tsx`
- Modify: `src/app/(workspace)/search-engines/page.tsx`
- Modify: `src/components/layout/app-sidebar.tsx`
- Modify: `src/components/layout/app-sidebar.test.tsx`
- Modify: `src/app/(workspace)/debate/page.test.tsx`
- Modify: provider/search/history page tests as needed.

- [ ] **Step 1: Write failing wiring tests**

Update tests to assert:

- Debate page does not render the local `界面语言` toggle.
- Sidebar renders `一个问题，正反两面，证据可见` by default.
- When stored language is English, sidebar/page header text uses English.
- Provider/search/history pages use the workspace copy for page headers.

- [ ] **Step 2: Run tests to verify they fail**

Run:

```bash
pnpm vitest run src/components/layout/app-sidebar.test.tsx 'src/app/(workspace)/debate/page.test.tsx' 'src/app/(workspace)/history/page.test.tsx' 'src/app/(workspace)/providers/page.test.tsx' 'src/app/(workspace)/search-engines/page.test.tsx'
```

Expected: FAIL because pages still hard-code Chinese and Debate owns local language state.

- [ ] **Step 3: Wire language**

Use `useAppPreferences()` in the workspace pages and sidebar. Replace visible page-chrome strings with `getWorkspaceCopy(language)`. Remove the local language state and header language buttons from Debate. Pass `language` into `SessionShell`.

- [ ] **Step 4: Run tests to verify they pass**

Run the same focused command.

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/app/\(workspace\)/debate/page.tsx src/app/\(workspace\)/history/page.tsx src/app/\(workspace\)/providers/page.tsx src/app/\(workspace\)/search-engines/page.tsx src/components/layout/app-sidebar.tsx src/components/layout/app-sidebar.test.tsx src/app/\(workspace\)/debate/page.test.tsx src/app/\(workspace\)/history/page.test.tsx src/app/\(workspace\)/providers/page.test.tsx src/app/\(workspace\)/search-engines/page.test.tsx
git commit -m "feat: apply global language across workspace"
```

---

### Task 4: Sidebar Brand Integration

**Files:**
- Modify: `src/components/layout/app-sidebar.tsx`
- Modify: `src/app/globals.css`
- Modify: `src/components/layout/app-sidebar.test.tsx`

- [ ] **Step 1: Write failing brand tests**

Assert the taiji SVG wrapper has a class containing `animate-taiji-counterclockwise`, the sidebar has no obvious bordered brand-card class on the brand link, and the Chinese brand line equals `一个问题，正反两面，证据可见`.

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/components/layout/app-sidebar.test.tsx`

Expected: FAIL because the animation class and new copy are missing.

- [ ] **Step 3: Implement brand polish**

Remove the brand card border/background classes from the top link, use softer padding only, add `animate-taiji-counterclockwise` to the SVG class, and define:

```css
@keyframes taiji-counterclockwise {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(-360deg);
  }
}

.animate-taiji-counterclockwise {
  animation: taiji-counterclockwise 28s linear infinite;
  transform-origin: center;
}
```

Keep the existing reduced-motion media query disabling animation duration.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run src/components/layout/app-sidebar.test.tsx`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/layout/app-sidebar.tsx src/app/globals.css src/components/layout/app-sidebar.test.tsx
git commit -m "feat: integrate rotating sidebar brand"
```

---

### Task 5: Selection List Simplification

**Files:**
- Modify: `src/components/common/selection-card-item.tsx`
- Modify: `src/app/(workspace)/providers/page.test.tsx`
- Modify: `src/app/(workspace)/search-engines/page.test.tsx`

- [ ] **Step 1: Write failing selection-card tests**

Update provider and search-engine tests to assert the left radiogroups do not render `已配置`, `未配置`, `已接入`, or `未接入` inside list cards, while the right configuration panel still shows its status tag.

- [ ] **Step 2: Run tests to verify they fail**

Run:

```bash
pnpm vitest run 'src/app/(workspace)/providers/page.test.tsx' 'src/app/(workspace)/search-engines/page.test.tsx'
```

Expected: FAIL because the list card currently renders status text and a status tag.

- [ ] **Step 3: Remove list status UI**

Remove the `StatusTag` import and status rendering from `SelectionCardItem`. Keep `configured` accepted if tests or callers still pass it, but only use `name`, `icon`, and the radio circle visually. Update `aria-labelledby` to reference only the name.

- [ ] **Step 4: Run tests to verify they pass**

Run the same focused command.

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/common/selection-card-item.tsx src/app/\(workspace\)/providers/page.test.tsx src/app/\(workspace\)/search-engines/page.test.tsx
git commit -m "feat: simplify provider selection lists"
```

---

### Task 6: Debate Role Cards And Action Bar

**Files:**
- Modify: `src/components/question-form.tsx`
- Modify: `src/components/question-form.test.tsx`
- Modify: `src/app/(workspace)/debate/page.test.tsx`

- [ ] **Step 1: Write failing debate-layout tests**

Update tests to assert:

- `风格：谨慎` and `风格：激进` are absent.
- `谨慎` and `激进` are present as compact labels.
- The explanatory action sentence is absent.
- The action section still shows `当前模型`, `当前搜索引擎`, and `开始辩论`.
- Clicking the `换` button changes its accessible pressed/active styling state briefly or toggles an inspectable active class.

- [ ] **Step 2: Run tests to verify they fail**

Run:

```bash
pnpm vitest run src/components/question-form.test.tsx 'src/app/(workspace)/debate/page.test.tsx'
```

Expected: FAIL because the old style labels/action sentence still render and swap feedback is missing.

- [ ] **Step 3: Implement layout and feedback**

Refactor the role-card markup to a compact internal grid:

- identity text on the left.
- order button near the identity header.
- style pill on the right with only the temperament label.
- center swap button in a fixed-width column.

Add local `isSwapActive` state that flips to `true` on click and resets with a short timeout. Use it to invert the swap button background/text colors. Clean up the timeout in an effect cleanup or by clearing an existing timeout before setting a new one.

Refactor action section to a compact flex/grid row with model/search cards on the left and submit button on the right. Remove the explanatory paragraph.

- [ ] **Step 4: Run tests to verify they pass**

Run the same focused command.

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/question-form.tsx src/components/question-form.test.tsx src/app/\(workspace\)/debate/page.test.tsx
git commit -m "feat: tighten debate entry layout"
```

---

### Task 7: Final Regression

**Files:** no intended production changes.

- [ ] **Step 1: Run focused regression**

Run:

```bash
pnpm vitest run src/lib/app-preferences.test.tsx src/components/layout/app-sidebar.test.tsx 'src/app/(workspace)/settings/page.test.tsx' 'src/app/(workspace)/debate/page.test.tsx' src/components/question-form.test.tsx 'src/app/(workspace)/providers/page.test.tsx' 'src/app/(workspace)/search-engines/page.test.tsx' 'src/app/(workspace)/history/page.test.tsx' src/components/session-shell.test.tsx src/components/evidence-panel.test.tsx src/components/debate-timeline.test.tsx src/components/summary-panel.test.tsx
```

Expected: PASS.

- [ ] **Step 2: Run full test suite**

Run: `pnpm test`

Expected: PASS.

- [ ] **Step 3: Run production build**

Run: `pnpm build`

Expected: PASS.

- [ ] **Step 4: Check git status**

Run: `git status --short`

Expected: clean.
