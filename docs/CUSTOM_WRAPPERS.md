# Authoring a custom form-field wrapper

This guide is for authors building a third-party form-field wrapper —
a Material variant, a PrimeNG variant, or a fully custom in-house wrapper —
that needs to participate in the toolkit's accessibility and rendering
pipeline as a first-class citizen.

A wrapper that satisfies the four contracts below gets:

- automatic `aria-invalid`, `aria-required`, and `aria-describedby` on the
  bound control via `NgxSignalFormAutoAria`
- automatic chaining of projected `<ngx-form-field-hint>` IDs into
  `aria-describedby`
- swappable error renderers without forking the wrapper, plus optional hint
  renderer symmetry for wrappers that render hints through an outlet

## The four contracts

A wrapper component must satisfy these four DI seams. The first two are
**provided** at the wrapper's component level, the third is **consumed**
(with a fallback), and the fourth is about keeping the ARIA directive in
scope wherever the bound control is declared.

### 1. `NGX_SIGNAL_FORM_FIELD_CONTEXT`

Provide an `NgxSignalFormFieldContext` whose `fieldName` signal yields the
wrapper's resolved field name (or `null` while it isn't yet known).
`NgxFormFieldHint` reads this token via `inject(..., { optional: true })` to
self-correlate with the surrounding field. Without it, projected hints have
no field name and the hint registry can't include them in
`aria-describedby`.

### 2. `NGX_SIGNAL_FORM_HINT_REGISTRY`

Provide an `NgxSignalFormHintRegistry` whose `hints` signal yields a
`readonly NgxSignalFormHintDescriptor[]` (each `{ id, fieldName }`).
`NgxSignalFormAutoAria` reads this registry instead of querying the DOM,
so hint IDs flow into `aria-describedby` purely through DI. The descriptor
shape is the public wire format — see `NgxSignalFormHintDescriptor` in
`@ngx-signal-forms/toolkit/core`.

### 3. `NGX_FORM_FIELD_ERROR_RENDERER` (and optionally `NGX_FORM_FIELD_HINT_RENDERER`)

Inject the renderer token with `{ optional: true }`, fall back to
`NgxFormFieldError` (or `NgxFormFieldHint`) when it returns `null`, and
instantiate the resolved component via `*ngComponentOutlet`. This is the
seam that lets consumers swap a Material-styled error component into your
wrapper without forking it. The token JSDoc spells out the contract:
the wrapper owns the default fallback; consumers override via the
provider helpers documented below.

### 4. `NgxSignalFormAutoAria`

`NgxSignalFormAutoAria` must be in scope in the template that declares the
`[formField]` control. If your wrapper renders that control in its own
template, import the directive in the wrapper's `imports` array. If your
wrapper accepts a projected control, the consumer must import
`NgxSignalFormAutoAria` (or a bundle export that includes it), because
Angular resolves directives on projected nodes in the declaring template.

Wherever the directive is imported, it reads the two tokens above and writes
the managed ARIA attributes to the bound control. The wrapper itself never
touches `aria-invalid`, `aria-required`, or `aria-describedby` directly —
providing the two tokens is what lets the directive do that job correctly.

## Minimal working example

A wrapper component that satisfies all four contracts. Pattern after
`NgxFormFieldWrapper` in `packages/toolkit/form-field/form-field-wrapper.ts`;
this example trims everything that isn't a contract obligation.

```typescript
import { NgComponentOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChildren,
  inject,
  input,
  type Type,
} from '@angular/core';
import type { FieldTree } from '@angular/forms/signals';
import {
  NGX_FORM_FIELD_ERROR_RENDERER,
  NGX_SIGNAL_FORM_FIELD_CONTEXT,
  NGX_SIGNAL_FORM_HINT_REGISTRY,
  type NgxSignalFormHintDescriptor,
} from '@ngx-signal-forms/toolkit';
import {
  NgxFormFieldError,
  NgxFormFieldHint,
} from '@ngx-signal-forms/toolkit/assistive';

@Component({
  selector: 'my-form-field',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgComponentOutlet, NgxFormFieldHint],
  providers: [
    {
      provide: NGX_SIGNAL_FORM_FIELD_CONTEXT,
      useFactory: () => {
        const wrapper = inject(MyFormField);
        return { fieldName: wrapper.resolvedFieldName };
      },
    },
    {
      provide: NGX_SIGNAL_FORM_HINT_REGISTRY,
      useFactory: () => {
        const wrapper = inject(MyFormField);
        return { hints: wrapper.hintDescriptors };
      },
    },
  ],
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
  readonly formField = input.required<FieldTree<TValue>>();
  readonly fieldName = input<string>();

  readonly resolvedFieldName = computed<string | null>(
    () => this.fieldName() ?? null,
  );

  protected readonly hintChildren = contentChildren(NgxFormFieldHint, {
    descendants: true,
  });

  readonly hintDescriptors = computed<readonly NgxSignalFormHintDescriptor[]>(
    () =>
      this.hintChildren().map((hint) => ({
        id: hint.resolvedId(),
        fieldName: hint.resolvedFieldName(),
      })),
  );

  readonly #errorRenderer = inject(NGX_FORM_FIELD_ERROR_RENDERER, {
    optional: true,
  });

  protected readonly errorComponent = computed<Type<unknown>>(
    () => this.#errorRenderer?.component ?? NgxFormFieldError,
  );

  protected readonly errorInputs = computed<Record<string, unknown>>(() => ({
    formField: this.formField(),
    // production: resolve from injected form context — see NgxFormFieldWrapper
    strategy: null,
    submittedStatus: 'unsubmitted',
  }));
}
```

