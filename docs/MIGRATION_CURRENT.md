# Migration guide: `v1.0.0-beta.6` → current `main`

Use this guide if you are testing or consuming the current unreleased `main` branch after `v1.0.0-beta.6`.

- Release baseline: `v1.0.0-beta.6`
- Target scope: current `main`

For the high-level summary, see [Current main changelog](./CHANGELOG_CURRENT.md).

## Who should read this

Review this guide if your codebase does any of the following:

- uses `manual` as an error display strategy
- configures toolkit internals such as `fieldNameResolver`, `strictFieldResolution`, or `debug`
- uses `bare` form-field appearance
- relies on wrapper/error components inferring unstable field names without explicit IDs
- imports `ReactiveOrStatic` from the public toolkit package

## Summary of changes

| Area                  | `beta.6`                                                     | current `main`                                                                |
| --------------------- | ------------------------------------------------------------ | ----------------------------------------------------------------------------- |
| Error strategies      | Included legacy `manual` handling in the broader API surface | Simplified to `immediate`, `on-touch`, `on-submit`, and field-level `inherit` |
| Global config         | Wider surface including field-resolution/debug knobs         | Reduced to stable public config only                                          |
| Field identity        | More permissive resolution paths                             | Deterministic: explicit `fieldName` or stable `id` required                   |
| Form-field appearance | Included `bare` in the type surface                          | Supports `standard` and `outline`                                             |
| Public types          | `ReactiveOrStatic` was reachable from the public surface     | `ReactiveOrStatic` is internal-only                                           |

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

If you previously used `manual` to fully control visibility, move that control into your own template/component conditions and keep the toolkit strategy aligned with the actual UX you want.

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

If you relied on custom field-name resolution, switch to explicit `fieldName` values or stable control `id` attributes.

## 3) Use deterministic field identity

The current toolkit expects field identity to be explicit.

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

Do the same for standalone `ngx-signal-form-error` and headless field-name/error-state patterns.

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

## 5) Stop importing `ReactiveOrStatic`

### Type import before

```ts
import type { ReactiveOrStatic } from '@ngx-signal-forms/toolkit';
```

### Type import after

Define your own local helper type if you still need that pattern:

```ts
type SignalLike<T> = (() => T) | { (): T };
type ReactiveOrStatic<T> = T | SignalLike<T>;
```

## Migration checklist

- [ ] Replace any `manual` strategy usage
- [ ] Remove `fieldNameResolver`, `strictFieldResolution`, and `debug` from toolkit config
- [ ] Replace `appearance="bare"` with supported appearance values
- [ ] Add explicit `fieldName` or stable `id` attributes where needed
- [ ] Remove public imports of `ReactiveOrStatic`
- [ ] Re-run build, tests, and lint for affected code
