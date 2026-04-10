# Two Agent Debate Taiji Temperament Control Design

Date: 2026-04-09

## Purpose

This pass replaces the current temperament-assignment cards with a more compact control that reflects the product's yin-yang logic more directly.

The existing assignment UI is functional but visually redundant. It repeats temperament name, side assignment, card styling, and selection state in a way that feels heavier than the rest of the product.

## Why This Pass Exists

The current assignment area has two main problems:

- it uses verbose radio-card language for a binary mapping choice
- it does not visually express the product's core idea of paired opposition and inversion

The product already uses taiji as a brand element. The temperament mapping control should reuse that visual logic instead of behaving like a generic form section.

## Goals

- Remove the redundant explanatory sentence under `乾明 / Lumina`
- Remove the redundant explanatory sentence under `坤察 / Vigila`
- Replace the current two assignment cards with a compact taiji-inspired mapping control
- Keep the `Temperament pair` selector as-is
- Let the user assign one temperament to `乾明 / Lumina`
- Auto-assign the paired opposite temperament to `坤察 / Vigila`
- Make the mapping visually legible through black/white and opposing halves
- Keep the current logic and payload shape unchanged

## Non-Goals

- Reworking the fixed side identities
- Changing the selected temperament pair model
- Changing server/runtime behavior
- Introducing animation-heavy ornamental UI
- Making the control look like a traditional decorative taiji illustration

## Design Decisions

### 1. Remove Redundant Side Copy

Delete the two supporting paragraphs below the identity cards:

- `乾明始终固定在这组配对中的建设性一侧。`
- `坤察会自动获得 激进。`

The identity cards should become quieter and rely on the assignment control below for meaning.

### 2. Keep Pair Selection Separate

The `Temperament pair` selector remains a normal form control.

Examples:

- `谨慎 / 激进`
- `理性 / 直觉`
- `成本 / 收益`
- `短期 / 长期`

This preserves clarity: first choose the opposing pair, then choose how it maps onto the two sides.

### 3. Replace Assignment Cards With One Taiji-Inspired Control

The current `乾明个性` radio-card grid should be replaced by a single compact control.

The control should:

- present the two temperament options as one paired opposition
- visually express inversion using light/dark halves
- allow clicking either half to assign that temperament to `乾明 / Lumina`
- automatically map the opposite temperament to `坤察 / Vigila`

The user should experience the interaction as:

- choose pair
- flip the mapping

not:

- read two near-duplicate cards and infer inversion from text

### 4. Visual Form of the Control

Recommended visual direction:

- a rounded taiji-like disc or split orb centered in the assignment area
- one side rendered in dark tones
- one side rendered in light tones
- the selected `乾明 / Lumina` side highlighted as the assigned half
- the opposite side implicitly belongs to `坤察 / Vigila`

This should feel geometric and modern, not ornamental.

Visual constraints:

- no heavy traditional motifs
- no high-cost effects that make scrolling heavier
- use the existing page palette: ink, off-white, subtle warm paper tones
- maintain clear focus/hover states for accessibility

### 5. Supporting Labels Around the Control

The control should not rely on the raw taiji form alone.

Display concise labels showing the current mapping, for example:

Chinese:

- `乾明：谨慎`
- `坤察：激进`

English:

- `Lumina: Cautious`
- `Vigila: Aggressive`

These labels should sit close to the control and update immediately when the user flips the assignment.

### 6. Interaction Model

The current logical model stays intact.

Given a selected pair:

- clicking temperament A assigns temperament A to `乾明 / Lumina`
- temperament B is then assigned to `坤察 / Vigila`
- clicking temperament B reverses the mapping

The submitted payload remains:

- `pairId`
- `luminaTemperament`

So this is a surface redesign, not a data-model redesign.

### 7. Accessibility

The new control must remain keyboard- and screen-reader-accessible.

Requirements:

- preserve a real radio-group semantic or equivalent accessible selection model
- maintain a clear accessible name for each choice
- ensure visible focus state
- do not encode meaning only by color

A visually custom taiji control is acceptable as long as the underlying selection remains accessible.

## Implementation Boundary

This pass should mainly touch:

- `src/components/question-form.tsx`
- `src/lib/ui-copy.ts` if supporting labels change
- targeted tests for the form

It should not require runtime, route, or orchestrator changes.

## Testing Focus

This pass should verify:

- the two descriptive side paragraphs are removed
- the assignment area still exposes two selectable choices accessibly
- selecting either choice updates the visible `乾明 / Lumina` and `坤察 / Vigila` mapping labels
- submission payload remains unchanged
- the new control does not reintroduce duplicated side-name text into each option label

## Recommendation

Implement the taiji assignment control as a custom-styled but semantically accessible binary selector.

That gives the product a more distinctive interaction without changing the underlying session contract or increasing system complexity.
