# Dualens Redeploy Security Hardening Guide

This guide is a pre-redeployment hardening reference for the current `dualens` Next.js application. It is documentation and configuration draft only; do not apply any command blindly in production.

## Current Project Assumptions

- App stack: Next.js App Router, React, TypeScript, pnpm.
- Runtime entry: `pnpm build` followed by `pnpm start` from `dualens/`.
- Main public routes: `/`, `/zh`, `/en`, `/app`, `/history`, `/providers`, `/search-engines`, `/settings`.
- Server API routes: `/api/session/*` and `/api/github-stars`.
- No server-side file upload endpoint was found in the current codebase. Any future upload feature must follow the upload hardening section below.
- Recent security fixes already added provider/search endpoint allowlists, `roundCount` cap, production anonymous session controls, and `/api/session` rate limiting knobs.

## 1. Disable Debug Mode In Production

Required state:

- `NODE_ENV=production`.
- Start only with the production server: `pnpm start` after `pnpm build`.
- Do not run `next dev`, `pnpm dev`, `NODE_OPTIONS=--inspect`, `DEBUG=*`, `MOCK_RESEARCH=1`, or test-only env flags.
- Ensure source maps, verbose request dumps, stack traces, and provider request bodies are not exposed to clients.

Preflight checks:

```bash
env | grep -E 'NODE_ENV|NODE_OPTIONS|DEBUG|MOCK_RESEARCH|NEXT_RUNTIME'
ps aux | grep -E 'next dev|--inspect|pnpm dev'
```

Expected:

- `NODE_ENV=production`
- no `DEBUG`
- no `MOCK_RESEARCH`
- no `--inspect`
- no `next dev`

## 2. Replace All Default Credentials

Replace every placeholder, demo key, shared key, or previously exposed key before redeploying:

- `DEEPSEEK_API_KEY`
- `TAVILY_API_KEY`
- `OPENAI_API_KEY` or `OPENAI_COMPATIBLE_API_KEY` if used
- `DUALENS_SESSION_API_TOKEN`
- any reverse proxy Basic Auth users
- any CI/CD deployment token
- any SSH key used for the host

Rules:

- Do not deploy values like `your_deepseek_api_key`, `change-me`, `demo`, `test`, `password`, or keys copied from local development.
- Rotate provider keys if `.env.local`, build logs, shell history, crash dumps, or the host image may have been shared.
- Use separate production and staging keys.
- Keep public GitHub metadata separate from secrets. `NEXT_PUBLIC_GITHUB_*` values are public by design.

## 3. Environment Variables And Secrets Management

Recommended production env file: `/etc/dualens/dualens.env`, owned by root, readable only by the service user.

Required secret hygiene:

- Do not commit `.env.local`, `.env.production`, or real secrets.
- Use a secrets manager where available: cloud secret store, systemd credentials, Vault, Doppler, 1Password SCIM/CLI, or CI protected variables.
- Keep env file permissions strict: `0640` or stricter.
- Never expose server secrets through `NEXT_PUBLIC_*`.
- Prefer provider-specific env names over broad fallbacks like `API_KEY` or `BASE_URL` in production.

Recommended variables:

```bash
NODE_ENV=production
NEXT_TELEMETRY_DISABLED=1

DEEPSEEK_API_KEY=<rotate-before-deploy>
DEEPSEEK_BASE_URL=https://api.deepseek.com
TAVILY_API_KEY=<rotate-before-deploy>

DUALENS_SESSION_API_TOKEN=<long-random-token>
DUALENS_SESSION_OWNER_SECRET=<long-random-cookie-signing-secret>
DUALENS_SESSION_RATE_LIMIT_MAX=30
# Keep unset or 0 for public production unless anonymous creation is explicitly intended.
DUALENS_ALLOW_ANONYMOUS_SESSIONS=0

NEXT_PUBLIC_GITHUB_OWNER=<public-owner>
NEXT_PUBLIC_GITHUB_REPO=<public-repo>
NEXT_PUBLIC_GITHUB_REPO_URL=https://github.com/<public-owner>/<public-repo>
```

## 4. Upload Directory Must Not Be Executable

Current state:

- No upload endpoint or server upload directory was found.

If uploads are added later:

- Store uploads outside the app source and outside `.next`.
- Use a path such as `/srv/dualens/uploads`.
- Mount with `noexec,nodev,nosuid`.
- Serve uploaded files from a separate host/path with strict content types.
- Never allow `.js`, `.mjs`, `.ts`, `.tsx`, `.php`, `.sh`, `.cgi`, `.html`, SVG with scripts, or user-controlled MIME execution.
- Strip metadata where appropriate.
- Virus-scan uploads before use.
- Do not let Next.js route uploaded files through dynamic code paths.

Nginx should either return `404` for `/uploads/` if unused, or serve it as static content with execution denied.

## 5. Run With Least Privilege

Recommended runtime model:

- Dedicated unprivileged user: `dualens`.
- App directory owned by deploy user or root, not writable by the runtime user except required cache/runtime paths.
- Runtime service binds only to `127.0.0.1:3000`; Nginx/Caddy owns ports `80` and `443`.
- No shell login for the service user.
- No write access to repo, `.env`, package manager cache, deployment keys, or backups.

Systemd hardening recommendations:

- `User=dualens`
- `Group=dualens`
- `NoNewPrivileges=true`
- `PrivateTmp=true`
- `ProtectSystem=strict`
- `ProtectHome=true`
- `ReadWritePaths=` limited to required runtime directories only
- `CapabilityBoundingSet=`
- `RestrictSUIDSGID=true`

See `deploy/examples/dualens.service.example`.

## 6. Reverse Proxy Security Configuration

