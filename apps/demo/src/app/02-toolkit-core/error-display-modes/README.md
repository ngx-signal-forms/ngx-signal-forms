# Error Display Modes

## Intent

Demonstrates how the toolkit's error display strategies change _when_ validation feedback appears. The same product feedback form can be switched between `immediate`, `on-touch`, and `on-submit` without touching any component code.

## Toolkit features showcased

- `NgxSignalFormToolkit` — root directive providing auto-ARIA and form context.
- `NgxFormFieldError` — strategy-aware error rendering.
- `[errorStrategy]` binding — drives all descendants' error visibility.
- `injectFormContext()` — read the active strategy from inside child components to build custom visibility helpers.
- Conditional validation via `applyWhen` — the "improvement suggestions" field only validates when rating ≤ 3.

## Form model

- Signal model: `signal<ProductFeedbackModel>()`.
- Schema: `form(model, productFeedbackSchema)`.

## Validation rules

### Errors

- Name — required; min length 2; max length 50.
- Email — required; email format.
- Company — max length 100.
- Product used — required.
- Overall rating — required; min 1; max 5.
- Improvement suggestions — required when rating ≤ 3; min length 10; max length 500.
- Detailed feedback — max length 1000.

### Warnings

- None.

## Strong suites

- Cleanest demonstration of strategy inheritance: one `[errorStrategy]` on `<form>` reaches every child error.
- Shows conditional validation without branching UI code — the improvements field dynamically becomes required based on rating.
- Ideal reference when deciding which error strategy best fits a product surface.

## Key files

- [error-display-modes.form.ts](error-display-modes.form.ts) — form component and custom visibility helpers.
- [error-display-modes.validations.ts](error-display-modes.validations.ts) — schema rules and conditional validation.
- [error-display-modes.page.ts](error-display-modes.page.ts) — page wrapper and debugger.

## How to test

1. Run the demo and navigate to `/toolkit-core/error-display-modes`.
2. Switch the strategy dropdown between `immediate`, `on-touch`, and `on-submit` and blur fields to observe timing differences.
3. Set the overall rating to 3 or lower — confirm the improvement suggestions field becomes required.
4. Type fewer than 10 characters in improvements and blur to see the min-length error.
5. Submit an empty form and confirm each strategy behaves correctly after the invalid submit.

## Related

- [Your First Form](../../01-getting-started/your-first-form/README.md) — minimal intro to the same toolkit directive.
- [Submission Patterns](../../05-advanced/submission-patterns/README.md) — pairs strategies with declarative submission.
