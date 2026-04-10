# Two Agent Debate UX Pass Design

Date: 2026-04-07

## Purpose

This document defines a focused product and UX improvement pass on top of the existing MVP implementation. The goal is not to redesign the architecture, but to remove current usability friction in four areas:

- preset variety
- language consistency
- provider messaging
- research progress visibility

This pass keeps the current local-first architecture and OpenAI-compatible backend model shape, but makes the product feel more coherent and less confusing in real use.

## Why This Pass Exists

The current build exposes several product-level problems:

1. The debate preset experience is too narrow. In practice the product behaves as if only one preset pair exists.
2. The interface and generated content are mixed between Chinese and English.
3. The provider configuration implies "OpenAI only" even though the integration path is really "OpenAI-compatible endpoint."
4. After the user starts a debate, the app appears stalled during research because it does not visibly communicate what the system is doing.

This pass addresses those issues without expanding into a full provider abstraction rewrite or a full internationalization system.

## Goals

- Make the preset system feel meaningfully usable on the first screen.
- Make the selected language govern the whole visible experience.
- Clarify the provider contract without overpromising support for many provider-specific protocols.
- Turn the research phase from a blank wait state into a visible staged process.

## Non-Goals

- Full multi-provider backend support
- Provider-specific request adapters for Gemini, Anthropic, or vendor-native APIs
- Full i18n infrastructure with translation files and locale routing
- Rich source document viewer
- Streaming crawl transcript or full raw page content display
- Major architecture changes to orchestrator, runtime, or session model

## Product Direction

This pass should be implemented as a structured UX improvement, not a broad redesign.

The guiding principle is:

Keep the current architecture, but noticeably improve product behavior.

## Change Area 1: Debate Presets

### Current Problem

The preset experience is too limited. Users do not feel they are choosing between genuinely different debate frames.

### Design

Presets become a two-level system:

### Default Presets

The default picker should include several visible role pairs:

- Cautious vs Aggressive
- Rational vs Intuitive
- Supporter vs Skeptic
- Cost-focused vs Benefit-focused
- Short-term vs Long-term

These should be available directly from the main preset selector.

### Optional Custom Role Overrides

Advanced settings should allow the user to override the selected preset with custom role text:

- Agent A title
- Agent B title
- Agent A role prompt
- Agent B role prompt

Behavior rules:

- If custom role fields are empty, the selected preset defines the debate framing.
- If custom role fields are present, they override preset wording for this session.
- The preset selector still remains required because it supplies a default starting structure.

### Why

This preserves a fast first-run experience while allowing more deliberate users to customize both sides.

## Change Area 2: Language Toggle

### Current Problem

The interface and generated content are mixed between Chinese and English, which makes the product feel unfinished.

### Design

Add a top-level language control with exactly two options:

- 中文
- English

The selected language must control:

- UI copy
- debate agent outputs
- final summary output
- research-phase status messages

### Important Rule

The selected language controls visible output, not necessarily the language of retrieved evidence.

The system may still use multilingual sources internally, but what the user reads on screen should consistently follow the selected language.

### Prompting Implication

Language must become part of session configuration and be explicitly passed into prompt generation for:

- opening turns
- debate turns
- summary generation
- research progress/status copy

## Change Area 3: Provider Messaging

### Current Problem

The product suggests an "OpenAI only" experience even though the actual backend contract is "OpenAI-compatible endpoint."

### Design

Do not add multiple provider families in this pass.

Instead, clarify the UX language in advanced settings.

Recommended wording:

- Model endpoint
- Base URL
- API key
- Model name

Recommended helper copy:

Works with OpenAI-compatible APIs, including many third-party providers.

### Why

This removes a real usability problem without forcing a large backend compatibility project.

### Explicit Non-Goal For This Pass

Do not add distinct provider modes such as:

- OpenAI
- Gemini
- DeepSeek
- Anthropic

That would imply protocol support the current runtime does not guarantee.

## Change Area 4: Research In Progress UX

### Current Problem

After the user clicks Start Debate, the app can look frozen. Users cannot tell:

- whether the system is searching
- whether anything has been found
- whether it is extracting evidence
- whether it is preparing the debate

### Design

The research phase should become a visible staged process.

### Primary Element: Activity Timeline

The main progress element should be a step-by-step activity feed such as:

1. Preparing query
2. Searching sources
3. Reading pages
4. Extracting evidence
5. Preparing opening arguments

One stage should be visually active at a time.

### Secondary Element: Evidence Preview

Alongside the activity feed, show a live evidence preview list as items become available.

Each preview item should include:

- source title
- source name or domain
- a light status such as found, read, or used

### What To Show During Research

Show:

- current stage
- source count found
- evidence count extracted
- latest source titles and domains

Do not show by default:

- full raw page content
- full scraped text
- long uninterpreted article excerpts

### Why

Users need reassurance and motion, not raw crawl output.

## Updated User Flow

The session flow becomes:

1. User enters a question.
2. User selects a preset.
3. User chooses language.
4. User optionally opens advanced settings.
5. User starts the session.
6. The input area compresses into a smaller header state.
7. The app shows the research activity timeline immediately.
8. The evidence preview list starts filling as sources are found.
9. Once enough evidence exists, the debate timeline begins.
10. The user may stop early and still get a meaningful summary.
11. The final summary appears with stronger emphasis than the raw debate transcript.

## UI Changes

### Header Area

The top area should now include:

- question input
- preset selector
- language toggle
- start action

### Advanced Settings

Advanced settings should now contain:

- provider endpoint fields
- optional custom agent role overrides
- existing low-level session settings that are still relevant

Advanced settings should remain collapsed by default.

### Research State Panel

When a session is in research, the workspace should prioritize:

- visible progress stages
- evidence preview activity

The debate timeline should not appear frozen or empty without explanation.

### Summary Panel

The summary panel should remain visually strongest and should reflect the selected language.

## Data And Prompt Implications

This pass does not require a new architecture, but it does require additional session-level fields.

The session model should support:

- selected language
- selected preset id
- optional custom agent role overrides
- research progress state suitable for UI rendering

Prompt generation must incorporate:

- the selected language
- either the chosen preset roles or the custom role overrides

## Recommended Scope For Implementation

This pass should include:

- expanded preset list
- optional custom role fields
- language toggle
- consistent visible language behavior
- revised provider wording
- research progress timeline
- evidence preview during research

This pass should not include:

- full provider-family abstraction
- vendor-specific request formats
- full localization framework
- document viewer for source content
- major runtime or orchestration redesign

## Risks

- If language is treated as UI-only and not prompt-level, output will remain inconsistent.
- If preset overrides are too open-ended, the product may drift back toward a generic prompt playground.
- If research progress is only cosmetic and not tied to real state transitions, users will still distrust the wait state.
- If provider wording becomes too broad, users may assume compatibility that the backend does not actually provide.

## Decision Summary

This UX pass should:

- keep the existing architecture
- expand preset choice
- add optional custom role overrides
- introduce a top-level Chinese/English toggle
- make all visible generated output follow the chosen language
- rename provider UX around the OpenAI-compatible endpoint model
- make research visibly staged with a live evidence preview

## Next Step

After this design is reviewed, the next step is to write an implementation plan for this UX pass before making code changes.
