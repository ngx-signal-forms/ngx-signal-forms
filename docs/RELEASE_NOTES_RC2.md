# 1.0.0-rc.1 (2026-04-06)

## Breaking changes

### Form field appearance naming

The appearance rename was intentional and is a breaking API change for wrapper appearance inputs and config defaults.

- `standard` was renamed to `stacked`
- `bare` was renamed to `plain`

Recommended migration mapping:

- `appearance="standard"` → `appearance="stacked"`
- `appearance="bare"` → `appearance="plain"`
- `defaultFormFieldAppearance: 'standard'` → `defaultFormFieldAppearance: 'stacked'`
- `defaultFormFieldAppearance: 'bare'` → `defaultFormFieldAppearance: 'plain'`

Rationale:

- `stacked` better describes the default label-above-control layout
- `plain` clearly communicates low-chrome wrapper behavior for custom controls

## Verification note

Before publishing, run appearance-focused validation to confirm the new defaults:

- wrapper unit tests covering `stacked`, `outline`, and `inherit` behavior
- focused form-field visual checks (including `custom-controls-stacked` snapshots)

---

# 1.0.0-rc.3 (upcoming)

## Breaking changes

### Error components renamed for `NgxFormField*` prefix consistency

The error display and error summary components used a mixed
`NgxSignalFormError*` prefix while every other field-scoped helper
(`NgxFormFieldHintComponent`, `NgxFormFieldCharacterCountComponent`,
`NgxFormFieldAssistiveRowComponent`) used `NgxFormField*`. The rename
closes that gap.

| Before                                     | After                                     |
| ------------------------------------------ | ----------------------------------------- |
| `NgxSignalFormErrorComponent`              | `NgxFormFieldErrorComponent`              |
| `NgxSignalFormErrorSummaryComponent`       | `NgxFormFieldErrorSummaryComponent`       |
| `NgxSignalFormErrorListStyle`              | `NgxFormFieldErrorListStyle`              |
| selector `<ngx-signal-form-error>`         | selector `<ngx-form-field-error>`         |
| selector `<ngx-signal-form-error-summary>` | selector `<ngx-form-field-error-summary>` |

Recommended migration:

```ts
// before
import {
  NgxSignalFormErrorComponent,
  NgxSignalFormErrorSummaryComponent,
} from '@ngx-signal-forms/toolkit/assistive';

// after
import {
  NgxFormFieldErrorComponent,
  NgxFormFieldErrorSummaryComponent,
} from '@ngx-signal-forms/toolkit/assistive';
```

```html
<!-- before -->
<ngx-signal-form-error [formField]="form.email" fieldName="email" />
<ngx-signal-form-error-summary [formTree]="form" />

<!-- after -->
<ngx-form-field-error [formField]="form.email" fieldName="email" />
<ngx-form-field-error-summary [formTree]="form" />
```

CSS custom properties are **unchanged**: existing theme overrides that
target `--ngx-signal-form-error-color`, `--ngx-signal-form-error-bg`,
etc. continue to work without modification.

### Auto-ARIA decoupled from internal selectors

`NgxSignalFormAutoAriaDirective` used to inject
`NgxSignalFormControlSemanticsDirective` directly and scan the DOM for
`ngx-signal-form-field-wrapper` / `ngx-signal-form-field-hint` elements
to assemble `aria-describedby`. It now reads two Angular DI tokens that
are exported from the root entry point but marked `@internal`:

- `NGX_SIGNAL_FORM_ARIA_MODE` — contributed by the control-semantics
  directive, replaces the direct class injection.
- `NGX_SIGNAL_FORM_HINT_REGISTRY` — contributed by the form-field
  wrapper, removes the wrapper-relative `closest(...)` DOM walk.

Both tokens are internal plumbing between the toolkit's own directives
and are **not part of the stable public API**. Consumers should use
`ngxSignalFormControlAria` on the control host instead of providing
`NGX_SIGNAL_FORM_ARIA_MODE` directly, and should let
`NgxSignalFormFieldWrapperComponent` own hint registration rather than
providing `NGX_SIGNAL_FORM_HINT_REGISTRY` themselves.

Consumer-facing behaviour is unchanged: hints inside
`NgxSignalFormFieldWrapperComponent` still contribute to
`aria-describedby`, and manual-ARIA mode still takes ownership of the
control host's ARIA attributes. Only custom direct consumers of those
internal paths (there should be none outside the toolkit itself) need
to update.

## Non-breaking refinements

- Main `packages/toolkit/README.md` now matches the public config
  surface (five fields) and carries explicit "Removed APIs" guidance,
  a "Which entry point do I pick?" decision aid, and a "Manual ARIA
  ownership" paragraph.
- `packages/toolkit/debugger/README.md` switches the production-gate
  example from `environment.production` to `isDevMode()`, matching
  what the component itself uses internally.
- `packages/toolkit/form-field/README.md` now consistently uses
  `appearance="outline"` everywhere (a legacy boolean `outline`
  attribute example was stale).
- `createErrorState()` and `NgxHeadlessErrorStateDirective` now share a
  single internal `buildHeadlessErrorState()` helper, removing ~60
  lines of duplicated split/resolve/ID logic and unifying them on the
  safer `readDirectErrors()` read path.
