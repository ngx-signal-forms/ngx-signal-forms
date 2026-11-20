# `@ngx-signal-forms/toolkit` interactive demo

Runnable examples showing Angular Signal Forms with `@ngx-signal-forms/toolkit`, from a first form to custom wrappers, validation layering, and multi-step wizards.

## Demo sections

### 1. Getting started (`01-getting-started/`)

| Example                                                                   | Route                              | Covers                                                                                |
| ------------------------------------------------------------------------- | ---------------------------------- | ------------------------------------------------------------------------------------- |
| [your-first-form](./src/app/01-getting-started/your-first-form/README.md) | `/getting-started/your-first-form` | Smallest setup with `[formRoot]`, `ngxSignalForm`, auto-ARIA, and `NgxFormFieldError` |

### 2. Toolkit core (`02-toolkit-core/`)

| Example                                                                        | Route                               | Covers                                                      |
| ------------------------------------------------------------------------------ | ----------------------------------- | ----------------------------------------------------------- |
| [error-display-modes](./src/app/02-toolkit-core/error-display-modes/README.md) | `/toolkit-core/error-display-modes` | `immediate`, `on-touch`, and `on-submit` timing strategies  |
| [warning-support](./src/app/02-toolkit-core/warning-support/README.md)         | `/toolkit-core/warning-support`     | Non-blocking `warn:*` rules and warning-tolerant submission |

### 3. Headless (`03-headless/`)

| Example                                                                      | Route                            | Covers                                                                      |
| ---------------------------------------------------------------------------- | -------------------------------- | --------------------------------------------------------------------------- |
| [fieldset-utilities](./src/app/03-headless/fieldset-utilities/README.md)     | `/headless/fieldset-utilities`   | Headless error summary, fieldset aggregation, and character-count utilities |
| [error-message-signal](./src/app/03-headless/error-message-signal/README.md) | `/headless/error-message-signal` | `createErrorMessageSignal()` across all `includeWarnings` modes             |

### 4. Form field wrapper (`04-form-field-wrapper/`)

| Example                                                                              | Route                                                                                         | Covers                                                                     |
| ------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| [complex-forms](./src/app/04-form-field-wrapper/complex-forms/README.md)             | `/form-field-wrapper/complex-forms`, `/form-field-wrapper/complex-forms/fieldset`             | Nested objects, dynamic arrays, grouped fieldsets, and mixed controls      |
| [fieldset-appearance](./src/app/04-form-field-wrapper/fieldset-appearance/README.md) | `/form-field-wrapper/fieldset-appearance`, `/form-field-wrapper/fieldset-appearance/feedback` | Fieldset appearances, surface tones, feedback styles, and error placement  |
| [custom-controls](./src/app/04-form-field-wrapper/custom-controls/README.md)         | `/form-field-wrapper/custom-controls`                                                         | `FormValueControl` controls, field-shaped comboboxes, sliders, and presets |
| [labelless-fields](./src/app/04-form-field-wrapper/labelless-fields/README.md)       | `/form-field-wrapper/labelless-fields`                                                        | Wrappers without projected labels and `aria-label` guidance                |
| [field-identity](./src/app/04-form-field-wrapper/field-identity/README.md)           | `/form-field-wrapper/field-identity`                                                          | Custom wrapper composing `NgxFieldIdentityProvider` inside collapsible UI  |
| [field-marking](./src/app/04-form-field-wrapper/field-marking/README.md)             | `/form-field-wrapper/field-marking`                                                           | `showMarkerWhen`, custom markers, and `NgxFormMarkingLegend`               |
| [brand-theming](./src/app/04-form-field-wrapper/brand-theming/README.md)             | `/form-field-wrapper/brand-theming`                                                           | Public CSS custom properties, light and dark themes, and contrast checks   |

### 5. Validation (`/validation/*`, source in `05-advanced/`)

| Example                                                                    | Route                             | Covers                                                                 |
| -------------------------------------------------------------------------- | --------------------------------- | ---------------------------------------------------------------------- |
| [zod-validation](./src/app/05-advanced/zod-validation/README.md)           | `/validation/zod-validation`      | Standard Schema validation with Zod and `requiredFromStandardSchema()` |
| [vest-validation](./src/app/05-advanced/vest-validation/README.md)         | `/validation/vest-validation`     | Vest 6 suites with blocking rules and warnings                         |
| [zod-vest-validation](./src/app/05-advanced/zod-vest-validation/README.md) | `/validation/zod-vest-validation` | Layering Zod contract rules with Vest business policy                  |

### 6. Advanced scenarios (`05-advanced/`)

