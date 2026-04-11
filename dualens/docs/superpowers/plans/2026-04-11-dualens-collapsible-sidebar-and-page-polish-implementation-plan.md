# Dualens Collapsible Sidebar And Page Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a compact collapsible workspace sidebar and apply the requested page polish without changing debate/session behavior.

**Architecture:** Keep the state in `AppShell` and pass `collapsed` into `AppSidebar`. Keep visual-only page changes in existing components and preserve the current global language provider.

**Tech Stack:** Next.js App Router, React client components, TypeScript, Tailwind CSS, Vitest, Testing Library.

---

## Tasks

### Task 1: Collapsible Shell And Sidebar

**Files:**
- Modify: `src/components/layout/app-shell.tsx`
- Modify: `src/components/layout/app-sidebar.tsx`
- Modify: `src/components/layout/app-sidebar.test.tsx`
- Create: `src/components/layout/app-shell.test.tsx`

- [ ] Write failing tests for a shell toggle button that collapses the sidebar, changes the aside width class, keeps nav links accessible, hides expanded copy, and restores the expanded state on second click.
- [ ] Implement `AppShell` as a client component with `sidebarCollapsed` state.
- [ ] Add collapsed rendering paths to `AppSidebar`.
- [ ] Run focused tests.
- [ ] Commit.

### Task 2: Brand And Settings Copy

**Files:**
- Modify: `src/lib/workspace-copy.ts`
- Modify: `src/components/layout/app-sidebar.tsx`
- Modify: `src/app/(workspace)/settings/page.tsx`
- Modify: `src/components/layout/app-sidebar.test.tsx`
- Modify: `src/app/(workspace)/settings/page.test.tsx`

- [ ] Write failing tests for the English tagline `One question, two lenses, visible evidence` and no duplicate language-setting description.
- [ ] Update copy and remove the duplicated Settings paragraph.
- [ ] Shift brand content right/center in expanded sidebar.
- [ ] Run focused tests.
- [ ] Commit.

### Task 3: Provider And Search List Status Hints

**Files:**
- Modify: `src/components/common/selection-card-item.tsx`
- Modify: `src/app/(workspace)/providers/page.tsx`
- Modify: `src/app/(workspace)/search-engines/page.tsx`
- Modify: `src/app/(workspace)/providers/page.test.tsx`
- Modify: `src/app/(workspace)/search-engines/page.test.tsx`

- [ ] Write failing tests for small status text in list cards while keeping large status tags out of list cards.
- [ ] Add `statusLabel` and `configured` styling to `SelectionCardItem`.
- [ ] Pass localized status labels from provider/search pages.
- [ ] Run focused tests.
- [ ] Commit.

### Task 4: Debate Page Polish

**Files:**
- Modify: `src/components/question-form.tsx`
- Modify: `src/components/question-form.test.tsx`

- [ ] Write failing tests for wider role-grid class, persistent swap toggle, no hover color mutation on swap button, and right-aligned action row.
- [ ] Widen role-card grid and keep the middle swap button centered.
- [ ] Change swap feedback from timed flash to persistent toggle.
- [ ] Right-align model/search/start controls and reduce action-row vertical pressure.
- [ ] Run focused tests.
- [ ] Commit.

### Task 5: Final Verification

- [ ] Run focused regression:

```bash
pnpm vitest run src/components/layout/app-shell.test.tsx src/components/layout/app-sidebar.test.tsx 'src/app/(workspace)/settings/page.test.tsx' src/components/question-form.test.tsx 'src/app/(workspace)/providers/page.test.tsx' 'src/app/(workspace)/search-engines/page.test.tsx'
```

- [ ] Run `pnpm test`.
- [ ] Run `pnpm build`.
- [ ] Confirm `git status --short` is clean.
