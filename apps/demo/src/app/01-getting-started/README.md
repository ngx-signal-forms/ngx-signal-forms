# Getting started

Entry point into `@ngx-signal-forms/toolkit`. Shows the smallest setup that delivers auto-ARIA, strategy-aware error timing, and `NgxFormFieldError` without pulling in the full field wrapper.

## Demos in this section

- **[your-first-form](./your-first-form/README.md):** contact form using `NgxSignalFormToolkit`, auto-ARIA, `NgxFormFieldError`, and a strategy toggle (`immediate`, `on-touch`, `on-submit`).

## Core concepts

- **Auto-ARIA.** Selects eligible `[formField]` hosts when imported in the template. `ngxSignalForm` adds optional form context and is not required to enable auto-ARIA. See the [toolkit README](../../../../../packages/toolkit/README.md).
- **Error strategy.** Controls when errors appear (`on-touch` by default). Deep dive in [error-display-modes](../02-toolkit-core/error-display-modes/README.md).
- **Assistive components.** `NgxFormFieldError` handles visibility, message resolution, and ARIA without per-field `@if` blocks. See the [assistive README](../../../../../packages/toolkit/assistive/README.md).

## When to use this section

- You want accessible validation feedback on your own markup without adopting the field wrapper.
- Skip ahead to [04-form-field-wrapper](../04-form-field-wrapper/README.md) if you want the full `NgxFormField` layout, hints, and character count out of the box.

## Next steps

- Continue to [02-toolkit-core](../02-toolkit-core/README.md) for error timing strategies and non-blocking warnings.
- Or jump to [04-form-field-wrapper](../04-form-field-wrapper/README.md) for the styled field wrapper.
