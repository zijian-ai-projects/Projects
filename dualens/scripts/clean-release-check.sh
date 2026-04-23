#!/usr/bin/env sh
set -eu

if find . -maxdepth 1 -type f \( -name ".env" -o -name ".env.*" \) | grep -q .; then
  echo "Release build refused: remove local .env files from the app checkout." >&2
  find . -maxdepth 1 -type f \( -name ".env" -o -name ".env.*" \) -print >&2
  exit 1
fi

for path in test-results playwright-report coverage .vitest-results.json; do
  if [ -e "$path" ]; then
    echo "Release build refused: remove test/report artifact '$path' before packaging." >&2
    exit 1
  fi
done

echo "Release checkout check passed: no local env or test report artifacts found."
