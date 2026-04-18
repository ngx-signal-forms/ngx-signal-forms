# Your First Form

## Intent

Your introduction to `@ngx-signal-forms/toolkit`. Takes a plain contact form and shows how the toolkit's core directives remove the accessibility boilerplate you would otherwise hand-wire in bare Angular Signal Forms templates.

## Toolkit features showcased

- `NgxSignalFormToolkit` — root directive that provides auto-ARIA (`aria-invalid`, `aria-describedby`, `aria-required`) and the shared form/error context.
- `NgxFormFieldError` — strategy-aware error rendering with `role="alert"` and automatic message resolution.
- `errorStrategy` binding — switch between `on-touch`, `on-submit`, and `immediate` from a single input.
- `createOnInvalidHandler()` — declarative focus-first-invalid behavior on failed submit.

## Form model

- Signal model: `signal<ContactFormModel>({ name, email, message })`.
- Schema: `form(model, contactFormSchema, { submission })`.

## Validation rules

### Errors

- Name — required; min length 2.
- Email — required; email format.
- Message — required; min length 10.

### Warnings

- None.

## Strong suites

- Simplest possible toolkit onboarding: one directive, one error component, zero manual ARIA wiring.
- Shows the `errorStrategy` knob without pulling in wrappers, headless utilities, or external validators.
- Good baseline to fork when building a new form from scratch.

## Key files

- [your-first-form.form.ts](your-first-form.form.ts) — component, model, toolkit directives.
- [your-first-form.validations.ts](your-first-form.validations.ts) — schema definition.
- [your-first-form.page.ts](your-first-form.page.ts) — page wrapper and error-strategy selector.

## How to test

1. Run the demo and navigate to `/getting-started/your-first-form`.
2. Inspect any input in devtools — confirm `aria-required`, `aria-invalid`, and `aria-describedby` appear automatically.
3. Switch the error strategy dropdown between "On Touch", "On Submit", and "Immediate" and observe how errors surface without code changes.
4. Submit an empty form to see focus move to the first invalid field.
5. Fix one field at a time and confirm each error clears as rules pass.

## Related

- [Error Display Modes](../../02-toolkit-core/error-display-modes/README.md) — deeper dive into strategies.
- [Complex Forms](../../04-form-field-wrapper/complex-forms/README.md) — next step with the wrapper component.
