# Complex and nested forms

How the toolkit's fieldset, error summary, and strategy inheritance scale from
flat forms to deeply nested groups and arrays.

## Is this for me?

Read this if your form has any of:

- **Grouped fields** (`address`, `passwords`, `billingInfo`) with cross-field rules
- **Nested arrays** (`invoices[]`, `lineItems[]`, `facts[][]`)
- **Multi-step wizards** with per-step aggregation
- **Form-level error summaries** that link back to fields
- **Mixed per-field and per-group error display**

If you're building a single flat form, the [form-field wrapper](../packages/toolkit/form-field/README.md)
alone is enough — come back here when you hit the first group of related fields.

> **State management is out of scope.** How the model signal is owned
> (component-local, service, NgRx Signal Store) doesn't change the toolkit
> patterns below. For a deep dive on owning nested CRUD state with NgRx Signal
> Store, see the archived
> [NgRx nested arrays pattern](./archive/NESTED_FORM_ARRAYS_PATTERN.md) —
> it's long, NgRx-first, and orthogonal to the toolkit.

---

## The two fieldset modes

`<ngx-signal-form-fieldset>` aggregates errors from a subtree. The
`includeNestedErrors` input picks the mode.

| Mode                       | `includeNestedErrors` | Shows                                 | Use when                                              |
| -------------------------- | --------------------- | ------------------------------------- | ----------------------------------------------------- |
| **Group-only** _(default)_ | `false`               | Only direct group-level errors        | Nested fields render their own errors via the wrapper |
| **Aggregated**             | `true`                | All errors including every descendant | Fields are silent; group owns the feedback            |

### Group-only: cross-field errors at the group level

When each field wraps itself, the fieldset only needs to show cross-field errors.

```html
<ngx-signal-form-fieldset [fieldsetField]="form.passwords">
  <legend>Passwords</legend>

  <ngx-signal-form-field-wrapper [formField]="form.passwords.password">
    <label for="pw">Password</label>
    <input id="pw" type="password" [formField]="form.passwords.password" />
  </ngx-signal-form-field-wrapper>

  <ngx-signal-form-field-wrapper [formField]="form.passwords.confirm">
    <label for="pw2">Confirm password</label>
    <input id="pw2" type="password" [formField]="form.passwords.confirm" />
  </ngx-signal-form-field-wrapper>

  <!-- The fieldset shows only the "Passwords must match" cross-field error -->
</ngx-signal-form-fieldset>
```

