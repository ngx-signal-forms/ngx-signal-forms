# Migration guide: `v1.0.0-beta.6` → `v1.0.0-beta.7`

Use this guide if you are upgrading from `@ngx-signal-forms/toolkit@1.0.0-beta.6` to `1.0.0-beta.7`.

- Release baseline: `v1.0.0-beta.6`
- Target release: `v1.0.0-beta.7`

For the high-level summary, see [Changelog: beta.7](./CHANGELOG_BETA7.md).

## Who should read this

### Toolkit consumers

Review this guide if your codebase does any of the following:

- uses `manual` as an error display strategy
- configures toolkit internals such as `fieldNameResolver`, `strictFieldResolution`, or `debug`
- uses `bare` form-field appearance
- relies on wrapper, assistive, or headless helpers inferring unstable field names without explicit IDs
- imports `ReactiveOrStatic`, `injectFormConfig`, or `createShowErrorsSignal` from the public toolkit package

### Demo consumers and example copiers

Review the demo notes if you copied patterns from `apps/demo`, especially around:

- grouped fieldset examples
- shared display controls
- async validation timing assumptions
- reset flows and deterministic control IDs

If you consume only the published toolkit package and do not copy demo source patterns, you can focus on the toolkit sections below.

## Summary of changes

| Area                  | `beta.6`                                                | `beta.7`                                                                 | Affects |
| --------------------- | ------------------------------------------------------- | ------------------------------------------------------------------------ | ------- |
| Error strategies      | Included legacy `manual` handling in the public surface | Supports `immediate`, `on-touch`, `on-submit`, and field-level `inherit` | Toolkit |
| Global config         | Included field-resolution and debug knobs               | Reduced to stable public config only                                     | Toolkit |
| Field identity        | More permissive fallback resolution                     | Deterministic: explicit `fieldName` or stable `id` required              | Toolkit |
| Form-field appearance | Included `bare` in the type surface                     | Supports `standard` and `outline`                                        | Toolkit |
| Public helper exports | Broader root export surface                             | Internal helper types/utilities removed from root exports                | Toolkit |
| Grouped examples      | No dedicated fieldset grouping page                     | New grouped fieldset examples and shared controls                        | Demo    |
| Async validation demo | Timing could vary by run                                | Demo flow is deterministic                                               | Demo    |

## Toolkit migration

## 1) Replace `manual` error strategy usage

### Strategy before

```ts
const strategy: ErrorDisplayStrategy = 'manual';
```

### Strategy after

Use one of the supported built-in strategies:

```ts
const strategy: ErrorDisplayStrategy = 'on-touch';
```

If you previously used `manual` to fully control visibility, move that control into your own component or template conditions and keep the toolkit strategy aligned with the user-facing UX you want.

Also note that `defaultErrorStrategy` is now a resolved global default. Use only:

- `immediate`
- `on-touch`
- `on-submit`

Keep `inherit` only for field-level overrides.

## 2) Remove deprecated config fields

### Config before

```ts
provideNgxSignalFormsConfig({
  defaultErrorStrategy: 'on-touch',
  fieldNameResolver: (element) => element.getAttribute('name'),
  strictFieldResolution: false,
  debug: true,
});
```

### Config after

```ts
provideNgxSignalFormsConfig({
  defaultErrorStrategy: 'on-touch',
  defaultFormFieldAppearance: 'outline',
});
```

If you previously relied on custom field-name resolution, switch to explicit `fieldName` values or stable control `id` attributes.

## 3) Use deterministic field identity

`beta.7` expects field identity to be explicit and stable.

### Field identity before

```html
<ngx-signal-form-field-wrapper [formField]="form.email">
  <label>Email</label>
  <app-custom-control [formField]="form.email" />
</ngx-signal-form-field-wrapper>
```

### Field identity after

```html
<ngx-signal-form-field-wrapper [formField]="form.email">
  <label for="email">Email</label>
  <app-custom-control id="email" [formField]="form.email" />
</ngx-signal-form-field-wrapper>
```

