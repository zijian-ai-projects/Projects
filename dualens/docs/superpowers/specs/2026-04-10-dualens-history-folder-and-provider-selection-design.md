# Dualens History Folder Setting And Provider Selection Design

Date: 2026-04-10

## Purpose

This document defines a focused refinement pass for two existing product pages in `两仪决 | Dualens`:

- `/settings`
- `/providers`

The goal is to make both pages feel more like mature product surfaces while also introducing the first real local persistence capability for debate history files.

This pass intentionally narrows the settings experience instead of expanding it. The settings page should become quieter, clearer, and more product-like by centering on a single meaningful action: choosing the local folder where debate histories are saved as JSON files.

## Goals

- Reduce the settings page to one restrained, primary settings card.
- Let the user choose a local folder for debate history storage from the browser.
- Persist the chosen folder authorization for reuse in the same browser profile.
- Save each debate record into exactly one JSON file inside the chosen folder.
- Keep the JSON file name unique and stable for the lifetime of the session.
- Refine the providers page into a stronger left-right configuration layout.
- Add a radio-like selection control to the top-right corner of every provider card.
- Ensure only one provider is selected at a time and the right-side panel always reflects that selection.

## Non-Goals

- Converting the project into Electron, Tauri, or another desktop runtime
- Displaying a guaranteed absolute filesystem path in the UI
- Adding multiple unrelated settings back into `/settings`
- Rebuilding the history page to read records from the chosen folder in this same pass
- Introducing backend database persistence for provider configuration

## Current Context

The current multi-page app shell already exists in the feature worktree. `/settings` and `/providers` are already routed pages, but both are still mostly static product surfaces:

- `/settings` currently contains several grouped preference modules with no real persistence
- `/providers` already has a left list and a right form, but the selection affordance is still too generic and the card hierarchy is not yet explicit enough
- debate sessions already produce rich `SessionView` / `SessionRecord` data structures that can be serialized into JSON
- `SessionShell` already receives session updates over time, which makes it the correct place to trigger automatic file updates

## Product Direction

This pass should strengthen the application's restrained product tone:

- fewer controls
- clearer hierarchy
- more deliberate spacing
- less “settings dashboard” density
- stronger alignment between interaction model and visual language

The settings page should feel like a calm utility page inside a serious product. The providers page should feel like a formal configuration center, not a list with a form attached.

## Settings Page Design

### Page Structure

`/settings` should keep the shared page header but replace the current multi-module layout with one centered primary card.

The page body should contain:

- page header
- one large settings card

The card should contain only one configurable item:

- `辩论历史保存文件夹`

This is intentionally the only core setting on the page.

### Card Layout

The settings card should use a restrained split layout:

- left side: title, short explanation, saving rules
- right side: current folder display, status tag, action button

The spacing should be generous and the alignment should be clean. The card should not resemble a dense admin form.

### Displayed State

Because the browser cannot reliably expose an absolute local path, the UI should display:

- folder name
- authorization status

The supported status states are:

- `未选择`
- `已授权`
- `需要重新授权`
- `当前浏览器不支持`

If a folder has been chosen, the page should display the directory name clearly and show the action button as `重新选择`.

If no folder is selected yet, the button should read `选择文件夹`.

### Browser Capability

This feature should use the File System Access API:

- `window.showDirectoryPicker`
- directory permission query / request
- directory handle reuse

If the API is unavailable, the page should not attempt a fallback that pretends to provide the same behavior. Instead it should render a clear unsupported-state message and disable the folder-selection action.

### Persistence Strategy

The chosen directory handle should be persisted in browser storage using `IndexedDB`.

The implementation should store:

- the directory handle itself
- light metadata such as the directory name and the last known permission state, when helpful for UI bootstrapping

The application should restore the saved handle on page load, re-check permission state, and render the correct status without requiring the user to pick a folder again every session.

## Debate History File Saving

### Saving Rule

Every debate record should correspond to exactly one JSON file in the chosen local folder.

This should work as follows:

- when a new debate session starts and returns its first `session.id`, create a unique filename for that session
- that filename stays fixed for the whole session
- as the session progresses, overwrite the same file with the newest JSON snapshot
- on completion, stop, or failure, write one final snapshot

This satisfies the product rule:

- one debate record
- one JSON file

### Filename Rule

The filename should be unique and human-scannable.

Recommended format:

`dualens-YYYYMMDD-HHmmss-<sessionId>.json`

Example:

`dualens-20260410-143205-session_7f2a1c.json`

The timestamp should represent the record creation time, not the latest update time.

### JSON Structure

The saved JSON should include at least:

- `id`
- `createdAt`
- `updatedAt`
- `question`
- `model`
- `provider`
- `presetSelection`
- `firstSpeaker`
- `language`
- `stage`
- `evidence`
- `researchProgress`
- `turns`
- `summary`
- `diagnosis`

The format should be stable and explicit so that a later history-ingestion pass can read these files without needing to guess field meanings.

### Error Handling

History saving must be non-blocking.

If folder access is unavailable, revoked, or write operations fail:

- the debate workflow must continue
- the page should surface a lightweight, local warning
- the saved folder state should move to `需要重新授权` when appropriate

The application must not interrupt a live debate because file saving failed.

## Providers Page Design

### Page Structure

