# Dualens Configuration Draft And Polling Fixes Design

## Goal

Apply the requested configuration-page polish, preserve the debate question while moving between first-level workspace pages, make the debate runtime summary reflect configured providers/search engines, and prevent model calls from leaving the UI in endless polling.

## Requirements

- AI provider and search engine forms save directly as the user types.
- The reset and save buttons are removed from both configuration pages.
- Provider and search-engine list status text uses compact pill styling.
- Configured list items use black status pills with white text; unconfigured list items remain visually quieter.
- The debate question draft survives navigation between workspace pages.
- The debate question draft resets on full page refresh because it is only held in React memory.
- Debate action summary cards show `未配置` / `Not configured` when no active provider or search engine is configured.
- Debate action summary cards link to `/providers` and `/search-engines`.
- Returning to the debate page after configuring a provider or search engine shows the newly configured model/search engine.
- Long-running OpenAI-compatible model calls time out and surface a diagnosis so the frontend stops polling a stuck session.

## Architecture

Keep provider and search-engine configuration in the existing localStorage preference modules. Change the page forms so local state and storage update in the same input handler, without explicit save/reset actions.

Add a workspace-scoped in-memory debate question draft provider under the existing App Router workspace shell. `SessionShell` reads this optional draft context and passes a controlled question value into `QuestionForm`, while tests outside the workspace keep a local fallback.

Add active display helpers for provider and search-engine preferences so UI can distinguish selected-but-unconfigured from configured. Add a timeout wrapper inside the OpenAI-compatible provider so stuck model fetches reject with an abort-shaped timeout error that existing diagnostics can classify.

## Testing

- Configuration page tests cover automatic persistence, removed buttons, and status pill styling.
- Session shell tests cover draft preservation across unmount/remount inside the workspace draft provider.
- Question form tests cover unconfigured summary labels and links to configuration pages.
- Provider tests cover timeout rejection for hung OpenAI-compatible fetches.
