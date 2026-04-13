#!/usr/bin/env bash
# Runs a command, retrying without Nx Cloud if the run hard-fails because
# Nx Cloud rejects or cannot serve the workspace (auth failure, org disabled,
# or plan/quota rejection). Nx Cloud stays enabled when it's healthy; CI never
# blocks when it isn't.
#
# Nx already tolerates transient remote-cache outages during task execution, so
# this wrapper only handles the failures that abort the command before local
# execution can continue.
#
# On fallback, persists NX_NO_CLOUD=true and scrubs NX_CLOUD_ACCESS_TOKEN /
# NX_CLOUD_AUTH_TOKEN in $GITHUB_ENV so every subsequent step in the same job
# also runs with a clean, cloud-less environment.
#
# Usage: bash .github/scripts/nx-safe.sh <command> [args...]

set -uo pipefail

# Classifier pattern. Kept as a single ERE so a match can be logged with the
# offending line for debuggability on fallback.
readonly NX_CLOUD_FAILURE_PATTERN='(Exiting run|organization has been disabled|workspace has been disabled|unable to be authorized|status code (401|402|403)|quota|credit(s)? (exceeded|exhausted)|plan limit|free plan|payment required)'

is_nx_cloud_hard_failure() {
  local file_path=$1

  grep -qi 'Nx Cloud' "$file_path" &&
    grep -qiE "$NX_CLOUD_FAILURE_PATTERN" "$file_path"
}

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

if is_nx_cloud_hard_failure "$logfile"; then
  # Surface the matched line so fallbacks are never silent in CI logs.
  matched_line=$(grep -iE "$NX_CLOUD_FAILURE_PATTERN" "$logfile" | head -n 1 || true)
  echo "::warning title=Nx Cloud unavailable::Retrying '$*' locally without Nx Cloud. Trigger: ${matched_line:-<no match line captured>}"

  # Persist a cloud-less environment for downstream steps in the same job.
  if [ -n "${GITHUB_ENV:-}" ] && [ -f "${GITHUB_ENV}" ]; then
    {
      echo "NX_NO_CLOUD=true"
      echo "NX_DAEMON=false"
      echo "NX_CLOUD_ACCESS_TOKEN="
      echo "NX_CLOUD_AUTH_TOKEN="
    } >> "$GITHUB_ENV"
  fi

  NX_NO_CLOUD=true NX_DAEMON=false NX_CLOUD_ACCESS_TOKEN= NX_CLOUD_AUTH_TOKEN= "$@"
  exit $?
fi

exit "$rc"
