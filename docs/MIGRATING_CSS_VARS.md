# Migrating CSS custom properties to v1

This guide covers every breaking CSS custom property change that landed during
the v1 release-candidate cycle. It is additive to
[`MIGRATING_BETA_TO_V1.md`](./MIGRATING_BETA_TO_V1.md) — the component /
directive / selector renames are documented there; this doc only covers the
theming surface.

If you are upgrading a theme that was built against `1.0.0-rc.6` or earlier,
grep your stylesheets for the old names below and apply the corresponding
rename or drop.

The toolkit's theming system is documented in full in
[`packages/toolkit/form-field/THEMING.md`](../packages/toolkit/form-field/THEMING.md).
That page also explains the two-prefix convention:

- **`--ngx-form-field-*`** — wrapper-level chrome: layout, labels, inputs, state
  borders, appearance-specific tokens.
- **`--ngx-signal-form-*`** — cross-cutting feedback concerns: the shared
  feedback tier, error messages, notification cards, fieldset grouped summaries.

## What changed, at a glance

- **New Tier 2 ("shared feedback") tokens** — a small token family that all
  feedback components (`ngx-form-field-error`, `ngx-form-field-notification`,
  `ngx-form-field-hint`, `ngx-form-field-character-count`) now cascade through.
  Override one token to retune every feedback surface at once.
- **`*-border` → `*-border-color`** across error, warning, notification, and
  fieldset grouped messages. The old bare `-border` names were ambiguous
  (border width vs. border color) and are removed.
- **`*-list-style-type` + `*-list-style-position` → `*-list-style`**
  shorthand. One token replaces two; accepts any valid CSS `list-style` value
  (`disc outside`, `circle inside`, `none`, etc.).
- **`*-padding-horizontal` shortcuts removed** on error, hint, character-count,
  and fieldset message tier. Use the logical-property pair
  (`*-padding-inline-start` / `*-padding-inline-end`) instead, or set the
  shared `--ngx-signal-form-feedback-padding-horizontal` to tune every
  feedback surface at once.
- **`-override` escape hatches removed** —
  `--ngx-signal-form-error-font-size-override` and
  `--ngx-signal-form-error-line-height-override` were undocumented escape
  hatches; the normal cascade already provides the same capability.
- **Legacy outline aliases removed** — the `--ngx-form-field-outline-*`
  family was a 1:1 backward-compat shim over the wrapper's core tokens.
  Override the core `--ngx-form-field-*` tokens instead.

## 1. New: shared feedback tier

```css
/* Typography + spacing for all feedback text in one place. */
:root {
  --ngx-signal-form-feedback-font-size: 0.875rem;
  --ngx-signal-form-feedback-line-height: 1.25rem;
  --ngx-signal-form-feedback-margin-top: 0.25rem;
  --ngx-signal-form-feedback-padding-horizontal: 0.75rem;
  --ngx-signal-form-feedback-list-style: circle outside;
  --ngx-signal-form-feedback-list-indent: 1.5rem;
}
```

Any of these overrides affects **every** feedback surface — error messages,
warning messages, notification cards, hints, character counts, and fieldset
grouped summaries — unless a component-level override is set closer to the
element (component-specific overrides still win).

Notification message typography used to cascade through
`--ngx-signal-form-error-font-size`. It no longer does — setting
`--ngx-signal-form-error-font-size` only affects inline error messages now.
Override `--ngx-signal-form-feedback-font-size` to tune both, or the
component-specific `--ngx-signal-form-notification-font-size` for just
notifications.

## 2. Renames (same behavior, new names)

### Error component (`ngx-form-field-error`)

| Before (rc.6)                                           | After (v1)                                       |
| ------------------------------------------------------- | ------------------------------------------------ |
| `--ngx-signal-form-error-border`                        | `--ngx-signal-form-error-border-color`           |
| `--ngx-signal-form-warning-border`                      | `--ngx-signal-form-warning-border-color`         |
| `--ngx-signal-form-error-list-style-type` + `-position` | `--ngx-signal-form-error-list-style` (shorthand) |

### Notification component (`ngx-form-field-notification`)

| Before (rc.6)                                                  | After (v1)                                              |
| -------------------------------------------------------------- | ------------------------------------------------------- |
| `--ngx-signal-form-notification-error-border`                  | `--ngx-signal-form-notification-error-border-color`     |
| `--ngx-signal-form-notification-warning-border`                | `--ngx-signal-form-notification-warning-border-color`   |
| `--ngx-signal-form-notification-list-style-type` + `-position` | `--ngx-signal-form-notification-list-style` (shorthand) |

### Fieldset component (`ngx-form-fieldset`)

