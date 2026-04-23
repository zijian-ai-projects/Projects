# Release Security Review

Review date: 2026-04-23
Scope: current working tree for the `dualens` Next.js application, API routes, dependency audit, deployment examples, env-file posture, upload surface, logging-sensitive paths, and previously identified Critical/High security fixes.

## Verdict

**Not ready for redeployment yet.**

The previously identified Critical/High dependency and SSRF/resource-exhaustion issues are materially addressed, and `pnpm audit --prod` reports no known production vulnerabilities. However, the current repository still has release-blocking security conditions:

1. Existing session subresource APIs remain unauthenticated and treat `sessionId` as the only access credential.
2. The current build environment loads `dualens/.env.local`; this file exists locally and contains provider secret keys.
3. The release candidate is not a clean, committed, reproducible state.

## Verification Evidence

Commands run:

```bash
pnpm audit --prod
pnpm audit
pnpm test
pnpm build
git diff --check
git check-ignore -v dualens/.env.local
git ls-files dualens/.env.local
find . -maxdepth 3 -type f \( -name 'Dockerfile*' -o -name 'docker-compose*.yml' -o -name 'docker-compose*.yaml' \) -print
```

Results:

- `pnpm audit --prod`: no known vulnerabilities found.
- `pnpm audit`: one Low dev dependency advisory in `@eslint/plugin-kit`; no High/Critical advisory.
- `pnpm test`: 41 test files, 239 tests passed.
- `pnpm build`: build completed successfully on Next.js `15.5.15`; output showed `Environments: .env.local`.
- `git diff --check`: no whitespace errors.
- `dualens/.env.local` is ignored by `.gitignore` and not tracked by Git.
- No Dockerfile or docker-compose file was found.

## Blocking Issues

### BLOCKER-1: Session subresource APIs are still unauthenticated

Evidence:

- `dualens/src/app/api/session/[sessionId]/route.ts` exposes `GET /api/session/{sessionId}` with no auth check.
- `dualens/src/app/api/session/[sessionId]/continue/route.ts` exposes `POST /continue` with no auth check.
- `dualens/src/app/api/session/[sessionId]/premise/route.ts` exposes `POST /premise` with no auth check.
- `dualens/src/app/api/session/[sessionId]/stop/route.ts` exposes `POST /stop` with no auth check.

Impact:

- Anyone with a leaked session id can read, continue, mutate, or stop that session.
- The `POST /api/session` route now has production controls, but those controls do not protect existing-session operations.
- Session ids are still functioning as bearer credentials.

Release condition:

- Add shared auth/ownership validation to all `/api/session/{sessionId}/*` routes, or enforce equivalent protection at the reverse proxy before public redeploy.
- If using proxy protection as a temporary gate, it must cover both `/api/session` and `/api/session/*`, not only create-session.

### BLOCKER-2: Current build loads local `.env.local`

Evidence:

- `dualens/.env.local` exists locally.
- Key names detected without printing values: `DEEPSEEK_API_KEY`, `TAVILY_API_KEY`.
- `git check-ignore -v dualens/.env.local` confirms it is ignored by `.gitignore`.
- `git ls-files dualens/.env.local` returns no tracked file.
- `pnpm build` output includes `Environments: .env.local`.

Impact:

- The file is not committed, but it is present in the working tree and is used by local builds.
- A file-copy, rsync, image build, or manual deploy from this directory could accidentally include or rely on local secrets.
- Release provenance is unclear if production build uses local developer credentials instead of production secret management.

Release condition:

- Build and deploy from a clean checkout or CI environment without `.env.local`.
- Provide production secrets via an approved secret manager or locked-down env file such as `/etc/dualens/dualens.env`.
- Rotate `DEEPSEEK_API_KEY` and `TAVILY_API_KEY` if this workspace, build cache, logs, or artifacts may have been shared.

### BLOCKER-3: Current working tree is not a clean release candidate

Evidence:

- `git status --short` shows modified and untracked files, including security fixes, hardening docs, and generated examples.
- `git diff --stat` shows pending code changes across runtime, validators, research providers, tests, package files, and Next-generated `next-env.d.ts`.

Impact:

- The reviewed state is not tied to a commit SHA.
- A redeploy from a different checkout may miss the security fixes or include extra local files.
- Rollback and audit cannot reliably identify the deployed artifact.

Release condition:

