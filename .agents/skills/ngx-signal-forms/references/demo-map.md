# Online example map

Load only the example relevant to the current task.
These GitHub links point to the latest `main` branch; apply [sources.md](sources.md) before assuming they match an older installed version.

## Getting started and core

- [First form](https://github.com/ngx-signal-forms/ngx-signal-forms/tree/main/apps/demo/src/app/01-getting-started/your-first-form): bundle imports, form context, auto-ARIA, inline errors.
- [Error display modes](https://github.com/ngx-signal-forms/ngx-signal-forms/tree/main/apps/demo/src/app/02-toolkit-core/error-display-modes): immediate, touch, and submit message timing.
- [Warning support](https://github.com/ngx-signal-forms/ngx-signal-forms/tree/main/apps/demo/src/app/02-toolkit-core/warning-support): non-blocking warnings versus blocking errors and ARIA roles.

## Headless

- [Fieldset utilities](https://github.com/ngx-signal-forms/ngx-signal-forms/tree/main/apps/demo/src/app/03-headless/fieldset-utilities): aggregation, summaries, and state flags.
- [Error message signal](https://github.com/ngx-signal-forms/ngx-signal-forms/tree/main/apps/demo/src/app/03-headless/error-message-signal): reactive message registry replacement.

## Form field wrapper and controls

- [Brand theming](https://github.com/ngx-signal-forms/ngx-signal-forms/tree/main/apps/demo/src/app/04-form-field-wrapper/brand-theming): light and dark `color-scheme` brand palettes with contrast-verified tokens.
- [Complex forms](https://github.com/ngx-signal-forms/ngx-signal-forms/tree/main/apps/demo/src/app/04-form-field-wrapper/complex-forms): nested objects, arrays, and grouped fieldset summaries.
- [Custom controls](https://github.com/ngx-signal-forms/ngx-signal-forms/tree/main/apps/demo/src/app/04-form-field-wrapper/custom-controls): editable controls, checkbox opt-in, manual slider ARIA, and component presets.
- [Field identity](https://github.com/ngx-signal-forms/ngx-signal-forms/tree/main/apps/demo/src/app/04-form-field-wrapper/field-identity): custom identity provider and collapsed controls.
- [Field marking](https://github.com/ngx-signal-forms/ngx-signal-forms/tree/main/apps/demo/src/app/04-form-field-wrapper/field-marking): required/optional markers and form legend.
- [Fieldset appearance](https://github.com/ngx-signal-forms/ngx-signal-forms/tree/main/apps/demo/src/app/04-form-field-wrapper/fieldset-appearance): shells, tones, grouped messages, and placement.
- [Labelless fields](https://github.com/ngx-signal-forms/ngx-signal-forms/tree/main/apps/demo/src/app/04-form-field-wrapper/labelless-fields): accessible names without redundant visible labels.
- [Orientation toggle](https://github.com/ngx-signal-forms/ngx-signal-forms/tree/main/apps/demo/src/app/ui/orientation-toggle): horizontal orientation defaults and wrapper overrides.

## Advanced

- [Advanced wizard](https://github.com/ngx-signal-forms/ngx-signal-forms/tree/main/apps/demo/src/app/05-advanced/advanced-wizard): multi-step flow with NgRx Signals and Zod.
- [Single-model wizard](https://github.com/ngx-signal-forms/ngx-signal-forms/tree/main/apps/demo/src/app/05-advanced/single-model-wizard): multi-step wizard backed by one form model.
- [Routed steps](https://github.com/ngx-signal-forms/ngx-signal-forms/tree/main/apps/demo/src/app/05-advanced/routed-steps): routed multi-step form with Angular 22.3 `withErrorBoundaries()` and shared `ngxSignalForm` above `<router-outlet>`.
- [Async validation](https://github.com/ngx-signal-forms/ngx-signal-forms/tree/main/apps/demo/src/app/05-advanced/async-validation): remote and pending checks.
- [Autosave](https://github.com/ngx-signal-forms/ngx-signal-forms/tree/main/apps/demo/src/app/05-advanced/autosave): debounced background saving.
- [Cross-field validation](https://github.com/ngx-signal-forms/ngx-signal-forms/tree/main/apps/demo/src/app/05-advanced/cross-field-validation): sibling dependencies.
- [Field state patterns](https://github.com/ngx-signal-forms/ngx-signal-forms/tree/main/apps/demo/src/app/05-advanced/field-state-patterns): touched, dirty, and other state signals.
- [Global configuration](https://github.com/ngx-signal-forms/ngx-signal-forms/tree/main/apps/demo/src/app/05-advanced/global-configuration): application defaults.
- [Internationalization (i18n)](https://github.com/ngx-signal-forms/ngx-signal-forms/tree/main/apps/demo/src/app/05-advanced/i18n): runtime language switching for messages and field labels.
- [Server integration](https://github.com/ngx-signal-forms/ngx-signal-forms/tree/main/apps/demo/src/app/05-advanced/server-integration): mapping API errors back to Signal Forms fields.
- [Store binding](https://github.com/ngx-signal-forms/ngx-signal-forms/tree/main/apps/demo/src/app/05-advanced/store-binding): writable form and store synchronization.
- [Submission patterns](https://github.com/ngx-signal-forms/ngx-signal-forms/tree/main/apps/demo/src/app/05-advanced/submission-patterns): lifecycle, invalid focus, and summaries.
- [Zod](https://github.com/ngx-signal-forms/ngx-signal-forms/tree/main/apps/demo/src/app/05-advanced/zod-validation), [Vest](https://github.com/ngx-signal-forms/ngx-signal-forms/tree/main/apps/demo/src/app/05-advanced/vest-validation), and [Zod with Vest](https://github.com/ngx-signal-forms/ngx-signal-forms/tree/main/apps/demo/src/app/05-advanced/zod-vest-validation): distinct validation strategies.

## Deeper documentation

Use [api.md](api.md) for entry-point READMEs and source barrels.
Task-specific guides:

- [Angular versus toolkit](https://github.com/ngx-signal-forms/ngx-signal-forms/blob/main/docs/ANGULAR_VS_TOOLKIT.md)
- [Validation strategy](https://github.com/ngx-signal-forms/ngx-signal-forms/blob/main/docs/VALIDATION_STRATEGY.md)
- [Nested forms](https://github.com/ngx-signal-forms/ngx-signal-forms/blob/main/docs/COMPLEX_NESTED_FORMS.md)
- [CSS integration](https://github.com/ngx-signal-forms/ngx-signal-forms/blob/main/docs/CSS_FRAMEWORK_INTEGRATION.md) and [Theming](https://github.com/ngx-signal-forms/ngx-signal-forms/blob/main/packages/toolkit/form-field/THEMING.md)
- [Warnings](https://github.com/ngx-signal-forms/ngx-signal-forms/blob/main/docs/WARNINGS_SUPPORT.md)
- [Package architecture](https://github.com/ngx-signal-forms/ngx-signal-forms/blob/main/docs/PACKAGE_ARCHITECTURE.md) and [Public API policy](https://github.com/ngx-signal-forms/ngx-signal-forms/blob/main/docs/ANGULAR_PUBLIC_API_POLICY.md)
- [Migrating from ngx-vest-forms](https://github.com/ngx-signal-forms/ngx-signal-forms/blob/main/docs/MIGRATING_FROM_NGX_VEST_FORMS.md)
- [Internal debugger](https://github.com/ngx-signal-forms/ngx-signal-forms/blob/main/packages/demo/debugger/README.md) (repository-only, not published)
