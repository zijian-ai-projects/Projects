# Dualens Global Language And Layout Polish Design

## Goal

Refine the mature multi-page Dualens workspace with a tighter debate-entry layout, quieter selection lists, an integrated rotating brand mark, and a global language preference controlled from Settings.

## Scope

This pass covers five product areas:

- Debate page role-card styling, role-card layout, swap feedback, and action-area compression.
- AI provider and search-engine list-card simplification.
- Sidebar brand-area integration and rotating taiji mark.
- Global language preference moved from Debate to Settings.
- Session and history language preservation.

This pass does not implement full server-side provider/search-engine persistence, history-record reading from JSON files, or a complete external i18n framework.

## Design

### Global Language Preference

The app will use a lightweight client-side preference provider. `AppPreferencesProvider` will live inside the workspace shell and expose `language` plus `setLanguage`. The value will default to `zh-CN`, load from `localStorage` on the client, and persist changes back to `localStorage`.

Settings becomes the only visible control for app language. Debate page no longer renders its own language switch. Sidebar labels, page headers, form text, section labels, evidence panel, timeline, summary panel, and session API payloads all use the global language. Each new session captures the language at submission time in `SessionInput.language`, so an existing session or saved JSON record keeps its original language even if the user later changes the global preference.

### Debate Page Polish

The dual-role section keeps the existing Lumina/Vigila semantic model and Chinese labels `乾明`/`坤察`. The visual treatment is tightened:

- `乾明` remains light, with black card border, black bordered order button, and black bordered `谨慎` style pill.
- `坤察` remains dark, with a white bordered `激进` style pill and a white-text `后` order button.
- Style pills show only the temperament label, not `风格：...`.
- The order button moves closer to the identity copy, and the style pill sits in the former right-side space.
- Role cards become narrower and lower, while the center `换` button stays visually centered between them.
- Clicking `换` swaps the assigned temperaments as before and also briefly flips the swap button background/text colors for tactile feedback.

The action section removes the sentence `本次辩论将使用当前默认模型与搜索引擎。`. Current model and current search-engine panels move to the left, and the primary start button moves to the right. Vertical padding is reduced to make the section feel like an action bar rather than a large content block.

### Selection List Simplification

The reusable selection-card item will no longer show `已配置`/`未配置` text in the left lists for AI providers or search engines. The right-side circular radio control remains the only selection indicator. The right-side configuration panel can still show a status tag, because it belongs to the detailed configuration context rather than the list navigation.

### Sidebar Brand Area

The top brand area will stop reading as a separate bordered card. It becomes a softer integrated brand block with no obvious card frame. The taiji SVG rotates slowly counterclockwise using CSS animation, while respecting `prefers-reduced-motion`. The description changes to:

`一个问题，正反两面，证据可见`

For English UI, the brand supporting line becomes:

`One question, two sides, visible evidence.`

### Page-Level Copy

The app will add a compact workspace copy map for sidebar navigation and page headers. The first implementation only covers current workspace pages and text visible in this flow. This keeps the implementation focused while making the global language control coherent across the app shell and pages.

## Data Flow

1. `AppShell` wraps workspace content in `AppPreferencesProvider`.
2. `useAppPreferences()` returns the active language to sidebar, page components, and settings.
3. Settings updates language via `setLanguage`.
4. Debate page passes the global language to `SessionShell`.
5. `QuestionForm` submits `SessionInput.language` using the global language at submit time.
6. `SessionShell` stores `historyMeta.language` from the submitted input, preserving historical language.

## Error Handling

If `localStorage` is unavailable or throws, the provider falls back to `zh-CN` and keeps working in memory. Invalid stored language values are ignored. Existing history-folder error handling is unchanged.

## Testing

Add or update tests for:

- Global preference helpers/provider loading, setting, invalid storage, and storage failure.
- Settings page language control.
- Debate page no longer showing a local language switch and using global copy.
- `QuestionForm` role-card/action-area copy and swap-button feedback behavior.
- Selection-card list items no longer rendering configuration status text.
- Sidebar integrated brand copy and rotating mark class.

Regression verification will run focused Vitest files, full `pnpm test`, and `pnpm build`.
