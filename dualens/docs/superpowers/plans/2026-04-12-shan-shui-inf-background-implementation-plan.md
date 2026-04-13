# Shan Shui Inf Background Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the simplified ink background with a deterministic, attributed, `shan-shui-inf`-adapted black/white/gray landscape scroll background for home and all workspace pages.

**Architecture:** Add a focused adapted generator module that ports the MIT-licensed `shan-shui-inf` primitives into deterministic TypeScript. `InkLandscapeBackground` consumes generated SVG strips, duplicates them for seamless CSS scrolling, and overlays white readability masks.

**Tech Stack:** Next.js, React, TypeScript, SVG strings, CSS transform animation, Vitest, Playwright.

---

### Task 1: Lock Requirements With Failing Tests

**Files:**
- Modify: `src/components/background/ink-landscape-background.test.tsx`
- Create: `src/components/background/shan-shui-inf-adapted.test.ts`

- [ ] Add tests that expect an adapted generator export, deterministic repeated output, MIT attribution metadata, mountain/tree/rock/texture layer markers, black/white/gray-only paint, and no taiji/flow layers.
- [ ] Run `pnpm vitest run src/components/background/ink-landscape-background.test.tsx src/components/background/shan-shui-inf-adapted.test.ts` and confirm the new generator tests fail because the module does not exist yet.

### Task 2: Port Shan Shui Core

**Files:**
- Create: `src/components/background/shan-shui-inf-adapted.ts`
- Create: `THIRD_PARTY_NOTICES.md`

- [ ] Port seeded RNG, p5-style noise, `poly`, `stroke`, `blob`, `texture`, selected `Tree` functions, selected `Mount` functions, and a route-safe planner from `shan-shui-inf`.
- [ ] Remove non-background elements such as boats, buildings, people, towers, and UI.
- [ ] Add file-level MIT attribution and repository-level third-party notice.
- [ ] Run generator tests and confirm they pass.

### Task 3: Replace Background Component

**Files:**
- Modify: `src/components/background/ink-landscape-background.tsx`

- [ ] Replace current manual mountain/tree SVG with duplicated generated strips.
- [ ] Preserve `aria-hidden`, `pointer-events: none`, fixed positioning, and the existing `variant` API.
- [ ] Add route-neutral layer names for scroll strip, landscape scene, and readability masks.

### Task 4: Update CSS And Coverage

**Files:**
- Modify: `src/app/globals.css`
- Modify: workspace/home tests as needed

- [ ] Add slow seamless horizontal scroll animation and reduced-motion stop.
- [ ] Add home/workspace opacity variables and center/preview/workspace readability masks.
- [ ] Verify workspace layout-level background covers `/app`, `/history`, `/providers`, `/search-engines`, and `/settings`.

### Task 5: Verify

- [ ] Run `pnpm vitest run src/components/background/ink-landscape-background.test.tsx src/components/background/shan-shui-inf-adapted.test.ts`.
- [ ] Run `pnpm test`.
- [ ] Run `pnpm build`.
- [ ] Restart dev server and run the Playwright background screenshot check.
- [ ] Run `pnpm test:e2e`.
