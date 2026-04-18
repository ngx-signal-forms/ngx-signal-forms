# Angular Signal Forms vs. `@ngx-signal-forms/toolkit`

The toolkit is **additive**. Angular Signal Forms still owns form creation, validation,
field state, and submission. The toolkit layers the UX pieces Angular intentionally
leaves to application and library authors: accessibility wiring, error-display timing,
warning semantics, and reusable field UI.

## Feature matrix

| Concern                                  | Angular Signal Forms                              | Toolkit                                                                                                                                             |
| ---------------------------------------- | ------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| Form model, validation, submit lifecycle | ✅ Native                                         | ➖ Builds on top                                                                                                                                    |
| `[formRoot]` form context                | ✅ `novalidate`, `preventDefault`, `submit()`     | ✅ Adds DI context, submitted status, error strategy                                                                                                |
| Progressive error timing                 | ❌ Manual                                         | ✅ Built in via `errorStrategy`                                                                                                                     |
| Submitted status tracking                | ❌ Only `submitting()` signal                     | ✅ `unsubmitted → submitting → submitted`                                                                                                           |
| Warning semantics                        | ❌ Manual convention needed                       | ✅ Built in via `warningError()`                                                                                                                    |
| Warning display timing                   | ❌ Manual                                         | ✅ Independent `warningStrategy` (default `'immediate'`) — see [`WARNINGS_SUPPORT.md`](./WARNINGS_SUPPORT.md#when-warnings-appear--warningstrategy) |
| Automatic ARIA linking                   | ❌ Manual                                         | ✅ Built in                                                                                                                                         |
| Reusable field UI                        | ❌ App-specific                                   | ✅ Assistive + form-field entry points                                                                                                              |
| CSS status classes                       | ✅ Native `provideSignalFormsConfig({ classes })` | ➖ Use Angular's native API alongside toolkit                                                                                                       |

## Why `ngxSignalForm` is additive, not a replacement

`NgxSignalForm` (selector: `form[formRoot][ngxSignalForm]`) is an **enhancer**.
It activates on `<form>` elements that already have `[formRoot]` when you also add the
`ngxSignalForm` attribute. It adds:

1. **DI context** — child toolkit components (error display, field wrappers, headless
   directives) access form state through `NGX_SIGNAL_FORM_CONTEXT` without prop drilling.
2. **Submitted status tracking** — derives `'unsubmitted' → 'submitting' → 'submitted'`
   from Angular's native `submitting()` signal, which Angular does not expose as a status.
3. **Error display strategy** — the `[errorStrategy]` input controls when validation
   feedback becomes visible (`'immediate'`, `'on-touch'`, or `'on-submit'`).

`NgxSignalFormToolkit` is a convenience bundle that combines `FormRoot` +
`NgxSignalForm` + `NgxSignalFormAutoAria` +
`NgxSignalFormControlSemantics`. Import it instead of `FormRoot` separately.

```typescript
imports: [FormField, NgxSignalFormToolkit];
```

```html
<form [formRoot]="myForm" ngxSignalForm errorStrategy="on-touch"></form>
```

## Side-by-side: the same field, with and without the toolkit

### Without the toolkit

```html
<form [formRoot]="userForm">
  <label for="email">Email</label>
  <input
    id="email"
    [formField]="userForm.email"
    [attr.aria-invalid]="userForm.email().invalid() ? 'true' : null"
    [attr.aria-describedby]="
      userForm.email().invalid() &&
      (userForm.email().touched() || userForm().touched())
        ? 'email-error'
        : null
    "
  />
  @if ( userForm.email().invalid() && (userForm.email().touched() ||
  userForm().touched()) ) {
  <span id="email-error" role="alert">
    {{ userForm.email().errors()[0].message }}
  </span>
  }
  <button type="submit">Submit</button>
</form>
```

### With the toolkit

```html
<form [formRoot]="userForm" ngxSignalForm>
  <ngx-signal-form-field-wrapper [formField]="userForm.email">
    <label for="email">Email</label>
    <input id="email" [formField]="userForm.email" type="email" />
  </ngx-signal-form-field-wrapper>
  <button type="submit">Send</button>
</form>
```

The wrapper handles ARIA wiring, error timing, `role="alert"` vs `role="status"`, and
hint/counter projection automatically. Angular still owns `form()`, `submit()`,
validation, and field state — the toolkit just removes the UX boilerplate around them.

## Deeper dive

For the full ownership boundary — every Angular API the toolkit consumes, every
toolkit-owned feature by entry point, the duck-typing rationale, and why the
`/core` internal entry point is not part of the public API — see
[`ANGULAR_PUBLIC_API_POLICY.md`](./ANGULAR_PUBLIC_API_POLICY.md).
