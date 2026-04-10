# Two Agent Debate Diagnostics and Brand Pass Design

Date: 2026-04-08

## Purpose

This document defines the next focused pass on top of the current MVP. The goal is to make runtime failures diagnosable for normal users while also tightening the top-of-page brand and information hierarchy.

This pass combines two related concerns:

- diagnostics clarity
- brand and layout polish

Diagnostics takes priority in implementation order. The product currently fails too opaquely, and that confusion must be reduced before visual polish can carry meaningful value.

## Why This Pass Exists

The current build has three active product problems:

1. Provider failures are hard to interpret. A failed second `/continue` currently surfaces as a generic "Unable to advance debate" state, which does not tell the user whether the issue is:
   - bad API key
   - bad base URL
   - wrong model name
   - incompatible endpoint shape
   - transient network failure
2. The top-of-page hierarchy is still too flat. The product name exists, but it is not yet the first clear visual anchor.
3. A few remaining Chinese labels and preset labels are still either untranslated or phrased awkwardly.

There is also an important technical limitation that must remain explicit:

- research is still backed by a mock provider, not real public-web search

This pass must not blur that distinction.

## Goals

- Let users explicitly test whether their model endpoint configuration works.
- Make start-flow failures legible and stage-specific.
- Separate provider-configuration failure from search expectations.
- Strengthen the `Dualens / 两仪决` brand presence.
- Reduce hero copy density and improve information hierarchy.
- Add a restrained taiji motif that supports the product idea without interfering with the form.
- Finish the remaining Chinese label cleanup in the current visible surfaces.

## Non-Goals

- Real public-web search
- Search validation or search-provider testing
- Provider-native adapters beyond the current OpenAI-compatible contract
- A full visual redesign of every page region
- Multi-step wizard diagnostics
- Heavy branding ornamentation
- Traditional decorative taiji rendering

## Product Direction

This pass should be implemented as a diagnostics-first product refinement.

The guiding principle is:

Make failure states understandable first, then make the product feel more intentional and memorable.

## Change Area 1: Model Endpoint Testing

### Current Problem

Users can enter `base URL`, `API key`, and `model`, but they have no way to validate those values before starting a debate. When generation fails, the product currently collapses that failure into a generic advance error.

### Design

Add a single manual action in Advanced Settings:

- `Test model endpoint`

The action should validate only the current model configuration:

- base URL
- API key
- model
- OpenAI-compatible response shape

This is not a generic "test everything" button. It should be honest about what it checks.

### Result States

The test result should map into clear user-facing categories:

- success
- authentication failed
- model unavailable or not found
- endpoint is not OpenAI-compatible
- network or timeout failure
- unknown provider error

Each result should include:

- short summary
- optional detail line
- suggested next action

### Important Constraint

This pass should not add a `Test search` button because search is not yet real. Adding one now would misrepresent the current system.

## Change Area 2: Structured Failure Diagnosis

### Current Problem

When the second `/continue` fails, the user sees only a short error such as "Unable to advance debate." That is too vague.

### Design

Keep the short inline error, but add a structured diagnosis panel as the primary failure surface.

The diagnosis panel should include:

- stage
- failing step
- provider endpoint
- model name
- error category
- short raw error summary
- suggested fix

### Primary Use Case

If the failure occurs during the second `/continue`, the UI should say something equivalent to:

- generation failed while preparing opening arguments

It should not imply that search failed unless the system has evidence that the failure came from search infrastructure.

### Error Taxonomy

The backend and UI should classify errors into stable categories where possible:

- auth
- model
- endpoint-shape
- network
- timeout
- unknown

These categories should drive both:

- the diagnosis panel
- the short inline error text

### Why

This gives users a direct answer to the current ambiguity:

- is my config wrong?
- did generation fail?
- is the app stuck?

## Change Area 3: Brand and Information Hierarchy

### Current Problem

The product name is visible but not dominant enough. Intro copy is also denser than necessary.