| Example                                                                          | Route                                        | Covers                                                                                                 |
| -------------------------------------------------------------------------------- | -------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| [global-configuration](./src/app/05-advanced/global-configuration/README.md)     | `/advanced-scenarios/global-configuration`   | `provideNgxSignalFormsConfig()`, `provideErrorMessages()`, `provideFieldLabels()`, and local overrides |
| [submission-patterns](./src/app/05-advanced/submission-patterns/README.md)       | `/advanced-scenarios/submission-patterns`    | Declarative `submission`, `createOnInvalidHandler()`, and error summaries                              |
| [advanced-wizard](./src/app/05-advanced/advanced-wizard/README.md)               | `/advanced-scenarios/advanced-wizard`        | Multi-step wizard with NgRx SignalStore, Zod, and lazy steps                                           |
| [single-model-wizard](./src/app/05-advanced/single-model-wizard/README.md)       | `/advanced-scenarios/single-model-wizard`    | Multi-step wizard backed by one shared `form()` model                                                  |
| [routed-steps](./src/app/05-advanced/routed-steps/README.md)                     | `/advanced-scenarios/routed-steps`           | Routed multi-step form with router error boundaries (`withErrorBoundaries()`)                          |
| [async-validation](./src/app/05-advanced/async-validation/README.md)             | `/advanced-scenarios/async-validation`       | `validateHttp()` with debounce, cancellation, and `pending()` indicators                               |
| [field-state-patterns](./src/app/05-advanced/field-state-patterns/README.md)     | `/advanced-scenarios/field-state-patterns`   | Conditional `hidden()`, `disabled()`, and `readonly()` rules                                           |
| [cross-field-validation](./src/app/05-advanced/cross-field-validation/README.md) | `/advanced-scenarios/cross-field-validation` | Sibling-aware rules with `ctx.valueOf()` and group errors                                              |
| [store-binding](./src/app/05-advanced/store-binding/README.md)                   | `/advanced-scenarios/store-binding`          | Two-way sync between a Signal Form and an NgRx SignalStore via `linkedSignal`                          |
| [server-integration](./src/app/05-advanced/server-integration/README.md)         | `/advanced-scenarios/server-integration`     | `resource()` prefill, submit, server `TreeValidationResult`, and `reset()`                             |
| [autosave](./src/app/05-advanced/autosave/README.md)                             | `/advanced-scenarios/autosave`               | Debounced field-level PATCH saves with `debounce()` and live status                                    |
| [i18n](./src/app/05-advanced/i18n/README.md)                                     | `/advanced-scenarios/i18n`                   | Runtime language switching with `provideErrorMessages()` and `provideFieldLabels()`                    |

## Run the demo

```bash
# Development server (http://localhost:4600)
pnpm nx serve demo

# Production build
pnpm nx build demo

# Unit tests
pnpm nx test demo

# End-to-end tests
pnpm nx run demo-e2e:e2e-toolkit
pnpm nx run demo-e2e:e2e-demo-app
```

Prefer `demo-e2e:e2e-toolkit` or `demo-e2e:e2e-demo-app` locally instead of plain `pnpm nx e2e demo-e2e`, because they clear port 4600 before starting Playwright.

## Copy a working example

Use the [tested root starter](../../README.md#quick-start) for a complete component with labels, imports, validation, and a submission action. For assistive-only rendering without the wrapper, start from [your-first-form](./src/app/01-getting-started/your-first-form/README.md).

Angular owns form state and submission. Toolkit directives and components add feedback, ARIA wiring, and layout. Always test your finished pages with a keyboard, screen reader, and contrast checks.

## Technology stack

- **Angular:** 22.3 (stable Signal Forms)
- **TypeScript:** ~6.0 (strict mode)
- **Toolkit:** `@ngx-signal-forms/toolkit`
- **Styling:** Tailwind CSS 4
- **Testing:** Vitest (unit), Playwright (E2E)

## Troubleshooting

- **Signal Forms type errors:** confirm Angular 22+ is installed, import from `@angular/forms/signals`, and run `pnpm nx build toolkit` if workspace types are stale.
- **Toolkit directives have no effect:** import `NgxSignalFormToolkit` from `@ngx-signal-forms/toolkit` (and `NgxFormField` when using wrappers) in the component's `imports` array.
- **ARIA attributes missing:** make sure each bound control has a stable `id` (or the wrapper has `fieldName`) and `NgxSignalFormAutoAria` is imported in the template that renders `[formField]`.
- **"This page could not be shown":** the app shell wraps the routed page and right-rail controls in Angular `@boundary` blocks (developer preview in Angular 22.2). Open the browser console for the `DemoErrorHandler.onViewError` log. Errors thrown inside `effect()` bypass `@boundary` and go to the global `ErrorHandler`.

Start with [01-getting-started/your-first-form](./src/app/01-getting-started/your-first-form/README.md).
