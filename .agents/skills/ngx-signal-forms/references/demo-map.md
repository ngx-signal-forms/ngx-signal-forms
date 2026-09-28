# Online example map

Load only the example for the current task. These GitHub links are latest
mutable source, not assumed local consumer files or proof of installed behavior.
Apply the [source/version policy](sources.md). Bundled contracts and installed
declarations remain available if these optional examples cannot be fetched.

## Getting started and core

- [First form](https://github.com/ngx-signal-forms/ngx-signal-forms/tree/main/apps/demo/src/app/01-getting-started/your-first-form): bundle imports, form context, auto-ARIA, inline errors.
- [Error display modes](https://github.com/ngx-signal-forms/ngx-signal-forms/tree/main/apps/demo/src/app/02-toolkit-core/error-display-modes): immediate, touch, and submit timing.
- [Warning support](https://github.com/ngx-signal-forms/ngx-signal-forms/tree/main/apps/demo/src/app/02-toolkit-core/warning-support): advisory versus blocking feedback and roles.

## Headless

- [Fieldset form](https://github.com/ngx-signal-forms/ngx-signal-forms/blob/main/apps/demo/src/app/03-headless/fieldset-utilities/fieldset-utilities.form.ts) and [page](https://github.com/ngx-signal-forms/ngx-signal-forms/blob/main/apps/demo/src/app/03-headless/fieldset-utilities/fieldset-utilities.page.ts): aggregation, summaries, and state flags.
- [Error message signal](https://github.com/ngx-signal-forms/ngx-signal-forms/tree/main/apps/demo/src/app/03-headless/error-message-signal): reactive message registry replacement.

## Wrappers and controls

- [Complex forms](https://github.com/ngx-signal-forms/ngx-signal-forms/tree/main/apps/demo/src/app/04-form-field-wrapper/complex-forms): nested objects, arrays, and grouped fieldset summaries.
- [Custom controls](https://github.com/ngx-signal-forms/ngx-signal-forms/tree/main/apps/demo/src/app/04-form-field-wrapper/custom-controls): editable controls, checkbox opt-in, manual slider ARIA, and component presets. For an existing widget, read the [adapter doc and its example caveat](https://github.com/ngx-signal-forms/ngx-signal-forms/blob/main/docs/CUSTOM_CONTROLS.md#adapting-an-existing-third-party-widget) first.
- [Field marking](https://github.com/ngx-signal-forms/ngx-signal-forms/tree/main/apps/demo/src/app/04-form-field-wrapper/field-marking): required/optional markers and form legend.
- [Fieldset appearance](https://github.com/ngx-signal-forms/ngx-signal-forms/tree/main/apps/demo/src/app/04-form-field-wrapper/fieldset-appearance): grouping, tone, and validation feedback.
- [Labelless fields](https://github.com/ngx-signal-forms/ngx-signal-forms/tree/main/apps/demo/src/app/04-form-field-wrapper/labelless-fields): accessible names without redundant visible labels.
- [Field identity](https://github.com/ngx-signal-forms/ngx-signal-forms/tree/main/apps/demo/src/app/04-form-field-wrapper/field-identity): custom identity provider and collapsed controls.
- [Orientation toggle](https://github.com/ngx-signal-forms/ngx-signal-forms/tree/main/apps/demo/src/app/ui/orientation-toggle): shared horizontal orientation controls. Global `defaultFormFieldOrientation` supplies the default; wrapper `orientation` overrides it.

## Advanced

- [Global configuration](https://github.com/ngx-signal-forms/ngx-signal-forms/tree/main/apps/demo/src/app/05-advanced/global-configuration): app defaults.
- [Submission patterns](https://github.com/ngx-signal-forms/ngx-signal-forms/tree/main/apps/demo/src/app/05-advanced/submission-patterns): lifecycle, invalid focus, and summaries.
- [Advanced wizard](https://github.com/ngx-signal-forms/ngx-signal-forms/tree/main/apps/demo/src/app/05-advanced/advanced-wizard): multi-step flow with NgRx Signals and Zod.
- [Async validation](https://github.com/ngx-signal-forms/ngx-signal-forms/tree/main/apps/demo/src/app/05-advanced/async-validation): remote/pending checks.
- [Cross-field validation](https://github.com/ngx-signal-forms/ngx-signal-forms/tree/main/apps/demo/src/app/05-advanced/cross-field-validation): sibling dependencies.
- [Field state](https://github.com/ngx-signal-forms/ngx-signal-forms/tree/main/apps/demo/src/app/05-advanced/field-state-patterns): touched/dirty and other signals.
- [Store binding](https://github.com/ngx-signal-forms/ngx-signal-forms/tree/main/apps/demo/src/app/05-advanced/store-binding): writable form/store synchronization.
- [Zod](https://github.com/ngx-signal-forms/ngx-signal-forms/tree/main/apps/demo/src/app/05-advanced/zod-validation), [Vest](https://github.com/ngx-signal-forms/ngx-signal-forms/tree/main/apps/demo/src/app/05-advanced/vest-validation), and [Zod with Vest](https://github.com/ngx-signal-forms/ngx-signal-forms/tree/main/apps/demo/src/app/05-advanced/zod-vest-validation): separate validation approaches, not a mandate to combine libraries.

## Deeper documentation

Use the [API index](api.md) for entry-point READMEs and source barrels.
These task-specific docs add detail beyond the bundled guides:

- [Angular versus toolkit](https://github.com/ngx-signal-forms/ngx-signal-forms/blob/main/docs/ANGULAR_VS_TOOLKIT.md): ownership boundaries.
- [Validation strategy](https://github.com/ngx-signal-forms/ngx-signal-forms/blob/main/docs/VALIDATION_STRATEGY.md): library choice.
- [Nested forms](https://github.com/ngx-signal-forms/ngx-signal-forms/blob/main/docs/COMPLEX_NESTED_FORMS.md): reusable schemas and arrays.
- [CSS integration](https://github.com/ngx-signal-forms/ngx-signal-forms/blob/main/docs/CSS_FRAMEWORK_INTEGRATION.md) and [theming](https://github.com/ngx-signal-forms/ngx-signal-forms/blob/main/packages/toolkit/form-field/THEMING.md): framework styles and toolkit tokens.
- [Warnings](https://github.com/ngx-signal-forms/ngx-signal-forms/blob/main/docs/WARNINGS_SUPPORT.md): advisory feedback and submission.
- [Package architecture](https://github.com/ngx-signal-forms/ngx-signal-forms/blob/main/docs/PACKAGE_ARCHITECTURE.md) and [public API policy](https://github.com/ngx-signal-forms/ngx-signal-forms/blob/main/docs/ANGULAR_PUBLIC_API_POLICY.md): export boundaries.
- [Migration workflow](../migrations/guide.md): crossed-version guides. For a different source library, use [ngx-vest-forms migration](https://github.com/ngx-signal-forms/ngx-signal-forms/blob/main/docs/MIGRATING_FROM_NGX_VEST_FORMS.md).
- [Internal debugger](https://github.com/ngx-signal-forms/ngx-signal-forms/blob/main/packages/demo/debugger/README.md): repository-only inspection, not a consumer package.
