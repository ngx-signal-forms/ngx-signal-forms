---
title: 'Migrating CSS custom properties (rc.6 to v1)'
sidebarTitle: 'CSS custom properties'
---

This guide covers the breaking CSS custom property renames and removals made when upgrading from `1.0.0-rc.6` or earlier. Component and TypeScript renames are in [`MIGRATING_BETA_TO_V1.md`](./MIGRATING_BETA_TO_V1.md).

For later CSS default and token changes, see [field spacing and selection rows](./MIGRATING_BETA_TO_V1.md#field-spacing-and-selection-rows) and [changes since rc.16](./MIGRATING_BETA_TO_V1.md#changes-since-rc16).

The current theming API lives in [`THEMING.md`](../packages/toolkit/form-field/THEMING.md).

## Prefix conventions

- **`--ngx-form-field-*`.** Wrapper layout, labels, inputs, state borders, and appearance tokens.
- **`--ngx-signal-form-*`.** Shared feedback tier, error messages, panel cards, and fieldset grouped summaries.

## Summary of rc.6 to v1 changes

- **Shared feedback tier added.** `--ngx-signal-form-feedback-*` sets typography, spacing, and list styling across errors, warnings, hints, character counts, and fieldsets at once.
- **`*-border` renamed to `*-border-color`** across error, warning, notification, and fieldset tokens.
- **`*-list-style-type` and `*-list-style-position` combined into `*-list-style`** (accepts standard CSS `list-style` shorthand such as `disc outside` or `none`).
- **`*-padding-horizontal` shortcuts removed.** Use `-padding-inline-start` / `-padding-inline-end` on hints and character counts (character counts also inherit `--ngx-signal-form-feedback-padding-horizontal`), `-inset-inline-start` / `-inset-inline-end` on fieldset messages and notifications, and host-level spacing or `--ngx-signal-form-error-panel-padding` on errors.
- **`-override` escape hatches removed.** `--ngx-signal-form-error-font-size-override` and `--ngx-signal-form-error-line-height-override` are replaced by setting `--ngx-signal-form-error-font-size` and `--ngx-signal-form-error-line-height` directly.
- **Legacy outline aliases removed.** Set the core `--ngx-form-field-*` tokens instead.

## 1. Shared feedback tier

```css
:root {
  --ngx-signal-form-feedback-font-size: 0.875rem;
  --ngx-signal-form-feedback-line-height: 1.25rem;
  --ngx-signal-form-feedback-margin-top: 0.25rem;
  --ngx-signal-form-feedback-padding-horizontal: 0.75rem;
  --ngx-signal-form-feedback-list-style: circle outside;
  --ngx-signal-form-feedback-list-indent: 1.5rem;
}
```

Component-level tokens still override the shared tier. Setting `--ngx-signal-form-error-font-size` affects inline errors only; use `--ngx-signal-form-error-panel-font-size` for `presentation="panel"`.

## 2. Renames

### Error component (`ngx-form-field-error`)

| Before (rc.6)                                           | After                                            |
| ------------------------------------------------------- | ------------------------------------------------ |
| `--ngx-signal-form-error-border`                        | `--ngx-signal-form-error-border-color`           |
| `--ngx-signal-form-warning-border`                      | `--ngx-signal-form-warning-border-color`         |
| `--ngx-signal-form-error-list-style-type` + `-position` | `--ngx-signal-form-error-list-style` (shorthand) |

### Former notification component tokens

In RC.12, `ngx-form-field-notification` was folded into `ngx-form-field-error` with `presentation="panel"`. See [notification migrations](./MIGRATING_BETA_TO_V1.md#notification-vest-and-testing-migrations).

| Before (rc.6)                                                  | After                                                   |
| -------------------------------------------------------------- | ------------------------------------------------------- |
| `--ngx-signal-form-notification-error-border`                  | `--ngx-signal-form-error-panel-border-color`            |
| `--ngx-signal-form-notification-warning-border`                | `--ngx-signal-form-warning-panel-border-color`          |
| `--ngx-signal-form-notification-list-style-type` + `-position` | `--ngx-signal-form-error-list-style` (shared shorthand) |

### Fieldset component (`ngx-form-fieldset`)

| Before (rc.6)                                                           | After                                                            |
| ----------------------------------------------------------------------- | ---------------------------------------------------------------- |
| `--ngx-signal-form-fieldset-error-border`                               | `--ngx-signal-form-fieldset-error-border-color`                  |
| `--ngx-signal-form-fieldset-warning-border`                             | `--ngx-signal-form-fieldset-warning-border-color`                |
| `--ngx-signal-form-fieldset-notification-error-border`                  | `--ngx-signal-form-fieldset-notification-error-border-color`     |
| `--ngx-signal-form-fieldset-notification-warning-border`                | `--ngx-signal-form-fieldset-notification-warning-border-color`   |
| `--ngx-signal-form-fieldset-message-list-style-type` + `-position`      | `--ngx-signal-form-fieldset-message-list-style` (shorthand)      |
| `--ngx-signal-form-fieldset-notification-list-style-type` + `-position` | `--ngx-signal-form-fieldset-notification-list-style` (shorthand) |

## 3. Removed tokens and replacements

### `*-padding-horizontal` shortcuts

| Removed                                                 | Replacement                                                                                                                                                                                     |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--ngx-signal-form-error-padding-horizontal`            | Inline errors keep `0` horizontal padding (see #787); add `margin-inline` or `padding-inline` on the `<ngx-form-field-error>` host or use `--ngx-signal-form-error-panel-padding` in panel mode |
| `--ngx-signal-form-fieldset-message-padding-horizontal` | `--ngx-signal-form-fieldset-message-inset-inline-start` / `-inline-end` (or `--ngx-signal-form-fieldset-notification-inset-inline-*` for cards)                                                 |
| `--ngx-form-field-hint-padding-horizontal`              | `--ngx-form-field-hint-padding-inline-start` / `-inline-end`                                                                                                                                    |
| `--ngx-form-field-char-count-padding-horizontal`        | `--ngx-form-field-char-count-padding-inline-start` / `-inline-end`                                                                                                                              |

### `-override` escape hatches

Removed: `--ngx-signal-form-error-font-size-override`, `--ngx-signal-form-error-line-height-override`. Set `--ngx-signal-form-error-font-size` and `--ngx-signal-form-error-line-height` directly.

### Legacy outline aliases

| Removed                                       | Replacement                         |
| --------------------------------------------- | ----------------------------------- |
| `--ngx-form-field-outline-bg`                 | `--ngx-form-field-input-bg`         |
| `--ngx-form-field-outline-border`             | `--ngx-form-field-border-color`     |
| `--ngx-form-field-outline-border-radius`      | `--ngx-form-field-radius`           |
| `--ngx-form-field-outline-min-height`         | `--ngx-form-field-min-height`       |
| `--ngx-form-field-outline-focus-border-color` | `--ngx-form-field-focus-color`      |
| `--ngx-form-field-outline-focus-box-shadow`   | `--ngx-form-field-focus-box-shadow` |

## 4. Check your codebase

Run this search to locate any remaining pre-v1 names:

```bash
rg --type css --type ts --type html -g '*.scss' -- \
  '--ngx-signal-form-(error|warning|fieldset-(error|warning)|notification-(error|warning))-border:|-list-style-(type|position)|--ngx-signal-form-(error|fieldset-message)-padding-horizontal|--ngx-form-field-(hint|char-count)-padding-horizontal|font-size-override|line-height-override|--ngx-form-field-outline-(bg|border|border-radius|min-height|focus-border-color|focus-box-shadow)'
```

## 5. Later CSS changes

Review [field spacing and selection rows](./MIGRATING_BETA_TO_V1.md#field-spacing-and-selection-rows) and [changes since rc.16](./MIGRATING_BETA_TO_V1.md#changes-since-rc16).