Do the same for:

- standalone `ngx-signal-form-error`
- headless field-name and error-state patterns
- custom controls projected into `ngx-signal-form-field-wrapper`

Use either:

- an explicit `fieldName`, or
- a deterministic `id` on the bound control or host element

## 4) Replace `bare` appearance usage

### Appearance before

```html
<ngx-signal-form-field-wrapper [formField]="form.email" appearance="bare">
  ...
</ngx-signal-form-field-wrapper>
```

### Appearance after

Use one of the supported appearance values:

```html
<ngx-signal-form-field-wrapper [formField]="form.email" appearance="standard">
  ...
</ngx-signal-form-field-wrapper>
```

If you depended on `bare` for a stripped layout, keep the visual styling custom and use `standard` plus your own CSS, or move to headless primitives where appropriate.

## 5) Stop importing internalized or removed root exports

### Import before

```ts
import type { ReactiveOrStatic } from '@ngx-signal-forms/toolkit';
import {
  createShowErrorsSignal,
  injectFormConfig,
} from '@ngx-signal-forms/toolkit';
```

### Import after

```ts
import { inject } from '@angular/core';
import { NGX_SIGNAL_FORMS_CONFIG, showErrors } from '@ngx-signal-forms/toolkit';

type SignalLike<T> = (() => T) | { (): T };
type ReactiveOrStatic<T> = T | SignalLike<T>;

const config = inject(NGX_SIGNAL_FORMS_CONFIG);
const visible = showErrors(field, 'on-touch', submittedStatus);
```

Migration notes:

- `ReactiveOrStatic` is internal-only in `beta.7`; define a local helper type if you still need the pattern.
- `createShowErrorsSignal()` is no longer exported; use `showErrors()`.
- `injectFormConfig()` is no longer exported from the public root entry point; inject `NGX_SIGNAL_FORMS_CONFIG` directly inside Angular injection context.

## Demo-specific notes

These are not additional package-level breaking changes, but they matter if you copied demo source or maintain docs/examples based on it.

- Grouped fieldset examples now use the dedicated `fieldset-grouping` page and emphasize grouped summaries.
- Demo pages now prefer shared display controls and shared form-field defaults instead of repeated per-page setup.
- Async validation examples were adjusted to be deterministic for tests and docs.
- Demo reset flows and control IDs were aligned with the stricter toolkit identity rules.

## Migration checklist

### Toolkit

- [ ] Replace any `manual` strategy usage
- [ ] Remove `fieldNameResolver`, `strictFieldResolution`, and `debug` from toolkit config
- [ ] Replace `appearance="bare"` with supported appearance values
- [ ] Add explicit `fieldName` or stable `id` attributes where needed
- [ ] Remove public imports of `ReactiveOrStatic`, `injectFormConfig`, and `createShowErrorsSignal`

### Demo and examples

- [ ] Re-check copied demo examples for deterministic `id` usage
- [ ] Re-check grouped fieldset examples and message placement assumptions
- [ ] Re-check async validation examples if your tests assumed earlier timing

### Verification

- [ ] Re-run build, tests, and lint for affected code

## Common issues after upgrade

### Error: `manual` is not assignable to `ErrorDisplayStrategy`

Replace it with a supported strategy and move any fully manual visibility rules into your own template or component state.

### Error: unknown config property `fieldNameResolver`, `strictFieldResolution`, or `debug`

Remove those fields from `provideNgxSignalFormsConfig()` and use explicit field identity instead.

### Error: could not resolve a deterministic field name

Add a stable `id` to the bound control or pass an explicit `fieldName`.

### Error: `ReactiveOrStatic`, `injectFormConfig`, or `createShowErrorsSignal` is not exported

Use a local helper type for `ReactiveOrStatic`, inject `NGX_SIGNAL_FORMS_CONFIG` directly, and replace `createShowErrorsSignal()` with `showErrors()`.
