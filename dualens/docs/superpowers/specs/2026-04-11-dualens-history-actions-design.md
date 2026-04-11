# Dualens History Actions Design

## Requirements

- The history page must make `查看详情` interactive.
- The history page must make `重新发起同题辩论` interactive.
- The history page must not delete a history record on the first delete click.

## Root Cause

- `HistoryCard` renders `查看详情` and `重新发起同题辩论` as inert buttons without callbacks.
- `HistoryPageContent` only receives list fields from `loadHistoryRecords()`, so the page cannot render useful details or restore a debate draft.
- `删除` calls `deleteHistoryRecordFile()` immediately, with no confirmation state.

## Design

- `查看详情` toggles an inline detail panel inside the selected history card. It shows model, search engine, status, role summary, evidence count, turn count, summary fields, and diagnosis summary when present.
- `重新发起同题辩论` writes the history question, preset selection, and first-speaker setting into the workspace debate draft, clears any active in-memory session, and navigates to `/debate`. It does not automatically start the debate.
- `删除` becomes a two-click in-page confirmation. The first click switches that card into confirm mode. The second click deletes the file. A cancel button exits confirm mode.

## Data Model

- `HistoryListRecord` keeps existing list fields and adds `searchEngine`, `presetSelection`, `firstSpeaker`, `language`, `stage`, `summary`, `diagnosis`, `evidenceCount`, and `turnCount`.
- `DebateWorkspaceStateProvider` adds optional draft fields for `presetSelection` and `firstSpeaker`.
- `QuestionForm` accepts optional controlled draft props for preset selection and first speaker so history reruns can prefill the debate page.
