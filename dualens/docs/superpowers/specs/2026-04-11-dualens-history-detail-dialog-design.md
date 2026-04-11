# Dualens History Detail Dialog Design

## Requirements

- `查看详情` on the debate history page must show the full debate process, not only a brief summary.
- The full process must include searched evidence and debate turns.
- `删除` must ask for confirmation in a window/modal, not by changing the delete button into another button.

## Design

- Open a modal dialog for `查看详情`.
- The dialog displays:
  - question, created time, status, model, search engine, and role setting;
  - every evidence item with title, source, URL, summary, and data points;
  - every debate turn with speaker, content, and referenced evidence labels/titles;
  - final summary content, including strongest-for, strongest-against, core disagreement, key uncertainty, and next action;
  - diagnosis details when the record failed.
- Open a modal dialog for `删除`.
- The delete dialog shows the selected question and has `取消` plus `确认删除` buttons. Only `确认删除` calls `deleteHistoryRecordFile()`.

## Data Model

- Extend `HistoryListRecord` to include full `evidence`, `turns`, and full `summary`.
- Continue reading the existing history JSON format. No file migration is required.
- Keep rerun behavior unchanged: it restores the debate draft and navigates to `/debate`.

## Testing

- Verify `查看详情` opens a dialog and shows evidence, debate turns, and final summary content.
- Verify closing the detail dialog removes it from the page.
- Verify `删除` opens a confirmation dialog and does not delete immediately.
- Verify `确认删除` deletes the record and removes the card.
