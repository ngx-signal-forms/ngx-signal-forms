# Toolkit migrations

This guide migrates an existing
`@ngx-signal-forms/toolkit` integration between released versions.

Read the [source and version policy](../references/sources.md). The workflow is
bundled; release-specific migration guides are online, not bundled with the
skill. Read published guides from the [Docs7 migration index](https://ngx-signal-forms-ngx-signal-forms.docs7.io/docs/migrations), for example the [RC.16 guide](https://ngx-signal-forms-ngx-signal-forms.docs7.io/docs/migrations/v1-0-0-rc-16). Docs7 may lag the repository during a release; for a pending release, or when a deployed guide does not reflect the current source, use the guide on the repository's online `main` branch. Do not assume either source exists on the consumer's computer. Offline work can proceed only for changes supported by available evidence. Report missing guides and leave the migration incomplete rather than infer their contents.

## Workflow

1. **Pin the upgrade.** Read the consumer's installed toolkit version from its
   manifest and lockfile, then identify the requested target version. Do not
   infer either version from source syntax alone.

   **Done:** source and target versions are explicit.

2. **Load the complete upgrade path.** Read the
   [migration index](https://ngx-signal-forms-ngx-signal-forms.docs7.io/docs/migrations)
   and every crossed version guide, not only the final target guide. For RC11
   to RC13, load both
   [RC12](https://github.com/ngx-signal-forms/ngx-signal-forms/blob/main/docs/migrations/v1.0.0-rc.12.md)
   and [RC13](https://github.com/ngx-signal-forms/ngx-signal-forms/blob/main/docs/migrations/v1.0.0-rc.13.md).
   For beta sources, also load the
   [cumulative beta-to-v1 guide](https://github.com/ngx-signal-forms/ngx-signal-forms/blob/main/docs/MIGRATING_BETA_TO_V1.md).
   Check current CSS token names and supported overrides in
   [THEMING.md](https://github.com/ngx-signal-forms/ngx-signal-forms/blob/main/packages/toolkit/form-field/THEMING.md).
   For RC.15 to RC.16, read the
   [RC.15-to-RC.16 migration guide](https://ngx-signal-forms-ngx-signal-forms.docs7.io/docs/migrations/v1-0-0-rc-16)
   when available. If Docs7 is behind or the guide is pending, use the guide
   on the repository's online `main` branch instead.
   Resolve each hop against that guide's target release when a tag exists.
   A source tag or manifest does not prove registry publication; verify
   availability before selecting the dependency and lockfile version. A guide
   for a pending target supports planning only; keep the migration incomplete
   until that version is available.

   **Done:** every crossed guide is loaded and its required changes are listed.

3. **Route each change to its owning surface.** Read [core](../core/guide.md),
   [form-field](../form-field/guide.md), [assistive](../assistive/guide.md),
   [headless](../headless/guide.md), or [Vest](../vest/guide.md) only for
   migration items that affect that entry point. Apply
   package, import, type, template, behavior, and test changes from the guides.

   **Done:** every required migration item is either applied or explicitly
   confirmed inapplicable to the consumer.

4. **Prove the target integration.** Use each crossed migration guide as the
   exhaustive checklist. Search the consumer for every removed or renamed
   public symbol and entry-point move named there. Check peer ranges and every
   applicable consumer-visible behavior change, including styles, accessible
   names and descriptions, announcements, focus, and tests or snapshots. Record
   each item as applied, verified unchanged, or inapplicable; do not treat a
   passing build as proof that behavior-only changes are covered.

   For RC15 to RC16, check these removals:

   - Testing entry point: `findAlertContaining`. Replace each call with the
     query in the [testing guide](../testing/guide.md).
   - Headless entry point: `readFieldFlag`. Use `field().invalid()` and
     similar, or `createFieldStateFlags()`.
   - Headless entry point: `readErrors`. Use `field().errorSummary()` for a
     subtree, or `createErrorState()` for one field's direct errors only.
   - Headless entry point: `toErrorSummaryEntry`,
     `resolveFieldNameFromError` and `focusBoundControlFromError`. Use
     `createErrorSummaryEntries()`.
   - Root entry point: `NgxFieldIdentity.isControlVisible`,
     `NgxFieldIdentity.setControlVisible` and `ControlVisibilitySignal`. Use
     `createControlVisibilitySignal()` for a visibility read, or
     `isElementCssVisible()` inside your own `earlyRead`.
   - Root entry point: `NgxControlPresetRegistry`. Use
     `inject(NGX_SIGNAL_FORM_CONTROL_PRESETS)`, and replace `extend()` with
     `mergeNgxSignalFormControlPresets()`.

   Use the testing guide for changed interactions. Repository `pnpm nx` tasks
   apply only when the user explicitly requests toolkit maintenance in its own
   checkout.

   **Done:** every migration-guide item is accounted for, no crossed-guide
   removal remains, and all applicable target validation gates pass.
