# Sources and version policy

This skill bundles core toolkit contracts, not a copy of the toolkit repository.
Its guidance baseline is Angular 22.3.
Always inspect the consumer's actual installed versions instead of assuming a patch version or assuming every peer-compatible release exposes every API.

## Before choosing an API

1. Read the consumer's `package.json`, lockfile, and installed package metadata for Angular, `@ngx-signal-forms/toolkit`, and any optional peers (`vest`, `axe-core`).
2. Check the toolkit's `peerDependencies` and `exports` map. Follow the chosen entry point's `types` target to its shipped `.d.ts` declarations. Source files can contain `@internal` members stripped from published declarations. Shipped Angular declarations are authoritative for exact Angular signatures.
3. Read the bundled branch guide first. Follow deeper doc or source links from [api.md](api.md) or [demo-map.md](demo-map.md) only when the task needs detail beyond the guide.

## Online links

GitHub `blob/main/...` and `tree/main/...` links in this skill point to the latest `main` branch.
Treat them as mutable latest-source references, not proof of installed behavior or npm availability.

For behavior-specific lookups, replace `main` with the installed toolkit's `v<version>` tag when that tag exists, then check the path and anchor.
If no tag exists, installed declarations confirm API shape only, not runtime behavior (for example, RC.17 changed `on-touch` edit-hiding without changing public signatures). Require version-specific behavioral evidence (such as the target release's migration guide or tests) before relying on a `main` behavior finding, or mark the behavior unverified.
For migrations, read every crossed release guide rather than only the target release guide.
Verify npm registry availability separately before updating a manifest or lockfile.

Use official Angular docs or Context7 only when needed, passing the consumer's installed Angular version.

## Offline limits

When remote access is unavailable, rely on installed declarations and bundled guides.
State any missing online evidence and leave affected decisions open.
Complex version upgrades require their unbundled crossed-version guides; leave an offline migration incomplete when a crossed guide is missing.
Run the consumer's own test and build commands; repository `pnpm nx` commands apply only inside a toolkit maintenance checkout.
