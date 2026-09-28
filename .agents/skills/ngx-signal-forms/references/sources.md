# Sources and version policy

This skill bundles essential contracts, not a copy of the toolkit repository.
Its guidance baseline is Angular 22.1. Inspect the consumer's actual versions;
do not assume a particular patch or that every peer-compatible version exposes
every API described here.

## Before choosing an API

1. Read the consumer's manifest, lockfile, and installed package metadata for
   Angular, toolkit, and any relevant optional peers.
2. Check the toolkit's actual peer range and `exports` map. Follow the selected
   entry's `types` target to shipped declarations. Source-only `@internal`
   members may be stripped. Installed Angular declarations are authoritative
   for exact-version Angular signatures too.
3. Read the bundled branch guide. For deeper behavior, follow only the relevant
   doc/source link from the [API index](api.md) or [online examples](demo-map.md).

## Online links

GitHub `blob/main/...` and `tree/main/...` links in this skill point to the
latest mutable documentation and source. They are not proof of installed
behavior, a release guarantee, or npm availability. `blob` identifies a file;
`tree` identifies a directory.

For behavior-specific lookup, replace `main` with the actual installed
toolkit's `v<version>` tag when it exists, then check the path and anchor.
If it does not exist, label any main-branch finding as latest-source evidence
and compare it with shipped declarations. For migrations, follow each crossed
guide for its own target version, not only the final target. Registry
availability needs separate verification.

Use official Angular docs or Context7 only when useful, with the installed
Angular version in the lookup. Neither Context7 nor a global Angular skill is
a dependency. No Nx or local toolkit docs, apps, or packages directory is
required. Demo links are online examples, not assumed consumer files.

## Offline limits

If remote access fails, use installed declarations and bundled guidance for
supported work. State the missing evidence and leave affected decisions open.
Complex migrations need their unbundled crossed-version guides; do not claim
an offline migration is complete without them. Run the consumer's own existing
checks. Toolkit repository tasks apply only to an explicit maintenance checkout.
