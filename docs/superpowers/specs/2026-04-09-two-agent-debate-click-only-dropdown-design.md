# Click-Only Dropdown Design

Date: 2026-04-09

## Goal

Make the temperament picker stable and predictable.

The current hover-assisted dropdown is too sensitive and disappears before selection. This pass changes the interaction to a click-only dropdown with clean close rules and a tighter visual relationship to the temperament button.

It also fixes the `乾明 / Lumina` speaking-order chip idle-state contrast so it does not render white-on-white.

## Scope

This pass includes:

- removing hover-open behavior from the temperament dropdown
- making the dropdown open on button click only
- making the dropdown close on:
  - selecting an option
  - clicking the same button again
  - clicking elsewhere on the page
- keeping the dropdown open otherwise
- matching the dropdown width to the temperament button width
- centering dropdown option labels
- fixing the idle visual style of the `乾明 / Lumina` speaking-order chip

This pass does not include:

- changing payload shape
- changing the speaking-order toggle logic
- changing the swap button behavior
- changing the surrounding layout outside the local control region

## Product Behavior

### Temperament dropdown

The temperament button becomes a click-only trigger.

Behavior:

- click the temperament button: open dropdown
- click the same temperament button again: close dropdown
- click an option: apply the pair and close dropdown
- click anywhere outside the control: close dropdown
- moving the mouse away does nothing by itself

There is no hover-open behavior in this version.

### Dropdown positioning and size

The dropdown remains anchored below the clicked temperament button.

Requirements:

- positioned directly under the button
- same width as the button
- does not resize or stretch the parent card
- options are centered within the dropdown

The menu should feel like an extension of the temperament button, not a separate free-floating panel.

### Lumina chip idle style

The `乾明 / Lumina` speaking-order chip must be readable in its default idle state.

Requirements:

- white background
- black text
- no white-on-white appearance at rest

This is a styling correction only; it does not change the speaking-order behavior.

## Visual Design

### Dropdown

The dropdown should be visually compact:

- rounded corners consistent with the current control style
- same width as the trigger
- centered option text
- strong enough border/shadow to separate it from the card

### Order chip

`乾明 / Lumina` idle chip:

- white background
- black text

`坤察 / Vigila` chip remains aligned with the black/white card language already established.

## Accessibility

Requirements:

- temperament button remains a button
- dropdown options remain buttons
- click-to-open and click-away-to-close both work
- keyboard focus should not be required to keep the menu open

## Testing

Update focused form coverage for:

- click opens the dropdown
- clicking the same temperament button again closes it
- clicking outside closes it
- dropdown width matches the button width assumption as closely as practical in DOM/class assertions
- option labels remain centered
- `乾明 / Lumina` order chip renders black text on white background

## Acceptance Criteria

- temperament dropdown no longer opens on hover
- dropdown stays open until selection, same-button click, or outside click
- dropdown width matches the temperament button width
- dropdown option labels are centered
- `乾明 / Lumina` order chip is readable in idle state with white background and black text
