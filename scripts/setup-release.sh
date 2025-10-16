#!/usr/bin/env bash

# Script to help set up release configuration
set -e

echo "🚀 Nx Release Setup Helper"
echo ""

# Check if we're in the right directory
if [ ! -f "nx.json" ]; then
  echo "❌ Error: nx.json not found. Please run this from the workspace root."
  exit 1
fi

echo "This script will help you set up releases for @ngx-signal-forms/toolkit"
echo ""

# Check if user is logged into npm
echo "1️⃣ Checking NPM authentication..."
if npm whoami &> /dev/null; then
  NPM_USER=$(npm whoami)
  echo "✅ Logged in as: $NPM_USER"
else
  echo "⚠️  Not logged in to NPM"
  echo ""
  read -p "Would you like to login now? (y/n) " -n 1 -r
  echo
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    npm login
  else
    echo "⚠️  Skipping NPM login. You'll need to login later to publish."
  fi
fi

echo ""
echo "2️⃣ Checking GitHub secrets..."
echo ""
echo "For automated releases, you need to add NPM_TOKEN to GitHub secrets:"
echo ""
echo "   1. Create an Automation token at: https://www.npmjs.com/settings/${NPM_USER:-YOUR_USERNAME}/tokens"
echo "   2. Go to: https://github.com/ngx-signal-forms/ngx-signal-forms/settings/secrets/actions"
echo "   3. Click 'New repository secret'"
echo "   4. Name: NPM_TOKEN"
echo "   5. Value: [paste your token]"
echo ""
read -p "Press Enter when done (or skip)..."

echo ""
echo "3️⃣ Testing release configuration..."
echo ""

# Run a dry-run to test configuration
echo "Running: pnpm exec nx release --dry-run"
echo ""

if pnpm exec nx release --dry-run; then
  echo ""
  echo "✅ Dry run successful!"
else
  echo ""
  echo "❌ Dry run failed. Please check the errors above."
  exit 1
fi

echo ""
echo "✅ Setup complete!"
echo ""
echo "📚 Next steps:"
echo ""
echo "   • Read RELEASE.md for detailed release instructions"
echo "   • Try a beta release: pnpm exec nx release version prerelease --preid=beta"
echo "   • Or use GitHub Actions: Actions → Release → Run workflow"
echo ""
echo "Happy releasing! 🎉"
