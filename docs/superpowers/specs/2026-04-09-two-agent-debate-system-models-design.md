# Two Agent Debate System-Provided DeepSeek Models Design

Date: 2026-04-09

## Purpose

This pass simplifies the product surface by removing user-managed model configuration from the UI and replacing it with a small built-in model choice.

The app should feel like a focused decision product, not a model console.

## Why This Pass Exists

The current surface still carries too much operator-style setup:

- `Advanced settings` is visible product complexity
- users are asked for `baseUrl` and `apiKey`
- model configuration feels like infrastructure instead of a product choice

For this version, the app should provide the model runtime itself and let users choose only which built-in model to use.

## Goals

- Remove `Advanced settings` from the user-facing UI
- Remove user-entered `baseUrl`
- Remove user-entered `apiKey`
- Expose a single visible `Model` selector in the main form
- Provide only built-in DeepSeek options for now:
  - `deepseek-chat`
  - `deepseek-reasoner`
- Keep the taiji as part of the product identity
- Place the taiji to the left of the product name
- Keep the UI-language switch as a separate utility control on the right

## Non-Goals

- Reintroducing user-managed provider credentials in this pass
- Adding multi-provider selection UI yet
- Reworking debate logic
- Reworking search/runtime orchestration beyond model configuration flow
- Exposing a hidden operator/debug panel

## Design Decisions

### 1. Product Surface Simplification

The visible form should contain only first-class user decisions:

- decision question
- temperament pair
- Lumina temperament assignment
- model selector
- start button

Remove from the surface UI:

- `Advanced settings`
- model endpoint test button
- base URL field
- API key field
- provider wording tied to OpenAI-compatible endpoints

This makes the page read as a product workflow rather than a configuration workflow.

### 2. Built-In Model Choice

The user should see one model selector in the main form.

Initial options:

- `deepseek-chat`
- `deepseek-reasoner`

The user chooses only the model name. All provider credentials and routing are system-managed.

### 3. Runtime Ownership of Provider Configuration

For this pass, the runtime should own the DeepSeek configuration.

Fixed runtime values:

- `baseUrl = https://api.deepseek.com`
- `apiKey = system-configured secret`

User-controlled value:

- selected model

Important constraint:

- the API key must stay server-side only
- it must not appear in client-side code, visible form state, or browser payloads other than the selected model

### 4. Submission Contract Change

The current form contract includes raw provider configuration. This pass should simplify the submission shape.

Current intent:

- question
- preset selection
- language
- provider config

New intent:

- question
- preset selection
- language
- selected model

The server/runtime then maps the selected model onto the built-in DeepSeek configuration.

### 5. Future-Proofing Boundary

This pass should simplify the UI without painting the runtime into a corner.

Recommended internal direction:

- keep a provider/model abstraction internally
- remove only the user-managed provider surface

That keeps a clean upgrade path for later:

- today: built-in DeepSeek model selector
- later: more built-in models
- later if needed: optional user-supplied provider mode returns as a separate product path

### 6. Hero Lockup

The hero should treat the taiji and product name as one lockup.

Layout direction:

- taiji on the left
- product name beside it
- language switch on the right

Why:

- the taiji is part of the identity, not a utility ornament
- the language switch is a utility control and should not visually own the symbol

The visible product name should still switch by UI language:

- English UI: `Dualens`
- Chinese UI: `两仪决`

### 7. Copy and Hierarchy

The hero should stay concise:

- product lockup
- main value statement
- one supporting line if needed

The form should no longer contain any operator-style setup copy.

## Implementation Boundary

This pass is expected to touch mainly:

- `src/components/question-form.tsx`
- `src/components/session-shell.tsx`
- `src/lib/types.ts`
- `src/lib/ui-copy.ts`
- session route/client payload handling
- runtime/provider config mapping
- related tests

It will likely remove or simplify code in:

- `src/components/advanced-settings.tsx`
- any tests that still assume visible advanced provider controls

Whether the file is deleted or left unused is an implementation choice. The product behavior requirement is that `Advanced settings` no longer appears in the UI.

## Error Handling

Removing advanced settings also removes the separate manual endpoint test flow from the user surface.

For this version:

- model-selection errors should surface during normal start flow
- diagnosis should still identify model/runtime failures clearly
- failures should refer to the selected built-in model rather than asking the user to debug raw endpoint settings

This keeps the product honest: the system owns infrastructure, the user owns only the model choice.

## Testing Focus

This pass should verify:

- `Advanced settings` is gone from the page
- no visible base URL/API key fields remain
- the form shows a built-in model selector
- the model selector submits the chosen DeepSeek model
- browser payloads no longer carry raw provider credentials from the UI
- the hero renders taiji to the left of the product name
- the language switch remains separate from the brand lockup
- session start behavior still works with the built-in DeepSeek configuration path

## Open Constraint

This design assumes the system-owned DeepSeek API key is acceptable for the current local/development version.

If later distribution or public deployment is needed, provider secret management will need a separate design pass.