| Before (rc.6)                                                           | After (v1)                                                       |
| ----------------------------------------------------------------------- | ---------------------------------------------------------------- |
| `--ngx-signal-form-fieldset-error-border`                               | `--ngx-signal-form-fieldset-error-border-color`                  |
| `--ngx-signal-form-fieldset-warning-border`                             | `--ngx-signal-form-fieldset-warning-border-color`                |
| `--ngx-signal-form-fieldset-notification-error-border`                  | `--ngx-signal-form-fieldset-notification-error-border-color`     |
| `--ngx-signal-form-fieldset-notification-warning-border`                | `--ngx-signal-form-fieldset-notification-warning-border-color`   |
| `--ngx-signal-form-fieldset-message-list-style-type` + `-position`      | `--ngx-signal-form-fieldset-message-list-style` (shorthand)      |
| `--ngx-signal-form-fieldset-notification-list-style-type` + `-position` | `--ngx-signal-form-fieldset-notification-list-style` (shorthand) |

## 3. Removed (with replacements)

### `*-padding-horizontal` shortcuts

Logical-property pairs (`-padding-inline-start` / `-padding-inline-end`) are
now the canonical way to set asymmetric inline padding on feedback surfaces.
The shared-feedback token covers the symmetric case.

| Removed                                                 | Replacement                                                                                                                                                                   |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--ngx-signal-form-error-padding-horizontal`            | Set `--ngx-signal-form-feedback-padding-horizontal` (affects every feedback surface), or the `-padding-inline-start` / `-padding-inline-end` pair (error-specific asymmetry). |
| `--ngx-signal-form-fieldset-message-padding-horizontal` | `--ngx-signal-form-fieldset-message-padding-inline-start` / `-inline-end` pair.                                                                                               |
| `--ngx-form-field-hint-padding-horizontal`              | `--ngx-form-field-hint-padding-inline-start` / `-inline-end` pair.                                                                                                            |
| `--ngx-form-field-char-count-padding-horizontal`        | `--ngx-form-field-char-count-padding-inline-start` / `-inline-end` pair.                                                                                                      |

### `-override` escape hatches

```css
/* Before (rc.6) */
--ngx-signal-form-error-font-size-override: 0.9rem;

/* After (v1) — just use the explicit tier directly */
--ngx-signal-form-error-font-size: 0.9rem;
```

The `-override` variants were only useful for reaching past the feedback tier
fallback. Setting the explicit component-level tier does the same thing with
one fewer indirection.

Removed: `--ngx-signal-form-error-font-size-override`,
`--ngx-signal-form-error-line-height-override`.

### Legacy outline aliases (`--ngx-form-field-outline-*`)

These were 1:1 backward-compat shims that mapped to the wrapper's core
pseudo-private tokens without adding any behavior. If you were setting any of
them, switch to the underlying core token:

| Removed                                       | Replacement                         |
| --------------------------------------------- | ----------------------------------- |
| `--ngx-form-field-outline-bg`                 | `--ngx-form-field-input-bg`         |
| `--ngx-form-field-outline-border`             | `--ngx-form-field-border-color`     |
| `--ngx-form-field-outline-border-radius`      | `--ngx-form-field-radius`           |
| `--ngx-form-field-outline-min-height`         | `--ngx-form-field-min-height`       |
| `--ngx-form-field-outline-focus-border-color` | `--ngx-form-field-focus-color`      |
| `--ngx-form-field-outline-focus-box-shadow`   | `--ngx-form-field-focus-box-shadow` |

## 4. Sanity-check grep

```bash
# Find every old name that was removed or renamed:
rg --type css --type scss --type ts --type html -- \
  '--ngx-signal-form-(error|warning|fieldset-(error|warning)|notification-(error|warning))-border:|-list-style-(type|position)|-padding-horizontal|font-size-override|line-height-override|--ngx-form-field-outline-'
```

Any hits in consumer code need the corresponding rename above.

## 5. Why these changes

The toolkit crossed 200+ public CSS vars during the rc cycle, with three
recurring sources of bloat:

1. **Per-component duplication of message/list tokens** — every feedback
   surface had its own copy of `-list-style-type`, `-list-style-position`,
   `-padding-horizontal`, `-message-spacing`. Consolidating through the
   shared feedback tier drops ~15 vars without losing flexibility.
2. **Ambiguous `-border` naming** — the bare `-border` token was sometimes
   the border color, sometimes a `1px solid <color>` shorthand. Consistently
   using `-border-color` + `-border-width` + `-border-radius` as the three
   canonical knobs removes ambiguity.
3. **One-off escape hatches** — `-override` suffixes and `-horizontal`
   shortcuts existed to paper over the cascade. The cascade now works
   directly (explicit tier → feedback tier → internal default), so the
   escape hatches are redundant.

After the v1 cleanup the theming surface is ~120 tokens — in line with
Shoelace, Primer, and other mature form-library APIs.
