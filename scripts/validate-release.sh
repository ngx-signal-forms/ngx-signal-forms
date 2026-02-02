#!/usr/bin/env bash
set -euo pipefail

# Validate release notes will include all important commits
# Usage: ./scripts/validate-release.sh [from-tag] [to-tag]

FROM_TAG="${1:-$(git describe --tags --abbrev=0)}"
TO_TAG="${2:-HEAD}"

echo "🔍 Analyzing commits from $FROM_TAG to $TO_TAG"
echo ""

# Get all commits in range
ALL_COMMITS=$(git log "$FROM_TAG..$TO_TAG" --pretty=format:"%h %s" --no-merges)

# Filter for conventional commits
FEAT_COMMITS=$(echo "$ALL_COMMITS" | grep -E "^[a-f0-9]+ feat(\(.*\))?:" || true)
FIX_COMMITS=$(echo "$ALL_COMMITS" | grep -E "^[a-f0-9]+ fix(\(.*\))?:" || true)
REFACTOR_COMMITS=$(echo "$ALL_COMMITS" | grep -E "^[a-f0-9]+ refactor(\(.*\))?:" || true)
DOCS_COMMITS=$(echo "$ALL_COMMITS" | grep -E "^[a-f0-9]+ docs(\(.*\))?:" || true)

# Check for toolkit-affecting commits
echo "📦 Commits affecting toolkit package:"
git log "$FROM_TAG..$TO_TAG" --pretty=format:"%h %s" --no-merges -- packages/toolkit/ | head -20
echo ""
echo ""

# Show summary
echo "📊 Commit Type Summary:"
echo "  feat:     $(echo "$FEAT_COMMITS" | grep -c ^ || echo 0)"
echo "  fix:      $(echo "$FIX_COMMITS" | grep -c ^ || echo 0)"
echo "  refactor: $(echo "$REFACTOR_COMMITS" | grep -c ^ || echo 0)"
echo "  docs:     $(echo "$DOCS_COMMITS" | grep -c ^ || echo 0)"
echo ""

# Show feature commits
if [ -n "$FEAT_COMMITS" ]; then
  echo "🚀 Feature Commits:"
  echo "$FEAT_COMMITS" | sed 's/^/  /'
  echo ""
fi

# Show fix commits
if [ -n "$FIX_COMMITS" ]; then
  echo "🩹 Fix Commits:"
  echo "$FIX_COMMITS" | sed 's/^/  /'
  echo ""
fi

# Check for breaking changes
BREAKING_CHANGES=$(git log "$FROM_TAG..$TO_TAG" --pretty=format:"%h %s%n%b" --no-merges | grep -i "BREAKING CHANGE" || true)
if [ -n "$BREAKING_CHANGES" ]; then
  echo "⚠️  Breaking Changes Detected:"
  echo "$BREAKING_CHANGES" | sed 's/^/  /'
  echo ""
fi

# Check for demo-only commits (won't be in toolkit release)
DEMO_ONLY=$(git log "$FROM_TAG..$TO_TAG" --pretty=format:"%h %s" --no-merges -- apps/demo/ | \
  grep -v "packages/toolkit" || true)
if [ -n "$DEMO_ONLY" ]; then
  echo "ℹ️  Demo-only commits (excluded from toolkit release):"
  echo "$DEMO_ONLY" | head -10 | sed 's/^/  /'
  echo ""
fi

echo "✅ Validation complete. Review the commits above before releasing."
