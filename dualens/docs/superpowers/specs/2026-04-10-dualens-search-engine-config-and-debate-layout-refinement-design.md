# Dualens Search Engine Configuration And Debate Layout Refinement Design

Date: 2026-04-10

## Purpose

This document defines an incremental refinement pass for the current multi-page product refactor of `两仪决 | Dualens`.

It amends the current direction in three ways:

- simplifies the debate entry page
- adds a new first-level search-engine configuration page
- tightens product naming across the shared navigation

The goal is to keep the application feeling like one mature product system. Configuration should live in dedicated configuration pages. The debate page should become a cleaner execution surface rather than a page full of competing control blocks.

## Relationship To Earlier Specs

This document extends and partially refines these earlier design documents:

- `2026-04-10-dualens-multi-page-app-design.md`
- `2026-04-10-dualens-history-folder-and-provider-selection-design.md`

Where there is a conflict, this document takes precedence for:

- route naming and navigation labels
- debate page section structure
- search engine configuration architecture

The earlier history-folder settings decisions remain valid.

## Goals

- Rename navigation labels to sound like stable product areas rather than descriptive page names.
- Add a first-level `/search-engines` route below `/providers` in the sidebar.
- Make `/search-engines` visually and structurally parallel to `/providers`.
- Remove the dedicated `模型与参数区` card from the debate page.
- Show the active model and active search engine as read-only execution context in the debate page action area.
- Compress the debate side configuration section so it feels lighter, tighter, and more product-like.

## Non-Goals

- Reintroducing model or search-engine editing controls directly on the debate page
- Replacing the existing route structure for `/debate`, `/history`, `/providers`, or `/settings`
- Reading history JSON files into the history page in this pass
- Adding backend persistence for providers or search engines in this pass

## Information Architecture

### First-Level Routes

The application should expose these primary routes:

- `/debate`
- `/history`
- `/providers`
- `/search-engines`
- `/settings`

The root route `/` should continue redirecting to `/debate`.

### Sidebar Order And Labels

The sidebar order should be:

1. `辩论`
2. `辩论历史`
3. `AI 服务商`
4. `搜索引擎`
5. `通用设置`

These labels replace the earlier wording:

- `辩论页` -> `辩论`
- `辩论历史页` -> `辩论历史`

### Page Titles

The page header titles should align with the sidebar:

- `/debate` -> `辩论`
- `/history` -> `辩论历史`
- `/providers` -> `AI 服务商`
- `/search-engines` -> `搜索引擎`
- `/settings` -> `通用设置`

## Debate Page Refinement

### Section Structure

The debate page should be reduced to four top-level entry sections:

- page header
- question input section
- dual-role configuration section
- action section

The dedicated `模型与参数区` card should be removed entirely.

This makes the debate page read as:

- define the question
- confirm the two debating roles
- start the debate

### Model And Search Engine Summary

Model and search-engine selection should not appear as editable controls on the debate page in this pass.

Instead, the action section should include a compact read-only summary on the right side showing:

- current model
- current search engine

These should be displayed as restrained information blocks or tags rather than form controls.

The debate page should reflect the current global defaults from the configuration pages:

- the current model comes from the existing model configuration state
- the current search engine comes from `/search-engines`

The debate page does not override either of them.

### Speaking Order Simplification

The dedicated `发言顺序` card should be removed from the dual-role configuration area.

The speaking-order concept may still exist in logic, but it should no longer occupy its own prominent card. If shown at all, it should be reduced to a secondary inline control or compact line-level control within the role area.

The important outcome is visual hierarchy:

- role identity and style should dominate
- speaking order should not consume comparable space

### Dual-Role Configuration Compression

The two role cards should become shorter and more compact.

The role area should continue to express a paired debate structure, but with less vertical weight.

Each role card should:

- keep the role name
- keep a short role descriptor
- show the current style in a compact one-line form

The current-assignment block should be simplified to a tighter line such as:

- `风格：谨慎`
- `风格：激进`

This summary should be visually smaller than before and should not behave like a separate large informational card.

### Qianming And Kuncha Layout

The `乾明` and `坤察` cards should:

