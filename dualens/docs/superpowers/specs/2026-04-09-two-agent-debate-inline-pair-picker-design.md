# Two Agent Debate Inline Pair Picker Design

Date: 2026-04-09

## Purpose

This pass removes the separate temperament-pair selector and folds pair selection directly into the two side modules.

The temperament area should become a single compact row with two side modules and one central swap button. Pair selection should feel embedded in the two sides themselves, not split into a separate form control.

## Why This Pass Exists

The current layout still separates:

- pair selection
- visible mapping
- swap action

That makes the temperament area more procedural than it needs to be.

The user wants a more direct model:

- click the visible temperament label on either side
- choose a pair from a popup list
- both sides update together
- use the central swap button only when inversion is needed

## Goals

- Remove the standalone `性格配对` selector entirely
- Keep only the two side modules and the central swap button
- Make the visible temperament label inside each side module clickable
- Show only the preset pair list in the popup
- Apply the chosen pair to both sides immediately
- Reset pair orientation to the default mapping when a new pair is selected
- Keep the swap button as the only inversion control
- Visually enlarge and emphasize the temperament labels

## Non-Goals

- Changing side identities
- Changing the swap button behavior
- Adding freeform custom temperament input
- Adding nested side-specific pair choices in the popup
- Changing submission payload structure

## Design Decisions

### 1. Remove the Standalone Pair Selector

Delete the separate `性格配对` dropdown from the form.

The temperament area should no longer be split into:

- a left configuration control
- a right mapping row

Instead, the mapping row becomes the only temperament configuration surface.

### 2. Keep a Single Compact Row

The row should contain only:

- `乾明` module
- central rotating swap button
- `坤察` module

No additional selector, legend, or control row should sit beside or below it unless strictly needed for accessibility.

### 3. Make the Temperament Label Clickable

Inside each side module, the visible temperament label becomes the trigger.

Examples:

- click `谨慎`
- click `激进`

Both sides should open the same pair-list popup.

This means pair selection becomes contextual and direct:

- the user interacts with the visible temperament itself
- not with a separate form widget elsewhere

### 4. Popup Content

The popup should show only the preset pair list:

- `谨慎 / 激进`
- `理性 / 直觉`
- `成本 / 收益`
- `短期 / 长期`

No side-specific mapping text should appear inside the popup.

The popup answers only one question:

- which opposition pair do you want?

### 5. Pair Selection Rule

When the user chooses a pair, the system resets to the pair’s default orientation:

- first temperament goes to `乾明 / Lumina`
- second temperament goes to `坤察 / Vigila`

Example:

- user picks `理性 / 直觉`
- result becomes `乾明：理性`, `坤察：直觉`

If the user wants the reverse, they use the swap button afterward.

This rule is intentional because it is:

- predictable
- easy to learn
- easy to communicate internally

### 6. Swap Button Role

The swap button remains the only explicit inversion control.

It should continue to:

- swap `luminaTemperament`
- rotate and invert visually based on state
- remain centered between the two modules

This pass does not change the button behavior. It only changes how the pair is selected.

### 7. Label Emphasis

The temperament labels should become more visually prominent inside their modules.

Recommended direction:

- larger type than the identity descriptor
- vertically centered within the module
- stronger chip-like or pill-like emphasis
- black/white reversed against the card background

The side identity (`乾明`, `坤察`) remains visible but secondary.

The user’s eye should go first to the temperament label, because it is both the primary state and the clickable control.

### 8. Accessibility

The clickable temperament labels must remain accessible.

Recommended behavior:

- render the visible temperament label as a button trigger
- use an accessible name such as:
  - English: `Choose temperament pair`
  - Chinese: `选择性格配对`
- ensure keyboard support for opening the popup
- ensure popup options are accessible buttons or menu items

### 9. Data Model

No backend or payload changes are required.

The component should still submit:

- `pairId`
- `luminaTemperament`

Pair selection updates both values together:

- set `pairId` to the chosen pair
- set `luminaTemperament` to the pair’s first option

## Implementation Boundary

This pass should mainly touch:

- `src/components/question-form.tsx`
- `src/lib/ui-copy.ts`
- `src/components/question-form.test.tsx`
- `tests/e2e/session-flow.spec.ts`

It should not require changes to runtime, routes, session shell, or orchestrator.

## Testing Focus

This pass should verify:

- the standalone `性格配对` selector is gone
- the two visible temperament labels act as triggers
- choosing a pair from the popup updates both sides
- choosing a new pair resets to the default orientation
- the swap button still reverses the current mapping afterward
- the submitted payload still carries the correct `pairId` and `luminaTemperament`

## Recommendation

Implement the temperament area as a self-contained inline pair picker:

- click visible temperament
- choose pair
- swap if needed

That makes the configuration feel integrated into the two sides themselves and removes the last remaining “form-control panel” feeling from this section.
