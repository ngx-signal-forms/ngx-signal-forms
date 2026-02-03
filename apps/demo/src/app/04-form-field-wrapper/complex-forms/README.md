# Complex Forms with Form Field Wrapper

## Overview

Complex form with nested objects and dynamic arrays using the form field wrapper to keep templates readable and error handling consistent.

## Form model

- Signal model via `signal<ComplexFormModel>()`.
- Form instance created with `form(model, complexFormSchema)`.

## Validation overview

**Errors**

- Personal info: first/last name required + minimum length 2; email required + email format; age required with min 18 and max 120.
- Address: street, city, zip, country required; ZIP pattern `12345` or `12345-6789`.
- Skills: each entry requires name and level (1–10).
- Contacts: type and value required; value minimum length 3.
- Preferences: contact method required.

**Warnings**

- Contact method `sms`: warns about potential charges.

## Toolkit usage

- `NgxSignalFormToolkit` for auto-ARIA and form context.
- `NgxFormField` wrapper for automatic error rendering and layout.
- `NgxSignalFormFieldset` for grouping sections.

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
