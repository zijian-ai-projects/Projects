## Goal

Make the app enter the workspace immediately after session creation, then progressively surface:

- research source discovery and shared evidence growth
- each debate turn as soon as it is generated
- final summary only after debate rounds complete

## Current Problems

- `POST /api/session` plus chained `continue` calls block the UI until large chunks of work finish.
- The client only sees final state transitions, so research and turn generation look frozen.
- There is no `GET /api/session/[sessionId]` read endpoint for polling live state.
- Runtime progression is synchronous; no background runner writes partial state to the store.

## Implementation Tasks

### 1. Add polling read API

Files:

- `src/app/api/session/[sessionId]/route.ts`
- `src/app/api/session/route.test.ts`

Work:

- Add `GET` endpoint that returns the latest redacted session state by id.
- Reuse existing not-found and response-shape conventions.
- Cover happy path and 404 behavior.

### 2. Introduce background session progression

Files:

- `src/server/runtime.ts`
- `src/server/session-store.ts`
- `src/server/orchestrator.ts`
- new helper if needed under `src/server/`
- `src/server/runtime.test.ts`

Work:

- Start a detached async progression loop after session creation.
- Persist intermediate states to the existing global store after each unit of work.
- Sequence:
  - run shared research and persist research progress incrementally
  - generate one turn at a time and persist after each turn
  - run summary and persist completion
- Ensure stop requests terminate further progression.
- Prevent duplicate runners for the same session.

### 3. Make research progress incremental

Files:

- `src/server/research/research-service.ts`
- `src/server/research/research-service.test.ts`
- maybe `src/lib/types.ts`

Work:

- Expose per-result progress callbacks or an async iterator style helper.
- Persist preview items as sources are found/read/used instead of only final counts.
- Keep existing evidence normalization and Tavily snippet fallback.

### 4. Update client flow to poll instead of blocking

Files:

- `src/components/session-shell.tsx`
- `src/components/session-shell.test.tsx`
- `src/app/session-client.ts`
- `src/app/page.tsx`

Work:

- After `createSession`, immediately set the session and show the workspace.
- Poll `GET /api/session/[sessionId]` until `stage === "complete"` or stop is requested.
- Surface research progress changes in place.
- Let timeline render as soon as each turn arrives.
- Keep existing error handling and diagnosis behavior for hard failures.

### 5. Verification

Run:

- `pnpm vitest run src/server/runtime.test.ts src/app/api/session/route.test.ts src/components/session-shell.test.tsx src/server/research/research-service.test.ts`
- `pnpm test`
- `pnpm build`

## Notes

- Keep the initial implementation polling-based; no SSE/WebSocket is needed yet.
- Favor minimal new types unless current `ResearchProgressView` blocks incremental updates.
- The first usable milestone is “workspace appears immediately and updates over time,” even if polling cadence is simple.
