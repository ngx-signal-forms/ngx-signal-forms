# Tools Directory

## Custom Changelog Renderer

### Overview

The `custom-changelog-renderer.js` file extends Nx's default changelog renderer to include ALL conventional commits in release notes, not just those affecting the toolkit package. This ensures demo improvements and other workspace changes appear in a separate "📦 Demo Application" section.

### Current Status: ⚠️ Disabled

Due to Nx Release's inability to load TypeScript modules, the renderer is currently **disabled** in `nx.json`.

### Workaround for Releases

When creating a new release that needs the custom renderer:

1. **Before `nx release version`**, temporarily add to `nx.json`:

   ```json
   "projectChangelogs": {
     "createRelease": "github",
     "file": false,
     "renderer": "./tools/custom-changelog-renderer.js",  // ← Add this line
     "renderOptions": { ... }
   }
   ```

2. **Run versioning**:

   ```bash
   pnpm exec nx release version patch  # or minor/major
   ```

3. **Before `nx release publish`**, remove the renderer line from `nx.json`

4. **Run publishing**:
   ```bash
   # Automated via GitHub Actions workflow
   ```

### Files

- **`custom-changelog-renderer.ts`** - TypeScript source (kept for reference and future updates)
- **`custom-changelog-renderer.js`** - Compiled JavaScript version (used by Nx)

### Why This Approach?

- Nx Release validates changelog renderer path during `nx release publish`
- TypeScript files cannot be loaded without additional configuration
- Temporarily adding/removing the config is safer than permanently disabling the renderer

### Future Improvements

Track issue for proper TypeScript loader support: [TBD]
