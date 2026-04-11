# Dualens Session History and Provider Links Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Preserve active debate state across workspace navigation, surface history-save status, and add official provider/search API links.

**Architecture:** A workspace-scoped React provider owns volatile debate state under `AppShell`, while `SessionShell` still falls back to local state in isolated tests. History persistence continues through `persistSessionHistory()`, and configuration pages render official links from option metadata.

**Tech Stack:** Next.js App Router, React context/hooks, Vitest, Testing Library, localStorage, File System Access API adapter.

---

### Task 1: Workspace Debate State

**Files:**
- Create: `dualens/src/lib/debate-workspace-state.tsx`
- Modify: `dualens/src/components/layout/app-shell.tsx`
- Modify: `dualens/src/components/session-shell.tsx`
- Test: `dualens/src/components/session-shell.test.tsx`

- [ ] **Step 1: Write the failing test**

Add a test that mounts `SessionShell` inside a workspace provider, starts a debate, unmounts the page body, remounts it, and expects the active session and question to remain visible.

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
pnpm vitest run src/components/session-shell.test.tsx -t "preserves an active debate session"
```

Expected: fail because no workspace provider exists and only the question draft is preserved today.

- [ ] **Step 3: Implement workspace state**

Create `DebateWorkspaceStateProvider` with state for:

```ts
question: string;
session: SessionView | null;
historyMeta: (HistoryRecordMeta & { sessionId: string }) | null;
errorKind: "start" | "advance" | "stop" | null;
errorDetail: string | null;
isStopping: boolean;
historySaveStatus: "idle" | "written" | "skipped" | "error";
```

Mount it in `AppShell` and update `SessionShell` to use it when present.

- [ ] **Step 4: Run test to verify it passes**

Run:

```bash
pnpm vitest run src/components/session-shell.test.tsx -t "preserves an active debate session"
```

Expected: pass.

### Task 2: History Save Status UI

**Files:**
- Modify: `dualens/src/lib/ui-copy.ts`
- Modify: `dualens/src/components/session-shell.tsx`
- Test: `dualens/src/components/session-shell.test.tsx`

- [ ] **Step 1: Write failing tests**

Add tests for:

- completed debate plus `{ status: "skipped" }` shows a choose-folder reminder.
- completed debate plus `{ status: "written" }` does not show that reminder.

- [ ] **Step 2: Run tests to verify they fail**

Run:

```bash
pnpm vitest run src/components/session-shell.test.tsx -t "history"
```

Expected: fail because the persistence status is not rendered.

- [ ] **Step 3: Implement minimal UI**

Capture the result from `persistSessionHistory()` in the existing persistence queue. Render an alert-style notice after session completion:

- `skipped`: ask the user to choose a history folder.
- `error`: tell the user the local history write failed.

- [ ] **Step 4: Run tests to verify they pass**

Run:

```bash
pnpm vitest run src/components/session-shell.test.tsx -t "history"
```

Expected: pass.

### Task 3: Official Links on Configuration Pages

**Files:**
- Modify: `dualens/src/lib/model-provider-preferences.ts`
- Modify: `dualens/src/lib/search-engine-options.ts`
- Modify: `dualens/src/lib/workspace-copy.ts`
- Modify: `dualens/src/app/(workspace)/providers/page.tsx`
- Modify: `dualens/src/app/(workspace)/search-engines/page.tsx`
- Test: `dualens/src/app/(workspace)/providers/page.test.tsx`
- Test: `dualens/src/app/(workspace)/search-engines/page.test.tsx`

- [ ] **Step 1: Write failing tests**

Assert the selected provider and selected search engine panels expose `Get API`/`获取 API` and `View tutorial`/`查看教程` links with the expected official URLs.

- [ ] **Step 2: Run tests to verify they fail**

Run:

```bash
pnpm vitest run 'src/app/(workspace)/providers/page.test.tsx' 'src/app/(workspace)/search-engines/page.test.tsx'
```

Expected: fail because the links are not rendered.

- [ ] **Step 3: Implement links**

Add `apiUrl` and `tutorialUrl` to each option object and render two external anchors in each detail card with `target="_blank"` and `rel="noreferrer"`.

- [ ] **Step 4: Run tests to verify they pass**

Run:

```bash
pnpm vitest run 'src/app/(workspace)/providers/page.test.tsx' 'src/app/(workspace)/search-engines/page.test.tsx'
```

Expected: pass.

### Task 4: Full Verification and Commit

**Files:**
- All modified source, test, spec, and plan files.

- [ ] **Step 1: Run focused tests**

```bash
pnpm vitest run src/components/session-shell.test.tsx 'src/app/(workspace)/providers/page.test.tsx' 'src/app/(workspace)/search-engines/page.test.tsx'
```

Expected: all pass.

- [ ] **Step 2: Run full test suite**

```bash
pnpm test
```

Expected: all tests pass.

- [ ] **Step 3: Run production build**

```bash
pnpm build
```

Expected: build exits 0.

- [ ] **Step 4: Commit**

```bash
git add dualens
git commit -m "feat: preserve debate state across workspace navigation"
```
