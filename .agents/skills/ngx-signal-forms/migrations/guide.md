# Toolkit migrations

This guide migrates an existing
`@ngx-signal-forms/toolkit` integration between released versions.

Read the [source and version policy](../references/sources.md). The workflow is
bundled; release-specific guides are online and are not bundled. Offline work
can proceed only for changes supported by available evidence. Report missing
guides and leave the migration incomplete rather than infer their contents.

## Workflow

1. **Pin the upgrade.** Read the consumer's installed toolkit version from its
   manifest and lockfile, then identify the requested target version. Do not
   infer either version from source syntax alone.

   **Done:** source and target versions are explicit.

2. **Load the complete upgrade path.** For beta sources, read the
   [beta migration](https://github.com/ngx-signal-forms/ngx-signal-forms/blob/main/docs/MIGRATING_BETA_TO_V1.md).
   For release-candidate or v1 sources, read the
   [migration index](https://github.com/ngx-signal-forms/ngx-signal-forms/blob/main/docs/migrations/README.md)
   and every crossed version guide, not only the final target guide. For
   RC11 to RC13, load both
   [RC12](https://github.com/ngx-signal-forms/ngx-signal-forms/blob/main/docs/migrations/v1.0.0-rc.12.md)
   and [RC13](https://github.com/ngx-signal-forms/ngx-signal-forms/blob/main/docs/migrations/v1.0.0-rc.13.md).
   Resolve each hop against that guide's target release when a tag exists.
   A source tag or manifest does not prove registry publication; verify
   availability before selecting the dependency and lockfile version.

   **Done:** every crossed guide is loaded and its required changes are listed.

3. **Route each change to its owning surface.** Read [core](../core/guide.md),
   [form-field](../form-field/guide.md), [assistive](../assistive/guide.md),
   [headless](../headless/guide.md), or [Vest](../vest/guide.md) only for
   migration items that affect that entry point. Apply
   package, import, type, template, behavior, and test changes from the guides.

   **Done:** every required migration item is either applied or explicitly
   confirmed inapplicable to the consumer.

4. **Prove the target integration.** Search for every removed API named by the
   crossed guides, then run the consumer's existing type-check, build, and
   relevant tests. Confirm shipped exports and peer ranges. For RC11 to RC13,
   check notification/panel changes, renderer input union and `errorsOverride`,
   summary `showWarnings`, boolean submission results, independent warnings,
   and field-shaped controls. Use the [testing guide](../testing/guide.md) for
   changed interactions. Repository `pnpm nx` tasks apply only when the user
   explicitly requests toolkit maintenance in its own checkout.

   **Done:** no crossed-guide removal remains, and the target validation gates
   pass.