Because the control is projected via `<ng-content />`, the consumer that
declares `<input [formField]="...">` must import `NgxSignalFormAutoAria`
(or a bundle export such as `NgxFormField` that already includes it).
Wrapper-level imports only apply when the wrapper owns the control element in
its own template.

A production wrapper will resolve `fieldName` from the bound control's `id`
attribute, propagate `strategy` and `submittedStatus` from the form context,
and gate rendering on `shouldShowErrors()` — `NgxFormFieldWrapper` is the
canonical reference. The example above only demonstrates the four seams.

## Customising the renderer

Consumers of your wrapper override the error and hint renderers via the
`provideFormFieldErrorRenderer` family. Two scopes are supported.

### Per app (environment scope)

```typescript
import { provideFormFieldErrorRenderer } from '@ngx-signal-forms/toolkit';

bootstrapApplication(AppComponent, {
  providers: [provideFormFieldErrorRenderer({ component: MaterialError })],
});
```

`provideFormFieldErrorRenderer` returns `EnvironmentProviders`, so it lives
alongside other app-config providers. The matching helper for hints is
`provideFormFieldHintRenderer`.

### Per component (component scope)

```typescript
@Component({
  selector: 'checkout-form',
  providers: [
    provideFormFieldErrorRendererForComponent({ component: BrandedError }),
  ],
  // ...
})
export class CheckoutForm {}
```

Component-scoped overrides return a `Provider[]` and inherit from the
nearest parent provider via `skipSelf` lookup, so passing `{}` deliberately
inherits without setting a new component. The matching helper for hints is
`provideFormFieldHintRendererForComponent`.

## The renderer interface

A custom renderer is a component referenced through
`{ component: Type<unknown> }`. The wrapper instantiates it with
`*ngComponentOutlet` and binds inputs depending on the call site:

- `NgxFormFieldWrapper` (and any wrapper following this guide) binds
  `{ formField, strategy, submittedStatus }`.
- `NgxFormFieldset` binds
  `{ errors, fieldName, strategy, submittedStatus, listStyle }`.

Inputs the renderer doesn't declare are dropped silently by
`*ngComponentOutlet`; extra inputs the renderer declares are unaffected.
A renderer that targets both call sites must accept the union (or declare a
generic `inputs` signature).

## Checklist before shipping

- [ ] Wrapper provides `NGX_SIGNAL_FORM_FIELD_CONTEXT` with a `fieldName`
      signal that yields the resolved field name (or `null`).
- [ ] Wrapper provides `NGX_SIGNAL_FORM_HINT_REGISTRY` with a `hints`
      signal derived from projected `NgxFormFieldHint` children.
- [ ] `NgxSignalFormAutoAria` is in scope where the `[formField]` control is
      declared — in the wrapper if it renders the control, or in the consumer
      if the control is projected.
- [ ] Wrapper injects `NGX_FORM_FIELD_ERROR_RENDERER` with
      `{ optional: true }`, falls back to `NgxFormFieldError`, and renders
      the resolved component via `*ngComponentOutlet`.
- [ ] The computed feeding `*ngComponentOutlet` inputs binds
      `{ formField, strategy, submittedStatus }` so any compliant renderer works.
- [ ] Wrapper does **not** write `aria-invalid`, `aria-required`, or
      `aria-describedby` on its host element — those belong on the bound
      control and are owned by `NgxSignalFormAutoAria`.
- [ ] Optional: provide `NGX_FORM_FIELD_HINT_RENDERER` symmetry if your
      wrapper's hint slot uses an outlet rather than projected
      `<ng-content>`. (The first-party wrapper currently projects content
      directly; the token is reserved for future parity.)
