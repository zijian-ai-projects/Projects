#!/usr/bin/env bash
# Dualens redeploy preflight draft.
# This script performs read-only checks except package/build commands if you enable them.
# Review before use. Do not run blindly on production hosts.

set -euo pipefail

APP_DIR="${APP_DIR:-/opt/dualens/current/dualens}"
ENV_FILE="${ENV_FILE:-/etc/dualens/dualens.env}"
SERVICE_NAME="${SERVICE_NAME:-dualens}"
DOMAIN="${DOMAIN:-dualens.example.com}"
RUN_BUILD_CHECKS="${RUN_BUILD_CHECKS:-0}"

failures=0

check() {
  local name="$1"
  shift
  echo "==> ${name}"
  if "$@"; then
    echo "OK: ${name}"
  else
    echo "FAIL: ${name}" >&2
    failures=$((failures + 1))
  fi
}

env_value() {
  local key="$1"
  if [[ -f "${ENV_FILE}" ]]; then
    grep -E "^${key}=" "${ENV_FILE}" | tail -n 1 | cut -d= -f2- || true
  fi
}

check_env_file_exists() {
  [[ -f "${ENV_FILE}" ]]
}

check_env_file_permissions() {
  local mode
  mode="$(stat -c "%a" "${ENV_FILE}" 2>/dev/null || stat -f "%Lp" "${ENV_FILE}")"
  [[ "${mode}" == "600" || "${mode}" == "640" ]]
}

check_production_env() {
  [[ "$(env_value NODE_ENV)" == "production" ]]
}

check_no_debug_flags() {
  ! grep -E '^(DEBUG|MOCK_RESEARCH|NODE_OPTIONS=.*--inspect)' "${ENV_FILE}" >/dev/null 2>&1
}

check_no_placeholder_secrets() {
  ! grep -Ei '(your_|change-me|replace-with|demo|test-key|password)' "${ENV_FILE}" >/dev/null 2>&1
}

check_session_controls() {
  local anonymous token
  anonymous="$(env_value DUALENS_ALLOW_ANONYMOUS_SESSIONS)"
  token="$(env_value DUALENS_SESSION_API_TOKEN)"
  [[ "${anonymous}" != "1" && -n "${token}" && "${#token}" -ge 32 ]]
}

check_node_local_bind() {
  ss -ltnp 2>/dev/null | grep ':3000' | grep -E '127\.0\.0\.1:3000|\[::1\]:3000' >/dev/null
}

check_public_ports() {
  local listening
  listening="$(ss -ltn 2>/dev/null || true)"
  echo "${listening}" | grep -E ':(80|443)\s' >/dev/null
  ! echo "${listening}" | grep -E '0\.0\.0\.0:3000|\[::\]:3000' >/dev/null
}

check_service_non_root() {
  local user
  user="$(systemctl show "${SERVICE_NAME}" -p User --value 2>/dev/null || true)"
  [[ -n "${user}" && "${user}" != "root" ]]
}

check_nginx_config() {
  command -v nginx >/dev/null 2>&1 && nginx -t
}

check_security_headers() {
  local headers
  headers="$(curl -fsSI "https://${DOMAIN}" || true)"
  echo "${headers}" | grep -qi '^strict-transport-security:' &&
    echo "${headers}" | grep -qi '^x-content-type-options:.*nosniff' &&
    echo "${headers}" | grep -qi '^x-frame-options:.*deny'
}

check_build_pipeline() {
  [[ "${RUN_BUILD_CHECKS}" == "1" ]] || return 0
  cd "${APP_DIR}"
  pnpm install --frozen-lockfile
  pnpm audit --prod
  pnpm test
  pnpm build
}

check "environment file exists" check_env_file_exists
check "environment file permissions are strict" check_env_file_permissions
check "NODE_ENV is production" check_production_env
check "debug flags are disabled" check_no_debug_flags
check "placeholder secrets are absent" check_no_placeholder_secrets
check "session creation controls are set" check_session_controls
check "Next.js is local-only on port 3000" check_node_local_bind
check "only required public ports are exposed" check_public_ports
check "systemd service is non-root" check_service_non_root
check "nginx config syntax is valid" check_nginx_config
check "security headers are present" check_security_headers
check "optional build pipeline checks" check_build_pipeline

if [[ "${failures}" -gt 0 ]]; then
  echo "Preflight completed with ${failures} failure(s)." >&2
  exit 1
fi

echo "Preflight checks passed."
