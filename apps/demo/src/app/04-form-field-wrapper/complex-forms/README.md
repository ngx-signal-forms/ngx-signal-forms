# Complex Forms with Form Field Wrapper

## Intent

A realistic, non-trivial form with nested objects, dynamic arrays, and mixed control families. Shows how the `NgxFormField` wrapper keeps templates readable, error handling consistent, and switch/checkbox rows explicit as forms grow in size.

## Toolkit features showcased

- `NgxSignalFormToolkit` — root directive for auto-ARIA and form context.
- `NgxFormField` wrapper — automatic label/error/hint layout for every field.
- `NgxFormFieldset` — realistic section structure with grouped state.
- Dynamic array mutations on signal models (add/remove skills and contacts).
- Explicit `ngxSignalFormControl="switch|checkbox"` semantics so switch/checkbox rows land on the right wrapper layout without projection heuristics.

## Form model

- Signal model: `signal<ComplexFormModel>()` with nested `personalInfo`, `address`, `skills[]`, `contacts[]`, `preferences`.
- Schema: `form(model, complexFormSchema)`.

## Validation rules

### Errors

- Personal info — first/last name required, min length 2; email required + email format; age required, min 18, max 120.
- Address — street, city, zip, country required; ZIP pattern `12345` or `12345-6789`.
- Skills — each entry requires name and level (1–10).
- Contacts — type and value required; value min length 3.
- Preferences — contact method required.

### Warnings

- `warn:sms-charges` — warns when the preferred contact method is SMS.

## Strong suites

- Best reference for _shape-heavy_ forms: nested objects + arrays + per-row validation in one place.
- Shows the wrapper scaling without the template devolving into manual `aria-*` plumbing.
- Makes the switch/checkbox opt-in ergonomics concrete (see preferences section).

## Key files

- [complex-forms.form.ts](complex-forms.form.ts) — model, array mutation helpers, wrapper wiring.
- [complex-forms.form.html](complex-forms.form.html) — wrapper usage and layout.
- [complex-forms.validations.ts](complex-forms.validations.ts) — nested schema rules.
- [complex-forms.page.ts](complex-forms.page.ts) — page wrapper and debugger.

## How to test

1. Run the demo and navigate to `/form-field-wrapper/complex-forms`.
2. Add and remove entries in the skills and contacts arrays to exercise per-row validation.
3. Enter an age outside 18–120 or a malformed ZIP to see field-level errors.
4. Choose `SMS` as contact method to trigger the warning (submission still allowed).
5. Toggle the newsletter switch and notification checkbox and confirm each renders with the correct wrapper layout and ARIA wiring.
6. Submit with errors and confirm aggregated fieldset errors appear at the section level.

## Related

- [Custom Controls](../custom-controls/README.md) — wrapper integration for custom value controls.
- [Headless Fieldset + Utilities](../../03-headless/fieldset-utilities/README.md) — headless equivalent of the grouping patterns.
