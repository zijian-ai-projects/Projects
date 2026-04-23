# Security Fix Plan

Scope: only Critical and High issues from `SECURITY_AUDIT.md` were fixed. Medium and Low findings are listed as out of scope to avoid broad refactors.

## Fixed Items

### 1. Critical - Next.js React Flight/RSC RCE

Changed:
- Upgraded `next` from `15.3.0` to `15.5.15`.
- Upgraded matching `eslint-config-next` from `15.3.0` to `15.5.15`.
- Upgraded `@playwright/test` from `1.52.0` to `1.55.1` because `pnpm audit --prod` still reported a High `playwright<1.55.1` advisory after the Next upgrade.

Why:
- `next@15.3.0` was in the vulnerable range for the Critical React Flight/RSC RCE advisory. Moving to the latest Next 15 patch removes that vulnerable runtime.
- Updating the matching ESLint config keeps the Next toolchain version-aligned.
- Updating Playwright clears the remaining High production audit path introduced through the lockfile.

### 2. High - Client-controlled provider `baseUrl` SSRF and API key exfiltration

Changed:
- Added `src/lib/url-safety.ts` with a strict provider allowlist.
- `providerConfig.baseUrl` now requires `https` and a known provider host: DeepSeek, OpenAI, Gemini, or Volcengine Ark.
- Added API route tests that reject `http://127.0.0.1:11434/v1`.

Why:
- The server sends `Authorization: Bearer ...` to the configured model endpoint. Allowing arbitrary client URLs let attackers point the server at internal services or attacker-controlled hosts and leak API keys.
- A server-side allowlist is the smallest change that blocks arbitrary egress without redesigning the provider settings UI.

### 3. High - Client-controlled Tavily endpoint and second-stage page extraction SSRF

Changed:
- `searchConfig.endpoint` now requires an allowed endpoint for the selected engine. Tavily is restricted to `https://api.tavily.com/search`.
- Tavily and DuckDuckGo result mapping now drops local/private/non-HTTPS result URLs.
- Page extraction validates the initial URL, DNS-resolved addresses, and each redirect target before fetching or following it.
- Added tests for attacker-controlled Tavily endpoint rejection, local/private result filtering, DNS-to-private blocking, direct local extraction blocking, and redirect-to-metadata blocking.

Why:
- The prior flow allowed one SSRF through the Tavily endpoint and a second SSRF through attacker-supplied result URLs.
- Endpoint allowlisting blocks the first SSRF. Public URL validation, DNS-result validation, and redirect revalidation block the second-stage fetch from reaching loopback, link-local, RFC1918, and similar local/private targets.

### 4. High - Anonymous session creation can trigger unbounded background work

Changed:
- `config.roundCount` is capped at `5`.
- `POST /api/session` now rate-limits creation per client IP/header key. Default: `30` requests per minute. Override with `DUALENS_SESSION_RATE_LIMIT_MAX`.
- In production, anonymous session creation is disabled unless `DUALENS_ALLOW_ANONYMOUS_SESSIONS=1` is set or the request supplies `Authorization: Bearer $DUALENS_SESSION_API_TOKEN` / `x-dualens-session-token`.
- Added tests for excessive `roundCount`, production anonymous blocking, and per-client rate limiting.

Why:
- Large `roundCount` values could create long-running LLM/search loops from one request.
- Rate limiting reduces bulk anonymous task creation.
- Production default-deny prevents accidental public deployment of an unauthenticated cost-amplifying endpoint while still leaving explicit opt-in knobs for private/demo deployments.

## Out Of Scope

- Medium session ownership checks were not implemented because the request limited changes to High/Critical findings.
- Medium browser `localStorage` API key storage was not redesigned because it requires a larger server-side credential custody change.
- Low response headers were not changed because they are outside the requested severity scope.

## Verification

- `pnpm test`: 41 files, 238 tests passed.
- `pnpm audit --prod`: no known vulnerabilities found.
- `pnpm build`: production build completed successfully on Next `15.5.15`.