Use a reverse proxy in front of Next.js:

- Terminate TLS at the proxy.
- Redirect HTTP to HTTPS.
- Proxy only to `http://127.0.0.1:3000`.
- Set secure headers.
- Enforce request body size limits.
- Add API rate limits.
- Deny access to hidden files and accidental secret paths.
- Optionally protect management-like pages (`/app`, `/providers`, `/search-engines`, `/settings`, `/history`) with SSO, VPN, IP allowlist, or strong Basic Auth.

Example:

- `deploy/examples/nginx-dualens.conf.example`

## 7. Open Only Necessary Ports

Inbound ports:

- `443/tcp`: public HTTPS
- `80/tcp`: only for HTTPS redirect and ACME HTTP challenge
- `22/tcp`: only from trusted admin IPs, or closed if using a managed session manager

Not public:

- `3000/tcp` must bind to `127.0.0.1` only.
- Database, cache, metrics, and admin ports must not be internet-exposed.

Host checks:

```bash
ss -ltnp
sudo ufw status verbose
sudo iptables -S
```

## 8. API Rate Limiting And Login Throttling

Current app-level knobs:

- `/api/session` creation is rate-limited by `DUALENS_SESSION_RATE_LIMIT_MAX`.
- Production anonymous session creation is denied unless `DUALENS_ALLOW_ANONYMOUS_SESSIONS=1` or a valid `DUALENS_SESSION_API_TOKEN` is supplied.

Proxy-level requirements:

- Add rate limits to `/api/session` and `/api/session/*`.
- Add a general lower-volume API limit to `/api/`.
- Add stricter login/reset throttles if authentication is introduced later.

Suggested policy:

- `/api/session`: burst-limited and low sustained rate because it can trigger LLM/search costs.
- `/api/github-stars`: moderate rate; cache already exists but proxy should still cap abuse.
- Login routes if added: per-IP and per-account throttling, lockouts with audit logs, MFA for admins.

## 9. Management Backoffice Access Control

Current state:

- No dedicated admin backend route was found.
- The pages `/providers`, `/search-engines`, `/settings`, `/history`, and `/app` can still be sensitive in a production deployment because they configure providers, trigger sessions, or expose local workflow state.

Before public redeployment choose one:

- Put the whole app behind SSO/VPN for internal use.
- Protect management-like pages at the proxy with SSO, IP allowlist, or strong Basic Auth.
- Keep public landing pages open while gating `/app`, `/providers`, `/search-engines`, `/settings`, `/history`, and `/api/session`.

Do not use default Basic Auth credentials. Generate per-operator accounts and rotate them.

## 10. Security Response Headers

Set headers at the reverse proxy or in Next.js middleware/config:

- `Strict-Transport-Security: max-age=31536000; includeSubDomains`
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=(), usb=()`
- `Content-Security-Policy` with explicit `default-src 'self'`

Because this app uses inline framework scripts/styles generated by Next.js, test CSP in `Content-Security-Policy-Report-Only` first, then enforce once violations are resolved.

## 11. Logs And Audit

Log requirements:

- Reverse proxy access logs with request id, remote IP, method, path, status, latency, and upstream status.
- App logs for session creation, validation failures, rate-limit denials, provider/network diagnostics, and stop/continue actions.
- No API keys, bearer tokens, prompt bodies, provider request bodies, full evidence payloads, or `.env` values in logs.
- Centralize logs with retention and restricted access.
- Alert on repeated `429`, `403`, `5xx`, SSRF validation failures, and unexpected outbound network errors.

Operational audit:

- Keep deploy metadata: commit SHA, package lock checksum, build timestamp, operator, and environment.
- Record secret rotations and who approved them.
- Review logs immediately after first redeploy and again after 24 hours.

## 12. Backup And Rollback

Current app appears mostly stateless server-side; browser history is local to the client. Still back up:

- deployment artifact or release directory
- `pnpm-lock.yaml`
- production env metadata without secret values
- reverse proxy config
- systemd unit
- TLS automation config
- host firewall config

Rollback requirements:

- Keep the last known-good release directory.
- Use an atomic symlink switch or platform-native rollback.
- Keep a rollback env file ready, but rotate secrets if rollback uses a previously exposed image.
- Test rollback before production traffic cutover.

Rollback trigger examples:

- build succeeds but app health check fails
- `5xx` error rate rises above baseline
- `/api/session` cost or outbound volume spikes
- CSP blocks critical app functionality after enforcement

## 13. Dependency Locking And Patch Updates

Required before redeploy:

```bash
pnpm install --frozen-lockfile
pnpm audit --prod
pnpm test
pnpm run build:release
```

Policy:

- Commit `pnpm-lock.yaml`.
- Do not deploy with a regenerated lockfile that was not reviewed.
- Use `pnpm run build:release` for release builds; it refuses to build when app-local `.env*` files or test report artifacts are present.
- Track Next.js, React, Playwright, Zod, and security advisories.
- Patch Critical/High advisories before production redeploy.
- Use scheduled dependency review for Medium/Low advisories.
- Generate SBOM if your deployment process supports it.

## 14. Final Go / No-Go Criteria

Go only if:

- `NODE_ENV=production` and no debug flags are active.
- All secrets are rotated and not committed.
- Service runs as non-root.
- Only `80/443` are publicly reachable.
- Next.js is reachable only through the reverse proxy.
- `/api/session` is authenticated or anonymous access is an explicit approved decision.
- Proxy rate limits are enabled.
- Security headers are present.
- Logs and alerts are active.
- Rollback path is tested.
- `pnpm audit --prod`, `pnpm test`, and `pnpm run build:release` pass from a clean checkout.