- retain symmetrical side-by-side layout
- use reduced vertical padding
- reduce secondary copy
- emphasize concise style labels over descriptive paragraphs

The overall effect should be a lower-profile paired configuration strip rather than a tall descriptive module.

## Search Engine Configuration Page

### Purpose

`/search-engines` should be a first-level configuration center for the application's global default search engine.

It should parallel `/providers` so both pages feel like part of the same settings system:

- one page configures model providers
- the other configures search providers

### Layout

The page should use the same left-right split as `/providers`:

- left column: search-engine cards
- right column: selected search-engine configuration panel

Recommended proportion:

- approximately `340px / 1fr`

### Search Engines In Scope

The supported engines for this pass are:

- Bing
- 百度
- Google
- Tavily

### Left Card List

Each search engine should render as an explicit card containing:

- icon or initial mark
- engine name
- configuration state
- selected state
- top-right circular selection control

Only one search engine may be selected at a time.

The entire card should be clickable, and the top-right control should mirror the same selection behavior.

### Right Configuration Panel

The right panel should follow the same visual structure as `/providers`:

- header area with title and status
- clean single-column field stack
- footer help and action row

The fields may vary slightly per engine, but the shared layout must remain stable.

The panel should support at least:

- `API Key`
- `Engine ID / CX / App ID`
- `API Endpoint`
- `其他必要参数`

This page should store a single selected engine as the global default used by the debate page summary.

## Providers And Search Engines As A Shared System

`/providers` and `/search-engines` should feel intentionally paired.

They should share:

- sidebar-level importance
- page-header tone
- left-card width and spacing
- right-panel structure
- selection-control behavior
- action-row alignment

They should differ only in domain-specific field labels and help copy.

## Settings Page Interaction With The New Structure

The earlier decision to simplify `/settings` into a single history-folder settings card remains unchanged.

This pass does not add search-engine controls to `/settings`.

Configuration responsibilities should stay clearly separated:

- `/providers` for model providers
- `/search-engines` for search providers
- `/settings` for history-folder persistence

## Data Flow

### Search Engine Selection

1. User opens `/search-engines`
2. Page renders all search-engine cards
3. One engine is selected by default
4. User clicks a different card or its circular selector
5. The selected engine id updates
6. The right panel rerenders with that engine's configuration
7. The current selected engine becomes the global default shown on `/debate`

### Debate Page Context Display

1. User opens `/debate`
2. Debate page renders question, role configuration, and action sections
3. Action section reads the current model and selected search engine
4. The right side of the action section displays those two values as read-only context
5. Starting a debate uses those current defaults without an extra on-page editor

## Error Handling

### Search Engine Page

- there must always be one selected engine in the UI
- changing selected cards must never blank the right panel
- configuration forms may stay client-side and non-persistent in this pass without breaking layout consistency

### Debate Page

- removing the `模型与参数区` must not break the ability to start a debate
- compacting the role area must not remove the clarity of current side styles
- the action section must still clearly communicate what environment the debate is about to use

## Testing Strategy

### Navigation

- sidebar renders the updated label set
- sidebar includes `搜索引擎`
- sidebar order matches the new information architecture

### Debate Page

- no longer renders a dedicated `模型与参数区`
- action area shows current model summary
- action area shows current search-engine summary
- role area renders compact style summaries
- speaking order is no longer rendered as a standalone card

### Search Engines Page

- renders the search-engine card list
- defaults to a single selected engine
- switches selection when another card is clicked
- rerenders the right panel heading and fields for the active engine
- renders the circular selector control on each card

### Providers Page

- continues to render the card list and configuration panel
- uses the same circular selector interaction pattern as the search-engine page

## Success Criteria

This pass is successful when:

- the sidebar reads `辩论 / 辩论历史 / AI 服务商 / 搜索引擎 / 通用设置`
- `/search-engines` feels like a true sibling of `/providers`
- the debate page no longer has a standalone model-and-parameters block
- the action section shows model and search-engine context in a quiet, product-like way
- the role section feels tighter and less vertically heavy
- configuration stays concentrated in dedicated configuration pages rather than drifting back into the debate surface
