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

### `submitWithWarnings` now surfaces broken field subtrees

`markAllFieldsAsTouched` (the internal traversal `submitWithWarnings`
uses to mimic Angular's `submit()` behavior) previously wrapped its
`isFieldTree` probe in a `try/catch` that silently demoted any thrown
`value()` to "not a FieldTree" and continued. The effect was that a
form with a broken subtree — a validator throwing, a misconfigured
lazy resolver, a `FieldTree` whose evaluation itself raised — could
be submitted with parts of it _never marked touched and never
re-validated_, while the helper reported success.

The `try/catch` has been removed. Broken subtrees now propagate the
throw out of `submitWithWarnings`, which lets the error surface at
the call site (Sentry, unhandled-promise handlers, tests). The
`createSubmittedStatusTracker.resolve()` throw on an unexpected input
is also reached more reliably because the guard no longer swallows
upstream exceptions.

**Impact:** If you have a form that was silently submitting despite
a throwing field (rare — the failure mode looks like "submit
succeeds, but some fields stay un-touched"), you will now see the
underlying error at submit time. Fix the field or wrap the
`submitWithWarnings` call in your own handler. No migration is
required otherwise — healthy forms are unaffected.

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
- **New dev-mode diagnostics** surface two common wiring mistakes
  that previously failed silently:
  - `focusFirstInvalid()` logs a one-shot `console.warn` in dev mode
    when `errorSummary()` is non-empty but every error was filtered
    out (missing `focusBoundControl`, hidden, disabled, or missing
    `fieldTree`). The typical cause is a custom control that never
    called `registerAsBinding()`, so the user sees the error message
    but focus is stranded wherever the submit button was.
  - `NgxSignalFormFieldWrapperComponent` logs a one-shot dev warning
    per instance when its bound control cannot be classified
    (`semantics.kind === null`). The wrapper falls back to textual
    chrome, which is often not what authors expected for custom
    widgets — declare `ngxSignalFormControl="..."` or register a
    preset to opt into the right layout and ARIA wiring. Both
    warnings are stripped in production builds (`ngDevMode`).
- **Kind capability exhaustiveness**: the form-field wrapper's
  control-kind predicates (`isTextualControlKind`,
  `supportsOutlinedAppearance`, `isSelectionGroupKind`,
  `hasPaddedControlContent`) now read from a single
  `CONTROL_KIND_CAPABILITIES` table declared with
  `satisfies Record<NgxSignalFormControlKind, ControlKindCapabilities>`.
  Adding a new kind to `NgxSignalFormControlKind` is a **compile-time
  error** until the capability table is updated, closing a
  drift-risk the predicates previously had.
- **`isFieldStateHidden` signature tightened** to
  `Pick<FieldState<unknown>, 'hidden'>` so the compiler catches
  incorrect call sites. The body keeps a defensive runtime check so
  existing partial-field test mocks (which omit `hidden()`)
  continue to work; migrating those mocks to a shared factory is a
  tracked follow-up.
- **`submitWithWarnings` drift guard** now includes a warning-only
  test case in `submission-helpers.drift.spec.ts`. Previously only
  blocking-only and fully-valid scenarios were pinned; the missing
  case covered exactly the divergence the helper exists to provide.
- **Wrapper preset-override integration tests** mount the wrapper
  under `provideNgxSignalFormControlPresets` (both environment- and
  component-scoped) and assert the override propagates into
  `data-ngx-signal-form-control-*` host attributes. A regression in
  the DI wiring or `resolveNgxSignalFormControlSemantics` will now
  fail a test instead of landing in the published bundle.