`/providers` should keep the current split structure but refine it into a stronger settings-center layout:

- left column: provider card list
- right column: selected provider configuration panel

Recommended proportion:

- approximately `340px / 1fr`

The left side should feel stable and moderately narrow. The right panel should feel spacious enough for form work.

### Provider Card Layout

Each provider item should become a more explicit card rather than a generic list row.

Each card should contain:

- provider icon
- provider name
- configuration status text or tag
- top-right radio-like selection control

The entire card should be clickable. The top-right control should mirror the same selection behavior instead of introducing a separate action path.

### Selection Control

The new top-right control should behave like a restrained single-selection indicator:

- circular or near-circular outline
- empty center in the default state
- darker outline and filled center dot in the selected state
- subtle hover feedback without bright accent colors

There must only be one selected provider at a time.

When a provider becomes selected:

- its radio control becomes selected
- the whole card enters a mild active state
- the right configuration panel updates to that provider

### Right Configuration Panel

The right panel should keep a formal settings layout with three clear layers:

- header area with title, status, and short guidance
- single-column form field stack
- footer area with help text and actions

The fields remain:

- API Key
- 模型 ID
- API Endpoint
- 其他必要参数

The bottom action row should remain restrained:

- `重置`
- `保存配置`

This pass does not require real backend persistence for provider credentials. Client-side typed state is sufficient as long as the layout and selection model are fully implemented.

## Architecture

This pass should introduce or refine four bounded client-side units.

### 1. History Folder Settings Store

A browser-only module responsible for:

- checking File System Access API support
- opening the directory picker
- requesting read/write permission
- saving and loading the directory handle from `IndexedDB`
- exposing a simple UI-facing status model

This keeps low-level browser APIs out of page components.

### 2. History File Writer

A browser-only module responsible for:

- generating stable unique filenames
- serializing session snapshots into a stable JSON structure
- creating or updating the session JSON file
- surfacing safe error results instead of throwing uncontrolled UI errors

### 3. Settings Page Surface

The settings page should only:

- read the current folder state
- display folder name and status
- trigger choose / re-choose actions
- show lightweight feedback

It should not directly contain complex File System Access logic.

### 4. Providers Page Surface

The providers page should:

- own the selected provider id
- render provider cards with explicit single-selection semantics
- render the selected provider form panel

The provider card component should be upgraded to support the new top-right control and stronger active-state styling.

## Data Flow

### Folder Selection Flow

1. User opens `/settings`
2. Page loads any saved directory handle from `IndexedDB`
3. Page checks whether permission is still granted
4. Page renders folder name and current status
5. User clicks `选择文件夹` or `重新选择`
6. Browser shows directory picker
7. Chosen directory handle is stored in `IndexedDB`
8. UI updates immediately

### Session Saving Flow

1. User starts a debate
2. `SessionShell` receives the first session payload with `session.id`
3. History writer resolves the configured folder state
4. If a usable handle exists, it generates the session filename and writes the first JSON snapshot
5. On every later session update, the same filename is overwritten with the latest JSON snapshot
6. On final states such as complete or stopped, one last write is attempted

### Provider Selection Flow

1. Providers page renders all provider cards
2. One provider is selected by default
3. Clicking a different card or its top-right control updates the selected id
4. The card selection state updates
5. The right-side panel rerenders with that provider's configuration copy and values

## Error Handling

### Settings And History Saving

- unsupported browser: render unsupported state, disable folder picking
- permission denied by user: remain in `未选择` or `需要重新授权`, no blocking error modal
- permission revoked later: render `需要重新授权`
- write failure: preserve debate flow, expose lightweight warning only

### Providers Page

- provider selection should never produce a blank right panel
- the page must always have one active provider
- switching provider should not visually collapse or remount the layout in a jarring way

## Testing Strategy

Tests should cover the behavior change, not just the rendered copy.

### Settings Page

- renders a single primary history-folder card
- shows `选择文件夹` when no folder is selected
- shows folder name and `重新选择` after a folder is available
- shows unsupported state when the browser API is unavailable

### History Folder Store / Writer

- generates a unique filename in the required format
- keeps one stable filename for the same session
- serializes the required session fields
- handles permission or write failures without crashing callers

### Session Shell Integration

- writes the first snapshot when a session starts
- writes updates as session polling returns newer snapshots
- writes a final snapshot for terminal states when possible

### Providers Page

- renders provider cards with the radio-like control
- defaults to a single selected provider
- switches selected provider when another card is clicked
- updates the right panel heading and fields to match the selection

## Scope Boundary For The Next Implementation Pass

This implementation pass should include:

- the simplified `/settings` page
- browser-side history folder selection
- browser-side JSON file saving for debate sessions
- the refined `/providers` page selection card behavior

This implementation pass should not include:

- reading JSON files back into `/history`
- desktop-runtime migration
- server persistence for provider credentials

## Success Criteria

This pass is successful when:

- `/settings` feels like a calm single-purpose product page
- users can choose and re-choose a local history folder from the browser
- the selected folder state survives page reloads in the same browser profile
- each debate session writes to exactly one JSON file with a unique timestamped filename
- failed file writes do not break debates
- `/providers` has a stronger left-right layout with explicit single selection
- the new selection control is clear, restrained, and integrated with the card rather than bolted on
