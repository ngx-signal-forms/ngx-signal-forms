# ADR-0008: A Vest Suite's Input Is the Bound Path's Value

## Status

Accepted — not yet implemented.

The decision below is settled and is what the implementing work must follow, but
the package still has the old behaviour: `focusCurrentField` and
`deriveVestFieldNameFromContext` are present until
[#287](https://github.com/ngx-signal-forms/ngx-signal-forms/issues/287) lands.
The Decision and Consequences sections are written declaratively because they
state the ruling, not the current state of the code.

## Date

2026-08-08

## Context

Issue [#287](https://github.com/ngx-signal-forms/ngx-signal-forms/issues/287) reported that `validateVest`'s single generic conflates two different types:

```ts
export function validateVest<TValue>(
  path: VestFieldPath<TValue>, //     TValue = the bound field's value type
  suite: VestRunnableSuite<TValue>, // TValue = the suite's input type
  options: ValidateVestOptions<TValue> = {},
): void;
```

The issue framed this as a typing defect and proposed splitting the generic into `<TModel, TField>`. Reviewing the package showed the typing defect is a **symptom**, and that the proposed fix would have made the underlying defect worse.

### What actually happens

`registerVestValidation` feeds `ctx.value()` — the **bound path's** value — straight into `suite.run()`:

```ts
validateTree(path, (ctx) => {
  const { fieldTree, value } = ctx;
  const entry = getOrCreateVestRun(
    suite,
    fieldTree,
    value(),
    resolveFocus(ctx),
  );
  // …
});
```

So the README-documented per-field pattern (`packages/toolkit/vest/README.md:135`, `:395`) hands a **string** to a suite authored for the model. Reproduced:

```ts
const suite = create((data: { email: string; password: string }) => {
  test('email', 'Email is required', () => enforce(data.email).isNotBlank());
});

form(model, (path) => {
  validateVest(path.email, suite, { focusCurrentField: true });
});

model.set({ email: 'ada@example.com', password: 'hunter2hunter2' });
```

```text
suite.run received:  ["", "ada@example.com"]
email errors AFTER valid input:
  [{ kind: 'vest:email:email-is-required:0', message: 'Email is required' }]
```

`data.email` on a string primitive is always `undefined`, so `enforce(undefined).isNotBlank()` fails forever. A **valid value carries a permanent blocking error**. The only thing preventing adoption was that the pattern does not typecheck — which is precisely what #287 proposed to remove.

A second defect shares the root cause. Vest field names were derived **root-relative** (`ctx.pathKeys().join('.')`) but resolved back to a field by walking from the **bound** tree, with `catch { return fieldTree; }` swallowing every miss. Reproduced: a suite testing `address.city`, bound to `path.address`, attaches its error to the `address` group instead of `address.city` — rendering beside the wrong control and pointing `aria-describedby` at the wrong control.

### Why no second value source exists

A field-scoped registration cannot fetch the model on its own. Angular 22.1's `FieldContext` (`RootFieldContext` / `ChildFieldContext` / `ItemFieldContext`) and `ReadonlyFieldState` expose no parent or root accessor — verified against the installed `.d.ts`. `ctx.valueOf(path)` requires a `SchemaPath` handed in from the enclosing `form()` callback. So any "bind to the field, run on the model" design **must** take a second path from the caller.

### Alternatives considered

**Split the generic and require a model path** — `validateVest(path.email, suite, { model: path })`, or the object form `validateVest({ field, model, suite })`. Rejected on two grounds:

1. **The central invariant is unenforceable.** `field` must be a descendant of `model`. `SchemaPath` carries no type-level descendant relation, so `{ field: formA.email, model: formB }` typechecks whenever the value types line up. An object form makes the invariant visible but no more checkable — the same class of defect this ADR exists to remove.
2. **It makes the reactive dependency worse.** Reading `ctx.valueOf(modelPath)` makes the whole model the dependency, so N field registrations each re-run on every keystroke anywhere in the form: N focused suite runs, N cache entries, N sequential `only().run()` calls against one stateful suite, per change. One root registration is one run.

**Suite-per-field** — author a separate suite per field so the field's value legitimately is the suite input. This is what the existing specs quietly do (`create((email: string, field?: string) => …)`). Rejected: it defeats the point of Vest, whose suites are model-scoped and whose `only()` exists to focus one model within one suite.

### Adoption evidence

`focusCurrentField` and field-scoped registration had **zero live call sites**. All 35 `validateVest` call sites in the repository bind the form root; the only 5 field-bound occurrences anywhere are documentation and JSDoc. No group-bound site exists. Every documented suite takes the whole model plus an optional focus name — `create((data: Model, field?: string) => { only(field); … })` — which is the root-registration idiom.

## Decision

**The bound path's value _is_ the suite input.** A Vest registration binds one path and one suite, and they must agree.

Consequences, in order:

1. **Delete `focusCurrentField`** and the root-relative name derivation (`deriveVestFieldNameFromContext`) it existed to serve. With derivation gone, `filterEntriesForBoundField` is never called with a name and is deleted as dead.
2. **Subtree binding stays legal**, and is correct whenever the suite is authored for that subtree's value — `validateVest(path.address, create((addr: { city: string }) => test('city', …)))` works. What is deleted is the _mismatch_, not the capability.
3. **Vest field names are relative to the bound path.** Resolution walks from the bound tree, which is now the only base there is — the encode/decode disagreement dissolves rather than needing a chosen base.
4. **An unresolvable name is split by shape.** An unresolvable _first_ segment is a **virtual Vest field name** (a deliberate form-level error such as `test('passwordMatch', …)`) and attaches to the bound field, silently and legitimately. A valid prefix with an invalid tail (`address.cityy`), or a proxy probe that throws, is an authoring bug: **hard error in dev mode**, `console.error` plus attach-to-bound in production. The blanket `catch { return fieldTree; }` is removed.
5. **The suite contract is made enforceable.** `run`, `only`, `getErrors` and `getWarnings` move from method-shorthand to readonly function-property position, because method parameters stay bivariant even under `strictFunctionTypes` — that bivariance is _why_ `VestRunnableSuite<SignupModel>` was assignable to `VestRunnableSuite<string>` and why the broken pattern compiled. `only` takes Vest 6.3.2's real `FieldExclusion<F> = Maybe<OneOrMoreOf<F>>` (which admits `false` and readonly arrays) instead of `string | string[]`.
6. **No generic split.** With the path and the suite agreeing, one type parameter is correct. #287's proposed `<TModel, TField>` signature is not implemented; the issue's premise dissolves.

Automatic per-field focus — the capability `focusCurrentField` was reaching for — is a **root-level** concern: one registration on the root, with the toolkit deriving the active field's dotted path from its own field-identity and touch tracking. That is tracked as separate research in #293, not as a repair of the deleted shape.

## Consequences

### Positive

- The documented per-field pattern stops producing a permanent blocking error on a valid value.
- The interface states one thing: _this suite validates this path's value._ Misuse becomes a type error at the call site rather than silent wrong behaviour at runtime.
- Group-bound registrations stop mis-attributing child errors to the group, which removes an `aria-describedby` correctness hazard (WCAG 1.3.1).
- Three modules of complexity are deleted, not moved: the focus derivation, the bound-field entry filter, and the blanket `catch`.
- The four `TS2345` spec errors blocking [#286](https://github.com/ngx-signal-forms/ngx-signal-forms/issues/286) are resolved by deletion, and the contract fix clears five further `TS2769` errors.

### Negative

- **Breaking, with no deprecation path.** `focusCurrentField` is removed outright. The project is pre-`v1.0.0` (`1.0.0-rc.11`, v1.0.0 never shipped), so no alias or overload is kept.
- Automatic focus names for array items (`items.0.sku`) are lost until the root-level replacement is designed. A manual `only` selector reading a consumer-tracked "active item" value remains available and is what the docs already teach.
- A dev-mode throw on a malformed Vest field name propagates through change detection, so the form render fails loudly. This is intentional but is a harder failure mode than anything the package did before.

### Neutral

- The run coordinator (cache, contention detection, FIFO queue, settlement — roughly 500 of `vest-adapter.ts`'s 1614 lines) is **not** retired by this decision. Contention is a two-mount concern: one module-scope suite, two field trees. Giving it its own interface is tracked in #295.

## Related

- [ADR-0006](0006-one-cascade-seam.md) — the same "one contract, one place" reasoning applied to error-visibility timing.
- [#287](https://github.com/ngx-signal-forms/ngx-signal-forms/issues/287) — re-scoped around this decision: suite input rule, `focusCurrentField` deletion, enforceable suite contract.
- [#291](https://github.com/ngx-signal-forms/ngx-signal-forms/issues/291) — the unresolvable-name rule from decision point 4.
- [#292](https://github.com/ngx-signal-forms/ngx-signal-forms/issues/292) — threading Vest's typed field-name union through the focus selector.
- [#293](https://github.com/ngx-signal-forms/ngx-signal-forms/issues/293) — research: automatic per-field focus at the root, the deliberate replacement for `focusCurrentField`.
- [#294](https://github.com/ngx-signal-forms/ngx-signal-forms/issues/294) — coverage of the exported interface, including the untested shared adapter singleton.
- [#295](https://github.com/ngx-signal-forms/ngx-signal-forms/issues/295) — giving the run coordinator its own interface.
- [#286](https://github.com/ngx-signal-forms/ngx-signal-forms/issues/286) — spec typecheck target; nine of its errors are resolved by #287.