### Design

The top hierarchy should become:

1. product name
2. main value statement
3. short supporting line
4. form controls
5. secondary/helper text

### Brand Anchor

`Dualens` in English and `两仪决` in Chinese should become the clearest first visual anchor.

This should be achieved through:

- larger type
- stronger weight
- more whitespace around the mark
- reduced competition from surrounding copy

### Copy Model

The top copy should be compressed into layers:

- product name
- main statement
- one short supporting sentence

The value statement should remain close to:

- English: `A structured workspace for difficult decisions`
- Chinese: `为艰难决策而设的结构化辩证工作区`

Long descriptive paragraphs should be reduced.

## Change Area 4: Taiji Visual Motif

### Design Intent

The taiji symbol should express the product's core idea:

- opposing viewpoints
- dynamic balance
- decision through structured tension

### Placement

This pass should use taiji in two roles:

1. primary: a refined mark near the brand name
2. secondary: a subtle background motif behind or around the hero/workspace area

The primary role should dominate.

### Visual Style

The taiji treatment must feel:

- minimal
- modern
- light
- professional

Recommended treatments:

- thin-line geometry
- low-opacity fill
- soft gradient or low-contrast surfaces

Avoid:

- heavy traditional ornament
- dark, dense symbolism
- anything that visually competes with the form

### Interaction Constraint

The motif must never reduce readability or interfere with:

- decision question input
- preset selector
- start debate button
- advanced settings controls

## Change Area 5: Localization Cleanup

### Remaining Chinese Cleanup

This pass should update the remaining visible labels in the current surfaces.

Required changes:

- `Agent A title` -> `智能体A名字`
- `Agent B title` -> `智能体B名字`
- Chinese preset pair:
  - `Supporter` -> `支持者`
  - `Skeptic` -> `反对者`

This should affect:

- form labels
- preset display copy
- preset preview cards
- prompt-facing role labels where visible output depends on them

### Language Consistency Rule

When UI language is Chinese, those visible labels should all be Chinese. When UI language is English, the English labels remain unchanged.

## Updated User Flow

The relevant top-of-funnel flow becomes:

1. User lands on the page and immediately sees the stronger `Dualens / 两仪决` brand anchor.
2. User reads a short value statement and reaches the input area quickly.
3. User opens Advanced Settings if they need provider configuration.
4. User can click `Test model endpoint` before starting a debate.
5. The product returns a clear success or failure result for model configuration.
6. User starts the debate.
7. If generation fails, the user sees both:
   - a short inline error
   - a structured diagnosis panel with likely cause and suggested fix

## Technical Direction

### Endpoint Test

The endpoint test should be implemented as a lightweight provider validation path that reuses the existing OpenAI-compatible contract.

It should not require a full session to be created.

### Error Handling

The runtime and API layer should preserve enough structured error information to map failures into stable categories before rendering them in the UI.

The frontend should not have to guess based on arbitrary string parsing alone.

### Branding

Brand/layout changes should remain within the current component structure unless a small component extraction materially simplifies implementation.

This is a focused refinement pass, not a full shell rewrite.

## Risks

- If the test button is too vague, users will assume it validates search too. The wording must stay specific.
- If diagnosis surfaces raw backend errors without structure, users will still be confused.
- If the taiji motif is too visible, it will make the interface feel ornamental rather than precise.
- If the hero copy is only partially simplified, the hierarchy will still feel muddy.

## Decision Summary

This pass should:

- add a `Test model endpoint` action
- classify provider-generation failures into clearer categories
- show a diagnosis panel when start/advance generation fails
- strengthen the `Dualens / 两仪决` brand hierarchy
- reduce hero copy density
- add a subtle taiji-based brand motif
- complete the remaining Chinese label cleanup

This pass should not:

- claim real search exists
- validate search
- expand into multi-provider native protocol support

## Next Step

After this design is reviewed, the next step is to write an implementation plan for the diagnostics and brand pass.
