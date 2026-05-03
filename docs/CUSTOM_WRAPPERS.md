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
`@ngx-signal-forms/toolkit`.

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

The same projection rule applies to `NgxFormFieldHint`. Importing it in the
wrapper's `imports` array enables the wrapper's own `contentChildren` query
(it can find projected hint instances), but it does **not** make the
`<ngx-form-field-hint>` element selector available inside consumer templates.
Consumers authoring `<ngx-form-field-hint>...</ngx-form-field-hint>` between
the wrapper's tags must import `NgxFormFieldHint` themselves (or a bundle
export that re-exports it from `@ngx-signal-forms/toolkit/assistive`).

A production wrapper will resolve `fieldName` from the bound control's `id`
attribute, propagate `strategy` and `submittedStatus` from the form context,
and gate rendering on `shouldShowErrors()` — `NgxFormFieldWrapper` is the
canonical reference. The example above only demonstrates the four seams.

If your wrapper or design-system shell needs to write ARIA attributes itself
— for instance, because Material's `mat-form-field` already owns
`aria-describedby` on the bound control and inheriting `NgxSignalFormAutoAria`
would fight it — see [Composing ARIA primitives](#composing-aria-primitives)
below. The four pure-signal factories let you reuse the toolkit's
`aria-invalid` / `aria-required` / `aria-describedby` resolution without
inheriting the directive shell.

## Composing ARIA primitives

The default story for "the toolkit owns ARIA on this control" is
[`NgxSignalFormAutoAria`](#4-ngxsignalformautoaria) — drop the directive into
scope and the three managed ARIA attributes flow into the control automatically.
That's the right answer for 95 % of wrappers, including the canonical
`NgxFormFieldWrapper`.

It's the wrong answer when your wrapper has to compose ARIA on top of an
existing host that already has opinions: Material's `mat-form-field`,
PrimeNG's `p-iconfield`, Spartan's form-control wrapper, or any in-house
design-system shell that already resolves `aria-describedby` from its own
hint slot. Inheriting `NgxSignalFormAutoAria` couples you to the toolkit's
`[formField]` selector matrix and its `afterEveryRender` DOM read/write loop,
and re-implementing `aria-describedby` ID composition by hand signs you up
for breaking changes whenever the toolkit's ID-generation contract or
visibility cascade evolves.

The four ARIA computeds that `NgxSignalFormAutoAria` uses internally are also
exported from `@ngx-signal-forms/toolkit/headless` as **pure signal
factories**. You compose them directly inside your own directive, thread the
visibility cascade through with `createErrorVisibility`, and own the
`afterEveryRender` phasing yourself.

The four factories are:

| Factory                       | Returns                             | Purpose                                                                 |
| ----------------------------- | ----------------------------------- | ----------------------------------------------------------------------- |
| `createHintIdsSignal`         | `Signal<readonly string[]>`         | Resolves the hint-ID list (registry-filtered or identity-passthrough).  |
| `createAriaInvalidSignal`     | `Signal<'true' \| 'false' \| null>` | Resolves `aria-invalid` from `errors()` and the visibility cascade.     |
| `createAriaRequiredSignal`    | `Signal<'true' \| null>`            | Resolves `aria-required` from `required()`.                             |
| `createAriaDescribedBySignal` | `Signal<string \| null>`            | Composes preserved + hint + error/warning IDs into one attribute value. |

All four are unconditional pure functions — they take signal inputs and
return computed signals. None of them read DOM, none of them call `inject()`,
and none of them know about manual-mode opt-out. That's deliberate: the
manual-mode escape hatch lives in the directive shell that wires the
factories, not in the factories themselves. (See
[ADR-0002](decisions/0002-aria-primitives-as-factories.md) for the rationale.)

### Worked example

A custom directive that wires all four factories plus the visibility cascade
on a `[formField]` host. Pattern after
`packages/toolkit/core/directives/auto-aria.ts` — this example trims the
manual-mode opt-out and some of the production-only wrapper wiring, while
keeping the hint-registry integration needed to compose projected hint IDs.

```typescript
import {
  Directive,
  ElementRef,
  Injector,
  afterEveryRender,
  computed,
  inject,
  signal,
} from '@angular/core';
import { FORM_FIELD, type FieldState } from '@angular/forms/signals';
import {
  NGX_SIGNAL_FORM_HINT_REGISTRY,
  createErrorVisibility,
  generateErrorId,
  generateWarningId,
  resolveFieldName,
} from '@ngx-signal-forms/toolkit';
import {
  createAriaDescribedBySignal,
  createAriaInvalidSignal,
  createAriaRequiredSignal,
  createHintIdsSignal,
  type HintIdsRegistryLike,
} from '@ngx-signal-forms/toolkit/headless';

interface MyAriaDomSnapshot {
  readonly fieldName: string | null;
  readonly describedBy: string | null;
}

const INITIAL_DOM_SNAPSHOT: MyAriaDomSnapshot = {
  fieldName: null,
  describedBy: null,
};

@Directive({
  // Apply alongside (or in place of) NgxSignalFormAutoAria — your shell, your
  // selector. This consumer host explicitly does NOT inherit
  // NgxSignalFormAutoAria.
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

  // 1. Resolve the bound `FieldState` reactively. The double-read mirrors
  //    `NgxSignalFormAutoAria`: `field()` is an `InputSignal<Field<T>>` that
  //    can be `undefined` on first read, in which case `state()` is the
  //    fallback that lets sibling directives keep working during that window.
  readonly #fieldState = computed<FieldState<unknown> | null>(() => {
    const field = this.#formField.field();
    const state =
      typeof field === 'function' ? field() : this.#formField.state();
    return state ?? null;
  });

  // 2. DOM snapshot — populated by the `earlyRead` callback below. Holds the
  //    resolved field name and any pre-existing aria-describedby IDs the
  //    factory should preserve.
  readonly #domSnapshot = signal(INITIAL_DOM_SNAPSHOT);

  // 3. Visibility cascade. `createErrorVisibility` consumes the nearest
  //    `[ngxSignalForm]` context via DI, so strategy + submittedStatus flow
  //    through automatically. Pass an explicit `{ strategy, submittedStatus }`
  //    options bag if you want to override.
  readonly #visibility = createErrorVisibility(this.#fieldState);

  // 4. Compose the four ARIA factories. Each takes signals + readers and
  //    returns a computed.
  readonly #hintIds = createHintIdsSignal({
    registry: this.#hintRegistry,
    fieldName: () => this.#domSnapshot().fieldName,
  });

  readonly #ariaInvalid = createAriaInvalidSignal(
    this.#fieldState,
    this.#visibility,
  );

  readonly #ariaRequired = createAriaRequiredSignal(this.#fieldState);

  readonly #ariaDescribedBy = createAriaDescribedBySignal({
    fieldState: this.#fieldState,
    hintIds: this.#hintIds,
    visibility: this.#visibility,
    preservedIds: () => this.#domSnapshot().describedBy,
    fieldName: () => this.#domSnapshot().fieldName,
  });

  constructor() {
    // 5. afterEveryRender phasing. Reads happen in `earlyRead` (before any
    //    writes in the same frame), writes in `write`. This avoids layout
    //    thrashing — never mix `read` and `write` work in the same callback.
    afterEveryRender(
      {
        earlyRead: () => this.#readDomSnapshot(),
        write: (snapshot) => {
          // Commit the snapshot read in `earlyRead`. Doing it here (not in
          // `earlyRead`) keeps the write phase the single mutation point.
          if (
            snapshot.fieldName !== this.#domSnapshot().fieldName ||
            snapshot.describedBy !== this.#domSnapshot().describedBy
          ) {
            this.#domSnapshot.set(snapshot);
          }

          this.#writeAttribute('aria-invalid', this.#ariaInvalid());
          this.#writeAttribute('aria-required', this.#ariaRequired());
          this.#writeAttribute('aria-describedby', this.#ariaDescribedBy());
        },
      },
      { injector: this.#injector },
    );
  }

  #readDomSnapshot(): MyAriaDomSnapshot {
    const el = this.#element.nativeElement;
    const fieldName = resolveFieldName(el);
    const raw = el.getAttribute('aria-describedby');

    // Filter out IDs this factory will manage on the next write so they don't
    // get re-counted as "preserved". A production directive caches the managed
    // ID set in a signal; this example recomputes inline for clarity.
    if (!raw || !fieldName) {
      return { fieldName, describedBy: raw };
    }

    const managed = new Set<string>([
      ...this.#hintIds(),
      generateErrorId(fieldName),
      generateWarningId(fieldName),
    ]);
    const preserved = raw
      .split(' ')
      .filter((part) => part && !managed.has(part))
      .join(' ');

    return {
      fieldName,
      describedBy: preserved.length > 0 ? preserved : null,
    };
  }

  #writeAttribute(name: string, value: string | null): void {
    if (value === null) {
      this.#element.nativeElement.removeAttribute(name);
    } else {
      this.#element.nativeElement.setAttribute(name, value);
    }
  }
}
```

A few things to call out:

1. **The directive selector includes `[formField]`** so DI lookup of
   `FORM_FIELD` is guaranteed. Whether you also include `[myDesignSystemAria]`,
   a CSS-class selector, or a wildcard mirroring `NgxSignalFormAutoAria`'s
   selector matrix is a design choice — the toolkit's selector targets every
   `[formField]` host that isn't opted out; your wrapper may be narrower.
2. **`createErrorVisibility` is the recommended visibility wiring.** It reads
   the nearest `[ngxSignalForm]` context from DI, which means the same
   `errorDisplayStrategy` + `submittedStatus` cascade the rest of the toolkit
   uses applies here without you having to thread it through. Pass
   `{ strategy: 'immediate' }` (or a `Signal<ErrorDisplayStrategy>`) to
   override.
3. **Hint composition is registry-driven.** Pass the optional
   `NGX_SIGNAL_FORM_HINT_REGISTRY` token in via `createHintIdsSignal`'s
   `registry` option and the factory filters by the current field name for
   you. The structural type `HintIdsRegistryLike` is a public option type, so
   you can type-check the binding without crossing into `@internal` territory.
4. **Phasing matters.** `earlyRead` runs before any `write` in the same
   render cycle, so DOM reads (the field name from the element's `id`,
   pre-existing `aria-describedby` IDs to preserve) never race with the
   attribute writes that follow. Mixing reads and writes in the same callback
   triggers layout thrash on every change-detection cycle.
5. **`isControlVisible` is optional.** `createAriaInvalidSignal` accepts an
   optional third argument — a `Signal<boolean>` that suppresses
   `aria-invalid` when the host is collapsed (e.g. inside a closed
   `<details>`). `NgxSignalFormAutoAria` wires this from `NgxFieldIdentity`'s
   shared visibility flag; consumers can pass any `Signal<boolean>` they
   already maintain.
6. **The consumer never inherits `NgxSignalFormAutoAria`.** That's the whole
   point — your directive owns the host, owns the writes, and owns the
   render phasing. The factories are reactive transforms over `FieldState`,
   nothing else.

### Reusing only some of the factories

Each factory is independently usable. Common partial compositions:

- **Material wrapper that owns `aria-describedby` from its own hint slot**:
  use `createAriaInvalidSignal` and `createAriaRequiredSignal` only; let
  Material handle `aria-describedby`.
- **PrimeNG `p-iconfield` host**: skip `createAriaRequiredSignal` (PrimeNG
  drives `aria-required` from its own input contract) and compose only the
  invalid + describedBy pair.
- **Headless wrapper with no hints**: drop `createHintIdsSignal` and pass a
  `signal<readonly string[]>([])` (or omit the option entirely; the factory
  returns an empty list when neither identity nor registry is supplied) into
  `createAriaDescribedBySignal`.

The contract each factory advertises is `fieldState in → ARIA out`. Pick the
ones you need.

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
      if the control is projected. (If your wrapper composes the four ARIA
      factories instead of inheriting the directive, see
      [Composing ARIA primitives](#composing-aria-primitives) — that flow
      replaces this checklist item.)
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

## Common pitfalls

### Alias your `formField` input to avoid double-binding

If your wrapper accepts the bound field as a component or directive
input named `formField`, the consumer template binding
`<my-wrapper [formField]="form.x">` will **also** match Angular Signal
Forms' `FormField` directive (selector `[formField]`) when the consumer
imports it into the same template. Both directives bind, both register
themselves as `FORM_FIELD` / `NgControl` providers at the wrapper's
host element, and you have a soundness landmine — even if observable
behaviour stays correct today.

The fix is to alias your input and put the alias in the selector so the
consumer never writes `[formField]` on the wrapper element:

```ts
@Component({
  selector: 'my-wrapper[ngxMyWrapperField]', // alias in the selector
  // ...
})
export class MyWrapper<TValue = unknown> {
  readonly formField = input.required<FieldTree<TValue>>({
    alias: 'ngxMyWrapperField', // alias on the input
  });
}
```

Consumer template:

```html
<my-wrapper [ngxMyWrapperField]="form.x">
  <input [formField]="form.x" id="x" />
</my-wrapper>
```

`FormField` no longer matches the wrapper element; only the inner
`<input>` carries the toolkit's `FormField` directive, and the wrapper
gets its bound field through the aliased input. The first-party
`NgxFormFieldWrapper` accepts `[formField]` directly because it lives
in the same package as `FormField` and accepts the double-bind risk for
backward compatibility — your wrapper does not have that constraint and
should alias.

### Use the toolkit's wrapper helpers instead of reinventing them

The `@ngx-signal-forms/toolkit/headless` entry point exposes four
helpers for the boilerplate every form-field wrapper otherwise
reimplements:

- `createFieldNameResolver({ explicit, labelFor?, boundControl, wrapperName })` —
  the priority cascade `explicit → labelFor → boundControl.id → null +
dev warning`.
- `toHintDescriptors(hints)` — maps `Signal<readonly NgxFormFieldHint[]>`
  to the registry wire format.
- `createErrorRendererInputs({ formField, strategy, submittedStatus })` —
  builds the `*ngComponentOutlet` `inputs:` map with a typed
  `NgxFormFieldErrorRendererInputs<TValue>` payload.
- `createAriaDescribedByBridge({ toolkit })` — for design systems that
  own `aria-describedby` via an injectable a11y service (Spartan brain's
  `BrnFieldA11yService`, or any equivalent), exposes a structurally
  matching `AriaDescribedByBridge` whose `describedBy` signal merges
  the toolkit composition with `register*` IDs. Provide it via
  `useFactory`/`useClass` at the wrapper's component-level injector.

These keep every reference wrapper on a single canonical primitive so a
behaviour change in one place takes effect everywhere — and they give
new wrappers a consistent look so consumers reading any reference
recognise the shape.
