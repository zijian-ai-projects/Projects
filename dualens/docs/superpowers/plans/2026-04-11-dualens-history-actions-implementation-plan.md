# Dualens History Actions Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make history card actions usable: inline details, rerun draft restore, and two-click delete confirmation.

**Architecture:** Extend the history record loader to expose detail and rerun data already present in saved JSON. Keep interactions local to `HistoryPageContent`, with `HistoryCard` receiving callbacks and rendering optional detail/confirmation UI. Reuse `DebateWorkspaceStateProvider` for rerun draft state and let `QuestionForm` consume optional controlled role draft props.

**Tech Stack:** Next.js App Router, React state/context, Vitest, Testing Library, File System Access API adapter.

---

### Task 1: Red Tests for History Actions

**Files:**
- Modify: `dualens/src/app/(workspace)/history/page.test.tsx`

- [ ] **Step 1: Write failing tests**

Add tests that:

- click `查看详情` and expect inline detail text such as `搜索引擎：Tavily` and `下一步：...`.
- click `重新发起同题辩论` and expect the debate page question plus role chips to be restored.
- click `删除` once and expect no delete call, then click `确认删除` and expect deletion.

- [ ] **Step 2: Run tests to verify failure**

```bash
pnpm vitest run 'src/app/(workspace)/history/page.test.tsx'
```

Expected: tests fail because the buttons are inert or delete immediately.

### Task 2: History Loader and Card UI

**Files:**
- Modify: `dualens/src/lib/history-records.ts`
- Modify: `dualens/src/components/common/history-card.tsx`
- Modify: `dualens/src/lib/workspace-copy.ts`
- Modify: `dualens/src/app/(workspace)/history/history-page-content.tsx`

- [ ] **Step 1: Expose saved detail fields**

Return search engine, preset selection, first speaker, language, stage, summary, diagnosis, evidence count, and turn count from `loadHistoryRecords()`.

- [ ] **Step 2: Add card callbacks and confirmation UI**

Add `onViewDetails`, `onRerun`, `deleteConfirmationActive`, and `onCancelDelete` props to `HistoryCard`.

- [ ] **Step 3: Render details and two-click delete in the page**

Track expanded record id and pending delete file name in `HistoryPageContent`.

### Task 3: Rerun Draft Integration

**Files:**
- Modify: `dualens/src/lib/debate-workspace-state.tsx`
- Modify: `dualens/src/components/session-shell.tsx`
- Modify: `dualens/src/components/question-form.tsx`
- Modify: `dualens/src/app/(workspace)/history/history-page-content.tsx`

- [ ] **Step 1: Add draft fields to workspace state**

Store optional `draftPresetSelection` and `draftFirstSpeaker`.

- [ ] **Step 2: Let `QuestionForm` consume optional controlled draft props**

Use controlled preset and first-speaker values when provided; otherwise keep existing local state.

- [ ] **Step 3: Wire history rerun**

Set question, draft preset, draft first speaker, clear active session state, and `router.push("/debate")`.

### Task 4: Verification and Commit

**Files:**
- All modified source, test, spec, and plan files.

- [ ] **Step 1: Run focused tests**

```bash
pnpm vitest run 'src/app/(workspace)/history/page.test.tsx' src/components/question-form.test.tsx src/components/session-shell.test.tsx src/lib/history-records.test.ts
```

Expected: all pass.

- [ ] **Step 2: Run full test suite**

```bash
pnpm test
```

Expected: all pass.

- [ ] **Step 3: Run production build**

```bash
pnpm build
```

Expected: exits 0.

- [ ] **Step 4: Commit**

```bash
git add dualens
git commit -m "fix: wire debate history actions"
```
