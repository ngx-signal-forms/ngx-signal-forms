---
name: ngx-signal-forms-migrations
disable-model-invocation: true
---

# Toolkit migrations

This routed sub-skill migrates an existing
`@ngx-signal-forms/toolkit` integration between released versions.

## Workflow

1. **Pin the upgrade.** Read the consumer's installed toolkit version from its
   manifest and lockfile, then identify the requested target version. Do not
   infer either version from source syntax alone.

   **Done:** source and target versions are explicit.

2. **Load the complete upgrade path.** For beta sources, read
   `docs/MIGRATING_BETA_TO_V1.md`. For release-candidate or v1 sources, read
   `docs/migrations/README.md` and every `v<target>.md` guide crossed between
   the source and target versions.

   **Done:** every crossed guide is loaded and its required changes are listed.

3. **Route each change to its owning surface.** Read `core/SKILL.md`,
   `form-field/SKILL.md`, `assistive/SKILL.md`, `headless/SKILL.md`, or
   `vest/SKILL.md` only for migration items that affect that entry point. Apply
   package, import, type, template, behavior, and test changes from the guides.

   **Done:** every required migration item is either applied or explicitly
   confirmed inapplicable to the consumer.

4. **Prove the target integration.** Search for every removed API named by the
   crossed guides, then run the consumer's existing type-check, build, and
   relevant tests.

   **Done:** no crossed-guide removal remains, and the target validation gates
   pass.
