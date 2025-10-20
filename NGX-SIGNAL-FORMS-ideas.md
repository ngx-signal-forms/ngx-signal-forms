# NGX SIGNAL FORMS ideas

## Form

- Add `ngxSignalForms` or `ngxSignalForm` directive to form tag to enable signal forms functionality with directives etc.
- Including `novalidate` by default to prevent native validation popups.
- There should be a provider or token token to configure global settings for signal forms. (so you can disable/enable certain features globally, like `novalidate` addition, or default debounce time for valueChanges signals etc)
  For the form-field this could be a `withFormFieldConfig` function that accepts a config object and provides it via DI.to the `provideNgxSignalFormsConfig` function/provider.

## Form Field (wrapper)

- should have all aria attributes/directives etc by default?
- add more css custom properties for easier theming/customization?
  - should be able to customize colors, font-sizes, paddings, margins, border-radius etc via css variables
- add ability to show warning messages (like validation messages but for warnings)
- add ability to show info/hint messages (like validation messages but for info)
- `withFormFieldConfig()`
  - showRequired true/false | or as object with true and a custom character instead of the default `*` ?
  - show max-count erros/warnings?
  - ??
