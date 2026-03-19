# Fieldset Grouping + Errors

## Overview

Focused demo page for grouped fieldsets, aggregated validation summaries, and fieldset-level error placement.

## What it demonstrates

- `NgxSignalFormFieldset` for grouped sections.
- Aggregated errors for nested address fields.
- Placement controls for grouped fieldset and radio-group summaries.
- Cross-field grouping with credentials.
- Debugger view for the grouped demo form.

## Key files

- `fieldset-grouping.page.ts` — page wrapper and debugger.
- `fieldset-grouping.content.ts` — educational copy for the page.
- `../complex-forms/fieldset.form.ts` — reusable grouped fieldset demo form.
- `../complex-forms/fieldset.form.html` — grouped fieldset template and placement playground.

## How to test

1. Run the demo app.
2. Navigate to `/form-field-wrapper/fieldset-grouping`.
3. Toggle placement controls to compare top and bottom summaries.
4. Submit or interact with the grouped sections to inspect aggregated errors.
