# Two Agent Debate Temperament Row Swap Design

Date: 2026-04-09

## Purpose

This pass simplifies the temperament-assignment area again by removing the large taiji selector and replacing it with a tighter horizontal row built around two mapping cards and one taiji-themed swap button.

The previous taiji selector improved the concept but still consumed too much vertical space and made the form feel heavier than necessary.

## Why This Pass Exists

The current assignment section still has three problems:

- the left `性格配对` control and the right assignment block do not align cleanly in height and vertical rhythm
- the large black/white circular selector creates unnecessary vertical bulk
- the mapping interaction should now be expressed as a simple swap, not a large selection surface

The interaction model is already binary. A dedicated swap button is a cleaner expression of that model.

## Goals

- Align the `性格配对` selector block and the `乾明个性` block so their visible controls share the same row height and top/bottom edges
- Remove the large lower taiji half-disc selector completely
- Remove the extra vertical whitespace created by that selector
- Keep the current selected pair visible on the left
- Keep the current `乾明 / 坤察` mapping visible on the right
- Add a taiji-themed swap button between the two mapping cards
- Make the swap button flip only the current pair mapping
- Keep the existing data contract unchanged

## Non-Goals

- Changing the temperament pair model
- Changing side identities
- Changing submission payload structure
- Reworking the surrounding hero or session shell
- Adding animation-heavy effects

## Design Decisions

### 1. Two-Column Top Row

Keep the two-column structure:

- left: `性格配对`
- right: `乾明个性`

But make the visible controls align as a single horizontal composition.

The left select control and the right assignment row should:

- share the same overall vertical footprint
- align their top edges
- align their bottom edges
- keep their internal content vertically centered

### 2. Remove the Lower Taiji Selector

Delete the large circular taiji selection block entirely.

That means removing:

- the big circular visual
- the hidden-radio overlay labels tied to that visual
- the extra lower container and its spacing

The assignment section should no longer stack into two levels. It becomes one compact row.

### 3. Replace Selection With Swap

The new interaction model is:

- the pair is chosen on the left
- the mapping is shown on the right
- a swap button flips `luminaTemperament`

This means the right side no longer needs two separate option targets. It only needs:

- current mapping card for `乾明 / Lumina`
- swap button
- current mapping card for `坤察 / Vigila`

### 4. Mapping Cards

Keep two compact mapping cards:

Chinese example:

- `乾明：谨慎`
- `坤察：激进`

English example:

- `Lumina: Cautious`
- `Vigila: Aggressive`

Visual treatment:

- left card remains light
- right card remains black
- both cards should use the same height
- text should be vertically centered

### 5. Taiji Swap Button

Place a small taiji-themed button between the two mapping cards.

The button should:

- look clearly interactive
- fit the existing brand style
- be smaller than the old selector and smaller than the mapping cards
- flip the two current temperament assignments when clicked

Functionally:

- if `luminaTemperament` is the first option in the pair, switch to the second
- if it is the second, switch back to the first

This is a direct inversion of the current mapping and should not alter the selected pair.

### 6. Accessibility

The swap button should have a clear accessible name.

Recommended pattern:

- visible taiji icon
- accessible label like:
  - English: `Swap temperament assignment`
  - Chinese: `交换个性分配`

The button should be keyboard-activatable and visibly focusable.

### 7. Data Model

No runtime or submission changes are needed.

The form still submits:

- `pairId`
- `luminaTemperament`

The swap button simply changes `luminaTemperament` in local state.

## Implementation Boundary

This pass should mainly touch:

- `src/components/question-form.tsx`
- `src/lib/ui-copy.ts` only if the swap button label or small support strings need localization
- `src/components/question-form.test.tsx`
- `tests/e2e/session-flow.spec.ts` if it still assumes the old selector interaction

It should not require changes to runtime, routes, orchestrator, or session payload validation.

## Testing Focus

This pass should verify:

- the large lower taiji selector is gone
- the assignment section is represented as one compact row
- the swap button is visible and accessible
- clicking the swap button flips the visible `乾明 / 坤察` mapping
- the submit payload still reflects the swapped `luminaTemperament`
- browser flow still works in Chinese UI

## Recommendation

Implement the assignment area as a compact horizontal mapping row with a central taiji swap button.

This keeps the yin-yang metaphor, removes vertical heaviness, and expresses the interaction more honestly as a flip rather than a selection grid.
