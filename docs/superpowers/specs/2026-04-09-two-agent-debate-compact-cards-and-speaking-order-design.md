# Compact Cards And Speaking Order Design

Date: 2026-04-09

## Goal

Refine the temperament-and-side control area so it feels lighter, more direct, and more product-like.

This pass replaces the current verbose side-mapping presentation with a compact row of two side cards and a larger central swap button, while adding an independent control for speaking order.

The new UI should let users control two separate things without ambiguity:

- who gets which temperament
- who speaks first

## Scope

This pass includes:

- removing the remaining mapping labels and helper headings from the side cards
- shrinking the `乾明 / Lumina` and `坤察 / Vigila` cards substantially
- right-aligning the visible temperament buttons
- replacing the current full-row popup with a local dropdown anchored to the temperament button
- making the dropdown open from hover or click and close when leaving the control area
- enlarging the central swap button and changing its content to text
- adding a new speaking-order toggle inside each side card
- extending the submitted session payload with first-speaker information

This pass does not include:

- changing the fixed side identities
- changing the system model selection flow
- changing debate language behavior
- changing backend research behavior

## Product Behavior

### Side cards

The temperament row remains a single compact three-part layout:

- left card: `乾明 / Lumina`
- center: temperament swap button
- right card: `坤察 / Vigila`

Each side card now contains only:

- side name
- side descriptor
- small speaking-order chip
- large temperament button

The following current UI strings are removed from this area:

- `乾明个性`
- `乾明：谨慎`
- `坤察：激进`

### Temperament pair selection

The standalone temperament-pair selector remains removed.

The large visible temperament button inside either card becomes the entry point for choosing a pair.

Interaction:

- hover over the temperament button opens the pair list
- click on the temperament button also opens the pair list
- the dropdown is visually anchored to the clicked/hovered button, not centered in the page
- the dropdown contains only preset pair labels
- choosing a pair updates both sides immediately
- choosing a pair resets orientation to the default mapping:
  - first temperament -> `乾明 / Lumina`
  - second temperament -> `坤察 / Vigila`
- leaving the trigger/dropdown area closes the dropdown
- the dropdown should not remain stuck open after the pointer leaves

Preset list remains:

- `谨慎 / 激进` or `Cautious / Aggressive`
- `理性 / 直觉` or `Rational / Intuitive`
- `成本 / 收益` or `Cost-focused / Benefit-focused`
- `短期 / 长期` or `Short-term / Long-term`

### Temperament swap button

The central swap button remains responsible only for temperament inversion.

It should:

- be larger than the current button
- remain circular
- match the black/white rounded minimal style of the page
- remove the arrow icon entirely
- show centered text instead:
  - Chinese UI: `换`
  - English UI: `swap`

Clicking the swap button:

- swaps `乾明 / Lumina` and `坤察 / Vigila` temperaments within the current pair
- preserves the selected pair
- keeps the current animation semantics, but the visible center content is text rather than arrows

### Speaking order toggle

Each side card gets a separate small chip indicating speaking order.

Labels:

- Chinese: `先` / `后`
- English: `First` / `Second`

Behavior:

- default order is `乾明 / Lumina = First`, `坤察 / Vigila = Second`
- clicking either side’s order chip flips the order
- the two chips always remain opposite
- flipping speaking order does not affect temperament assignment
- flipping temperament does not affect speaking order

This is an independent control with independent state.

## Layout And Visual Design

### Card height and density

Both side cards should become noticeably shorter than the current implementation, targeting roughly a forty percent reduction in vertical footprint.

That means:

- reduced vertical padding
- smaller minimum card height
- less vertical spacing between identity text and controls

The row should feel compact and horizontally balanced.

### Temperament button

The temperament button becomes the main visual emphasis inside each side card.

Requirements:

- right-aligned inside the card
- larger than the order chip
- vertically centered within the card layout
- same black/white reversed treatment as today:
  - `乾明 / Lumina` temperament button uses dark fill with light text
  - `坤察 / Vigila` temperament button uses light fill with dark text

### Dropdown

The pair list should be positioned relative to the temperament trigger.

Requirements:

- appears directly below the hovered/clicked temperament button
- not clipped by the outer container
- compact width, sized to content but visually consistent
- layered above nearby content
- closes cleanly when pointer focus leaves the local control area

### Order chip

The speaking-order chip should be visually secondary.

Requirements:

- small rounded pill or chip
- placed near the upper-right area of each card
- opposite black/white treatment to stay legible against the card background
- clearly clickable

### Alignment

The entire row should align cleanly:

- both side cards share equal height
- the central swap button is vertically centered with the cards
- the temperament buttons align visually across both sides
- the order chips align visually across both sides

## Data Model

Add first-speaker state to the form payload.

Current submitted structure:

```ts
{
  question,
  presetSelection: {
    pairId,
    luminaTemperament
  },
  language,
  model
}
```

New structure:

```ts
{
  question,
  presetSelection: {
    pairId,
    luminaTemperament
  },
  firstSpeaker,
  language,
  model
}
```

Where:

- `firstSpeaker` is `"lumina"` or `"vigila"`

Default:

- `"lumina"`

The rest of the payload remains unchanged.

## Accessibility

The new controls must remain keyboard-usable.

Requirements:

- temperament button remains a real button
- pair list items remain real buttons
- order chip remains a real button
- swap button remains a real button
- accessible names remain localized
- dropdown visibility should still be reachable by click, not hover-only

Hover support is additive. Click support remains required.

## Testing

Update unit and browser coverage for:

- removed mapping labels and removed `乾明个性`
- anchored pair dropdown interaction
- dropdown closes after selection
- dropdown closes when leaving the local control region
- new order-chip labels in Chinese and English
- order toggle flips independently of temperament
- swap button still only swaps temperament
- submitted session payload includes `firstSpeaker`

## Implementation Notes

The safest implementation is to keep the existing pair-selection state model:

- `temperamentPairId`
- `luminaTemperament`

and add:

- `firstSpeaker`

For the dropdown, use local component state plus pointer/focus events tied to the temperament trigger region, rather than a page-level overlay.

## Acceptance Criteria

- No standalone temperament-pair selector is visible
- No `乾明个性`, `乾明：...`, or `坤察：...` summary labels are visible in the cards
- Temperament buttons are right-aligned and visually dominant
- Hovering or clicking a temperament button opens a local dropdown anchored to that button
- The dropdown closes after selection and does not remain stranded in the page
- The central button shows `换` or `swap`
- Speaking order can be flipped independently via `先/后` or `First/Second`
- Session submission includes `firstSpeaker`
