# Dualens Multi-Page Application Refactor Design

Date: 2026-04-10

## Purpose

This document defines the next major product pass for `两仪决 | Dualens`.

The current project already has real debate-session behavior, but the application still presents itself as a single-page prototype. This pass upgrades it into a coherent multi-page product with a stable app shell, unified visual system, and settings-oriented information architecture.

The goal is not to make the UI more decorative. The goal is to make it feel like a finished decision workspace:

- restrained
- structured
- consistent
- product-like rather than demo-like

## Product Goals

- Replace the current single primary page with a formal multi-page application shell.
- Introduce a fixed left sidebar and a spacious right content area.
- Add four first-level product areas:
  - Debate
  - History
  - AI Providers
  - General Settings
- Rebuild the debate entry surface so it reads as a product workflow rather than a loose form.
- Establish one design system across layout, navigation, forms, cards, status labels, and settings surfaces.
- Preserve the current working debate session logic and server-side flow.

## Non-Goals

- Rewriting the backend runtime or debate orchestration logic
- Adding real persistence for provider settings, history management, or global preferences if that infrastructure does not yet exist
- Building a marketing homepage
- Adding vivid gradients, neon accents, or “AI dashboard” visual clichés
- Introducing complex animation systems

## Current Project Context

The current codebase is built with:

- Next.js 15 App Router
- React 19
- TypeScript
- Tailwind CSS
- existing server routes for debate session lifecycle

The current UI is centered on:

- `src/app/page.tsx`
- `src/components/session-shell.tsx`
- `src/components/question-form.tsx`

This means the most efficient path is to preserve the working session engine and reorganize the page layer around it.

## Product Direction

This pass should be implemented as a shell-first product refactor.

The application should feel like a decision operating system with quiet visual discipline. The overall visual language should express:

- balance
- opposition in dialogue
- deliberate judgment
- calm over speed

The brand should reinforce the “两仪” idea through a restrained taiji mark and a minimal wordmark, not through illustration or ornamental symbolism.

## Information Architecture

### Primary Routes

The app should expose these first-level routes:

- `/debate`
- `/history`
- `/providers`
- `/settings`

The root route `/` should redirect to `/debate`.

### Shared Application Layout

All four routes should live inside one shared workspace layout:

- fixed left sidebar
- right main content region
- stable spacing and width rules across pages

This layout should be implemented once and reused by all page routes.

## Visual System

### Core Visual Tone

The visual system should be:

- black, white, and neutral gray first
- minimal and quiet
- spacious and orderly
- formal, not promotional
- slightly philosophical in mood, but still clearly a software product

### Color Direction

The primary palette should be neutral:

- page background in soft white or very light gray
- card surfaces in white
- primary text in charcoal or near-black
- secondary text in medium gray
- borders in light neutral gray

Accent usage should be extremely restrained. Strong emphasis should come mostly from contrast, hierarchy, and spacing rather than colored decoration.

### Typography Direction

The application should use a clean sans-serif base for product clarity.

Brand treatment may use weight, spacing, and proportion to suggest an East Asian philosophical tone, but body UI should remain highly readable and contemporary. The product must not become calligraphic, ornamental, or editorial.

### Component Language

The following visual rules should be shared across the application:

- generous but controlled border radius
- light borders before heavy shadows
- roomy padding
- clear title hierarchy
- consistent control height
- muted interaction states

## Shared Components

This pass should introduce or formalize the following shared components:

- `components/layout/app-sidebar.tsx`
- `components/layout/app-shell.tsx`
- `components/common/page-header.tsx`
- `components/common/section-card.tsx`
- `components/common/status-tag.tsx`
- `components/common/provider-list-item.tsx`
- `components/common/setting-row.tsx`
- `components/common/history-card.tsx`

The existing base UI primitives should also be visually aligned:

- `Button`
- `Input`
- `Textarea`
- `Select`
- `Card`

These primitives should shift away from the current warm-paper palette and into the new neutral system.

## Brand Area

The top-left sidebar brand area should contain:

- a simple taiji logo mark
- the product name `两仪决`

The visual intent is:

- balance
- duality
- opposition held in structure
- support for judgment

The logo should be geometric and restrained. It should feel like part of a product UI, not an illustrated emblem.

## Page Design

### 1. Debate Page

This is the upgraded form of the current main page.

The debate page should preserve the existing working flow:

- input a decision question
- configure two AI roles
- define each side’s stance framing
- define style inclinations such as cautious or aggressive and speaking order
- choose a model
- start debate

The page should be reorganized into clearly separated sections:

- page header
- question input section
- dual-role configuration section
- model and parameter section
- action section

Below the entry sections, the existing debate session workspace should continue to show:

- research progress
- debate timeline
- evidence
- summary
- any existing runtime diagnostics

