# Hero Alignment And Idle Colors Design

Date: 2026-04-09

## Goal

Polish two remaining visual rough edges:

- correct the idle-state colors of the `乾明 / Lumina` order chip and the center `换 / swap` button
- better align the brand text block vertically with the taiji mark in the hero

This is a styling-only pass. It does not change control behavior, layout structure, or data flow.

## Scope

This pass includes:

- changing the idle style of the `乾明 / Lumina` order chip to black background with white text
- changing the idle style of the center `换 / swap` button to white background with black text
- shifting the hero brand text block slightly downward relative to the taiji

This pass does not include:

- changing dropdown behavior
- changing speaking-order logic
- changing swap logic
- changing hero structure or taiji size

## Product Behavior

No behavior changes.

The controls keep the same actions and the hero keeps the same structure.

## Visual Design

### Lumina order chip

The small speaking-order chip inside the `乾明 / Lumina` card should idle as:

- black background
- white text

This is the resting visual state.

### Center swap button

The center `换 / swap` button should idle as:

- white background
- black text

It should remain clearly visible even when not hovered.

### Hero alignment

The brand text block containing:

- product name
- subtitle

should move slightly downward so that its visual center aligns more closely with the visual center of the taiji icon.

This should be done by adjusting the alignment and/or top spacing of the text block only, not by resizing the taiji.

## Testing

Update focused UI assertions for:

- `乾明 / Lumina` order chip idle classes
- center `换 / swap` button idle classes
- optionally a structural test that the hero text block uses the updated alignment class if there is already a stable DOM hook

## Acceptance Criteria

- `乾明 / Lumina` order chip is black with white text at rest
- center `换 / swap` button is white with black text at rest
- hero text block is visibly lowered to align better with the taiji center
