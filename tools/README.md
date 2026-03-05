# Tools Directory

## Custom Changelog Renderer

### Overview

The `custom-changelog-renderer.ts` source extends Nx's default changelog renderer to include all conventional commits in release notes, not just those affecting the toolkit package. This ensures demo improvements and other workspace changes appear in a separate "📦 Demo Application" section.

### Current Status: ⚠️ Source Only (Not Active)

The compiled JavaScript artifact was removed during cleanup, and the custom
renderer is currently not wired in `nx.json`.

### Files

- **`custom-changelog-renderer.ts`** - TypeScript source for the custom renderer

### Why This Approach?

- Nx Release validates changelog renderer paths during `nx release publish`
- TypeScript renderer files cannot be loaded directly without extra runtime setup
- Keeping only source avoids shipping stale compiled artifacts

### Future Improvements

Track issue for proper TypeScript loader support: [TBD]