The debate page should feel more like a formal control room than a single stacked form. The two-agent contrast should remain obvious, but within the same restrained system as the rest of the app.

### 2. History Page

The history page is a new records-management surface.

It should include:

- page header
- search input
- filters
- card-based history list

Each record should show:

- question title
- created time
- chosen model
- side configuration summary
- status such as completed, in progress, or failed

Each record should support UI actions for:

- view details
- relaunch same debate
- delete

This page should not look like a raw data table. It should feel like a product archive view.

If no real persistence exists yet, the first pass may use typed mock data with clear component boundaries so later backend integration is straightforward.

### 3. AI Providers Page

This is one of the main settings surfaces and should feel like a proper configuration center.

The page layout should be split:

- left column: provider list
- right column: selected provider configuration form

Providers in scope:

- DeepSeek
- OpenAI
- Gemini
- 豆包

Each provider entry in the left list should show:

- icon or mark
- provider name
- configured or not configured state
- selected state

The right-side form should support fields such as:

- API key
- model ID
- API endpoint when relevant
- any additional provider-specific parameters required by the UI model

The detail panel should also include:

- a clear section title
- concise help copy
- a location for “how to get API key” guidance or links

If backend persistence is not yet available, this pass should still define a stable front-end data model and present the page as a real product settings center rather than a placeholder.

### 4. General Settings Page

This is the second major settings surface and should share the same system as the providers page.

Suggested modules:

- language
- default model
- default debate role style
- history retention strategy
- data export
- clear cache
- optional theme setting

The layout should be modular and card-based, with clear grouping and calm spacing.

The page should feel structurally related to the providers page so the product reads as one coherent settings system.

## Data and State Strategy

### Debate

The debate page should reuse the current working session creation and polling behavior. Existing API routes and session orchestration should remain intact.

The preferred approach is to refactor the current page shell around the existing session logic rather than rewriting the session engine.

### History

If the app does not yet have persistent history retrieval and mutation endpoints, this page should launch with typed local data and UI-only actions. The data shape should mirror the eventual real record format closely enough to avoid future component churn.

### Providers

If provider settings are currently environment-driven rather than user-configurable, the UI may begin as front-end managed state with a clear shape for future storage. The product should still present this as a formal settings surface, but the code must not pretend persistence exists when it does not.

### General Settings

General settings should follow the same rule as providers:

- stable state structure
- clear UI model
- future-friendly persistence boundary

## Responsive Behavior

Desktop is the primary target for this pass.

The core behavior should be:

- persistent left sidebar on desktop
- readable stacked layout on narrower screens
- sections remain spacious instead of collapsing into cramped grids

The mobile version does not need to become a separate visual concept. It should remain the same system, simplified for width.

## Routing and File Structure

The route structure should move toward:

```text
src/app/
  page.tsx                         root redirect
  (workspace)/
    layout.tsx                     shared workspace shell
    debate/page.tsx
    history/page.tsx
    providers/page.tsx
    settings/page.tsx
```

Supporting shared components should live under:

```text
src/components/
  layout/
    app-shell.tsx
    app-sidebar.tsx
  common/
    page-header.tsx
    section-card.tsx
    status-tag.tsx
    provider-list-item.tsx
    setting-row.tsx
    history-card.tsx
```

Existing debate-specific components may be retained and incrementally adapted as needed.

## Implementation Strategy

The implementation order should be:

1. establish global neutral design tokens and shell layout
2. add shared workspace routing and sidebar navigation
3. create shared page and settings components
4. rebuild the debate page around the new sections while preserving session behavior
5. build the providers page
6. build the general settings page
7. build the history page
8. perform a final consistency pass on spacing, borders, radius, headers, and action styling

This order keeps the working debate logic alive while the product shell becomes coherent first.

## Design Constraints

- Avoid glossy gradients, neon tones, or “futuristic AI” styling.
- Avoid fragmented per-page aesthetics.
- Avoid heavy shadows as the main depth mechanism.
- Avoid making the history page a plain table.
- Avoid fake persistence claims in providers or settings if the code does not yet support them.

## Acceptance Criteria

This pass is successful when:

- the app opens into a formal workspace shell instead of a single loose page
- the left sidebar and right content layout are stable across all four pages
- all four routes exist and feel visually related
- the debate page feels like a mature product surface while still supporting the current debate session flow
- providers and settings read as real configuration centers
- history reads as a usable record-management page
- visual language is consistent across borders, spacing, controls, cards, and page headers

## Open Technical Boundary

This refactor should prioritize product structure and UI coherence first.

Where backend persistence does not yet exist for history, providers, or general settings, the implementation should:

- define typed UI state
- define clean component boundaries
- keep the user-facing surface polished
- leave obvious seams for later integration

That keeps the refactor honest while still delivering the mature product feel required for this pass.
