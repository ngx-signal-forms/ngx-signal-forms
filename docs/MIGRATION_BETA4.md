# Migration Guide: `1.0.0-beta.4`

This guide covers migration from earlier beta releases to `@ngx-signal-forms/toolkit@1.0.0-beta.4`.

## Who should migrate

You should follow this guide if your project currently:

- uses manual `(submit)` handlers with `event.preventDefault()` for toolkit forms
- uses `canSubmit()` or `isSubmitting()` from `@ngx-signal-forms/toolkit`
- imports or references `computeShowErrors()`
- relies on implicit form directive behavior instead of explicit `[ngxSignalForm]`

## Summary of breaking/behavioral changes

| Area                    | Before                                            | Now (`beta.4`)                                                               |
| ----------------------- | ------------------------------------------------- | ---------------------------------------------------------------------------- |
| Angular baseline        | `21.1.x`                                          | `21.2.0`                                                                     |
| Form wiring             | Often manual `(submit)` + `submit()`              | Prefer `<form [ngxSignalForm]="form">` with declarative `submission` config  |
| Submission helpers      | `canSubmit()`, `isSubmitting()`, `hasSubmitted()` | `hasSubmitted()` only; use native `form().valid()` and `form().submitting()` |
| Error API               | `computeShowErrors()` used in examples/docs       | Use `showErrors()`                                                           |
| Form directive selector | Included broad/implicit patterns in older docs    | Explicit `form[ngxSignalForm]`                                               |

## 1) Upgrade Angular to `21.2.0`

Ensure your workspace resolves Angular packages to `21.2.0` and reinstall dependencies.

## 2) Move submit logic to declarative `submission`

### Before

- Template used native submit binding.
- Component called `submit(form, ...)` manually.

### After

- Use `<form [ngxSignalForm]="myForm">`.
- Configure `submission: { action, onInvalid }` in `form(...)` options.

```ts
readonly myForm = form(
  this.#model,
  schema,
  {
    submission: {
      action: async (field) => {
        await this.api.save(field().value());
        return null;
      },
      onInvalid: createOnInvalidHandler(),
    },
  },
);
```

## 3) Replace removed helpers

### Removed

- `canSubmit(form)`
- `isSubmitting(form)`

### Replacement

Use native Angular Signal Forms state directly:

- `form().valid() && !form().submitting()` instead of `canSubmit()`
- `form().submitting()` instead of `isSubmitting()`

Example:

```ts
protected readonly canSubmitForm = computed(
  () => this.form().valid() && !this.form().submitting(),
);

protected readonly isFormSubmitting = computed(() => this.form().submitting());
```

## 4) Switch from `computeShowErrors()` to `showErrors()`

### Before

```ts
const visible = computeShowErrors(field, strategy, submittedStatus);
```

### After

```ts
const visible = showErrors(field, strategy, submittedStatus);
```

## 5) Ensure forms using toolkit bind `[ngxSignalForm]`

For toolkit-managed forms, use:

```html
<form [ngxSignalForm]="myForm">...</form>
```

This ensures form-root composition, submit lifecycle integration, and context availability.

## 6) Optional: standard invalid-submit behavior

Use `createOnInvalidHandler()` to keep invalid-submit UX consistent (focus first invalid field by default):

```ts
submission: {
  action: async () => { ... },
  onInvalid: createOnInvalidHandler(),
}
```

## Migration checklist

- [ ] Angular packages resolve to `21.2.0`
- [ ] Toolkit forms use `[ngxSignalForm]`
- [ ] `submission.action` defined for declarative submit flow
- [ ] `canSubmit()` and `isSubmitting()` removed from imports/usages
- [ ] `computeShowErrors()` replaced by `showErrors()`
- [ ] Invalid submit handling reviewed (`createOnInvalidHandler()` recommended)
- [ ] Unit/E2E tests run successfully

## Common issues after upgrade

### Error: `canSubmit` / `isSubmitting` is not exported

Use native form signals (`valid()`, `submitting()`) and inline `computed` values.

### Errors not showing with `'on-submit'` strategy

Ensure the form is bound with `[ngxSignalForm]` and uses the declarative submission pipeline.

### `submittedStatus` appears incorrect

Verify form reset flows reset both form state and model where appropriate.

## Verification

Run your normal project verification steps (build, tests, lint) after migration.
