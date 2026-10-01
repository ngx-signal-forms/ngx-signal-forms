---
title: 'Custom wrappers'
---

This guide is for app developers who wrap a component library or design
system once and reuse the wrapper in every form. Examples are Angular
Material, PrimeNG, Spartan, or an in-house design system.

A custom wrapper that follows this guide shows errors and warnings at the
same moments as `ngx-form-field-wrapper`. It links hints and messages to the
control through `aria-describedby`, and it lets apps swap the error component
without changing the wrapper.

Do not build a wrapper when:

- The built-in wrapper fits. Theme it with CSS variables instead. See
  [Choose your level](../README.md#choose-your-level).
- You have one custom input. Read [Custom controls](./CUSTOM_CONTROLS.md).

## Choose a recipe

| Your design system…                                                                   | Use                                                                                          | Reference wrapper                           |
| ------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- | ------------------------------------------- |
| Styles the controls itself and lets the toolkit write ARIA on them                    | [The recommended recipe](#recommended-recipe)                                                | [PrimeNG](../apps/demo-primeng/README.md)   |
| Writes `aria-describedby` through an injectable service                               | The recipe plus [`createAriaDescribedByBridge`](#design-systems-that-write-aria-describedby) | [Spartan](../apps/demo-spartan/README.md)   |
| Writes `aria-describedby` itself and has no service to replace                        | The recipe with [manual ARIA mode](#design-systems-that-write-aria-describedby)              | [Material](../apps/demo-material/README.md) |
| Needs one directive that writes all ARIA attributes itself, with no wrapper component | [Compose the ARIA factories](#composing-aria-primitives)                                     | `NgxSignalFormAutoAria` source              |

The reference wrappers are runnable examples in this repository. They are not
published packages.

## Recommended recipe

All three reference wrappers follow this shape. The control is projected into
the wrapper, and the toolkit's auto-ARIA directive writes the ARIA attributes
on it.

```typescript
import { NgComponentOutlet } from '@angular/common';
import {
  Component,
  computed,
  contentChildren,
  inject,
  input,
  type Type,
} from '@angular/core';
import type { FieldState, FieldTree } from '@angular/forms/signals';
import {
  createFieldPresentation,
  injectFormContext,
  NGX_FORM_FIELD_ERROR_RENDERER,
  NGX_SIGNAL_FORM_FIELD_CONTEXT,
  NGX_SIGNAL_FORM_HINT_REGISTRY,
  NgxSignalFormControl,
  type ErrorDisplayStrategy,
  type WarningDisplayStrategy,
} from '@ngx-signal-forms/toolkit';
import {
  NgxFormFieldError,
  NgxFormFieldHint,
} from '@ngx-signal-forms/toolkit/assistive';
import { createFieldNameResolver } from '@ngx-signal-forms/toolkit/headless';

@Component({
  // The attribute in the selector keeps [formField] off the wrapper element.
  selector: 'my-form-field[myFormField]',
  imports: [NgComponentOutlet],
  providers: [
    // 1. Tell projected hints and the error renderer the field name.
    {
      provide: NGX_SIGNAL_FORM_FIELD_CONTEXT,
      useFactory: () => ({ fieldName: inject(MyFormField).resolvedFieldName }),
    },
    // 2. Tell auto-ARIA which hint IDs describe the control.
    {
      provide: NGX_SIGNAL_FORM_HINT_REGISTRY,
      useFactory: () => ({ hints: inject(MyFormField).hintDescriptors }),
    },
  ],
  host: {
    '[class.my-form-field--invalid]': 'presentation.showErrors()',
  },
  template: `
    <ng-content select="label" />
    <ng-content />
    <ng-content select="ngx-form-field-hint" />
    <ng-container
      *ngComponentOutlet="errorComponent(); inputs: errorInputs()"
    />
  `,
})
export class MyFormField<TValue = unknown> {
  readonly field = input.required<FieldTree<TValue>>({ alias: 'myFormField' });
  readonly fieldName = input<string>();
  readonly strategy = input<ErrorDisplayStrategy | null>(null);
  readonly warningStrategy = input<WarningDisplayStrategy | null>(null);

  // 3. Find the projected control. It carries `ngxSignalFormControl`.
  protected readonly boundControls = contentChildren(NgxSignalFormControl, {
    descendants: true,
  });

  // 4. Resolve the name: `fieldName` input, then the control's `id`.
  readonly resolvedFieldName = createFieldNameResolver({
    explicit: this.fieldName,
    boundControl: () =>
      this.boundControls()[0]?.elementRef.nativeElement ?? null,
    wrapperName: 'my-form-field',
  });

  protected readonly hintChildren = contentChildren(NgxFormFieldHint, {
    descendants: true,
  });

  readonly hintDescriptors = computed(() =>
    this.hintChildren().map((hint) => ({
      id: hint.resolvedId(),
      fieldName: hint.resolvedFieldName(),
    })),
  );

  // 5. Error and warning timing, the same as the built-in wrapper.
  readonly #fieldState = computed<FieldState<TValue> | null>(() =>
    this.field()(),
  );
  protected readonly presentation = createFieldPresentation(this.#fieldState, {
    strategy: this.strategy,
    warningStrategy: this.warningStrategy,
  });

  // 6. Render the error component the app chose, or the toolkit default.
  readonly #formContext = injectFormContext();
  readonly #errorRenderer = inject(NGX_FORM_FIELD_ERROR_RENDERER, {
    optional: true,
  });

  protected readonly errorComponent = computed<Type<unknown>>(
    () => this.#errorRenderer?.component ?? NgxFormFieldError,
  );

  protected readonly errorInputs = computed<Record<string, unknown>>(() => ({
    formField: this.field(),
    fieldName: this.resolvedFieldName(),
    strategy: this.presentation.effectiveStrategy(),
    warningStrategy: this.presentation.effectiveWarningStrategy(),
    submittedStatus: this.#formContext?.submittedStatus() ?? 'unsubmitted',
  }));
}
```

Use it like this. The component that declares this template imports
`FormField` from `@angular/forms/signals`, `NgxSignalFormToolkit`,
`NgxFormFieldHint`, and `MyFormField`:

```html
<form [formRoot]="profileForm" ngxSignalForm>
  <my-form-field [myFormField]="profileForm.email">
    <label for="email">Email</label>
    <input
      id="email"
      ngxSignalFormControl="input-like"
      [formField]="profileForm.email"
    />
    <ngx-form-field-hint>We never share your email.</ngx-form-field-hint>
  </my-form-field>
</form>
```

What each part does:

- **Auto-ARIA runs in the consumer's template.** The control is projected, so
  Angular matches its directives in the template that declares it. That
  template must import `FormField` and `NgxSignalFormAutoAria` (both are in
  the usual bundles). The same rule applies to `<ngx-form-field-hint>`. If
  your wrapper renders the `[formField]` element in its own template, import
  them in the wrapper instead. See
  [template-local imports](./CUSTOM_CONTROLS.md#standalone-imports-are-template-local-the-most-common-gotcha).
- **The field name is the control's `id`.** Auto-ARIA builds the message IDs
  `<fieldName>-error` and `<fieldName>-warning` from the control's `id`. Your
  renderer builds them from `resolvedFieldName()`. Set the wrapper's
  `fieldName` only to the same value, or add
  [`NgxFieldIdentityProvider`](#when-the-field-name-is-not-the-control-id).
- **`ngxSignalFormControl` marks the control** so the `contentChildren` query
  finds it. The reference wrappers log an error in development mode when it
  is missing.
- **`createFieldPresentation`** resolves the timing. See
  [`createFieldPresentation`](#createfieldpresentation).
- **The default error renderer tells auto-ARIA when messages show.** Inside
  `form[ngxSignalForm]`, `NgxFormFieldError` registers in the
  [visibility registry](#visibility-registry-tell-auto-aria-when-messages-show).
  So a per-field `strategy` on your wrapper also reaches `aria-describedby`.
  A replacement renderer must do the same.
- **The wrapper never writes `aria-invalid`, `aria-required`, or
  `aria-describedby` itself.** Auto-ARIA writes them on the control.

## Reference

### DI tokens

These tokens connect a wrapper to the toolkit. Most apps never touch them.

| Token                                       | Carries                                                                                      | Who provides it                                                   |
| ------------------------------------------- | -------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| `NGX_SIGNAL_FORMS_CONFIG`                   | The resolved config (`NgxSignalFormsConfig`)                                                 | `provideNgxSignalFormsConfig()`                                   |
| `NGX_SIGNAL_FORM_CONTEXT`                   | Form-level `errorStrategy`, `warningStrategy`, and `submittedStatus`                         | `ngxSignalForm`. Read it with `injectFormContext()`               |
| `NGX_SIGNAL_FORM_FIELD_CONTEXT`             | The field name for projected hints and renderers                                             | Your wrapper                                                      |
| `NGX_SIGNAL_FORM_HINT_REGISTRY`             | Hint IDs for `aria-describedby`                                                              | Your wrapper                                                      |
| `NGX_SIGNAL_FORM_FIELD_VISIBILITY_REGISTRY` | Whether each field's error and warning messages show now                                     | `ngxSignalForm`. Message components register in it                |
| `NGX_SIGNAL_FORM_ARIA_MODE`                 | `'auto'` or `'manual'` ARIA ownership for one control                                        | `ngxSignalFormControl*` attributes, or a directive on the control |
| `NGX_SIGNAL_FORM_CONTROL_PRESETS`           | Layout and ARIA mode per control kind. Extend them with `mergeNgxSignalFormControlPresets()` | `provideNgxSignalFormControlPresets()`                            |
| `NGX_FORM_FIELD_ERROR_RENDERER`             | The error component that replaces the default                                                | `provideFormFieldErrorRenderer()`                                 |
| `NGX_FORM_FIELD_HINT_RENDERER`              | The hint component that replaces the default                                                 | `provideFormFieldHintRenderer()`                                  |

Each function and token also exports its option and state types from
`@ngx-signal-forms/toolkit`, for example `NgxSignalFormFieldContext` and
`NgxSignalFormHintDescriptor`.

### `NGX_SIGNAL_FORM_FIELD_CONTEXT`

Provide an `NgxSignalFormFieldContext`:

| Member                          | Required | What it does                                                                                    |
| ------------------------------- | -------- | ----------------------------------------------------------------------------------------------- |
| `fieldName`                     | Yes      | `Signal<string \| null>`. The resolved name, or `null` while it is unknown.                     |
| `hintOrdinal(hint)`             | No       | The zero-based position of a hint that has no `id`. Gives each such hint a unique fallback ID.  |
| `isControlDescribedByManaged()` | No       | `true` when auto-ARIA writes the control's `aria-describedby`. Defaults to `false` when absent. |

`NgxFormFieldHint` reads `fieldName` to link itself to the field. Without it,
projected hints have no field name and do not reach `aria-describedby`.

For several hints without an explicit `id`, provide `hintOrdinal`. The first
fallback ID is `<fieldName>-hint`, then `<fieldName>-hint-2`, and so on.
Return `0`, not `-1`, for a hint you do not know. Without `hintOrdinal`, give
each hint its own `id`.

`NgxFormFieldCharacterCount` hides its visible "n/max" text only when
`isControlDescribedByManaged()` returns `true`. Return `true` only when you
also add the count's ID to the hint registry (see below) and auto-ARIA owns
the control's `aria-describedby`. Otherwise leave it out.

### `NGX_SIGNAL_FORM_HINT_REGISTRY`

Provide an `NgxSignalFormHintRegistry`. Its `hints` signal returns
`readonly NgxSignalFormHintDescriptor[]`, where each descriptor is
`{ id, fieldName }`. Auto-ARIA reads this list, not the DOM.

To link a projected `NgxFormFieldCharacterCount`, query it with
`contentChildren` and add its `limitId()` to the same list, after the hints.
Skip it while `limitId()` is `null`. The order in `aria-describedby` is:
the control's own IDs, hints, character count, then error or warning.

### `createFieldPresentation`

`createFieldPresentation(fieldState, options?)` from
`@ngx-signal-forms/toolkit` returns the error and warning state of one field.
The built-in wrapper and the three reference wrappers use it, so all of them
show messages at the same moments.

Options:

| Option            | Default                          | What it does                                                                                                                 |
| ----------------- | -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `strategy`        | Form context, config, `on-touch` | Field-level error strategy. `null`, `undefined`, and `'inherit'` use the form's strategy.                                    |
| `warningStrategy` | Form context, config, `on-touch` | Field-level warning strategy. It never reads the error strategy.                                                             |
| `hidden`          | The field's own `hidden()`       | A hidden field shows no messages. The reference wrappers pass `() => false` because their renderers do not check `hidden()`. |
| `identity`        | None                             | An `NgxFieldIdentity` to publish the resolved strategies to, so auto-ARIA uses them.                                         |
| `injector`        | Current injection context        | For calls outside an injection context, such as tests.                                                                       |

Returned signals:

| Signal                     | Meaning                                                                     |
| -------------------------- | --------------------------------------------------------------------------- |
| `errors`, `warnings`       | The field's blocking errors and its warnings (`warn:` kinds)                |
| `hasErrors`, `hasWarnings` | Whether there is at least one of each                                       |
| `showErrors`               | Blocking errors show now. Use it for invalid styling and the error message. |
| `showWarnings`             | Warnings show now. `false` while a blocking error shows.                    |
| `renderMessageSlot`        | Whether to mount the message renderer at all                                |
| `effectiveStrategy`        | The resolved error strategy                                                 |
| `effectiveWarningStrategy` | The resolved warning strategy                                               |

The [toolkit API reference](../packages/toolkit/README.md) lists it with the
other root exports.

### What auto-ARIA reads, and who provides it

<a id="which-seam-publishes-what"></a>

Auto-ARIA needs three facts it cannot work out alone. Each has its own
source. Pick the ones you need. They work together:

| Fact                                 | Default source        | Provide it with                                                                                                                     |
| ------------------------------------ | --------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| The field name                       | The control's `id`    | [`NgxFieldIdentityProvider`](#when-the-field-name-is-not-the-control-id)                                                            |
| When error and warning messages show | The form's strategies | The [visibility registry](#visibility-registry-tell-auto-aria-when-messages-show), or `createFieldPresentation`'s `identity` option |
| Which hints describe the control     | None                  | [`NGX_SIGNAL_FORM_HINT_REGISTRY`](#ngx_signal_form_hint_registry)                                                                   |

Providing one does not change the others. A wrapper that only needs to fix
the name adds only `NgxFieldIdentityProvider`.

### When the field name is not the control id

Some controls cannot use the field name as their `id`. A third-party widget
may generate its own inner `id`. A `role="group"` cluster has a name that
belongs to the group, not to one control. Then auto-ARIA builds
`<controlId>-error`, while your renderer shows `<fieldName>-error`, and
`aria-describedby` points to nothing.

Add `NgxFieldIdentityProvider` to your wrapper's host and bind its
`fieldName`:

```typescript
import { Component, input } from '@angular/core';
import type { FieldTree } from '@angular/forms/signals';
import { NgxFieldIdentityProvider } from '@ngx-signal-forms/toolkit';
import { NgxFormFieldError } from '@ngx-signal-forms/toolkit/assistive';

@Component({
  selector: 'my-field',
  hostDirectives: [
    { directive: NgxFieldIdentityProvider, inputs: ['fieldName'] },
  ],
  imports: [NgxFormFieldError],
  template: `
    <ng-content />
    <ngx-form-field-error [formField]="field()" [fieldName]="fieldName()" />
  `,
})
export class MyField {
  readonly field = input.required<FieldTree<unknown>>();
  // Same public name as the host directive input. Angular sets both from
  // one binding, and you can read it in your own template.
  readonly fieldName = input.required<string>();
}
```

```html
<my-field fieldName="emailAddress" [field]="form.emailAddress">
  <label for="p-inputtext-42">Email</label>
  <input id="p-inputtext-42" [formField]="form.emailAddress" />
</my-field>
<!-- aria-describedby="emailAddress-error", not "p-inputtext-42-error" -->
```

How the provider behaves:

- **It has no selector.** Add it only through `hostDirectives` on the
  wrapper. That element's injector is the one projected controls use.
- **A bound `fieldName` applies to every control inside the wrapper.** `null`
  means "not known yet": ARIA wiring waits and does not fall back to the
  control's `id`. In development mode, a warning reports a name that never
  appears.
- **Always bind `fieldName`.** An unbound provider publishes no name, and the
  controls inside get no ARIA wiring.
- **It publishes the name only.** Timing still comes from the visibility
  registry. To publish your wrapper's resolved strategies too, pass
  `identity: inject(NgxFieldIdentity)` to `createFieldPresentation`.

The [`field-identity` demo](https://ngx-signal-forms.github.io/ngx-signal-forms/form-field-wrapper/field-identity/)
([code](../apps/demo/src/app/04-form-field-wrapper/field-identity/README.md))
runs this shape: a widget with its own inner `id`, inside a collapsible
container.

### `NgxFieldIdentity`

`NgxFieldIdentityProvider` provides an `NgxFieldIdentity` service on the
wrapper element. `ngx-form-field-wrapper` has one too. Any control or
component inside the wrapper can inject it and read the same resolved state
auto-ARIA sees. All members are read-only:

| Member                      | Description                                                                                                                 |
| --------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `fieldName()`               | The resolved field name, or `null`                                                                                          |
| `controlId()`               | The bound control's `id`, or `null`                                                                                         |
| `errorId()`                 | `<fieldName>-error`, or `null` without a name                                                                               |
| `warningId()`               | `<fieldName>-warning`, or `null` without a name                                                                             |
| `hintIds()`                 | Hint IDs for this field. `null` means none were published, so readers use the hint registry. `[]` means there are no hints. |
| `describedBy()`             | The hint IDs joined for `aria-describedby`, or `null`. It does not include message IDs.                                     |
| `resolvedErrorStrategy()`   | The wrapper's resolved error strategy, or `null` when none was published                                                    |
| `resolvedWarningStrategy()` | The wrapper's resolved warning strategy, or `null` when none was published                                                  |
| `resolveControlElement()`   | The bound control element, or `null`                                                                                        |

```typescript
import { inject } from '@angular/core';
import { NgxFieldIdentity } from '@ngx-signal-forms/toolkit';

// Inside a control or component projected into a wrapper
readonly #identity = inject(NgxFieldIdentity, { optional: true });
protected readonly errorId = computed(() => this.#identity?.errorId() ?? null);
```

A control can use `errorId()` and `warningId()` to link to the wrapper's
messages. Do not render a second element with those IDs: the wrapper already
renders them. The methods that write to the service are internal.

### Visibility registry: tell auto-ARIA when messages show

`NGX_SIGNAL_FORM_FIELD_VISIBILITY_REGISTRY` holds, per field name, whether the
error and warning messages show now. `ngxSignalForm` provides it, so it exists
anywhere inside `form[ngxSignalForm]`. Auto-ARIA reads it when no
`NgxFieldIdentity` has published a strategy for the field. Errors and
warnings fall back separately.

`NgxFormFieldError` registers itself. `ngxHeadlessErrorState` registers itself
when it has a `fieldName`, also when you compose it as a host directive. Do not
register again for the same field. Register your own message component only
when it decides visibility without these:

```typescript
import { Component, effect, inject, input } from '@angular/core';
import { NGX_SIGNAL_FORM_FIELD_VISIBILITY_REGISTRY } from '@ngx-signal-forms/toolkit';

@Component({
  /* ... */
})
export class MyErrorMessages {
  readonly fieldName = input<string | null>(null);

  readonly #registry = inject(NGX_SIGNAL_FORM_FIELD_VISIBILITY_REGISTRY, {
    optional: true,
  });

  // The same signals that decide whether your error and warning
  // elements have content and their IDs.
  protected readonly errorVisible = /* Signal<boolean> */;
  protected readonly warningVisible = /* Signal<boolean> */;

  constructor() {
    effect((onCleanup) => {
      const fieldName = this.fieldName();
      if (!this.#registry || fieldName === null) return;

      const unregister = this.#registry.register({
        fieldName,
        errorContainerVisible: this.errorVisible,
        warningContainerVisible: this.warningVisible,
      });
      onCleanup(unregister);
    });
  }
}
```

Register the exact booleans that give your `<fieldName>-error` and
`<fieldName>-warning` elements their content and IDs, not whether the
elements are in the DOM. Do not register a strategy for auto-ARIA to resolve
again. Then `aria-describedby` always matches what is on screen.

`aria-invalid` needs a different answer when a surface renders one channel
only. A warning-only surface has no error element, so its
`errorContainerVisible` is `false`, yet the field can be invalid. Add the
optional `shouldShowErrors` signal: `true` when the field shows its errors,
whether or not you render them. Auto-ARIA uses it for `aria-invalid`. Without
it, auto-ARIA uses `errorContainerVisible` for both, as before.

`NgxFormFieldError` in `packages/toolkit/assistive/form-field-error.ts` is the
reference implementation.

### Replace the error or hint component

Apps replace the error and hint components that wrappers render. Two scopes
work:

```typescript
import {
  provideFormFieldErrorRenderer,
  provideFormFieldErrorRendererForComponent,
} from '@ngx-signal-forms/toolkit';

// App-wide, in app.config.ts. Returns EnvironmentProviders.
provideFormFieldErrorRenderer({ component: BrandedError });

// One component subtree. Returns Provider[].
@Component({
  selector: 'checkout-form',
  providers: [
    provideFormFieldErrorRendererForComponent({ component: CheckoutError }),
  ],
})
export class CheckoutForm {}
```

The component-scoped helper inherits from the nearest parent provider. Pass
`{}` to inherit without setting a new component. The hint helpers are
`provideFormFieldHintRenderer` and `provideFormFieldHintRendererForComponent`.

A wrapper renders the error component through `*ngComponentOutlet`, as in
the recipe. It does not render the hint component: `NgxFormFieldHint` does
that itself.

### The renderer interface

A renderer is a standalone component, passed as `{ component }`. Declare
every input the caller sets with `input()`. An input the component does not
declare never reaches it. In dev mode Angular logs an `NG0303` error for it,
and it throws if the app sets `errorOnUnknownProperties`.

| Caller                                              | Error renderer inputs                                                      |
| --------------------------------------------------- | -------------------------------------------------------------------------- |
| `NgxFormFieldWrapper` and the recipe above          | `formField`, `strategy`, `submittedStatus`, `warningStrategy`, `fieldName` |
| `NgxFormFieldset` with `feedbackAppearance="plain"` | `errors`, `fieldName`, `strategy`, `submittedStatus`, `listStyle`          |

A renderer that serves both callers declares all inputs from both rows and
treats the ones a caller does not set as optional.

- From a wrapper, `formField` is the field tree and `fieldName` can be
  `null`. Time errors with `strategy` and warnings with `warningStrategy`
  separately.
- From a fieldset, `errors` is a signal of errors the fieldset already
  filtered for visibility, and `fieldName` is the fieldset's ID. Render the
  list as it is. Do not apply timing again. The fieldset's default `auto` and
  `notification` appearances use their own panel, not this renderer.

An easy way to build an error renderer is to compose
`NgxHeadlessErrorState` from `@ngx-signal-forms/toolkit/headless` and map its
`field` input to `formField`:

```typescript
hostDirectives: [
  {
    directive: NgxHeadlessErrorState,
    inputs: [
      'field: formField',
      'fieldName',
      'strategy',
      'warningStrategy',
      'submittedStatus',
    ],
  },
],
```

Then read `errorId()`, `warningId()`, `shouldShowErrors()`,
`shouldShowWarnings()`, `resolvedErrors()`, and `resolvedWarnings()` from the
injected directive.

A hint renderer declares `resolvedFieldName: string | null`,
`resolvedId: string`, and `position: 'left' | 'right' | null` with `input()`,
and has a default `<ng-content />` slot for the hint text. The
`<ngx-form-field-hint>` element keeps `resolvedId` as its own `id` and stays
the element that `aria-describedby` points to. Do not copy that ID to an inner
element.

### The id contract

When a message shows, `aria-describedby` points to `<fieldName>-error` or
`<fieldName>-warning`. Your renderer must render a matching element:
`id="<fieldName>-error"` while it shows blocking errors, and
`id="<fieldName>-warning"` while it shows warnings. Otherwise
`aria-describedby` points to a missing element.

- Take `fieldName` from the input. Fall back to
  `NGX_SIGNAL_FORM_FIELD_CONTEXT` only when the input is `null`.
- Never build an ID from a `null` name.
- Keep a `role="alert"` element for errors and a `role="status"` element for
  warnings in the DOM before their content appears.
- Set the IDs and content with the same visibility rules as the caller,
  including "a visible blocking error hides the warning".
- Per-message IDs from `createErrorMessageSignal()` do not replace these
  container IDs.
- Check the references in a browser test. Axe alone does not catch every
  broken link.

`NgxFormFieldError` is the reference implementation.

## Design systems that write `aria-describedby`

Some design systems write `aria-describedby` on the control themselves. Two
writers overwrite each other, so pick one of these patterns.

**The design system reads IDs from an injectable service (Spartan).**
Spartan's `BrnField` writes `aria-describedby` from `BrnFieldA11yService`.
Replace that service at the wrapper with `createAriaDescribedByBridge` from
`@ngx-signal-forms/toolkit/headless`. The toolkit then decides the IDs, and
Spartan writes them:

```typescript
providers: [
  {
    provide: BrnFieldA11yService,
    useFactory: () =>
      createAriaDescribedByBridge({
        toolkit: inject(MySpartanField).toolkitAriaDescribedBy,
      }),
  },
],
```

`toolkitAriaDescribedBy` comes from `createAriaDescribedBySignal`
([ARIA factories](#composing-aria-primitives)). The bridge's `describedBy`
signal returns the toolkit's IDs first, then any IDs the design system
registers through `registerDescription()` or `registerError()`. Provide it on
the wrapper component so it replaces the design system's default service.

**The design system writes the attribute and you cannot replace it
(Material).** `mat-form-field` links `<mat-hint>` and `<mat-error>` itself.
Set the control to manual ARIA mode, so auto-ARIA stays off it. The Material
reference does this with per-control directives (`ngxMatTextControl` and
others) that provide `NGX_SIGNAL_FORM_ARIA_MODE` as `'manual'`. On a single
control, `ngxSignalFormControlAria="manual"` does the same. The wrapper still
uses `createFieldPresentation` for timing, and `createAriaInvalidSignal` and
`createAriaRequiredSignal` for its own invalid and required state.

## Composing ARIA primitives

Use this path when a directive must write all ARIA attributes itself instead
of `NgxSignalFormAutoAria`. It is the headless option: no wrapper component,
and full control over when attributes are written.

`@ngx-signal-forms/toolkit/headless` exports the four functions that
`NgxSignalFormAutoAria` uses. Each takes signals and returns a computed
signal. None of them read the DOM or call `inject()`, and none of them know
about manual mode.

| Factory                       | Returns                             | Purpose                                                             |
| ----------------------------- | ----------------------------------- | ------------------------------------------------------------------- |
| `createHintIdsSignal`         | `Signal<readonly string[]>`         | The hint IDs for the field, from an identity or the hint registry.  |
| `createAriaInvalidSignal`     | `Signal<'true' \| 'false' \| null>` | `aria-invalid` from the errors, the visibility, and the layout box. |
| `createAriaRequiredSignal`    | `Signal<'true' \| null>`            | `aria-required` from `required()`.                                  |
| `createAriaDescribedBySignal` | `Signal<string \| null>`            | The control's own IDs, then hints, then error or warning IDs.       |

Use only the ones you need. The Material reference uses
`createAriaInvalidSignal` and `createAriaRequiredSignal` for wrapper state and
lets Material write `aria-describedby`. The Spartan reference also uses
`createHintIdsSignal` and `createAriaDescribedBySignal` to feed the bridge.

### Worked example

This directive writes all three attributes on a `[formField]` host. It
follows `packages/toolkit/core/directives/auto-aria.ts`, without the manual
mode switch.

```typescript
import {
  afterEveryRender,
  computed,
  Directive,
  ElementRef,
  inject,
  Injector,
  signal,
} from '@angular/core';
import { FORM_FIELD, type FieldState } from '@angular/forms/signals';
import {
  createErrorVisibility,
  createWarningVisibility,
  generateErrorId,
  generateWarningId,
  isElementCssVisible,
  NGX_SIGNAL_FORM_HINT_REGISTRY,
  resolveFieldName,
  splitByKind,
} from '@ngx-signal-forms/toolkit';
import {
  createAriaDescribedBySignal,
  createAriaInvalidSignal,
  createAriaRequiredSignal,
  createHintIdsSignal,
  type HintIdsRegistryLike,
} from '@ngx-signal-forms/toolkit/headless';

interface DomSnapshot {
  readonly fieldName: string | null;
  readonly describedBy: string | null;
  readonly isControlVisible: boolean;
}

@Directive({
  selector: '[myDesignSystemAria][formField]',
})
export class MyDesignSystemAriaDirective {
  readonly #element = inject<ElementRef<HTMLElement>>(ElementRef);
  readonly #injector = inject(Injector);
  readonly #formField = inject(FORM_FIELD);
  readonly #hintRegistry = inject<HintIdsRegistryLike | null>(
    NGX_SIGNAL_FORM_HINT_REGISTRY,
    { optional: true },
  );

  // The bound field state. `field()` can be undefined on the first read.
  readonly #fieldState = computed<FieldState<unknown> | null>(() => {
    const field = this.#formField.field();
    const state =
      typeof field === 'function' ? field() : this.#formField.state();
    return state ?? null;
  });

  // Filled in the read phase below. Start with "visible" so aria-invalid
  // does not flicker before the first layout.
  readonly #dom = signal<DomSnapshot>({
    fieldName: null,
    describedBy: null,
    isControlVisible: true,
  });

  // Timing from the nearest ngxSignalForm. Pass { strategy } to override.
  readonly #showErrors = createErrorVisibility(this.#fieldState);
  readonly #showWarnings = createWarningVisibility(this.#fieldState, {
    errorVisibility: () =>
      this.#showErrors() &&
      splitByKind(this.#fieldState()?.errors() ?? []).blocking.length > 0,
  });

  readonly #hintIds = createHintIdsSignal({
    registry: this.#hintRegistry,
    fieldName: () => this.#dom().fieldName,
  });

  readonly #ariaInvalid = createAriaInvalidSignal(
    this.#fieldState,
    this.#showErrors,
    computed(() => this.#dom().isControlVisible),
  );

  readonly #ariaRequired = createAriaRequiredSignal(this.#fieldState);

  readonly #ariaDescribedBy = createAriaDescribedBySignal({
    fieldState: this.#fieldState,
    hintIds: this.#hintIds,
    visibility: this.#showErrors,
    warningVisibility: this.#showWarnings,
    preservedIds: () => this.#dom().describedBy,
    fieldName: () => this.#dom().fieldName,
  });

  constructor() {
    afterEveryRender(
      {
        // Read the DOM before any write in the same frame.
        earlyRead: () => this.#readDom(),
        write: (snapshot) => {
          const current = this.#dom();
          if (
            snapshot.fieldName !== current.fieldName ||
            snapshot.describedBy !== current.describedBy ||
            snapshot.isControlVisible !== current.isControlVisible
          ) {
            this.#dom.set(snapshot);
          }
          this.#write('aria-invalid', this.#ariaInvalid());
          this.#write('aria-required', this.#ariaRequired());
          this.#write('aria-describedby', this.#ariaDescribedBy());
        },
      },
      { injector: this.#injector },
    );
  }

  #readDom(): DomSnapshot {
    const el = this.#element.nativeElement;
    const fieldName = resolveFieldName(el);
    const raw = el.getAttribute('aria-describedby');
    const isControlVisible = isElementCssVisible(el);

    if (!raw || !fieldName) {
      return { fieldName, describedBy: raw, isControlVisible };
    }

    // Keep only IDs this directive does not manage.
    const managed = new Set([
      ...this.#hintIds(),
      generateErrorId(fieldName),
      generateWarningId(fieldName),
    ]);
    const preserved = raw
      .split(' ')
      .filter((id) => id && !managed.has(id))
      .join(' ');

    return {
      fieldName,
      describedBy: preserved || null,
      isControlVisible,
    };
  }

  #write(name: string, value: string | null): void {
    if (value === null) {
      this.#element.nativeElement.removeAttribute(name);
    } else {
      this.#element.nativeElement.setAttribute(name, value);
    }
  }
}
```

Rules for this path:

1. **One writer.** Where toolkit auto-ARIA is also in scope, add
   `ngxSignalFormControlAria="manual"` to the host, and import the toolkit
   bundle or `NgxSignalFormControl` in that template.
2. **Import Angular's `FormField`** in the consumer's template. The
   directive injects `FORM_FIELD`, which only `FormField` provides.
3. **Timing.** `createErrorVisibility` and `createWarningVisibility` read the
   nearest `ngxSignalForm`. Pass `{ strategy }` (an `ErrorDisplayStrategy` or
   a signal of one) to override. These helpers do not read the app config.
   Pass `configDefault` to use it.
4. **Read, then write.** Read the DOM in `earlyRead` and write attributes in
   `write`. Mixing both in one callback forces extra layout work.
5. **Pass the layout check to `createAriaInvalidSignal`.** Its third
   argument is `false` while the control has no layout box: a closed
   `<details>`, an inactive tab, a hidden wizard step. Then `aria-invalid` is
   removed. Without the argument, the attribute keeps its old value while the
   container is closed. Check the element that gets `aria-invalid`, which can
   be an inner element, not the host.

There are two ways to get that layout check:

| Helper                                                    | Use it when                                                                                                           |
| --------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `createControlVisibilitySignal(resolveElement, injector)` | Your code has no `afterEveryRender` hook. It adds one and returns a `Signal<boolean>`. The reference wrappers use it. |
| `isElementCssVisible(el)`                                 | You already run `afterEveryRender`. Call it in your `earlyRead`, as the example does.                                 |

Both return `true` in browsers without `Element.checkVisibility()`.
`createControlVisibilitySignal` also returns `true` while `resolveElement`
returns `null`.

## Checklist before shipping

- [ ] The wrapper provides `NGX_SIGNAL_FORM_FIELD_CONTEXT` with a `fieldName`
      signal.
- [ ] The wrapper provides `NGX_SIGNAL_FORM_HINT_REGISTRY` from its projected
      `NgxFormFieldHint` children.
- [ ] Auto-ARIA and `FormField` are imported where the `[formField]` control
      is declared: in the consumer for a projected control, in the wrapper
      for a control in its own template. Skip this if you compose the ARIA
      factories instead.
- [ ] The field name that auto-ARIA uses matches the name your renderer uses.
      Use the control's `id`, or `NgxFieldIdentityProvider`.
- [ ] The wrapper injects `NGX_FORM_FIELD_ERROR_RENDERER` with
      `{ optional: true }`, falls back to `NgxFormFieldError`, and passes
      `{ formField, strategy, submittedStatus, warningStrategy, fieldName }`.
- [ ] A custom renderer follows [the id contract](#the-id-contract) and
      registers in the visibility registry.
- [ ] Each ARIA attribute has one writer on the real control: auto-ARIA or
      your integration. The wrapper element itself gets none.
- [ ] A wrapper that uses `createAriaInvalidSignal` passes the layout check
      for the element that gets `aria-invalid`.
- [ ] Browser tests find every `aria-describedby` target before and after
      touch and submit, with separate warning timing and two hints.
- [ ] Tests close and reopen a collapsible container and check the real
      control. For radios, hide one option, then the whole group.
- [ ] Keyboard focus, live-region announcements, and contrast in your theme
      are checked by hand. Axe alone does not prove them.

## Common pitfalls

### Name or alias the field-tree input

Do not name the wrapper's field-tree input `formField` on a plain selector.
Angular's `FormField` and the toolkit's auto-ARIA both match `[formField]`,
also on elements that are not controls. On your wrapper element, auto-ARIA
then injects `FORM_FIELD`. A consumer that did not import `FormField` gets
`NG0201: No provider found for InjectionToken FORM_FIELD`.

Use one of these:

- **An aliased input with the alias in the selector**, as the recipe and the
  reference wrappers do:
  `selector: 'my-form-field[myFormField]'` with
  `input.required<FieldTree<T>>({ alias: 'myFormField' })`.
- **A different name**, such as `field`, as the
  [`field-identity` demo](../apps/demo/src/app/04-form-field-wrapper/field-identity/README.md)
  does.
- **Keep `formField`** and make sure every consumer template imports
  `FormField`. Angular's `FormField` then passes the binding through to your
  input.

### Rebuilding helpers the toolkit already has

Use these instead of writing your own:

- `createFieldNameResolver({ explicit, labelFor?, boundControl, wrapperName })`
  from `/headless`: the name from `explicit`, then the label's `for`, then
  the control's `id`. Returns `null` and warns in development mode when
  nothing resolves. The `labelFor` step is optional.
- `createFieldPresentation()`: error and warning timing.
- `createAriaDescribedByBridge()`: for design systems with an a11y service.

## For maintainers

- Design records: [ADR-0002](./decisions/0002-ngx-mat-forms-package-shape.md)
  (reference wrapper shape), [ADR-0005](./decisions/0005-aria-primitives-as-factories.md)
  (ARIA factories), [ADR-0007](./decisions/0007-warning-display-timing-cascade.md)
  (separate warning timing), [ADR-0010](./decisions/0010-field-identity-shadows-registries-per-channel.md)
  and [ADR-0011](./decisions/0011-field-identity-provider-host-directive.md)
  (field identity).
- `NgxFormFieldWrapper` composes `NgxFieldIdentityProvider` and leaves its
  input unbound. It writes the identity through the internal writers, which
  third-party wrappers cannot reach.
- The `NgxFieldIdentity` writer methods are `@internal`. The post-build step
  `scripts/strip-internal-members.mjs` removes them from the published
  `.d.ts`.
