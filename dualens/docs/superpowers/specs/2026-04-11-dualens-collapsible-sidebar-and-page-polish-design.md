# Dualens Collapsible Sidebar And Page Polish Design

## Goal

Refine the workspace with a collapsible left navigation rail, tighter debate controls, restored lightweight provider/search status hints, and small copy/layout corrections.

## Scope

- Add a page-level button that collapses or expands the left sidebar.
- Keep the collapsed sidebar useful: taiji mark and primary navigation glyphs remain visible, hover/focus reveals each page label, and links still navigate.
- Update Debate page role-card width, swap-button behavior, and action-row alignment.
- Restore small `已配置` / `未配置` hints in AI provider and search-engine list items without reintroducing large status tags.
- Update brand copy and brand alignment.
- Remove duplicated language-setting description from Settings.

## Design

`AppShell` will become a client component and own `sidebarCollapsed`. It will pass this state to `AppSidebar` and render one toggle button at the top-left of the main content area. The sidebar width changes between `280px` and `88px`; when collapsed, text content is visually removed while the taiji mark and nav glyphs stay visible. Each collapsed navigation link exposes the page label through a compact tooltip on hover/focus.

The Debate role section will use a wider internal grid close to full card width, keeping the swap button centered in a fixed middle column. The swap button becomes a persistent toggle state: first click switches to black background and white text, second click returns to white background and black text. Hover does not change colors.

The Debate action section will align current model, current search engine, and start button closer to the right side and slightly higher by reducing top padding and using right-justified row layout on desktop.

Provider and search-engine selection cards will render a small status line under the item name. Configured status is dark and slightly emphasized; unconfigured status is muted. The previous large right-side status tag stays absent from list cards.

## Testing

Add or update tests for:

- Shell/sidebar collapse button toggles width/state and preserves collapsed navigation links.
- Collapsed links show page labels through title/aria label and hide full text.
- Sidebar brand English tagline uses `One question, two lenses, visible evidence`.
- Settings page no longer duplicates the language description text.
- Provider/search-engine list cards render lightweight status text without large list tags.
- Debate role cards are wider, swap button toggles persistently, hover class does not imply color change, and action row is right aligned.

Final verification: focused Vitest, full `pnpm test`, and `pnpm build`.