To attach a rule to the group itself — so the fieldset (not either child)
surfaces it — use [`validateTree()`](https://angular.dev/guide/forms/signals/cross-field-logic).
`validateTree` runs at the parent node, and returning a plain validation error
without a `fieldTree` keeps it at the group level:

```typescript
import { required, validateTree } from '@angular/forms/signals';

form(model, (path) => {
  required(path.passwords.password, { message: 'Password is required' });
  required(path.passwords.confirm, { message: 'Please confirm your password' });

  validateTree(path.passwords, ({ value }) => {
    const { password, confirm } = value();
    if (password && confirm && password !== confirm) {
      return { kind: 'mismatch', message: 'Passwords must match' };
    }
    return null;
  });
});
```

> **Leaf vs group target.** Angular's cross-field guide recommends placing the
> error "where the user would most likely go to fix it." When that's a specific
> child (e.g. the _confirm_ field), use `validate(path.passwords.confirm, ...)`
> with `ctx.valueOf(path.passwords.password)` instead — the error then shows on
> that child's wrapper. Reach for `validateTree` only when the rule is
> inherently about the group and you want it on the fieldset.

### Aggregated: group owns all the feedback

When you want a compact layout — e.g. a deep address group where individual
fields stay plain — let the fieldset display every descendant error once.

```html
<ngx-signal-form-fieldset
  [fieldsetField]="form.address"
  [includeNestedErrors]="true"
>
  <legend>Address</legend>
  <input [formField]="form.address.street" />
  <input [formField]="form.address.city" />
  <input [formField]="form.address.postalCode" />
</ngx-signal-form-fieldset>
```

The fieldset deduplicates identical messages and inherits the error strategy
from its parent `ngxSignalForm`, so nothing shows up before the user has had
a chance to interact.

---

## Error summaries across the whole form

For wizards and long forms you usually want a single list at the top that
links each message back to its field.

```html
<form [formRoot]="form" ngxSignalForm errorStrategy="on-submit">
  <ngx-form-field-error-summary [formTree]="form" />
  <!-- ...fields... -->
</form>
```

Under the hood this wraps Angular's native `errorSummary()` so every nested
field's errors surface at the root. The summary:

- Shows messages only when the strategy allows (e.g. after the first submit)
- Renders each entry as a clickable link that calls Angular's
  `focusBoundControl()` to jump to the offending field
- Uses `role="alert"` for blocking errors, `role="status"` for warnings
- Deduplicates identical `kind` + `message` pairs across fields

For fully custom markup, the headless equivalent
(`NgxHeadlessErrorSummaryDirective`) exposes the same managed state as signals
while you own every element.

---

## Strategy inheritance via `ngxSignalForm`

On a deeply nested form you don't want to pass `[strategy]` to every wrapper
and fieldset. Add `ngxSignalForm` once at the root and every toolkit component
below it — wrapper, auto-ARIA, assistive components, headless directives —
picks up the same strategy via DI:

```html
<form [formRoot]="wizardForm" ngxSignalForm errorStrategy="on-submit">
  <ngx-signal-form-fieldset [fieldsetField]="wizardForm.personalInfo">
    <legend>Personal</legend>
    <!-- wrappers inside inherit 'on-submit' automatically -->
  </ngx-signal-form-fieldset>

  <ngx-signal-form-fieldset [fieldsetField]="wizardForm.billing">
    <legend>Billing</legend>
    <!-- same strategy, no extra wiring -->
  </ngx-signal-form-fieldset>
</form>
```

You can still override at any level by passing `[strategy]` to a specific
wrapper or fieldset — it only affects that subtree.

---

## Field labels for deep paths

Error summaries on nested forms default to humanized paths:

```text
ng.form0.address.postalCode  →  Address / Postal code
facts.0.offenses.1.article   →  Facts / 0 / Offenses / 1 / Article
```

For long forms this is usually not what you want. Override globally with `provideFieldLabels()`. The map form does an **exact
path lookup** — it does not support wildcards, so it's best for flat or
small-group forms:

```typescript
provideFieldLabels({
  'address.postalCode': 'Postcode',
  'address.street': 'Straat',
  'credentials.confirmPassword': 'Confirm password',
});
```

For deeply nested arrays where paths vary by index (`facts.0.offenses.1.article`),
pass a **factory** that returns a custom resolver and do the pattern matching
yourself:

```typescript
import { humanizeFieldPath } from '@ngx-signal-forms/toolkit/headless';
import { provideFieldLabels } from '@ngx-signal-forms/toolkit';

provideFieldLabels(() => (fieldPath) => {
  if (/^facts\.\d+\.offenses\.\d+\.article$/.test(fieldPath)) {
    return 'Legal article';
  }
  if (/^facts\.\d+\.offenses\.\d+$/.test(fieldPath)) {
    return 'Offense';
  }
  return humanizeFieldPath(fieldPath);
});
```

For i18n, inject your translation service inside the same factory. See the
[WARNINGS_SUPPORT advanced section](./WARNINGS_SUPPORT.md#advanced-error-flow-and-message-resolution)
for the full resolver API.

---

## Arrays of field groups

For repeated groups (`invoices[]`, `lineItems[]`), wrap each iteration in its
own fieldset so errors aggregate per row:

```html
@for (item of form.lineItems; track $index; let i = $index) {
<ngx-signal-form-fieldset [fieldsetField]="form.lineItems[i]">
  <legend>Line {{ i + 1 }}</legend>
  <ngx-signal-form-field-wrapper [formField]="form.lineItems[i].description">
    <label [for]="'line-' + i + '-desc'">Description</label>
    <input
      [id]="'line-' + i + '-desc'"
      [formField]="form.lineItems[i].description"
    />
  </ngx-signal-form-field-wrapper>
  <ngx-signal-form-field-wrapper [formField]="form.lineItems[i].quantity">
    <label [for]="'line-' + i + '-qty'">Quantity</label>
    <input
      [id]="'line-' + i + '-qty'"
      type="number"
      [formField]="form.lineItems[i].quantity"
    />
  </ngx-signal-form-field-wrapper>
</ngx-signal-form-fieldset>
}
```

> `track $index` plus indexed access (`form.lineItems[i]`) matches the pattern
> used in the [`complex-forms`](../apps/demo/src/app/04-form-field-wrapper/complex-forms)
> demo — the toolkit's own reference for array fieldsets.

A root `ngx-form-field-error-summary` still picks up every row's errors and
links to the exact field.

---

## Configuring defaults app-wide

For complex forms, set strategy and appearance once in `app.config.ts`:

```typescript
provideNgxSignalFormsConfig({
  defaultErrorStrategy: 'on-touch',
  defaultFormFieldAppearance: 'outline',
});
```

Individual forms can still override with `errorStrategy` on `ngxSignalForm`,
and individual wrappers can override `appearance` on the element itself.

---

## Demos

- [`complex-forms`](../apps/demo/src/app/04-form-field-wrapper/complex-forms) — grouped fields with fieldset aggregation
- [`cross-field-validation`](../apps/demo/src/app/05-advanced/cross-field-validation) — cross-field rules surfacing at the group
- [`advanced-wizard`](../apps/demo/src/app/05-advanced/advanced-wizard) — multi-step form with summary, strategy inheritance, and per-step aggregation
- [`async-validation`](../apps/demo/src/app/05-advanced/async-validation) — debounced async rules inside a nested group

## Related

- [Form-field wrapper](../packages/toolkit/form-field/README.md) — the single-field primitive these patterns compose
- [Headless primitives](../packages/toolkit/headless/README.md) — for custom markup of fieldset aggregation and error summary
- [Warnings and error flow](./WARNINGS_SUPPORT.md) — how `errors()` and `errorSummary()` differ, and how messages are resolved
- [Validation strategies](./VALIDATION_STRATEGY.md) — layering Angular validators, Zod, and Vest in a complex form
- [Archived: NgRx nested arrays pattern](./archive/NESTED_FORM_ARRAYS_PATTERN.md) — deep state-management architecture with NgRx Signal Store (not toolkit-specific)
