# Two Agent Debate Rotating Swap Button Design

Date: 2026-04-09

## Purpose

This pass refines the temperament swap button so it better matches the page's black-and-white minimal style and more clearly communicates inversion.

The current compact taiji button works functionally, but the symbol does not yet read strongly as a deliberate swap interaction.

## Why This Pass Exists

The swap button now needs to become a stronger interaction affordance without breaking the page's restrained visual language.

The user wants:

- a circular button that keeps the current size
- a closed-loop double-arrow icon inside it
- black/white split coloring that matches the two side cards
- a 180-degree clockwise rotation on each swap
- the visual state to stay synchronized with the actual mapping state

## Goals

- Keep the current circular button footprint and placement
- Replace the inner taiji mark with a closed-loop double-arrow icon
- Use black on the left arc and white on the right arc
- Round all stroke ends and joins to match the page's soft geometry
- Animate rotation with a smooth 0.2s transition
- Derive the icon's orientation directly from the current mapping state
- Keep the button vertically aligned with the two mapping cards

## Non-Goals

- Changing the swap behavior itself
- Changing the mapping-card layout
- Adding complex motion choreography
- Introducing spring animation or physics libraries
- Reworking surrounding page structure

## Design Decisions

### 1. Icon Shape

The button remains circular, but the internal symbol becomes a continuous loop-like pair of arrows.

The icon should read as:

- two curved arrows
- connected visually into a circular exchange loop
- one arrow occupying the left half
- one arrow occupying the right half

The result should feel geometric, crisp, and modern rather than decorative.

### 2. Color Split

The icon color should mirror the surrounding assignment cards:

- left half: black
- right half: white

This supports the product's yin-yang logic and visually bridges the light `乾明` card and the dark `坤察` card.

### 3. State-Derived Orientation

The button rotation must not use an independent animation state.

Instead, derive the orientation directly from the mapping state:

- one orientation when `luminaTemperament === selectedPair.options[0]`
- the opposite orientation when `luminaTemperament === selectedPair.options[1]`

That ensures:

- no visual drift
- correct hydration
- correct rerender behavior
- icon state always matches actual assignment state

### 4. Rotation Behavior

On each click:

- `luminaTemperament` flips to the opposite value in the selected pair
- the icon rotates clockwise to the opposite 180-degree orientation
- the left/right black-white relationship flips with the state
- the mapping cards update at the same time

Implementation direction:

- wrap the SVG in a container with `transition-transform`
- use a 200ms duration
- use a gentle easing such as `ease-out`

### 5. SVG Recommendation

Use inline SVG inside the button.

Recommended characteristics:

- two path elements for the loop arrows
- rounded `strokeLinecap`
- rounded `strokeLinejoin`
- no fill except optional arrowheads if built from stroke-friendly paths
- balanced stroke width that matches the page's current icon weight

This is preferable to CSS-only pseudo-elements because:

- better control over curvature and arrowheads
- easier black/white split
- more robust scaling

### 6. Layout Fit

The button must remain visually centered between the two mapping cards.

Requirements:

- same current button footprint
- centered on the row's vertical axis
- no added row height
- no extra spacing that breaks the compact alignment from the previous pass

### 7. Accessibility

Keep the current accessible behavior.

The button should still:

- be keyboard-focusable
- retain the existing accessible label
- have visible focus styling

This pass is visual refinement, not a semantic change.

## Implementation Boundary

This pass should mainly touch:

- `src/components/question-form.tsx`
- `src/components/question-form.test.tsx` only if a test must assert the new icon structure or class behavior

It should not require changes to:

- runtime
- routes
- session shell
- data model
- browser flow behavior

## Testing Focus

This pass should verify:

- the swap button still exists and remains accessible
- clicking the button still flips the visible mapping labels
- the icon container reflects state through a rotation class or style
- existing browser flow remains green

## Recommendation

Implement the new button as an inline SVG loop-arrow icon whose rotation is derived directly from `luminaTemperament`.

This gives you the requested black/white visual refinement and smooth 180-degree motion without introducing fragile animation state.
