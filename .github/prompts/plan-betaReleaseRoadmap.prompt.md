# Plan: Beta Release Roadmap

**TL;DR**: Fix critical package metadata issues (peerDependencies), add API stability documentation, and ensure a11y behaviors match WCAG guidance before beta. Currently alpha-ready but not beta-ready.

## Steps

### 1. Fix package.json peerDependencies

**File**: `packages/toolkit/package.json`

Remove build tools that are incorrectly listed as peer dependencies:

- `@nx/vite`
- `vite`
- `@analogjs/vite-plugin-angular`

Add missing runtime peer dependencies:

- `@angular/forms` (>=21.1.0)
- `@angular/common` (>=21.1.0)

### 2. Fix core/package.json Angular peer versions

**File**: `packages/toolkit/core/package.json`

Change `"next"` to consistent `~21.1.0` to match root package:

```json
{
  "peerDependencies": {
    "@angular/common": "~21.1.0",
    "@angular/core": "~21.1.0"
  }
}
```

### 3. Decide live-region a11y behavior

**Files**: `packages/toolkit/core/components/form-error.component.ts`

Errors currently render with `role="alert"` only when shown. Evaluate options:

**Option A**: Pre-render hidden live regions at page load (WCAG best practice for screen reader reliability)

```html
<!-- Always present, content conditionally shown -->
<div role="alert" aria-live="assertive">
  @if (showErrors()) {
  <!-- error content -->
  }
</div>
```

**Option B**: Keep current approach (render-on-demand) with documentation note explaining tradeoffs

**Recommendation**: Option B - simpler, works in practice, document the decision.

### 4. Add API stability policy to README.md

**File**: `packages/toolkit/README.md`

Add section documenting:

- Semver commitment
- Breaking change policy for 0.x versions (minor may include breaking)
- Deprecated API labeling convention
- Experimental API labeling convention (`@experimental` JSDoc tag)

### 5. Create CHANGELOG.md

**File**: `packages/toolkit/CHANGELOG.md`

Create initial changelog with:

- All features from ROADMAP.md "Completed Items" section
- Migration guidance for future versions
- Link to GitHub releases

---

## Further Considerations

### 1. Pre-rendered live regions?

WCAG best practice suggests `aria-live` regions exist at page load. Should error containers always render but visually hide content until needed?

**Options**:

- A: Always render container, toggle content visibility
- B: Keep current approach with documentation note

**Recommendation**: Option B - keep current approach with documentation note. Modern screen readers handle dynamic `role="alert"` well.

### 2. Breaking change policy before 1.0?

Should minor versions (0.x → 0.y) allow breaking changes?

**Recommendation**: Yes - document explicitly in README:

> During 0.x releases, minor version bumps may include breaking changes. Check CHANGELOG.md before upgrading. Patch releases (0.x.y) will never contain breaking changes.

### 3. Version bump strategy

What version for first beta?

**Options**:

- `0.1.0-beta.1` - indicates pre-1.0 status, beta quality
- `1.0.0-beta.1` - indicates API considered stable, beta quality

**Recommendation**: `0.1.0-beta.1` - API is not yet proven stable in production.

---

## Checklist for Beta Release

- [ ] Fix peerDependencies in `packages/toolkit/package.json`
- [ ] Fix Angular peer versions in `packages/toolkit/core/package.json`
- [ ] Document live-region behavior decision
- [ ] Add API stability policy to README.md
- [ ] Create CHANGELOG.md with all completed features
- [ ] Bump version to `0.1.0-beta.1`
- [ ] Run full test suite (`nx run-many -t test lint`)
- [ ] Build and verify package (`nx build toolkit`)
- [ ] Tag release and publish to npm
