# Tools Directory

## Custom Changelog Renderer

### Overview

The `custom-changelog-renderer.js` file extends Nx's default changelog renderer to include ALL conventional commits in release notes, not just those affecting the toolkit package. This ensures demo improvements and other workspace changes appear in a separate "📦 Demo Application" section.

### Current Status: ✅ Enabled

The compiled JavaScript renderer is now **enabled** in `nx.json` via
`release.changelog.projectChangelogs.renderer`.

### Files

- **`custom-changelog-renderer.ts`** - TypeScript source (kept for reference and future updates)
- **`custom-changelog-renderer.js`** - Compiled JavaScript version (used by Nx)

### Why This Approach?

- Nx Release validates changelog renderer path during `nx release publish`
- TypeScript files cannot be loaded without additional configuration
- Temporarily adding/removing the config is safer than permanently disabling the renderer

### Future Improvements

Track issue for proper TypeScript loader support: [TBD]
