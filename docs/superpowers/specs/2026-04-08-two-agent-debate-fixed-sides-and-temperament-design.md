# Two Agent Debate Fixed Sides and Temperament Design

Date: 2026-04-08

## Purpose

This document defines a focused product-model refinement for the debate-side identities and preset system.

The goal is to remove the current confusion between:

- side identity
- side naming
- debate role
- temperament pairing

This pass makes the two sides fixed, named product characters and moves user choice into temperament mapping instead of editable side names.

## Why This Pass Exists

The current model has become muddy in three ways:

1. `Agent A / Agent B name` duplicates concepts already implied by the preset system.
2. `Supporter vs Skeptic` behaves more like a debate stance pair than a personality pair, which makes it feel inconsistent beside the other presets.
3. Users should be choosing how the two fixed sides think, not manually renaming the sides themselves.

The product will be cleaner if side identity is fixed and user choice is redirected into temperament assignment.

## Goals

- Remove editable side names from Advanced Settings.
- Give both sides permanent product identities.
- Remove `Supporter vs Skeptic` from the current preset set.
- Redefine `Debate preset` as a temperament-pair system.
- Let users choose which side gets which temperament within a pair.
- Keep the UI explicit about both fixed side names at all times.
- Avoid visible `正方 / 反方` labels in the surface UI.

## Non-Goals

- Full personality authoring system
- MBTI-style persona controls
- Freeform side renaming
- Arbitrary dual-side prompt editing in this pass
- Rebuilding the broader diagnostics flow
- Replacing the existing debate orchestration logic

## Product Model

### Fixed Side Identities

The two sides become permanent product characters.

Chinese UI:

- `乾明`
  - `立论主张`
- `坤察`
  - `驳论审视`

English UI:

- `Lumina`
  - `argument lead`
- `Vigila`
  - `critical review`

These names should be visible throughout the core experience.

### Important Surface Rule

Do not surface `正方 / 反方` or `affirmative / opposing` as primary labels in the main product UI.

The fixed names plus the short functional descriptors should carry the meaning instead.

## Debate Preset Redesign

### Current Problem

The preset list currently mixes distinct concepts:

- temperament pairs
- stance pairs

That makes the control harder to interpret and leads to overlap with editable agent naming.

### New Preset Set

For this version, the available temperament pairs should be:

- `Cautious / Aggressive`
- `Rational / Intuitive`
- `Cost-focused / Benefit-focused`
- `Short-term / Long-term`

Remove:

- `Supporter / Skeptic`

### Meaning

These presets are not names and not deep personas.

They are:

- paired thinking styles
- paired argument tendencies
- paired decision lenses

## Mapping Model

### User Choice

The user should choose:

1. the temperament pair
2. which temperament `Lumina / 乾明` receives

The opposite side then receives the paired counterpart automatically.

### Example

If the selected pair is:

- `Cautious / Aggressive`

and the user assigns:

- `Lumina / 乾明 = Cautious`

then the system automatically sets:

- `Vigila / 坤察 = Aggressive`

If the user flips the assignment, the opposite side flips automatically too.

### Why

This is cleaner than duplicating preset entries like:

- `Cautious vs Aggressive`
- `Aggressive vs Cautious`

Those are not truly different presets. They are the same pair plus different side assignment.

## UI Design

### Always-Visible Side Identity

The interface should always show the fixed side names.

Chinese UI:

- `乾明`
  - `立论主张`
- `坤察`
  - `驳论审视`

English UI:

- `Lumina`
  - `argument lead`
- `Vigila`
  - `critical review`

This identity block should be visible in the preset area and in the debate workspace.

### Preset Interaction

Use a two-part interaction:

1. `Temperament pair`
2. `Lumina / 乾明 receives`

The second control should feel more direct and designed than a dry second dropdown.
It may be presented as compact selectable cards or segmented options, as long as the behavior remains:

- choose one side of the pair for `Lumina / 乾明`
- auto-assign the opposite side of the pair to `Vigila / 坤察`

### Explicit Design Constraint

Do not reintroduce editable `Agent A / Agent B name` inputs in this flow.

## Prompt and Runtime Implications

### Fixed Names in Output

The runtime should use the fixed side names for visible speaker identity:

Chinese:

- `乾明`
- `坤察`

English:

- `Lumina`
- `Vigila`

### Functional Role

The short descriptors should remain a presentation aid, but the runtime can still internally understand one side as the lead argument side and the other as the critical review side.

The important rule is:

- UI identity is fixed
- temperament assignment is variable

### Prompt Model

Prompt construction should stop depending on user-edited side names.

Instead it should be derived from:

- selected temperament pair
- chosen assignment for `Lumina / 乾明`
- automatic opposite assignment for `Vigila / 坤察`

## Advanced Settings Changes

Remove from Advanced Settings:

- editable side-name fields

This pass does not require adding new freeform side-prompt editing fields.

The key cleanup is removal, not replacement.

## Risks

- If the fixed identities are not shown consistently, users will still mentally map the product back to generic `Agent A / Agent B`.
- If preset mapping is not visually clear, users may not understand which side gets which temperament.
- If `Supporter / Skeptic` remains anywhere in the visible preset flow, the conceptual cleanup will remain incomplete.
- If the UI hides the short side descriptors entirely, some users may not understand the functional distinction between the two named sides.

## Decision Summary

This pass should:

- remove editable side names
- fix the two side identities as `乾明 / Lumina` and `坤察 / Vigila`
- show those names at all times
- pair them with short functional descriptors
- remove `Supporter / Skeptic`
- redefine presets as temperament pairs
- let users choose which temperament `Lumina / 乾明` receives
- auto-assign the opposite temperament to `Vigila / 坤察`

This pass should not:

- add freeform personality authoring
- add MBTI-like systems
- keep generic `Agent A / Agent B` naming as a user-facing concept

## Next Step

After this design is reviewed, the next step is to write an implementation plan for the fixed-sides and temperament-mapping pass.
