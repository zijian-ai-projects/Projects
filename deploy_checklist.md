# Dualens Redeploy Checklist

Use this as a manual gate before production redeployment. Do not mark an item complete without evidence.

## A. Source And Build

- [ ] Deployment commit SHA is recorded: `________________`
- [ ] `pnpm-lock.yaml` is committed and reviewed.
- [ ] Clean checkout uses `pnpm install --frozen-lockfile`.
- [ ] `pnpm audit --prod` reports no Critical/High vulnerabilities.
- [ ] `pnpm test` passes.
- [ ] `pnpm run build:release` passes from a checkout without `.env*` files.
- [ ] The deployment uses `pnpm start`, not `pnpm dev`.

Evidence:

```text
audit output:
test output:
build output:
```

## B. Debug Mode Disabled

- [ ] `NODE_ENV=production`.
- [ ] `DEBUG` is unset.
- [ ] `MOCK_RESEARCH` is unset or `0`.
- [ ] `NODE_OPTIONS` does not include `--inspect`.
- [ ] Process list has no `next dev` or `pnpm dev`.
- [ ] Client-facing errors do not expose stack traces or secrets.

Evidence:

```bash
env | grep -E 'NODE_ENV|NODE_OPTIONS|DEBUG|MOCK_RESEARCH'
ps aux | grep -E 'next dev|pnpm dev|--inspect'
```

## C. Credentials And Secrets

- [ ] `DEEPSEEK_API_KEY` rotated for production.
- [ ] `TAVILY_API_KEY` rotated for production if used.
- [ ] `OPENAI_API_KEY` / `OPENAI_COMPATIBLE_API_KEY` rotated if used.
- [ ] `DUALENS_SESSION_API_TOKEN` generated with high entropy.
- [ ] `DUALENS_SESSION_OWNER_SECRET` generated with high entropy.
- [ ] No placeholder values remain: `your_*`, `change-me`, `demo`, `test`, `password`.
- [ ] No real secrets are committed to Git.
- [ ] `.env.local` is not deployed as a shared artifact.
- [ ] Production env file is `0640` or stricter.
- [ ] Secrets are stored in an approved secret manager or locked-down env file.

Evidence:

```text
secret rotation ticket:
env file path:
env file owner/mode:
```

## D. Runtime Least Privilege

- [ ] Dedicated non-root user exists, for example `dualens`.
- [ ] Runtime process runs as non-root.
- [ ] App binds to `127.0.0.1:3000`, not `0.0.0.0:3000`.
- [ ] Runtime user cannot write source files, `.env`, deployment keys, or backups.
- [ ] systemd hardening options are enabled where applicable.

Evidence:

```bash
ps -o user,group,pid,args -C node
ss -ltnp | grep 3000
systemctl cat dualens
```

## E. Network And Ports

- [ ] Only `80/tcp`, `443/tcp`, and restricted admin SSH are reachable from the internet.
- [ ] Port `3000/tcp` is local-only.
- [ ] Cloud security group/firewall matches host firewall.
- [ ] No database/cache/metrics/admin port is public.

Evidence:

```bash
ss -ltnp
sudo ufw status verbose
```

## F. Reverse Proxy

- [ ] HTTP redirects to HTTPS.
- [ ] TLS certificate is valid and auto-renewal is monitored.
- [ ] Proxy forwards to `http://127.0.0.1:3000`.
- [ ] Request body size limit is set.
- [ ] Hidden files and accidental secret paths are denied.
- [ ] `/uploads/` returns `404` or is served from a non-executable static directory.
- [ ] Proxy config syntax checked before reload.

Evidence:

```bash
sudo nginx -t
curl -I http://<domain>
curl -I https://<domain>
```

## G. API Rate Limits And Session Controls

- [ ] `DUALENS_SESSION_RATE_LIMIT_MAX` is set to an approved value.
- [ ] `DUALENS_ALLOW_ANONYMOUS_SESSIONS` is unset/`0`, unless explicitly approved.
- [ ] If anonymous sessions are disabled, clients use `DUALENS_SESSION_API_TOKEN`.
- [ ] Reverse proxy rate limits `/api/session` and `/api/`.
- [ ] Login throttling is configured if auth routes are introduced.

Evidence:

```text
approved anonymous-session decision:
rate limit value:
proxy rate-limit config:
```

## H. Management Access Control

- [ ] Decision recorded for access to `/app`, `/providers`, `/search-engines`, `/settings`, `/history`.
- [ ] Management-like routes are behind SSO, VPN, IP allowlist, strong Basic Auth, or another approved gate.
- [ ] No default Basic Auth credentials exist.
- [ ] Admin access logs are enabled.

Evidence:

```text
access-control mechanism:
allowed users/groups/IP ranges:
```

## I. Security Headers

- [ ] `Strict-Transport-Security` enabled after HTTPS verification.
- [ ] `X-Content-Type-Options: nosniff`.
- [ ] `X-Frame-Options: DENY`.
- [ ] `Referrer-Policy: strict-origin-when-cross-origin`.
- [ ] `Permissions-Policy` restricts unused browser features.
- [ ] CSP is deployed in report-only or enforced mode after testing.

Evidence:

```bash
curl -I https://<domain>
```

## J. Logs And Audit

- [ ] Reverse proxy access and error logs enabled.
- [ ] App service logs captured by journald or central logging.
- [ ] Logs do not include API keys, bearer tokens, full prompt bodies, or `.env` values.
- [ ] Alerts configured for spikes in `403`, `429`, `5xx`, and outbound provider failures.
- [ ] Deploy metadata recorded: commit SHA, build time, operator, package lock checksum.

Evidence:

```text
log destination:
alert rules:
deploy record:
```

## K. Backups And Rollback

- [ ] Last known-good release retained.
- [ ] Reverse proxy config backed up.
- [ ] systemd unit backed up.
- [ ] Production env metadata backed up without secret values.
- [ ] Rollback command/path documented.
- [ ] Health check and rollback trigger thresholds defined.
- [ ] Rollback tested in staging or dry-run.

Evidence:

```text
backup location:
rollback target:
rollback test result:
```

## Final Approval

- [ ] Security owner approval: `________________`
- [ ] Deployment owner approval: `________________`
- [ ] Rollback owner available during release window: `________________`
- [ ] Release window: `________________`
