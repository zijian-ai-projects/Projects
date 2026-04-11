# Dualens Configuration Draft And Polling Fixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement configuration-page auto-save, workspace debate question draft persistence, runtime summary links/unconfigured labels, and model-request timeout diagnostics.

**Architecture:** Reuse the existing localStorage preference modules for saved provider and search-engine data. Add a small workspace-scoped React context for the debate question draft and pass it through `SessionShell` into `QuestionForm`. Add display helpers for configured/unconfigured runtime summaries and a timeout wrapper in the OpenAI-compatible provider.

**Tech Stack:** Next.js App Router, React client components, TypeScript, Tailwind CSS, Vitest, Testing Library.

---

## File Structure

- Modify: `src/app/(workspace)/providers/page.tsx` for input-time provider persistence and removed action buttons.
- Modify: `src/app/(workspace)/providers/page.test.tsx` for auto-save and status pill coverage.
- Modify: `src/app/(workspace)/search-engines/page.tsx` for input-time search persistence and removed action buttons.
- Modify: `src/app/(workspace)/search-engines/page.test.tsx` for auto-save and status pill coverage.
- Modify: `src/components/common/selection-card-item.tsx` for shared status pill styling.
- Create: `src/lib/debate-question-draft.tsx` for workspace-scoped in-memory question draft.
- Modify: `src/components/layout/app-shell.tsx` to mount the draft provider.
- Modify: `src/components/session-shell.tsx` to pass optional draft state into the form.
- Modify: `src/components/session-shell.test.tsx` to verify draft preservation across page-like unmounts.
- Modify: `src/components/question-form.tsx` for controlled question state and linked runtime summaries.
- Modify: `src/components/question-form.test.tsx` for unconfigured labels and navigation link coverage.
- Modify: `src/lib/model-provider-preferences.ts` for active provider display state.
- Modify: `src/lib/search-engine-preferences.ts` for active search-engine display state.
- Modify: `src/server/llm/openai-compatible-provider.ts` for timeout handling.
- Modify: `src/server/debate/summary.test.ts` for provider timeout coverage.

## Tasks

### Task 1: Configuration Pages

- [ ] Write failing tests that provider/search forms persist on input without save buttons.
- [ ] Write failing tests that list status text is a rounded pill and configured pills are black with white text.
- [ ] Implement input-time persistence and remove reset/save action rows.
- [ ] Run provider and search-engine page tests.

### Task 2: Debate Draft And Runtime Summary

- [ ] Write failing tests for workspace draft preservation across unmount/remount.
- [ ] Write failing tests for `未配置` runtime summary labels and links to `/providers` and `/search-engines`.
- [ ] Add the in-memory draft provider and controlled form props.
- [ ] Add configured/unconfigured display helpers and linked summary cards.
- [ ] Run session shell and question form tests.

### Task 3: Stuck Model Request Diagnostics

- [ ] Write a failing test for a timed-out OpenAI-compatible provider request.
- [ ] Add timeout support to the provider fetch path.
- [ ] Run provider-related tests.

### Task 4: Verification

- [ ] Run focused tests for all touched areas.
- [ ] Run `pnpm test`.
- [ ] Run `pnpm build`.
- [ ] Confirm `git status --short`.