- Commit the intended release state.
- Tag or record the release commit SHA.
- Build from a clean checkout with `pnpm install --frozen-lockfile`.

## High-Risk Items Verified As Addressed

### Critical/High dependency issues

Status: addressed for production dependencies.

Evidence:

- `dualens/package.json` now uses `next@15.5.15`.
- `eslint-config-next` is aligned to `15.5.15`.
- `@playwright/test` is upgraded to `1.55.1`.
- `pnpm audit --prod` reports no known vulnerabilities.

Residual:

- Full `pnpm audit` still reports one Low dev dependency issue in `@eslint/plugin-kit`.

### Provider `baseUrl` SSRF and API key exfiltration

Status: addressed for the reviewed code path.

Evidence:

- `dualens/src/lib/url-safety.ts` defines provider host allowlist and public-fetch URL validation.
- `dualens/src/lib/validators.ts` validates provider base URLs through `isAllowedProviderBaseUrl`.
- Regression tests cover rejection of loopback provider base URL.

Residual:

- The allowlist is intentionally narrow. Adding new providers requires code review, not arbitrary user-provided endpoints.

### Tavily endpoint and second-stage page extraction SSRF

Status: addressed for the reviewed code path.

Evidence:

- `searchConfig.endpoint` is validated by selected engine.
- Tavily results and DuckDuckGo results reject local/private/non-HTTPS URLs.
- Page extraction validates initial URL, DNS-resolved addresses, and redirect targets.
- Regression tests cover private result filtering, direct local extraction blocking, DNS-to-private blocking, and metadata redirect blocking.

Residual:

- Runtime egress firewalling is still recommended as defense in depth.

### Anonymous high-cost session creation

Status: partially addressed in application code.

Evidence:

- `POST /api/session` blocks anonymous production creation unless `DUALENS_ALLOW_ANONYMOUS_SESSIONS=1` or a valid `DUALENS_SESSION_API_TOKEN` is supplied.
- `DUALENS_SESSION_RATE_LIMIT_MAX` controls in-memory create-session rate limiting.
- `roundCount` is capped at `5`.

Residual:

- App-level rate limiting is in-memory and per process. Use reverse proxy or edge-level limits for production.
- Existing-session subroutes remain unauthenticated; see `BLOCKER-1`.

## Other Review Areas

### Hardcoded secrets

Status: no high-confidence tracked secret pattern found, but local secret file exists.

Evidence:

- High-confidence tracked-file scan found no OpenAI-like key, GitHub token, AWS access key, Google API key, private key block, Slack token, or JWT-like token.
- Broad keyword scan found many expected variable names, test fixture strings, placeholders, and UI labels.
- `dualens/.env.local` exists and contains secret key names; values were not printed.

Classification:

- Blocking only because local `.env.local` exists and is loaded by build. No evidence of real secrets committed to tracked files.

### Unauthenticated interfaces

Status: blocking.

Findings:

- `/api/github-stars` is intentionally public and low sensitivity.
- `POST /api/session` has production gating and rate limiting.
- `/api/session/{sessionId}`, `/continue`, `/premise`, and `/stop` have no auth/owner validation.

Classification:

- Blocking for public redeploy unless protected by a proxy-level gate.

### Upload functionality

Status: no exploitable server-side upload execution path found.

Evidence:

- No server-side upload endpoint, `multipart` parser, `multer`, `busboy`, server `writeFile`, or upload directory was found.
- Current “upload local evidence” feature reads local files in the browser with `File.text()` and adds text to client-side evidence state.
- Example Nginx config returns `404` for `/uploads/`.

Classification:

- Not blocking. Keep `/uploads/` closed unless a server upload feature is intentionally added and hardened.

### Dependency vulnerabilities

Status: no High/Critical dependency issue detected.

Evidence:

- `pnpm audit --prod`: no known vulnerabilities.
- `pnpm audit`: one Low dev dependency advisory only.

Classification:

- Not blocking for High/Critical criteria.

### Production debug mode

Status: not verifiable from current production environment; example config is safe.

Evidence:

- `deploy/examples/env.production.example` sets `NODE_ENV=production`.
- Hardening docs require `DEBUG`, `MOCK_RESEARCH`, and `NODE_OPTIONS=--inspect` to remain unset.
- Local build loaded `.env.local`; production runtime env was not available for live verification.

Classification:

