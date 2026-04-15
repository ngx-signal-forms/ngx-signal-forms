# Global Toolkit Configuration

## Intent

Shows how global toolkit defaults and app-level control-family presets (configured in `apps/demo/src/main.ts`) affect every form in the app, while one form can still override the error strategy locally.

## Toolkit features showcased

- `provideNgxSignalFormsConfig()` — sets app-wide toolkit defaults (error strategy, labels, etc.).
- `provideNgxSignalFormControlPresets()` — declares app-wide control presets (e.g. switch → `layout: 'inline-control'`, `ariaMode: 'auto'`).
- Local override of `[errorStrategy]` on a single `<form>` — demonstrates that form-level settings still win over global defaults.
- `NgxSignalFormToolkit` + `NgxFormField` wrapper — consume the inherited configuration automatically.
- Bound control `id` values — deterministic ARIA linkage without hand-wiring.

## Form model

- Signal model: `signal<GlobalConfigModel>({ email, phone, website, acceptTerms })`.
- Schema: `form(model, globalConfigSchema)`.

## Validation rules

### Errors

- Email — required; email format.
- Phone — required; format `123-456-7890`.
- Website — optional, but must be a valid URL when provided.
- Accept terms — must be checked before submission.

### Warnings

- None.

## Strong suites

- The canonical reference for wiring up global config and reading the resolved values at runtime.
- Proves that app-level presets reach custom control semantics (the terms switch) without per-component configuration.
- Makes the inheritance/override story concrete: global default + local override in one screen.

## Key files

- [global-configuration.form.ts](global-configuration.form.ts) — form component and local overrides.
- [global-configuration.validations.ts](global-configuration.validations.ts) — schema rules.
- [global-configuration.page.ts](global-configuration.page.ts) — page wrapper and configuration panel.
- `apps/demo/src/main.ts` — `provideNgxSignalFormsConfig()` and `provideNgxSignalFormControlPresets()` setup.

## How to test

1. Run the demo and navigate to `/advanced-scenarios/global-configuration`.
2. Inspect the configuration panel — confirm the global defaults in `main.ts` are reflected.
3. Toggle the local error-strategy override and watch only this form's behavior change.
4. Blur the accept-terms switch to verify the app-level preset keeps the row inline while auto-ARIA stays active.
5. Enter an invalid phone or URL and confirm the format errors render.
6. Submit without accepting the terms to confirm the error is blocking.

## Related

- [Custom Controls](../../04-form-field-wrapper/custom-controls/README.md) — where the switch/checkbox/slider presets are exercised.
- [Error Display Modes](../../02-toolkit-core/error-display-modes/README.md) — dedicated strategy deep dive.
