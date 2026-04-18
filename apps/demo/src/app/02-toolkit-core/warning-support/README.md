# Warning Support

## Intent

Real-world forms often need _non-blocking_ feedback — "weak password", "disposable email domain" — that guides users without preventing submission. This demo shows the toolkit's `warn:*` convention, warning-aware styling, and warning-tolerant submission.

## Toolkit features showcased

- `warn:*` error kinds — any `ValidationError` whose `kind` starts with `warn:` is treated as advisory.
- `NgxFormFieldError` — renders blocking errors with `role="alert"` and warnings with `role="status"` / `aria-live="polite"`, plus distinct styling.
- `submitWithWarnings()` — warning-tolerant submit helper used with `<form novalidate>` instead of Angular's native `submit()` (which treats every validation result as blocking).
- Separation of blocking errors from warnings at the form-state level.

## Form model

- Signal model: `signal<PasswordFormModel>({ username, email, password })`.
- Schema: `form(model, passwordFormSchema)` plus manual submit wiring.

## Validation rules

### Errors

- Username — required; min length 3.
- Email — required; email format.
- Password — required; min length 8.

### Warnings

- `warn:short-username` — username between 3 and 5 characters.
- `warn:disposable-email` — email from a disposable provider (`tempmail.com`, `throwaway.email`, `10minutemail.com`).
- `warn:weak-password` — password between 8 and 11 characters.
- `warn:simple-password` — password missing 3 of 4 character classes (upper/lower/digit/symbol).

## Strong suites

- Clearest example of the `warn:*` convention and the visual/ARIA split between errors and warnings.
- Shows the _manual_ submission path: when you can't (or don't want to) use declarative `submission`, `submitWithWarnings` is the supported escape hatch.
- Good reference for policy-style guidance where blocking would be user-hostile.

## Key files

- [warning-support.validations.ts](warning-support.validations.ts) — blocking rules and `warn:*` advisories.
- [warning-support.form.ts](warning-support.form.ts) — `submitWithWarnings` wiring.
- [warning-support.page.ts](warning-support.page.ts) — page wrapper and debugger.

## How to test

1. Run the demo and navigate to `/toolkit-core/warning-support`.
2. Enter username `abcd` — submission stays enabled; the amber "short username" warning appears.
3. Enter email `me@tempmail.com` — disposable email warning appears.
4. Enter password `password123` — weak + simple warnings appear (still submittable).
5. Clear each required field to see blocking errors render in red with `role="alert"`.
6. Submit with only warnings present — confirm the action runs; submit with a blocking error — confirm it is rejected.

## Related

- [Vest-Only Validation](../../05-advanced/vest-validation/README.md) — warnings coming from a Vest suite.
- [Zod + Vest Validation](../../05-advanced/zod-vest-validation/README.md) — layered errors + warnings.
