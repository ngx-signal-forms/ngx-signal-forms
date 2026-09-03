# @ngx-signal-forms/toolkit

> Core directives, providers, and utilities for Angular Signal Forms — form-level context, error strategies, automatic ARIA, submission helpers, and warning support.

**[🚀 Live demo](https://ngx-signal-forms.github.io/ngx-signal-forms/)** · **[📖 Full documentation (GitHub)](https://github.com/ngx-signal-forms/ngx-signal-forms#readme)**

## Why this entry point exists

Angular Signal Forms provides the form model, validation, and field state. The core toolkit builds on top with three things Angular intentionally leaves to you:

1. **Form-level context** — error display strategy and submitted status, shared via DI so child components stay in sync without prop drilling.
2. **Automatic ARIA** — `aria-invalid`, `aria-required`, and `aria-describedby` applied to `[formField]` controls based on strategy-aware timing.
3. **Utilities** — error visibility helpers, focus management, warning support, and submission lifecycle tracking.

You always import the core entry point. The other entry points add UI components and adapters on top.

> [!IMPORTANT]
> `@ngx-signal-forms/toolkit` is the behavioral foundation.
> Use this entry point for form context, ARIA ownership, strategy resolution, and shared utilities.
> Add `/form-field`, `/assistive`, `/headless`, `/vest`, or `/testing` only for the specific surface you need.

## Entry points

| Entry point                            | Purpose                                                              |
| -------------------------------------- | -------------------------------------------------------------------- |
| `@ngx-signal-forms/toolkit`            | Core directives, providers, and utilities                            |
| `@ngx-signal-forms/toolkit/assistive`  | Error, grouped panel feedback, hint, counter, and summary components |
| `@ngx-signal-forms/toolkit/form-field` | Form field wrapper and fieldset components                           |
| `@ngx-signal-forms/toolkit/headless`   | Renderless primitives for custom UI                                  |
| `@ngx-signal-forms/toolkit/vest`       | Optional Vest adapter (requires `vest@6`)                            |
| `@ngx-signal-forms/toolkit/testing`    | WCAG 2.2 AA test harness (requires `axe-core`)                       |

### Picking the right surface quickly

- Need a ready-to-use form UI? Use [`/form-field`](./form-field/README.md).
- Need standalone feedback widgets in your own layout? Use [`/assistive`](./assistive/README.md).
- Need full custom markup with toolkit state only? Use [`/headless`](./headless/README.md).
- Need Vest policy validation and warning mapping? Use [`/vest`](./vest/README.md).
- Need WCAG assertions in tests? Use [`/testing`](./testing/README.md).

## First 60 seconds (core)

If you only need the core behavior layer first, copy/paste this:

```typescript
import { Component, signal } from '@angular/core';
import { FormField, form, required } from '@angular/forms/signals';
import { NgxSignalFormToolkit } from '@ngx-signal-forms/toolkit';

@Component({
  imports: [FormField, NgxSignalFormToolkit],
  template: `
    <form [formRoot]="form" ngxSignalForm errorStrategy="on-submit">
      <label for="email">Email</label>
      <input id="email" [formField]="form.email" />
      <button type="submit">Submit</button>
    </form>
  `,
})
export class ExampleComponent {
  protected readonly model = signal({ email: '' });
  protected readonly form = form(this.model, (path) => {
    required(path.email, { message: 'Email is required' });
  });
}
```

Next step by need:

- Ready-made field UI → [`/form-field`](./form-field/README.md)
- Standalone feedback UI → [`/assistive`](./assistive/README.md)
- Full custom markup → [`/headless`](./headless/README.md)

## Import

```typescript
// Bundle import (recommended) — includes FormRoot, NgxSignalForm,
// NgxSignalFormAutoAria, NgxSignalFormControlSemanticsDirective
import { NgxSignalFormToolkit } from '@ngx-signal-forms/toolkit';
```

<details>
<summary>Individual imports (advanced / selective usage)</summary>

```typescript
// Individual imports when needed
import {
  NgxSignalForm,
  NgxSignalFormAutoAria,
  NgxSignalFormControlSemanticsDirective,
  provideNgxSignalFormsConfig,
  provideErrorMessages,
  createShowErrorsComputed,
  focusFirstInvalid,
  createOnInvalidHandler,
  warningError,
  splitByKind,
} from '@ngx-signal-forms/toolkit';
```

</details>

> The directive class is `NgxSignalFormControlSemanticsDirective` — the only
> public class in v1 that keeps its `Directive` suffix, because the
> `NgxSignalFormControlSemantics` interface (in `core/types.ts`) already
> occupies the suffix-less name.

## Next step: submission + invalid-focus handling

After the [First 60 seconds (core)](#first-60-seconds-core) snippet works,
add submit handling and first-invalid focus:

```typescript
import { createOnInvalidHandler } from '@ngx-signal-forms/toolkit';

protected readonly form = form(
  this.model,
  (path) => {
    required(path.email, { message: 'Email is required' });
  },
  {
    submission: {
      action: async () => console.log('Submit:', this.model()),
      onInvalid: createOnInvalidHandler(),
    },
  },
);
```

```html
<form [formRoot]="form" ngxSignalForm errorStrategy="on-submit">
  <label for="email">Email</label>
  <input id="email" type="email" [formField]="form.email" />
  <button type="submit">Send</button>
</form>
```

## Core directives

### NgxSignalForm

Selector: `form[formRoot][ngxSignalForm]`

Enhances Angular's `FormRoot` with form-level context shared via DI:

- **Error strategy** (`errorStrategy` input) — `'immediate'`, `'on-touch'`, or `'on-submit'`
- **Submitted status** (`submittedStatus` signal) — `'unsubmitted' → 'submitting' → 'submitted'`
- **DI context** (`NGX_SIGNAL_FORM_CONTEXT`) — child components inherit strategy and status without prop drilling

Angular's `FormRoot` remains the owner of `novalidate`, `event.preventDefault()`, and `submit()`.

```html
<form [formRoot]="myForm" ngxSignalForm errorStrategy="on-submit">
  <button type="submit">Submit</button>
</form>
```

### NgxSignalFormAutoAria

Auto-applies to supported `[formField]` controls:

- `aria-invalid` (respects error strategy timing)
- `aria-required`
- `aria-describedby` (links to error/warning elements)

Covers native `<input>`, `<textarea>`, `<select>`, and custom `[formField]` hosts. Excludes `radio` and standard `checkbox` unless explicitly opted in. Checkbox-based switches (`role="switch"`) are included automatically.

- Disable per control with `ngxSignalFormAutoAriaDisabled`
- Use `ngxSignalFormControlAria="manual"` when a control already owns its ARIA attributes

### NgxSignalFormControlSemanticsDirective

Declares a control's family for wrapper layout and auto-ARIA classification.
The directive class keeps its `Directive` suffix to avoid colliding with the
`NgxSignalFormControlSemantics` interface in `core/types.ts`.

```html
<app-star-rating
  id="productRating"
  role="slider"
  ngxSignalFormControl="slider"
  ngxSignalFormControlAria="manual"
  [formField]="form.productRating"
/>
```

Built-in kinds: `input-like`, `standalone-field-like`, `switch`, `checkbox`, `radio-group`, `slider`, `composite`.

Field-shaped custom comboboxes infer `input-like` from `role="combobox"` with
an ID.
A closed custom select that should look like a text field also uses
`input-like` — there is no `select` kind. Keep that trigger naked so the
wrapper owns border, focus, invalid chrome, and the public input type
tokens (`--ngx-form-field-input-*`, outline aliases, placeholder color).
Widget-shaped controls stay `slider` or `composite` and usually use
`appearance="plain"`.

See [Custom Controls](https://github.com/ngx-signal-forms/ngx-signal-forms/blob/main/docs/CUSTOM_CONTROLS.md#field-shaped-vs-widget-shaped-custom-controls) for detailed guidance.

## Configuration

```typescript
provideNgxSignalFormsConfig({
  autoAria: true, // default
  defaultErrorStrategy: 'on-touch', // 'immediate' | 'on-touch' | 'on-submit'
  defaultWarningStrategy: 'on-touch', // 'immediate' | 'on-touch' | 'on-submit'
  defaultFormFieldAppearance: 'standard', // 'standard' | 'outline' | 'plain'
  defaultFormFieldOrientation: 'vertical', // 'vertical' | 'horizontal'
  showMarkerWhen: 'required', // 'required' | 'optional' | 'none'
  requiredMarker: ' *', // marker for required fields ('required' mode)
  optionalMarker: ' (optional)', // marker for optional fields ('optional' mode)
  requiredLegendText: '{marker} indicates a required field',
  optionalLegendText: 'All fields are required unless marked {marker}',
  requiredHintText: 'required', // visually-hidden required hint for role="group" clusters
});
```

This is the canonical list of configuration keys and their defaults.

### How settings resolve (the cascade)

Every presentation setting — error strategy, appearance, orientation, markers,
control presets, renderers — resolves through **one precedence chain, most
specific wins**:

```text
field / component input
  ?? form context (ngxSignalForm)
  ?? component-scoped provider (…ForComponent)
  ?? app-wide provider (provideNgxSignalForms…)
  ?? built-in default
```

See the
[root README](https://github.com/ngx-signal-forms/ngx-signal-forms#how-settings-resolve-the-cascade)
for the full walkthrough (per-tier details, nullish-merge semantics). Every
"you can override this" in the sections below is a link in this chain.

### Field marking

`showMarkerWhen` controls which fields carry a visual marker:

- `'required'` (default) — mark required fields with `requiredMarker`.
- `'optional'` — mark optional fields with `optionalMarker` (best when most
  fields are required; the GOV.UK / NN/g "mark the exception" guidance).
- `'none'` — mark nothing. Required state is still exposed via `aria-required`,
  so this remains accessible.

Markers render in every appearance (`standard`, `outline`, `plain`) and are
`aria-hidden` (decorative). Drop `NgxFormMarkingLegend` anywhere in a form to
explain the marker — it is mode-aware, reads its text from config (or a `[text]`
input), substitutes `{marker}`, and hides itself when the form has no field of
the relevant kind:

```html
<form [formRoot]="form" ngxSignalForm>
  <ngx-form-marking-legend />
  <!-- fields… -->
</form>
```

`NgxFormMarkingLegend` is available from `@ngx-signal-forms/toolkit/assistive`.

Per-field / per-legend overrides are available via the `showMarkerWhen`,
`requiredMarker`, and `optionalMarker` inputs on both
`<ngx-form-field-wrapper>` and `<ngx-form-marking-legend>`.

For component-scoped overrides: `provideNgxSignalFormsConfigForComponent()`.
This is the component-scoped tier of the
[cascade](#how-settings-resolve-the-cascade): the provider merges with parent
configuration property-by-property via `skipSelf` DI — child values win for
keys they set, and every other key is inherited from the nearest ancestor
`provideNgxSignalFormsConfig` call. The same inheritance contract applies to
`provideNgxSignalFormControlPresetsForComponent()`.

### Error messages

```typescript
provideErrorMessages({
  required: 'This field is required',
  email: 'Invalid email format',
  minLength: (params) => `Minimum ${params.minLength} characters`,
});
```

Priority: validator `error.message` → registry → default toolkit message.

The same resolution is available programmatically for custom error UIs:
`resolveValidationErrorMessage(error, registry?, options?)` runs the full
three-tier cascade, and `getDefaultValidationMessage(error, options?)` returns
just the built-in fallback text for a validator kind.

### Custom error / hint renderers

Swap the wrapper's error or hint UI for your own component app-wide or per
subtree — the wrapper renders it via the `NGX_FORM_FIELD_ERROR_RENDERER` /
`NGX_FORM_FIELD_HINT_RENDERER` tokens:

```typescript
import { provideFormFieldErrorRenderer } from '@ngx-signal-forms/toolkit';

// App-wide (environment scope)
provideFormFieldErrorRenderer({ component: MyErrorComponent });

// One component subtree — the cascade's component-scoped tier
provideFormFieldErrorRendererForComponent({ component: MyErrorComponent });
```

`provideFormFieldHintRenderer()` / `provideFormFieldHintRendererForComponent()`
work the same way for hints. The renderer contracts are the
`NgxFormFieldErrorRenderer` / `NgxFormFieldHintRenderer` types; see
[`CUSTOM_WRAPPERS.md`](https://github.com/ngx-signal-forms/ngx-signal-forms/blob/main/docs/CUSTOM_WRAPPERS.md)
for the full renderer contract and a worked example.

### Control presets

Global or feature-scoped defaults for control ARIA and layout:

```typescript
provideNgxSignalFormControlPresets({
  slider: { layout: 'custom', ariaMode: 'manual' },
  composite: { layout: 'custom' },
});
```

For component-scoped overrides: `provideNgxSignalFormControlPresetsForComponent()`.

#### Reading presets with `NgxControlPresetRegistry`

`NgxControlPresetRegistry` is an injectable read/merge surface over the
`NGX_SIGNAL_FORM_CONTROL_PRESETS` token. The token stays the source of truth,
so the registry observes whatever the **calling injector** resolves — including
component- and feature-scoped `provideNgxSignalFormControlPresetsForComponent()`
overrides.

`NgxControlPresetRegistry` is `providedIn: null`, so list it in the relevant
`providers` array (or environment injector) before injecting it — each provided
node then captures the presets effective at that node:

```typescript
@Component({
  // ...
  providers: [NgxControlPresetRegistry],
})
export class MyComponent {
  private readonly registry = inject(NgxControlPresetRegistry);
  // ...
}
```

```typescript
const registry = inject(NgxControlPresetRegistry);

registry.resolve('slider'); // → effective { layout, ariaMode } for 'slider'
registry.kinds(); // → readonly list of registered control kinds
```

Use `extend()` for a merge-not-replace layering: only the fields you pass are
overridden, every other kind (and untouched field) is preserved:

```typescript
const next = registry.extend({ slider: { layout: 'custom' } });
// next.slider.layout === 'custom'
// next.slider.ariaMode is unchanged; next.switch, next.composite, ... all stay default
```

#### Control semantics utilities

The functions behind kind resolution, for custom wrappers that need the same
answers as the built-in wrapper and auto-ARIA:

| Symbol                                                   | Description                                                                         |
| -------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| `inferNgxSignalFormControlKind(element)`                 | Heuristic kind from the DOM (`null` when no safe heuristic exists)                  |
| `readNgxSignalFormControlSemantics(element)`             | Read semantics explicitly declared on a host (`data-ngx-signal-form-control-*`)     |
| `resolveNgxSignalFormControlSemantics(el, p)`            | Full resolution — explicit → inferred → preset fallback — as used by wrapper + ARIA |
| `DEFAULT_NGX_SIGNAL_FORM_CONTROL_PRESETS`                | The built-in per-kind defaults (the cascade's last tier)                            |
| `isNgxSignalFormControlKind/Layout/AriaMode(v)`          | Runtime guards for validating kind/layout/aria values                               |
| `isFormFieldAppearance(v)` / `isFormFieldOrientation(v)` | Runtime guards for appearance/orientation config values                             |

### Field labels

Override how field paths appear in error summaries:

```typescript
provideFieldLabels({
  contactEmail: 'E-mailadres',
  'address.postalCode': 'Postcode',
});
```

Use a factory for dynamic resolvers (ngx-translate, Transloco, etc.). The
resolver it returns runs on every render, so a runtime language switch works
only if the resolver reads a reactive language signal — `$localize` is
build-time only and can't do this; see
[`WARNINGS_SUPPORT.md`](https://github.com/ngx-signal-forms/ngx-signal-forms/blob/main/docs/WARNINGS_SUPPORT.md#the-i18n-contract-string-vs-function-entries)
for the full contract:

```typescript
provideFieldLabels(() => {
  const translate = inject(TranslateService);
  const lang = toSignal(translate.onLangChange, { initialValue: null });
  return (fieldPath) => {
    lang(); // reactive dependency — re-renders on language switch
    return (
      translate.instant(`fields.${fieldPath}`) || humanizeFieldPath(fieldPath)
    );
  };
});
```

`humanizeFieldPath` is available from `@ngx-signal-forms/toolkit/headless`.

## Utilities

### Error visibility

| Function                                                     | Description                                                                                |
| ------------------------------------------------------------ | ------------------------------------------------------------------------------------------ |
| `createErrorVisibility(field, opts?)`                        | One call: `Signal<boolean>` with strategy + submitted status auto-read from the DI context |
| `createShowErrorsComputed(field, strategy, status?)`         | `Signal<boolean>` — whether errors should show now                                         |
| `shouldShowErrors(invalid, touched, strategy, status)`       | Pure boolean strategy helper — not reactive; use `createShowErrorsComputed` for a signal   |
| `shouldShowWarnings(hasWarnings, touched, strategy, status)` | Pure boolean warning-timing counterpart to `shouldShowErrors`                              |
| `combineShowErrors(signals)`                                 | Combines an array of visibility signals, e.g. `combineShowErrors([sigA, sigB])`            |
| `readDirectErrors(state)`                                    | Direct `errors()` of a field/group only — excludes nested-field errors                     |

### Strategy & context resolution

Building blocks for custom wrappers and headless UIs that want to join the
[cascade](#how-settings-resolve-the-cascade) exactly like the built-in surfaces:

| Function                                                                | Description                                                                                                                              |
| ----------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `resolveErrorDisplayStrategy(input, context?, configDefault?)`          | Pure resolution: input ?? context ?? config default ?? `'on-touch'`                                                                      |
| `resolveStrategyFromContext(input, formContext, configDefault?)`        | Resolved strategy value (call inside your own `computed()` for reactivity)                                                               |
| `resolveWarningStrategy(input, context?, configDefault?)`               | Warning-strategy counterpart to `resolveErrorDisplayStrategy` — warnings resolve through their own cascade, never `defaultErrorStrategy` |
| `resolveWarningStrategyFromContext(input, formContext, configDefault?)` | Reactive warning-strategy resolver (call inside your own `computed()`)                                                                   |
| `resolveSubmittedStatusFromContext(input, formContext)`                 | Same cascade for `SubmittedStatus`                                                                                                       |
| `injectFormContext()`                                                   | Get the `ngxSignalForm` context, or `undefined`                                                                                          |
| `injectFieldControl(element, injector?)`                                | Resolve the bound `FieldTree` for an element from the form context                                                                       |

### Focus management

| Function                           | Description                                         |
| ---------------------------------- | --------------------------------------------------- |
| `focusFirstInvalid(form)`          | Focus first invalid, interactive field              |
| `createOnInvalidHandler(options?)` | Creates `onInvalid` handler for `FormSubmitOptions` |

### Submission lifecycle

| Function                             | Description                                                   |
| ------------------------------------ | ------------------------------------------------------------- |
| `createSubmittedStatusTracker(form)` | Derives `unsubmitted/submitting/submitted` status             |
| `hasSubmitted(form)`                 | `Signal<boolean>` — whether at least one submission completed |

### Warning support

| Function                             | Description                                                                                                                                                                                                             |
| ------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `warningError(kind, message)`        | Creates a non-blocking warning                                                                                                                                                                                          |
| `isWarningError(error)`              | `true` if kind starts with `warn:`                                                                                                                                                                                      |
| `isBlockingError(error)`             | `true` if not a warning                                                                                                                                                                                                 |
| `splitByKind(errors)`                | Partition into `blocking` and `warnings`                                                                                                                                                                                |
| `hasOnlyWarnings(errors)`            | `true` when no blocking errors are present                                                                                                                                                                              |
| `getBlockingErrors(errors)`          | Filters out warning-only messages                                                                                                                                                                                       |
| `canSubmitWithWarnings(form)`        | Allows submission when only warnings remain, even while a validator is still pending                                                                                                                                    |
| `submitWithWarnings(form, callback)` | Delegates to Angular `submit()`; blocks only on settled blocking errors, not warnings or pending validators; returns `Promise<boolean>` (`true` once the callback has run and settled, `false` when refused or dropped) |

> Warning **display timing** is controlled separately from error timing via the
> `warningStrategy` input on `NgxFormFieldError` (default:
> `'on-touch'`). See
> [`WARNINGS_SUPPORT.md`](https://github.com/ngx-signal-forms/ngx-signal-forms/blob/main/docs/WARNINGS_SUPPORT.md#when-warnings-appear--warningstrategy)
> and the [assistive README](./assistive/README.md#ngxformfielderror)
> for usage.

### Field interactivity

| Function                              | Description                      |
| ------------------------------------- | -------------------------------- |
| `isFieldStateInteractive(fieldState)` | `false` when hidden or disabled  |
| `isFieldStateHidden(fieldState)`      | Narrow check for `hidden()` only |

### ARIA and identity

| Function                                                  | Description                                                                                                           |
| --------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `buildAriaDescribedBy(fieldName, options)`                | Assemble `aria-describedby` for manual ARIA controls                                                                  |
| `normalizeFieldName(value)`                               | Trim and null-collapse a candidate name into the v1 identity form                                                     |
| `resolveFieldName(element)`                               | Read a usable field name from an element's `id` (trimmed, with `element.id` fallback)                                 |
| `resolveFieldNameFromCandidates(...candidates)`           | Pick the first non-blank field name from a precedence chain (explicit → host id → context)                            |
| `generateErrorId(fieldName, kind?)`                       | Derive `{fieldName}-error` (container) or `{fieldName}-error-{kind}` (per-error) element id                           |
| `generateWarningId(fieldName)`                            | Derive the `{fieldName}-warning` element id used for `aria-describedby`                                               |
| `isElementCssVisible(element)`                            | CSS-visibility test via `Element.checkVisibility()`; reports `true` on runtimes without it                            |
| `createControlVisibilitySignal(resolveElement, injector)` | Reactive layout probe for `createAriaInvalidSignal`'s third argument; registers one `afterEveryRender` and fails open |

### Field identity service

`NgxFieldIdentity` is the element-scoped service that consolidates the three
load-bearing accessibility primitives every assistive/headless surface depends
on: **field-name resolution**, **control visibility**, and **stable error /
warning ID generation**. Both the canonical `ngx-form-field-wrapper` and any
third-party wrapper get one the same way — by composing
[`NgxFieldIdentityProvider`](../../docs/CUSTOM_WRAPPERS.md) as a host
directive.

Its channels publish **independently**. Merely providing an identity claims
nothing but the field name: hint ids and the error / warning display
strategies keep resolving through `NGX_SIGNAL_FORM_HINT_REGISTRY` and
`NGX_SIGNAL_FORM_FIELD_VISIBILITY_REGISTRY` until this service actually
publishes them (ADR-0010).

| Member                      | Description                                                                                                                 |
| --------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `fieldName()`               | Resolved field name (explicit → bound-control `id` → `null`; the label `for=` tier is opt-in via `createFieldNameResolver`) |
| `controlId()`               | The bound control element's `id` attribute, or `null`                                                                       |
| `errorId()`                 | Stable `{fieldName}-error` id, or `null` when no name is resolved                                                           |
| `warningId()`               | Stable `{fieldName}-warning` id, or `null` when no name is resolved                                                         |
| `hintIds()`                 | Hint ids for this field, or `null` when the hint channel was never published (consumers fall back to the hint registry)     |
| `describedBy()`             | Aggregated `aria-describedby` chain from `hintIds()`, or `null`                                                             |
| `isControlVisible()`        | Callable signal: no-arg returns the cached, reactive visibility flag                                                        |
| `isControlVisible(element)` | Same member with an element argument: ad-hoc, non-reactive `isElementCssVisible(element)` probe                             |
| `resolveControlElement()`   | The currently bound control element, or `null`                                                                              |

Name resolution comes in two interchangeable shapes that produce **identical**
names:

- The service's internal resolution (driven by the wrapper) follows
  explicit → bound-control `id` — no label tier.
- `createFieldNameResolver({ explicit, labelFor?, boundControl, wrapperName })`
  exposes the same cascade for custom wrappers, with the label `for=` tier as
  an **opt-in** middle step. Omit `labelFor` and the two paths emit the same
  name byte-for-byte.

The `set*` writer methods are tagged `@internal`: a wrapper **drives** the
identity — through `NgxFieldIdentityProvider` for the field name, and directly
in-package for the rest — and consumers **read** the resolved signals. A
post-build step
(`scripts/strip-internal-members.mjs`) removes `@internal`-tagged class
members from the published `.d.ts`, so the writers do not appear there — this
is a compile-time barrier, not just a naming convention. (`tsconfig.lib.json`
does not enable TypeScript's own `stripInternal`: that flag breaks
ng-packagr's multi-entry-point `.d.ts` bundling for this package, dropping
unrelated public symbols along with the tagged ones — see #289.)

Building a wrapper of your own? Don't reach for the writers. Compose
`NgxFieldIdentityProvider` when your field's name is not the bound control's
`id`, and compose the pure ARIA factories (`createAriaDescribedBySignal`,
`createAriaInvalidSignal`, …) for the rest. Those are the supported seams, and
they are what [`CUSTOM_WRAPPERS.md`](../../docs/CUSTOM_WRAPPERS.md)
documents — the built-in wrapper runs on the same ones.

```typescript
@Component({
  selector: 'my-field',
  hostDirectives: [
    { directive: NgxFieldIdentityProvider, inputs: ['fieldName'] },
  ],
})
export class MyField {}
```

#### Custom control example

A custom control placed inside `ngx-form-field-wrapper` injects the
wrapper-provided `NgxFieldIdentity` and **reads** the resolved identity it
publishes — the resolved name, the stable error / warning ids, and the
aggregated `aria-describedby` chain — so the control stays in lockstep with
every other toolkit surface without re-deriving any of the rules:

```typescript
import { Component, ElementRef, inject } from '@angular/core';
import {
  NgxFieldIdentity,
  isElementCssVisible,
} from '@ngx-signal-forms/toolkit';

@Component({
  selector: 'my-rating-control',
  template: `
    <div role="radiogroup" [attr.aria-describedby]="identity.describedBy()">
      <!-- rating widget -->
    </div>
    @if (identity.errorId(); as errorId) {
      <div [id]="errorId"><!-- error message --></div>
    }
  `,
})
export class MyRatingControl {
  // Injected from the surrounding `ngx-form-field-wrapper`, which drives it.
  protected readonly identity = inject(NgxFieldIdentity);
  readonly #host = inject<ElementRef<HTMLElement>>(ElementRef);

  protected describedBy(): string | null {
    return this.identity.describedBy();
  }

  // Read the cached, reactive visibility flag the wrapper maintains…
  protected isLaidOut(): boolean {
    return this.identity.isControlVisible();
  }

  // …or run the wrapper's exact CSS-visibility test against an arbitrary
  // element ad hoc, via the public `isElementCssVisible` helper.
  protected isElementLaidOut(): boolean {
    const el = this.#host.nativeElement.querySelector('input');
    return el ? isElementCssVisible(el) : true;
  }
}
```

`identity.errorId()` / `identity.warningId()` yield stable
`{name}-error` / `{name}-warning` ids the control wires into its error and
warning elements, matching every other toolkit surface.

### Other

| Function                                         | Description                                          |
| ------------------------------------------------ | ---------------------------------------------------- |
| `unwrapValue(signalOrValue)`                     | Extract value from `Signal` or static                |
| `updateAt(array, index, updater)`                | Immutable array item update                          |
| `updateNested(array, index, key, nestedIdx, fn)` | Immutable nested array update                        |
| `createUniqueId(prefix)`                         | Stable, monotonic DOM id (`prefix-1`, `prefix-2`, …) |

## Accessibility testing harness

`@ngx-signal-forms/toolkit/testing` asserts that a rendered fixture has no
WCAG 2.2 AA axe-core violations. It's a **hard fail** by design — toolkit
components are published primitives, so accessibility regressions in them are
bugs, not baseline drift to track.

```typescript
import { expectNoA11yViolations } from '@ngx-signal-forms/toolkit/testing';

// Inside a Vitest browser-mode spec, after rendering a fixture:
await expectNoA11yViolations();
```

| Export                                       | Description                                                                                                        |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `expectNoA11yViolations(context?, options?)` | Runs axe against `context` (default: `document.body`) and throws on any WCAG 2.2 AA violation                      |
| `WCAG_22_AA_TAGS`                            | The axe tag set (`wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa`, `wcag22aa`) that adds up to full WCAG 2.2 AA coverage |

This entry point requires `axe-core` (an optional peer dependency — install it
yourself, e.g. `npm i -D axe-core`). Note that axe-core has no automated rules
for the two WCAG 2.2 Level A criteria (Consistent Help, Redundant Entry); like
the rest of WCAG 2.2 AA automated coverage, those must be verified manually.

## Advanced: public DI tokens

These tokens are the integration points for custom wrappers and renderers.
Most apps never touch them — they're what the `provide*` functions above write
and what the toolkit's surfaces read. Documented in depth in
[`CUSTOM_WRAPPERS.md`](https://github.com/ngx-signal-forms/ngx-signal-forms/blob/main/docs/CUSTOM_WRAPPERS.md).

| Token                             | Carries                                                                                          |
| --------------------------------- | ------------------------------------------------------------------------------------------------ |
| `NGX_SIGNAL_FORMS_CONFIG`         | Resolved app/component config (`NgxSignalFormsConfig`; user input is `NgxSignalFormsUserConfig`) |
| `NGX_SIGNAL_FORM_CONTEXT`         | Form-level strategy + submitted status (provided by `ngxSignalForm`)                             |
| `NGX_SIGNAL_FORM_FIELD_CONTEXT`   | Per-field identity a wrapper provides to its projected content                                   |
| `NGX_SIGNAL_FORM_HINT_REGISTRY`   | Hint-id registration so auto-ARIA can compose `aria-describedby`                                 |
| `NGX_SIGNAL_FORM_ARIA_MODE`       | Resolved ARIA ownership (`auto`/`manual`) — decouples semantics from auto-ARIA                   |
| `NGX_SIGNAL_FORM_CONTROL_PRESETS` | Effective control presets (read via `NgxControlPresetRegistry`)                                  |
| `NGX_FORM_FIELD_ERROR_RENDERER`   | Error-renderer override (see [Custom error / hint renderers](#custom-error--hint-renderers))     |
| `NGX_FORM_FIELD_HINT_RENDERER`    | Hint-renderer override                                                                           |

Each documented function and token also exports its companion option/state
types from the package root (`CreateErrorVisibilityOptions`,
`OnInvalidHandlerOptions`, `SplitErrors`, `NgxSignalFormControlPresetOverrides`,
`NgxFormFieldErrorRendererOverride`, …) — the root `index.ts` is the
authoritative enumeration of the public surface.

## Related documentation

- [Root README](https://github.com/ngx-signal-forms/ngx-signal-forms#readme) — overview, installation, quick start
- [Form field wrapper](./form-field/README.md) — pre-styled wrapper component
- [Assistive components](./assistive/README.md) — standalone error, grouped panel feedback, hint, counter, and summary components
- [Headless primitives](./headless/README.md) — renderless directives for custom UI
- [Vest integration](./vest/README.md) — Vest adapter
- [Accessibility testing harness](#accessibility-testing-harness) — WCAG 2.2 AA axe-core assertions
- [Theming guide](./form-field/THEMING.md) — CSS custom properties
- [Custom controls](https://github.com/ngx-signal-forms/ngx-signal-forms/blob/main/docs/CUSTOM_CONTROLS.md) — field-shaped combobox/select (wrapper owns the shell) and widget-shaped sliders, date pickers, and third-party adapters
- [Warnings support](https://github.com/ngx-signal-forms/ngx-signal-forms/blob/main/docs/WARNINGS_SUPPORT.md) — warning convention and flow
