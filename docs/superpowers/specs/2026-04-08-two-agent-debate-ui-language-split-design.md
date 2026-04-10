# Two Agent Debate UI Language Split Design

Date: 2026-04-08

## Purpose

This document defines a focused follow-up UX adjustment to separate frontend localization from debate-output language.

The current product still treats language as one overloaded setting. That is not precise enough for the intended behavior.

This pass introduces two distinct concepts:

- UI language
- Debate language

The goal is to make the interface feel fully localized while preserving explicit control over the language used by the agents and the final summary.

## Problem

The current language setting is placed in Advanced Settings and behaves as if one control should decide both:

- the language of the product interface
- the language of agent replies and summary output

That creates product confusion:

1. Users do not have a clear way to switch all visible frontend elements between Chinese and English.
2. The existing language field is not clearly scoped, so users cannot tell whether it affects the UI, the agents, or both.
3. The app needs one language for product chrome and one language for generated content, even if they often default to the same value.

## Goals

- Add a clear top-level UI language switch.
- Make all frontend product text follow the selected UI language.
- Keep debate-output language as a session-level setting.
- Default debate language to the selected UI language.
- Allow the user to override debate language when needed.

## Non-Goals

- Full locale routing
- Full translation framework with external message catalogs
- Support for more than Chinese and English in this pass
- Translating raw source pages themselves
- Vendor-specific language detection or language-specific provider behavior

## Product Model

The product should now treat language as two separate layers.

### 1. UI Language

UI language controls all frontend interface text, including:

- project name
- project description
- browser page title
- form labels
- button labels
- panel titles
- progress labels
- empty states
- error messages

This should be exposed as a visible toggle in the app header:

- 中文
- English

This setting should update the interface immediately.

### 2. Debate Language

Debate language controls all generated output, including:

- Agent A replies
- Agent B replies
- summary output
- evidence snippets or evidence summaries shown to the user when the model rewrites them

This should remain a session setting and should live in Advanced Settings.

The current field labeled `Language` should be renamed to `Debate language`.

## Default Behavior

The default relationship should be:

- `uiLanguage` is the primary visible app preference
- `debateLanguage` initially follows `uiLanguage`

If the user manually changes `debateLanguage`, it should stop auto-following `uiLanguage` for that session.

This means:

- changing the UI language updates frontend copy immediately
- debate language remains synced until explicitly overridden
- once overridden, debate language stays independent

## Example Behaviors

Supported combinations should include:

- UI Chinese + Debate Chinese
- UI English + Debate English
- UI Chinese + Debate English
- UI English + Debate Chinese

The first two are the normal defaults.
The latter two are advanced but valid use cases.

## UX Changes

### Header

The app header should include a clear UI language switch.

Recommended placement:

- top-right area of the main shell or hero header

Recommended control:

- a compact segmented toggle or two-button switch

### Advanced Settings

Advanced Settings should keep the generated-content control, but rename it:

- from `Language`
- to `Debate language`

If `debateLanguage` has not been manually changed yet, it should mirror the current `uiLanguage`.

If the user changes it, the field becomes explicitly session-specific.

### Visible Copy Coverage

This pass should localize at least:

- page title
- hero title
- hero description
- question label and placeholder
- preset label
- advanced settings label
- start button
- status and progress labels
- debate section title
- evidence section title
- summary section title
- common error copy

This pass does not need to localize every internal developer-facing string.

## Technical Direction

This pass should use a lightweight internal dictionary rather than a full i18n framework.

Recommended approach:

- introduce a small translation object for `en` and `zh`
- store `uiLanguage` in frontend state
- propagate `uiLanguage` into shared UI components
- keep `debateLanguage` in session input and prompt generation

## Data Model Implications

The app state should distinguish:

- `uiLanguage`
- `debateLanguage`

The session payload sent to the backend should include only the session-relevant debate language, not the UI-only preference, unless the implementation chooses to reuse it for server-rendered copy or metadata.

## Prompt Implications

Prompt generation should continue to rely on debate language, not UI language.

That means:

- prompt builders should use `debateLanguage`
- summaries should use `debateLanguage`
- visible UI progress labels generated by the frontend should use `uiLanguage`

If any runtime-generated visible status text is still model-generated, it should also follow the user-facing debate language or be converted to frontend-owned copy.

## Risks

- If UI strings are only partially localized, the product will still feel inconsistent.
- If debate language remains named only `Language`, users will still misunderstand the control.
- If UI language and debate language remain hard-coupled, advanced use cases are blocked.
- If they are fully decoupled with no default syncing behavior, the product becomes harder to understand.

## Decision Summary

This follow-up pass should:

- add a header-level UI language switch
- localize visible frontend product copy
- rename the current language field to `Debate language`
- default debate language to follow UI language
- allow debate language to be overridden per session
- keep implementation lightweight and within current architecture

## Next Step

After this design is reviewed, the next step is to write a small implementation plan for the language split and localization pass.