- Blocking only if redeploying from this local environment or without a reviewed production env file.

### Dockerfile / deployment scripts

Status: no Dockerfile risk found; deployment examples are drafts.

Evidence:

- No Dockerfile or docker-compose file found.
- `deploy/examples/dualens.service.example` runs as `User=dualens`, binds to `127.0.0.1:3000`, and includes systemd hardening.
- `deploy/examples/nginx-dualens.conf.example` proxies to `127.0.0.1:3000`, denies `/uploads/`, adds rate limits and security headers.
- `deploy/examples/ufw-rules.example.sh` denies public `3000/tcp`.

Classification:

- Not blocking, assuming examples are reviewed and adapted before use.

### Sensitive data in logs and client-visible diagnostics

Status: no obvious API key logging found; diagnostics still expose endpoint/model metadata.

Evidence:

- No `console.log` or server log path was found that directly prints API keys or request bodies.
- `redactSessionForClient()` removes provider/search `apiKey` before returning sessions to clients.
- `SessionDiagnosis` can expose `providerBaseUrl`, `providerModel`, and error `detail`.

Impact:

- Provider endpoint/model disclosure is useful for debugging but may reveal infrastructure choices to anyone who can access a session.
- Once `BLOCKER-1` is fixed, this exposure becomes limited to authorized users.

Classification:

- Suggested optimization unless sessions remain publicly readable; with unauthenticated session routes it compounds `BLOCKER-1`.

## Suggested Optimizations

### OPT-1: Enforce auth/ownership in code, not only proxy

Even if proxy protection is added for redeploy, move toward first-party session ownership:

- issue an owner cookie or authenticated user id at session creation
- persist owner metadata with the session
- enforce owner checks on get/continue/premise/stop
- add TTL and cleanup for in-memory sessions

### OPT-2: Move rate limiting out of process memory

The current in-memory limit is useful for a single Node process but insufficient for multi-instance deployment.

Use one of:

- Nginx `limit_req`
- CDN/edge WAF rule
- Redis-backed application limiter
- managed API gateway limits

### OPT-3: Add security headers in application or enforced proxy config

The example Nginx config includes headers, but the app itself does not define them in `next.config.ts` or middleware.

For deployments without Nginx, add equivalent headers at the platform layer.

### OPT-4: Replace browser `localStorage` API key storage for public production

The current UI stores user provider/search API keys in browser `localStorage`. This was out of scope for the high-risk fix but remains a security concern.

For public production, prefer:

- server-side credential custody
- user/account-scoped secret references
- encrypted storage and key rotation
- explicit XSS/CSP hardening

### OPT-5: Tighten CSP after report-only burn-in

The Nginx example starts CSP in report-only mode and includes `unsafe-inline` / `unsafe-eval` for compatibility. Treat that as a transitional policy.

After observing reports:

- remove `unsafe-eval` if possible
- minimize `unsafe-inline`
- add `report-to` / `report-uri`
- enforce CSP once app behavior is verified

### OPT-6: Add structured security audit logging

Add structured logs for:

- session create denied by auth
- session create rate-limited
- SSRF URL validation rejected
- provider/search diagnostic category
- stop/continue/premise actions

Do not include API keys, bearer tokens, full prompt bodies, or uploaded local evidence text.

### OPT-7: Keep release artifacts minimal

Do not include:

- `SECURITY_AUDIT.md`
- `FIX_PLAN.md`
- `DEPLOY_HARDENING.md`
- local `.env.*`
- `docs/superpowers`
- test reports or coverage

Deploy from a built artifact or clean checkout with explicit include/exclude rules.

## Release Gate Checklist

Before approving redeploy:

- [ ] Fix or proxy-protect all `/api/session/{sessionId}/*` routes.
- [ ] Build from a clean environment without `.env.local`.
- [ ] Commit and tag the release candidate.
- [ ] Confirm production secrets are rotated and injected via approved secret management.
- [ ] Re-run `pnpm install --frozen-lockfile`, `pnpm audit --prod`, `pnpm test`, and `pnpm build` from clean checkout.
- [ ] Verify live production env has `NODE_ENV=production`, no `DEBUG`, no `MOCK_RESEARCH`, and no `NODE_OPTIONS=--inspect`.
- [ ] Verify reverse proxy rate limits and security headers are active.
- [ ] Verify only `80/443` are public and Next.js binds only to localhost.
