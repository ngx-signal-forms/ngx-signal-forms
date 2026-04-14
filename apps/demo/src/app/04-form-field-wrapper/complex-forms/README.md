# Complex Forms with Form Field Wrapper

## Overview

Complex form with nested objects, dynamic arrays, and mixed control families using the form field wrapper to keep templates readable, error handling consistent, and switch/checkbox rows explicit.

## Form model

- Signal model via `signal<ComplexFormModel>()`.
- Form instance created with `form(model, complexFormSchema)`.

## Validation overview

### Errors

- Personal info: first/last name required + minimum length 2; email required + email format; age required with min 18 and max 120.
- Address: street, city, zip, country required; ZIP pattern `12345` or `12345-6789`.
- Skills: each entry requires name and level (1–10).
- Contacts: type and value required; value minimum length 3.
- Preferences: contact method required.

### Warnings

- Contact method `sms`: warns about potential charges.

## Toolkit usage

- `NgxSignalFormToolkit` for auto-ARIA and form context.
- `NgxFormField` wrapper for automatic error rendering and layout.
- `NgxSignalFormFieldset` for realistic section structure inside a longer form.
- Explicit control semantics keep the newsletter switch and notification checkbox on the correct wrapper layouts without relying on projection heuristics.

## Other tools

- None.

## Key files

- `complex-forms.form.ts` — form model and array mutations.
- `complex-forms.form.html` — wrapper usage and layout.
- `complex-forms.validations.ts` — nested schema rules.
- `complex-forms.page.ts` — demo wrapper and debugger.

## How to test

1. Run the demo app.
2. Navigate to `/form-field-wrapper/complex-forms`.
3. Add/remove skills and contacts to see array validation.
4. Choose SMS as contact method to trigger the warning.
5. Use the grouped sections inside this page to inspect aggregated fieldset and nested error behavior.
6. Inspect the preferences section to see switch and checkbox semantics rendered with the expected wrapper treatment.
