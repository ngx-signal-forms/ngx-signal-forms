# Angular Signal Forms and the toolkit

This page explains what Angular Signal Forms does, what the toolkit adds, and
when the toolkit is worth adding.

## Ownership model

The toolkit adds to Angular. It does not replace anything. Angular Signal
Forms owns form creation, validation, field state, and submission. The toolkit
adds the user-facing parts that Angular leaves to you:

- when errors and warnings show,
- the ARIA attributes that link a control to its messages,
- non-blocking warnings,
- reusable field UI: labels, hints, character counts, and themes.

Angular Signal Forms sets no ARIA attributes itself. Without the toolkit, you
write `aria-invalid` and `aria-describedby` for each field.

## When to use the toolkit

Use it when:

- you write the same `aria-invalid`, `aria-describedby`, and error-timing code
  for more than one field,
- you want errors to show after the user leaves a field (`on-touch`) or after
  submit (`on-submit`), not at once,
- you need warnings that do not block submit,
- you want the same field layout, hints, counters, and theme across an app.

You do not need it for one small form without accessibility requirements.
You can add it later without changing your `form()` or `[formField]` code.

For the same email field written with and without the toolkit, see
[why use it](../README.md#why-use-it). To pick an entry point, see
[choose your level](../README.md#choose-your-level).

## What `ngxSignalForm` adds

`ngxSignalForm` is a directive that you add to a `<form>` that already has
`[formRoot]`. It does not replace `[formRoot]`. It adds:

1. **Form-wide timing.** `errorStrategy` and `warningStrategy` inputs set when
   feedback shows for every field in the form.
2. **Submitted status.** It tracks `'unsubmitted'`, `'submitting'`, and
   `'submitted'`. Angular has only the `submitting()` signal. `on-submit`
   timing needs this status.
3. **Shared state for child components.** Wrappers, error components, the
   error summary, and headless directives read the form's timing and status
   from it, so you do not pass them down by hand.

`NgxSignalFormToolkit` imports Angular's `FormRoot`, `NgxSignalForm`, and
auto-ARIA together. Import it instead of `FormRoot`:

```typescript
imports: [FormField, NgxSignalFormToolkit];
```

```html
<form [formRoot]="myForm" ngxSignalForm errorStrategy="on-submit"></form>
```

The [root README](../README.md#when-errors-show) says when you need
`ngxSignalForm`.

## Feature matrix

| Concern                                  | Angular Signal Forms                                      | Toolkit                                                                                  |
| ---------------------------------------- | --------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| Form model, validation, submit lifecycle | Yes                                                       | Uses Angular's. See [validation choices](./VALIDATION_STRATEGY.md)                       |
| `[formRoot]`                             | Yes: sets `novalidate`, prevents default, runs `submit()` | `ngxSignalForm` adds form-wide timing and submitted status                               |
| Error timing                             | No, you write it                                          | `on-touch`, `on-submit`, or `immediate`                                                  |
| Submitted status                         | Only `submitting()`                                       | `unsubmitted`, `submitting`, `submitted`                                                 |
| Warnings                                 | No, you need your own convention                          | `warningError()`. See [warnings](./WARNINGS_SUPPORT.md)                                  |
| Warning timing                           | No                                                        | Separate `warningStrategy`. See [timing](./WARNINGS_SUPPORT.md#timing-and-configuration) |
| ARIA links between control and messages  | No                                                        | Yes, automatic                                                                           |
| Focus on the first invalid field         | No                                                        | `createOnInvalidHandler()`                                                               |
| Reusable field UI                        | No                                                        | `/form-field` and `/assistive` components                                                |
| CSS status classes                       | Yes, `provideSignalFormsConfig({ classes })`              | None. Use Angular's API next to the toolkit                                              |

## For maintainers

[Angular public API policy](./ANGULAR_PUBLIC_API_POLICY.md) lists every
Angular API the toolkit uses and why `/core` is not public.
