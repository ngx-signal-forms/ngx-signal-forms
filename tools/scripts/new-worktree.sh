#!/usr/bin/env bash
# Creates a worktree for <branch> in the sibling `<repo>.worktrees/` folder
# and installs its dependencies. See docs/agents/sandbox.md.
#
# Run it outside the agent sandbox: it writes .git/config and the pnpm store.
set -euo pipefail

branch=${1:?usage: tools/scripts/new-worktree.sh <branch> [base, default origin/main]}
base=${2:-origin/main}

root=$(cd "$(git rev-parse --path-format=absolute --git-common-dir)/.." && pwd)
dir="$root.worktrees/$branch"

if [[ $base == origin/* ]]; then git -C "$root" fetch --quiet origin "${base#origin/}"; fi
# --no-track: `-b` with tracking needs a .git/config lock that fails in the sandbox.
git -C "$root" branch --no-track "$branch" "$base"
git -C "$root" worktree add --quiet "$dir" "$branch"

cd "$dir"
# --offline is fast, but fails when a lockfile entry is not in the store yet.
pnpm install --frozen-lockfile --offline --reporter=silent ||
  pnpm install --frozen-lockfile --reporter=silent

echo "$dir"
