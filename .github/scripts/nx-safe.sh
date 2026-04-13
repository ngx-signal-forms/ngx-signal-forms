#!/usr/bin/env bash
# Runs a command, retrying without Nx Cloud if the run hard-fails because
# Nx Cloud rejected the workspace (org disabled, quota exceeded, token bad).
# Nx Cloud stays enabled when it's healthy; CI never blocks when it isn't.
#
# On fallback, persists NX_NO_CLOUD=true to $GITHUB_ENV so every subsequent
# step in the same job also skips Nx Cloud.
#
# Usage: bash .github/scripts/nx-safe.sh <command> [args...]

set -uo pipefail

if [ "$#" -eq 0 ]; then
  echo "nx-safe.sh: no command given" >&2
  exit 2
fi

logfile=$(mktemp)
trap 'rm -f "$logfile"' EXIT

"$@" 2>&1 | tee "$logfile"
rc=${PIPESTATUS[0]}

if [ "$rc" -eq 0 ]; then
  exit 0
fi

if grep -qE "Nx Cloud.*(Exiting run|organization has been disabled|unable to be authorized)" "$logfile"; then
  echo "::warning title=Nx Cloud unavailable::Retrying '$*' locally without Nx Cloud."
  if [ -n "${GITHUB_ENV:-}" ] && [ -f "${GITHUB_ENV}" ]; then
    echo "NX_NO_CLOUD=true" >> "$GITHUB_ENV"
  fi
  NX_NO_CLOUD=true NX_DAEMON=false "$@"
  exit $?
fi

exit "$rc"
