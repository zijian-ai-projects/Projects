# Release Blockers Fixed

Date: 2026-04-23

## Scope

Only the three release blockers from `RELEASE_SECURITY_REVIEW.md` were addressed:

1. Session subresource APIs lacked auth/owner checks.
2. Release builds could accidentally load local `.env.local` development secrets.
3. The release process lacked a minimal reproducible clean-checkout path.

No business workflow or UI feature was intentionally changed.

## 1. Session Owner Enforcement

Implemented a minimal session owner token model:

- `POST /api/session` now creates a random owner token.
- The server stores only `ownerTokenHash` on the `SessionRecord`.
- The raw owner token is returned only as a signed, HttpOnly, SameSite=Lax cookie named `dualens_session_owner`.
- Signed cookie validation uses `DUALENS_SESSION_OWNER_SECRET` when set, then `DUALENS_SESSION_API_TOKEN`, then a process-local fallback for local/test use.
- Owner checks are shared through `src/server/session-auth.ts`.

Why this change:

- The project does not currently have a complete login system, so a per-session owner token is the smallest server-side authorization boundary that prevents unauthenticated users from reading, continuing, changing, or stopping another session.
- The raw owner token is never persisted; only its hash is stored with the session record, reducing impact if server-side session metadata is exposed.
- A signed HttpOnly cookie avoids exposing the token to application JavaScript while still letting existing browser fetches carry credentials automatically.
- The shared authorization helper keeps the four protected route checks consistent without introducing a larger auth refactor.

Protected routes:

- `GET /api/session/{sessionId}`
- `POST /api/session/{sessionId}/continue`
- `POST /api/session/{sessionId}/premise`
- `POST /api/session/{sessionId}/stop`

Failure behavior:

- Missing owner cookie: `401`
- Invalid owner cookie: `401`
- Valid cookie for a different session: `403`
- Missing session id: `404`

## 2. Tests Added / Updated

Route tests now cover each protected subroute:

- missing owner credentials fail
- wrong owner credentials fail
- correct owner credentials succeed

Existing route tests were updated to send the owner cookie when they intentionally exercise authorized session operations.

## 3. Release Build Guard

Added:

- `dualens/scripts/clean-release-check.sh`
- `pnpm run build:release`

`build:release` refuses to continue if the app checkout contains:

- `.env`
- `.env.*`
- `test-results`
- `playwright-report`
- `coverage`
- `.vitest-results.json`

This prevents a production release build from silently loading local development secrets such as `.env.local`.

Why this change:

- Next.js automatically loads app-local env files during `next build`; refusing release builds when `.env*` files exist makes a clean checkout a hard precondition instead of a convention.
- Blocking common test/report directories prevents local security notes, reports, and generated artifacts from being mixed into a release package.
- The existing `pnpm build` command is left unchanged for local development, while `pnpm run build:release` gives deployment a reproducible guarded entry point.

## 4. Documentation Updates

Updated release/deploy docs to use `pnpm run build:release` and include `DUALENS_SESSION_OWNER_SECRET`:

- `DEPLOY_HARDENING.md`
- `deploy_checklist.md`
- `deploy/examples/env.production.example`

Why this change:

- Release operators need an explicit production cookie-signing secret; relying on the process-local fallback would invalidate cookies on restart and is not suitable for production.
- The clean-release commands document how to reproduce a release from a clean checkout instead of the current dirty development workspace.

## Clean Release Commands

Run these from the repository root after the intended release changes have been reviewed and committed.
The first checks intentionally fail if the current repository is still dirty.

```bash
SOURCE_REPO=$(pwd)
RELEASE_REF=HEAD
RELEASE_DIR=/tmp/dualens-release

test -d "$SOURCE_REPO/dualens"
test -z "$(git status --short)"

rm -rf "$RELEASE_DIR"
git clone "$SOURCE_REPO" "$RELEASE_DIR"
cd "$RELEASE_DIR"
git checkout "$RELEASE_REF"

test -z "$(git status --short)"
test ! -e dualens/.env
! find dualens -maxdepth 1 -type f -name '.env.*' | grep -q .

cd dualens
pnpm install --frozen-lockfile
pnpm audit --prod
pnpm test
pnpm run build:release
```

Minimal artifact packaging example:

```bash
cd "$RELEASE_DIR"
tar \
  --exclude='dualens/.env' \
  --exclude='dualens/.env.*' \
  --exclude='dualens/test-results' \
  --exclude='dualens/playwright-report' \
  --exclude='dualens/coverage' \
  --exclude='dualens/.vitest-results.json' \
  --exclude='SECURITY_AUDIT.md' \
  --exclude='FIX_PLAN.md' \
  --exclude='DEPLOY_HARDENING.md' \
  --exclude='RELEASE_SECURITY_REVIEW.md' \
  --exclude='RELEASE_BLOCKERS_FIXED.md' \
  --exclude='deploy_checklist.md' \
  --exclude='dualens/docs/superpowers' \
  -czf /tmp/dualens-release.tgz dualens
```

Production secrets should be injected by the deployment environment, for example through `/etc/dualens/dualens.env` or a managed secret store, not copied from `.env.local`.
