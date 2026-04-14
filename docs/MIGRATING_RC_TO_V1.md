# Migrating from RC to v1

This guide covers breaking changes between the release-candidate builds
(`1.0.0-rc.1` / `1.0.0-rc.2`) and the stable `1.0.0` release.

## Removed APIs

The following symbols existed in earlier betas / RCs and have been removed.
If your code still references them, replace them with the v1 equivalents below.

| Removed API                    | v1 Replacement                                  |
| ------------------------------ | ----------------------------------------------- |
| `computeShowErrors()`          | `showErrors()`                                  |
| `createShowErrorsSignal()`     | `showErrors()`                                  |
| `canSubmit()`                  | `canSubmitWithWarnings()`                       |
| `isSubmitting()`               | `submittedStatus()` from `[formRoot]` directive |
| `injectFormConfig()`           | `inject(NGX_SIGNAL_FORMS_CONFIG)`               |
| `'manual'` error strategy      | `showErrors()` + a manual signal                |
| `fieldNameResolver` config     | Provide `id` on the bound control element       |
| `strictFieldResolution` config | Removed — strict by default                     |
| `debug` config field           | Removed — use the debugger component instead    |

## Renamed APIs

Same behavior, new name:

| RC name                 | v1 name                |
| ----------------------- | ---------------------- |
| `appearance="standard"` | `appearance="stacked"` |
| `appearance="bare"`     | `appearance="plain"`   |

## Migration steps

1. **Search & replace** the renamed appearances in your templates.
2. **Find usages** of removed APIs (grep for the left column above) and swap
   them for the v1 replacement.
3. **Remove** any imports of `injectFormConfig` — use
   `inject(NGX_SIGNAL_FORMS_CONFIG)` directly if you need to read the resolved
   config, or `provideNgxSignalFormsConfig()` to provide overrides.
4. **Run the build** to catch any remaining references at compile time.
