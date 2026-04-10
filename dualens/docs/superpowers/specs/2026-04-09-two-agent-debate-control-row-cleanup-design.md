# Control Row Cleanup Design

Date: 2026-04-09

## Goal

Refine the compact side-card control row so it feels visually stable and easier to use.

The current layout already has the right overall structure, but the micro-interactions are off:

- the speaking-order chip placement is awkward
- only one order chip feels actionable
- the temperament dropdown affects the whole card region visually
- the center swap button style is too weak
- the `坤察 / Vigila` supporting text lacks contrast

This pass fixes those issues without changing the broader page structure or data model.

## Scope

This pass includes:

- moving the speaking-order chip to the left of the temperament button inside each side card
- making both visible order chips act as toggles
- changing the temperament picker to a local anchored dropdown under the temperament button
- preventing the side card from resizing when the dropdown opens
- changing the center swap button to black background with white text
- removing swap-text rotation
- increasing `坤察 / Vigila` supporting text contrast

This pass does not include:

- changing payload shape
- changing fixed identities
- changing the session runtime
- changing the model selector
- changing the broader hero/workspace layout

## Product Behavior

### Speaking-order chips

The speaking-order chip remains inside each side card, but moves to the left of the temperament button so both controls read as one row.

Layout inside each card:

- left: speaking-order chip
- right: temperament button

Behavior:

- both visible chips are clickable
- clicking either chip flips speaking order
- the chips remain opposite:
  - if `乾明 / Lumina` is `先 / First`
  - then `坤察 / Vigila` is `后 / Second`
- clicking either one toggles the pair

### Temperament dropdown

The temperament button remains the trigger for pair selection, but the dropdown behavior changes:

- the dropdown appears below the clicked/hovered temperament button only
- it floats outside the card
- it does not push, expand, or resize the `乾明 / 坤察` card container
- choosing a pair closes the dropdown immediately
- clicking away closes the dropdown
- hovering away from the local control region also closes it

Selecting a pair still resets orientation to default:

- first temperament -> `乾明 / Lumina`
- second temperament -> `坤察 / Vigila`

The center swap button remains the only control that reverses temperament assignment after pair selection.

### Swap button

The center button remains circular and centered between the two side cards.

Changes:

- background becomes black
- text becomes white
- visible label remains localized:
  - Chinese: `换`
  - English: `swap`
- the text no longer rotates

The button still swaps the two temperament assignments.

## Visual Design

### Side-card control row

Each side card should present the two interactive controls as one compact row:

- speaking-order chip on the left
- temperament button on the right

The row should be visually aligned and vertically centered.

The temperament button remains the more dominant control.

### Color rules

`乾明 / Lumina` card:

- speaking-order chip: black background, white text
- temperament button: black background, white text

`坤察 / Vigila` card:

- speaking-order chip: white background, black text
- temperament button: white background, black text

Center swap button:

- black background
- white text

### Contrast fix

All lower supporting text in the `坤察 / Vigila` card should be readable on black:

- descriptor text should be white or strong near-white
- no low-opacity gray that reduces readability

## Accessibility

Requirements:

- speaking-order chips remain buttons
- temperament button remains a button
- dropdown options remain buttons
- center swap remains a button with descriptive localized aria label
- dropdown must remain clickable and keyboard reachable
- click-away dismissal should work

## Testing

Update coverage for:

- order chip placement/interaction assumptions
- both visible order chips flipping the speaking order
- dropdown appearing under the temperament button without relying on card-expansion behavior
- swap button visible label no longer rotating
- black/white swap button styling
- `坤察 / Vigila` supporting text contrast class expectations

## Acceptance Criteria

- `先 / 后` or `First / Second` chips appear to the left of the temperament buttons
- clicking either visible order chip flips the order
- opening the temperament list does not expand the whole side card
- the dropdown is anchored to the temperament button
- the center swap button is black with white text
- the swap label does not rotate
- `坤察 / Vigila` supporting text is clearly readable on the black card
