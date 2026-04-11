# Dualens History Detail Dialog Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace brief inline history details and button-based delete confirmation with modal dialogs that show full debate records and confirm deletion safely.

**Architecture:** Extend the existing history loader to expose full evidence, turn, and summary data from saved JSON. Keep dialog state in `HistoryPageContent`, render accessible modal windows there, and simplify `HistoryCard` back to list-card actions.

**Tech Stack:** Next.js App Router, React state, Vitest, Testing Library, File System Access API adapter.

---

### Task 1: Red Tests

**Files:**
- Modify: `dualens/src/app/(workspace)/history/page.test.tsx`

- [x] **Step 1: Write failing tests**

Add tests that click `查看详情` and expect a dialog with:

- evidence title and summary;
- debate turn content and speaker;
- strongest-for and final next action summary.

Add tests that click `删除` and expect:

- a `确认删除` dialog;
- no delete call before clicking dialog `确认删除`;
- deletion after clicking dialog `确认删除`;
- cancellation closes the dialog without deleting.

- [x] **Step 2: Run tests to verify failure**

```bash
pnpm vitest run 'src/app/(workspace)/history/page.test.tsx'
```

Expected: fail because details are inline and brief, and delete confirmation is button-based.

### Task 2: Data Model

**Files:**
- Modify: `dualens/src/lib/history-records.ts`
- Modify: `dualens/src/lib/history-records.test.ts`

- [x] **Step 1: Expose full record fields**

Add `evidence`, `turns`, and full `summary` to `HistoryListRecord`.

- [x] **Step 2: Validate minimally**

Use existing structural guards for arrays and summary fields so older or partial records still load.

- [x] **Step 3: Run loader tests**

```bash
pnpm vitest run src/lib/history-records.test.ts
```

Expected: pass.

### Task 3: Dialog UI

**Files:**
- Modify: `dualens/src/app/(workspace)/history/history-page-content.tsx`
- Modify: `dualens/src/components/common/history-card.tsx`
- Modify: `dualens/src/lib/workspace-copy.ts`

- [x] **Step 1: Render detail dialog**

Track selected detail record id and render a `role="dialog"` modal with full evidence, turns, and summary.

- [x] **Step 2: Render delete dialog**

Track selected delete record id and render a confirmation modal with cancel and confirm actions.

- [x] **Step 3: Simplify card props**

Remove inline details and button-confirmation props from `HistoryCard`; keep `onViewDetails`, `onRerun`, and `onDelete`.

### Task 4: Verification and Commit

**Files:**
- All modified source, test, spec, and plan files.

- [x] **Step 1: Run focused tests**

```bash
pnpm vitest run 'src/app/(workspace)/history/page.test.tsx' src/lib/history-records.test.ts
```

Expected: all pass.

- [x] **Step 2: Run full tests**

```bash
pnpm test
```

Expected: all pass.

- [x] **Step 3: Run build**

```bash
pnpm build
```

Expected: exits 0.

- [ ] **Step 4: Commit**

```bash
git add dualens
git commit -m "fix: show full debate history details"
```
