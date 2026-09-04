# @ngx-signal-forms/toolkit/vest

> Optional adapter for using [Vest](https://vestjs.dev/) business-rule validation with Angular Signal Forms and the toolkit's warning support.

## Why this entry point exists

Angular Signal Forms already supports Standard Schema validators through `validateStandardSchema()`, and Vest 6 suites implement Standard Schema. This entry point adds a toolkit-branded adapter that maps Vest's richer suite results — including `warn()` guidance — into toolkit-native warning messages.

Use it **together with** Angular validators and Standard Schema tools like Zod, not instead of them.

### Native `validateStandardSchema()` vs. the toolkit adapter

Because Vest 6 suites are Standard Schema, you may not need this entry point at all. Reach for the smallest tool that covers your case:

**Use native `validateStandardSchema(path, suite)`** (zero toolkit code) when you only need **blocking** validation. This works for any Standard-Schema library (Zod, Valibot, ArkType) and for a plain Vest 6 suite alike:

```typescript
import { form, validateStandardSchema } from '@angular/forms/signals';

const signupForm = form(model, (path) => {
  // A Vest 6 suite is a Standard Schema — pass it directly.
  validateStandardSchema(path, signupSuite);
});
```

**Use the toolkit's `validateVest` / `validateVestWarnings`** when you need something the Standard Schema interface cannot express:

- **`warn:*` warning severity** — Standard Schema only models blocking issues; it has no `warn()` / severity concept. Surfacing Vest `warn()` output as toolkit warnings is the primary reason this bridge exists.
- **`only()` focused runs** — thread the changed field into the suite (the adapter prefers the canonical `suite.only(field).run(value)` form, falling back to `suite.run(value, field)`) so large suites validate one field at a time instead of re-running every test.
- **`resetOnDestroy` lifecycle** — call `suite.reset()` when the hosting injection context tears down, so module-scope suite state does not leak across mounts.

The adapter reads Vest's full `run()` result, mapping blocking errors **and** `warn()` output in a single pass — so enabling warnings never costs a second suite run.

## Installation

Vest is an optional peer dependency (`>=6.0.0 <7.0.0`). Install it only when using this entry point.

```bash
pnpm add @ngx-signal-forms/toolkit vest
```

> **Vest v6+ required.** Standard Schema support was introduced in Vest 6.

If you are migrating from `ngx-vest-forms`, see [`docs/MIGRATING_FROM_NGX_VEST_FORMS.md`](https://github.com/ngx-signal-forms/ngx-signal-forms/blob/main/docs/MIGRATING_FROM_NGX_VEST_FORMS.md) and the official [Vest 6 upgrade guide](https://vestjs.dev/docs/upgrade_guide).

## Import

```typescript
import {
  validateVest,
  validateVestWarnings,
} from '@ngx-signal-forms/toolkit/vest';
```

## Quick start

```typescript
import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { form, FormField } from '@angular/forms/signals';
import { create, enforce, test, warn } from 'vest';
import {
  createOnInvalidHandler,
  hasOnlyWarnings,
  NgxSignalFormToolkit,
} from '@ngx-signal-forms/toolkit';
import { NgxFormFieldError } from '@ngx-signal-forms/toolkit/assistive';
import { validateVest } from '@ngx-signal-forms/toolkit/vest';

interface SignupModel {
  email: string;
}

const signupSuite = create((data: SignupModel) => {
  test('email', 'Email is required', () => {
    enforce(data.email).isNotBlank();
  });

  test('email', 'Using a company email usually speeds up approval', () => {
    warn();
    enforce(!data.email.endsWith('@gmail.com')).isTruthy();
  });
});

@Component({
  selector: 'ngx-signup-form',
  imports: [FormField, NgxSignalFormToolkit, NgxFormFieldError],

  template: `
    <form [formRoot]="signupForm" ngxSignalForm>
      <label for="email">Email</label>
      <input id="email" [formField]="signupForm.email" />
      <ngx-form-field-error [formField]="signupForm.email" fieldName="email" />
      <button type="submit">Create account</button>
    </form>
  `,
})
export class SignupFormComponent {
  readonly #model = signal<SignupModel>({ email: '' });
  readonly #onInvalid = createOnInvalidHandler();

  protected readonly signupForm = form(
    this.#model,
    (path) => {
      validateVest(path, signupSuite, { includeWarnings: true });
    },
    {
      submission: {
        ignoreValidators: 'all',
        action: async () => {
          if (!hasOnlyWarnings(this.signupForm().errorSummary())) {
            this.#onInvalid(this.signupForm);
            return;
          }
          console.log('Create account', this.#model());
        },
      },
    },
  );
}
```

Blocking Vest errors render as `role="alert"`. Vest `warn()` results render as `role="status"` through the toolkit's wrapper and assistive components.

## API

### validateVest()

First-class adapter for Vest suites. Reads `suite.run()` results and maps blocking errors directly into Signal Forms validation errors.

**A suite runs on the bound path's value — that value is the suite's input.** `path` and `suite` must agree: bind the form root to a suite authored for the whole model (the common case), or bind a subtree to a suite authored for that subtree's value. Binding a suite to a path whose value type it wasn't written for is a compile error, not a runtime footgun.

```typescript
validateVest(path, suite); // blocking errors only
validateVest(path, suite, { includeWarnings: true }); // + warn() as toolkit warnings
validateVest(path, suite, { resetOnDestroy: false }); // opt out of teardown reset (true is the default)
validateVest(path, suite, { only: (ctx) => ctx.value().focusedField });
```

Blocking errors and warnings are read from the same Vest run — enabling warnings does not require a second suite pass.

#### Options

| Option            | Default | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| ----------------- | ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `includeWarnings` | `false` | Surface `warn()` results as toolkit warnings (`kind` prefixed with `warn:vest:`).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| `resetOnDestroy`  | `true`  | Call `suite.reset()` via `DestroyRef.onDestroy()` when the hosting injection context tears down. Enabled by default (`true`) for all registrations; pass `{ resetOnDestroy: false }` only to deliberately persist suite state across mounts (see [Suite lifecycle](#suite-lifecycle) below).                                                                                                                                                                                                                                                                                                                                        |
| `only`            | _none_  | Selector `(ctx) => VestFieldExclusion` — a field name, a list of field names, `undefined` for a whole-suite run, or `false` to focus nothing — threaded into `suite.only(field).run(value)` when the suite exposes `only` (falling back to `suite.run(value, fieldName)`, single field name only, otherwise). `false` throws: Vest cannot express "focus nothing" through either form. When `suite` is declared with `create<{ fields: … }>(…)` (or a schema), the returned field-name union narrows this selector's accepted return value — a mistyped focus name is a compile error. See [Typed focus names](#typed-focus-names). |

### Exported constants

The `kind` values the adapter generates are stable. Use the exported prefixes
when building custom error strategies, debugger filters, or tests:

```typescript
import {
  VEST_ERROR_KIND_PREFIX, // 'vest:'
  VEST_WARNING_KIND_PREFIX, // 'warn:vest:'
} from '@ngx-signal-forms/toolkit/vest';

const isVestWarning = (kind: string) =>
  kind.startsWith(VEST_WARNING_KIND_PREFIX);
```

### validateVestWarnings()

Registers only the warning bridge. Use when blocking validation comes from another source (Angular validators, Zod) but you still want Vest `warn()` output in toolkit components.

```typescript
import { email, form, required } from '@angular/forms/signals';
import { validateVestWarnings } from '@ngx-signal-forms/toolkit/vest';

const checkoutForm = form(checkoutModel, (path) => {
  required(path.email, { message: 'Email is required' });
  email(path.email, { message: 'Enter a valid email address' });
  validateVestWarnings(path, checkoutAdvisorySuite);
});
```

Prefer `validateVest(path, suite, { includeWarnings: true })` when the same Vest suite provides both blocking errors and warnings. Prefer `validateVestWarnings()` when Vest is advisory-only.

### createVestAdapter() / sharedVestAdapter

`validateVest` and `validateVestWarnings` are thin wrappers over a public
**Vest adapter** that owns the per-(suite + field-tree) shared run cache and the
sync/async delta machinery. Advanced consumers can use the adapter directly to
run a suite once and share that single execution across multiple validators or a
hand-rolled validation flow — without re-implementing the cache.

```typescript
import {
  createVestAdapter,
  sharedVestAdapter,
  type VestSuiteAdapter,
} from '@ngx-signal-forms/toolkit/vest';

// Create your own adapter (its own cache)…
const adapter: VestSuiteAdapter = createVestAdapter();

// …or reuse the shared instance that the built-in validators are wired onto,
// so a manual run reuses the SAME cached execution as validateVest().
const shared = sharedVestAdapter;
```

| Member                 | Description                                                                                                                                                                                                                                                |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `register(path, …)`    | Wire the suite into Signal Forms (the `validateTree` + `validateAsync` pipeline). `validateVest`/`validateVestWarnings` delegate here.                                                                                                                     |
| `runVestSuite(params)` | Run the suite once through the shared cache. Returns the cached run for an identical `(suite, fieldTree, value, focus)` tuple, or a fresh run when any of them change. The result's `settled()` — not `runResult` — is the safe thing to await; see below. |
| `invalidate(suite)`    | Drop the shared run cache for a suite (the `resetOnDestroy` teardown hook calls this).                                                                                                                                                                     |

The companion option/shape types are also exported for typing your own
integrations: `VestAdapterOptions` (for `createVestAdapter()`),
`VestRegisterOptions`, `RunVestSuiteParams`, and `RunVestSuiteResult`.

#### Example: a custom validator consuming the adapter

Use `runVestSuite` inside your own `validateTree` callback when you want full
control over how the Vest result maps onto Signal Forms — for example, to
collapse every Vest failure into a single summary error while still sharing the
one suite run with any other `validateVest` registrations on the same path.

```typescript
import { signal } from '@angular/core';
import { form, validateTree } from '@angular/forms/signals';
import { create, enforce, test } from 'vest';
import { sharedVestAdapter } from '@ngx-signal-forms/toolkit/vest';

interface Checkout {
  email: string;
  amount: string;
}

const checkoutSuite = create((data: Checkout) => {
  test('email', 'Email is required', () => enforce(data.email).isNotBlank());
  test('amount', 'Amount is required', () => enforce(data.amount).isNotBlank());
});

const checkoutForm = form(
  signal<Checkout>({ email: '', amount: '' }),
  (path) => {
    // Custom validator: one shared run, one summary error per field tree.
    validateTree(path, (ctx) => {
      const { fieldTree, value } = ctx;
      const run = sharedVestAdapter.runVestSuite({
        suite: checkoutSuite,
        fieldTree,
        value: value(),
      });

      const result = run.initialResult;
      if (!result) {
        // No synchronous result yet (the suite's `run()` returned a raw
        // thenable). This sync-only custom validator has no async phase of its
        // own, so to surface async-only failures pair it with a regular
        // `validateVest(path, checkoutSuite)` (or your own `validateAsync`)
        // on the same path — both share this one cached run.
        return [];
      }

      const failing = Object.keys(result.getErrors());
      return failing.length === 0
        ? []
        : [
            {
              kind: 'vest:summary',
              message: `${failing.length} field(s) need attention`,
              fieldTree,
            },
          ];
    });
  },
);
```

Because `runVestSuite` reads the shared cache keyed on
`(suite, fieldTree, value, focus)`, a custom validator and a regular
`validateVest(path, checkoutSuite)` on the same path execute `checkoutSuite.run()`
exactly once per value.

#### Awaiting a manual run's outcome

Outside a `validateTree`/`validateAsync` pair — a one-off manual check, a test,
a script — await `run.settled()`, not `run.runResult`:

```typescript
const run = sharedVestAdapter.runVestSuite({ suite, fieldTree, value });
const result = await run.settled(); // correct
```

`run.runResult` is the raw value `suite.run()` returned. Vest 6 tracks a
single resolver per suite instance, so a LATER `suite.run()` call on the SAME
suite — a second `runVestSuite` call, or a second focused `validateVest`
registration — replaces that resolver before an earlier, still-pending call's
`runResult` promise ever settles (empirically verified against `vest@6.3.2`).
Awaiting `runResult` directly then hangs forever:

```typescript
// UNSAFE: hangs forever if another run lands on the same suite first.
const result = await Promise.resolve(run.runResult);
```

`run.settled()` recovers from that supersession by racing the run against the
suite's own `ALL_RUNNING_TESTS_FINISHED` bus event — the same mechanism the
built-in `validateVest`/`validateVestWarnings` pipeline relies on internally.

## When to use Vest

Use Angular Signal Forms validators for simple, field-local rules (`required`, `email`, `minLength`). Use Vest when validation reads more like business policy:

- Eligibility rules that depend on multiple fields
- Conditional rules driven by business state
- Async checks like "username already taken"
- Rules you want to reuse outside an Angular form

For the full three-layer decision guide (Angular validators vs. Zod / OpenAPI
Standard Schema vs. Vest), the recommended layering order, and a worked example
combining all three, see
[Choosing a validation strategy](https://github.com/ngx-signal-forms/ngx-signal-forms/blob/main/docs/VALIDATION_STRATEGY.md).
Keep each layer focused — don't duplicate the same rule in multiple layers.

## Suite lifecycle

Vest suites created with `create()` retain state across runs: the last result,
any pending async tests, and per-test memoization. The recommended Vest
pattern is to declare suites at **module scope** so they can be imported from
anywhere:

```typescript
// signup.suite.ts — module scope, reused by every form mount
export const signupSuite = create((data: SignupModel) => {
  /* ... */
});
```

That's a great choice for performance but it means that without a teardown
hook, suite state bleeds across component mounts. A second mount can see
stale errors from a previous session, or async tests from an unmounted form
can continue resolving and leak errors into the new one.

To prevent this foot-gun, the adapter wires `suite.reset()` into `DestroyRef`
**by default** (`resetOnDestroy: true`). It calls `suite.reset()` (and drops
its internal run cache) when the injection context that registered the
validator is destroyed — no configuration needed:

```typescript
validateVest(path, signupSuite); // resets suite state on teardown automatically
```

Pass `{ resetOnDestroy: false }` only when you deliberately want suite state to
persist across mounts:

```typescript
validateVest(path, signupSuite, { resetOnDestroy: false }); // opt out of teardown reset
```

### Concurrent mounts of the same suite

Registrations against the same suite are reference-counted, so mounting the
same module-scope suite in two forms at once — e.g. a list/detail view, a
wizard step rendered alongside a summary, or two tabs open simultaneously —
is safe: the suite is only reset once the **last** surviving registration's
injection context tears down, not the first one. Destroying one mount while
a sibling mount is still using the same suite leaves that sibling's retained
`only()`-run state and any in-flight async run untouched.

Two concurrently-mounted field trees sharing one suite are also isolated
against each other's **unfocused** (whole-suite) runs: the adapter defers the
later-arriving tree's run until the suite is idle, so the two never overlap
(#214). This does not cover **focused** (`only`) registrations: several
`only`-focused registrations for different fields of the SAME form are the
documented, intentional shared-suite pattern and are never deferred, but a
focused registration racing an unrelated, concurrently-mounted form's
registration on the same suite is unsupported — give each independently
mounted form its own suite instance in that case.

### Server-side rendering (SSR)

Do not share a suite — or the module-scope `sharedVestAdapter` — across
concurrent SSR requests. A Node SSR process serves several requests from ONE
process, so a module-scope suite instance and `sharedVestAdapter`'s run cache
are shared across those requests: a per-request `resetOnDestroy` teardown
resets a suite (and drops the run cache) that another request is still
mid-render on. Create the suite, and ideally an adapter via
`createVestAdapter()`, **per request** instead — for example, provided by a
request-scoped provider — rather than at module scope.

### Async caveats

- `suite.run(data)` returns a synchronous `SuiteResult` that is _also_ a
  thenable. The adapter surfaces sync errors immediately, then, when
  `result.isPending()` is `true`, awaits the run's _settlement_ — not the raw
  thenable directly. See
  [Awaiting a manual run's outcome](#awaiting-a-manual-runs-outcome): a later
  `run()` on the same suite instance can supersede the thenable's resolver
  before it ever settles, so the adapter races it against the suite's
  `ALL_RUNNING_TESTS_FINISHED` bus event — resolving immediately from
  `suite.get()` once the suite is already idle — to recover.
- If a consumer-wrapped suite returns a `Promise<SuiteResult>` directly from
  `run()` (no sync result), the adapter drives validation straight from the
  promise. This keeps bridge suites that wrap a remote policy check working
  end-to-end.
- Only the **latest** run's result surfaces to Signal Forms. Rapid value
  changes cancel pending work via Angular's async validator contract; stale
  results never reach the field's `errors()` signal.
- **Warnings vs. pending async tests.** Angular's `validateAsync` only
  schedules its resource when the bound subtree has zero sync errors, and a
  toolkit `warn:vest:*` result is an ordinary `ValidationError`. To avoid a
  sync warning silently suppressing a blocking async check from the SAME
  registration, the adapter defers surfacing a warning while the suite still
  has pending async tests and this registration also maps errors
  (`includeErrors: true`), re-surfacing the warning together with the settled
  result once they finish. In practice this means a warning can appear one
  tick later than a blocking sync error while async validation is in flight —
  it does not change what surfaces once the field settles. A warning-only
  registration (`validateVestWarnings`, or `includeErrors: false`) has no
  blocking error of its own to protect, so it never defers: its warnings
  surface immediately, even while the suite is pending or a separate
  validator on the same subtree is blocking.

### Focused `only()` runs

When a suite callback uses `only(fieldName)` (or `suite.only(field).run(...)`),
pass an `only` selector so the adapter threads the changed field through:

```typescript
import { create, enforce, only, test } from 'vest';

interface Model {
  email: string;
  username: string;
  // Declared as the exact field-name union so `ctx.value().lastTouched`
  // below already returns `'email' | 'username' | undefined` — proving the
  // `only` selector's narrowing, not just its shape.
  lastTouched?: 'email' | 'username';
}

const suite = create((data: Model, field?: string) => {
  only(field);
  test('email', 'Email is required', () => {
    enforce(data.email).isNotBlank();
  });
  test('username', 'Username is required', () => {
    enforce(data.username).isNotBlank();
  });
});

validateVest(path, suite, {
  only: (ctx) => ctx.value().lastTouched, // or any state-driven field name
});
```

The default behavior (no `only` option) runs the whole suite on every change,
which stays correct but re-executes every test body. Use `only` for large
suites where per-field isolation matters.

#### Typed focus names

Declare the suite with `create<{ fields: … }>(…)` (Vest ≥6.3.2) to get a
field-name union instead of a bare `string`. Reusing the same `Model` from
above (whose `lastTouched` is already typed as `'email' | 'username'`) shows
the union propagating end to end:

```typescript
const typedSuite = create<{ fields: 'email' | 'username' }>(
  (data: Model, field?: string) => {
    only(field);
    test('email', 'Email is required', () => {
      enforce(data.email).isNotBlank();
    });
    test('username', 'Username is required', () => {
      enforce(data.username).isNotBlank();
    });
  },
);

validateVest(path, typedSuite, {
  // Return type narrows to `VestFieldExclusion<'email' | 'username'>`: a
  // single field name, a `('email' | 'username')[]` for multi-field focus,
  // `undefined` for a whole-suite run, or `false` to focus nothing (throws —
  // Vest has no way to express "run zero tests" through `only()`).
  only: (ctx) => ctx.value().lastTouched,
});
```

`validateVest`, `validateVestWarnings`, and `VestSuiteAdapter.register` infer
this union straight from `suite` — no type argument to write. With the union
in place, `only: () => 'emial'` (a typo) is a **compile error** instead of a
focused run that silently executes zero tests and reports the field valid. A
suite declared with plain `create(…)` (no `fields`, no schema) keeps
accepting any `string`, so existing suites are unaffected.

#### Focusing the currently active field

`validateVest` always registers against the value the bound path resolves to
— for a model-scoped suite, that's the **form root**, not an individual
field (see [ADR-0008](https://github.com/ngx-signal-forms/ngx-signal-forms/blob/main/docs/decisions/0008-vest-suite-input-is-the-bound-path.md)).
To focus the suite on whichever field the user is currently working in,
track that field name yourself — e.g. on `(focus)`/`(blur)`, or from a
signal your input bindings already update — and read it from the `only`
selector:

```typescript
readonly #activeField = signal<string | undefined>(undefined);

readonly signupForm = form(this.#model, (path) => {
  validateVest(path, suite, {
    only: () => this.#activeField(),
  });
});
```

This is the same `only` mechanism shown above — a suite whose `only(field)`
call runs the whole suite when `field` is `undefined`, and just that field's
tests otherwise. There is no separate auto-focus option: the suite always
runs on the bound path's value, so the field to focus is information only
your form knows and must supply.

## Vest field-name resolution

Per [ADR-0008](https://github.com/ngx-signal-forms/ngx-signal-forms/blob/main/docs/decisions/0008-vest-suite-input-is-the-bound-path.md), a Vest field name (the string a `test()`/`warn()` is
registered under) is resolved **relative to the bound path** by walking the
Angular field tree the validator is attached to. A name that does not resolve
is classified by shape:

- **Virtual Vest field name** — the name's FIRST segment does not resolve
  against the bound field tree, e.g. `test('passwordMatch', 'Passwords must
match', …)` on a model with no `passwordMatch` field. This is a deliberate,
  form-level error and is indistinguishable from an authoring mistake at that
  point, so it is treated as legitimate: the failure attaches to the bound
  field silently, with no warning or error logged.
- **Invalid Vest field name** — a valid prefix resolves but a LATER segment
  does not (`test('address.cityy', …)` when the bound field tree has
  `address.city` but no `address.cityy`), or the resolution probe itself
  throws. Nothing but a typo or a field-tree/suite shape mismatch explains
  this shape, so it is treated as an authoring bug:
  - **Development mode:** the adapter **throws** synchronously, inside the
    validator's computed — the form's render fails loudly rather than
    silently misattaching the error.
  - **Production builds:** the adapter logs a `console.error()` instead of
    throwing, and still attaches the failure to the bound field so it is
    never silently lost.

```typescript
const suite = create((data: SignupModel) => {
  // Virtual: `passwordMatch` names no field on `SignupModel` — legitimate,
  // attaches to the bound field silently.
  test('passwordMatch', 'Passwords must match', () => {
    /* ... */
  });

  // Invalid, IF the bound field tree has `address.city` but not
  // `address.cityy` — a valid prefix (`address`) followed by a typo'd tail.
  // Throws in dev mode; logs and attaches to the bound field in production.
  test('address.cityy', 'City is required', () => {
    /* ... */
  });
});
```

This only applies to a Vest field name's own shape — it is unrelated to
`validateVest`'s `only` selector, which focuses which Vest tests RUN, not how
a result's field name is resolved.

## Using Angular `submit()` with warnings

Angular treats every `ValidationError` as blocking. For forms that should allow warnings:

1. Set `ignoreValidators: 'all'` in the `submission` config
2. Inside `action`, check `hasOnlyWarnings(form().errorSummary())` — `errorSummary()` yields only the fields that errored, so it is not a full-tree enumeration of every field
3. Return early and focus the first invalid field when blocking errors remain

The Quick start example above hand-rolls this exact pattern. The toolkit also ships
[`submitWithWarnings(form, action)`](../README.md#warning-support), a ready-made
helper that marks the form touched, waits for validation to settle, and invokes
`action` only when no blocking errors remain — reach for it directly (e.g. from a
button click handler) instead of re-implementing the `ignoreValidators` /
`hasOnlyWarnings` breakdown, unless you need that finer control.

## Related documentation

- [Toolkit core](../README.md) — error strategies, warning utilities
- [Validation strategies](https://github.com/ngx-signal-forms/ngx-signal-forms/blob/main/docs/VALIDATION_STRATEGY.md) — when to use Angular, Zod, or Vest
- [Migrating from ngx-vest-forms](https://github.com/ngx-signal-forms/ngx-signal-forms/blob/main/docs/MIGRATING_FROM_NGX_VEST_FORMS.md)
- [Vest 5.x → 6.x upgrade guide](https://vestjs.dev/docs/upgrade_guide) — official Vest migration docs
- Demos: [vest-validation](https://github.com/ngx-signal-forms/ngx-signal-forms/tree/main/apps/demo/src/app/05-advanced/vest-validation), [zod-vest-validation](https://github.com/ngx-signal-forms/ngx-signal-forms/tree/main/apps/demo/src/app/05-advanced/zod-vest-validation)
