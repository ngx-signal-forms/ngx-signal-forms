# Angular Signal Forms essentials

Guidance baseline: Angular 22.3.
Verify the consumer's installed Angular version, peer ranges, and shipped declarations before choosing APIs (see [sources.md](sources.md)).

Angular owns values, validation, field state, and submission.
The toolkit owns presentation, timing, and ARIA wiring.
Keep existing Reactive Forms intact unless migration is part of the task.

## Model and field state

- Create `form(writableModel, schemaFn, options?)` inside an injection context or pass an `injector`. Keep the model writable and update nested objects and arrays immutably.
- `FieldTree<T>` is callable and holds child paths. `tree.email` is a tree; `tree.email()` returns `FieldState<T>`. Read `value()`, `touched()`, `dirty()`, `errors()`, `pending()`, `hidden()`, `disabled()`, and `readonly()` on the called state. Navigate child properties before calling the tree.
- `FormField` is the `[formField]` directive, not a tree type. Let it own value, disabled, readonly, and constraint bindings on native controls. Radio options keep their own static `value`.
- Checkboxes bind to `boolean`. Native `<select multiple>` is **not supported** by `[formField]`; model multi-select values as one boolean field and checkbox per option, or build a custom `FormValueControl<string[]>`.
- Use `''` for empty native text inputs and `false` for checkboxes. Use a supported nullable numeric or date representation for matching native inputs.
- Use `!touched()` and `!dirty()` (there are no `untouched()` or `pristine()` signals). While async validation is pending with no errors, `valid()` and `invalid()` can both be `false`. Use `errorSummary()` when descendant errors matter.
- `field().reset()` clears interaction state without changing the value. `field().reset(nextValue)` also replaces the value. Neither restores an initial snapshot unless you keep and pass one.
- `hidden()` changes form participation, not DOM visibility. Hide the control, label, and feedback together in the template.

## Validation choice

Start with Angular validators for field constraints, conditional rules, cross-field checks (`validateTree`), and async server checks (`validateAsync`, `validateHttp`).
Use `validateStandardSchema()` when a shared schema (such as Zod) already owns the data contract.
Use Vest when an existing Vest suite exists or when large grouped business-policy rules read more clearly as a suite.
Async checks and cross-field rules alone are not reasons to add Vest.
Assign each rule in one place.
Deeper trade-offs live in [VALIDATION_STRATEGY.md](https://github.com/ngx-signal-forms/ngx-signal-forms/blob/main/docs/VALIDATION_STRATEGY.md).

## Schemas and arrays

Schema paths register rules; they are not callable signals.
Inside rule callbacks, read values and state through `value()`, `valueOf(otherPath)`, `state`, and `stateOf(otherPath)`.

- Attach reusable `schema<T>()` definitions with `apply(path, schema)`.
- Apply array item rules with `applyEach(path.items, itemPath => ...)`. The callback takes one argument (the item path, no index). Track dynamic array items in `@for` by stable field identity, not `$index`. Capture outer indexes with `let outerIndex = $index` in nested loops.
- Use a rule's `when` option for a single conditional rule, or `applyWhen(path, condition, schemaOrFn)` for rule groups and sibling dependencies.
- `applyWhenValue(path, predicate, schemaOrFn)` passes the value directly to `predicate`, not a context object. A TypeScript type guard narrows discriminated-union paths.
- `validateTree(path, ctx => result)` can target a descendant error with `fieldTree: ctx.fieldTree.child`. Untargeted errors attach to the validated path. Keep `validate` and `validateTree` synchronous.

## Async validation

Use `validateAsync` or `validateHttp`.
Both require `onError` to map failures to a validation result.

- `validateAsync.params` is a context callback such as `({ value }) => value()`. Return `undefined` from `params` to skip validation (for example, when an input is empty or too short).
- `validateAsync.factory` receives a signal. Angular `resource()` takes `params`, not `request`.
- `onSuccess` returns `null` or `undefined` when valid, or a validation error when invalid.
- `validateHttp` uses a `request` callback. Check `when` and `debounce` support in the installed declarations.
- An async validator's `debounce` delays validation only. The separate `debounce(path, durationOrBlur)` rule delays UI-to-model updates; touch flushes buffered edits.

## Submission

Use `<form [formRoot]="tree">` with `FormRoot` in imports and `submission.action` in `form()` options.
`FormRoot` sets `novalidate`, prevents native navigation, and invokes Angular submission.
Keep one submit owner per `<form>`.

When you omit `FormRoot` (for example, in a warning-aware submit flow), handle `(submit)`, call `event.preventDefault()`, and add `novalidate`.
`submit(tree)` uses configured `form()` options, or accepts an explicit action and options.

The submission action returns `Promise<TreeValidationResult>`.
Map server responses to validation errors, or return `null`, `undefined`, or `void` for success.
Submission marks the tree touched.

| `ignoreValidators`    | Eligibility                                       |
| --------------------- | ------------------------------------------------- |
| `'pending'` (default) | Blocking errors stop submit; pending checks pass  |
| `'none'`              | Invalid or pending validation blocks this attempt |
| `'all'`               | Ignores errors and pending validation             |

These options are gates, not wait-and-retry policies.
When saving requires completed async checks, set `ignoreValidators: 'none'` and let the user retry once validation settles.
Keep the submit button enabled on invalid forms so an attempt can reveal feedback; disable it during `submitting()`.
Guard programmatic re-entry, handle rejected promises, and use `onInvalid` for focus management.
See [core/guide.md](../core/guide.md) and [testing/guide.md](../testing/guide.md#submission-checks) for toolkit timing and warning-aware gates.

## Custom controls

Implement `FormValueControl<T>` (with a `value` model) or `FormCheckboxControl` (with a boolean `checked` model), never both.
`FormUiControl<T>` is their shared optional-state base, not an editable contract on its own.
Bind the component with `[formField]`; ordinary custom controls register automatically.

- Enable `"strictUnknownElements": true` in `angularCompilerOptions` (Angular 22.3+, planned default in v23). Without it, a custom control missing from a parent component's `imports` passes the build because `[formField]` matches the attribute, and crashes at runtime with `NG01914` instead of compile-time `NG8001` ([CUSTOM_CONTROLS.md](https://github.com/ngx-signal-forms/ngx-signal-forms/blob/main/docs/CUSTOM_CONTROLS.md#let-the-compiler-find-a-missing-control-import)).
- Forward optional `name`, `disabled`, `readonly`, `required`, and `hidden` state inputs to inner elements as needed.
- Emit `touch` on blur or when focus leaves the entire composite control, not on focus entry or movement between its input, trigger, and popup. Account for portaled popups outside the host subtree.
- Implement `focus(options?: FocusOptions)` and pass `options` to the interactive inner element so error-summary clicks focus it reliably.
- Import toolkit ARIA directives in the child component if that child renders the real `[formField]` element. See [form-field/guide.md](../form-field/guide.md#custom-controls) and [headless-composition.md](headless-composition.md).

## Value transformation

Use `transformedValue(valueModel, { parse, format })` when the widget's raw UI type differs from the model type (for example, string input for `Date | null`).

- Bind the widget to the returned writable raw signal and update it through `set()` or `update()` to preserve partial and invalid text.
- `parse(raw)` returns `ParseResult<T>`: `{ value }` updates the model; `{ error }` keeps the previous model value and reports parse errors; returning both updates the model and reports errors.
- `format(modelValue)` maps external model changes back to the widget. `rawValue.parseErrors()` exposes parse errors; inside a bound field context they report to the nearest field automatically.
- A bound field reset clears parse errors and reformats either the unchanged current value or the supplied replacement.

The [widget adapter guide](https://github.com/ngx-signal-forms/ngx-signal-forms/blob/main/docs/CUSTOM_CONTROLS.md#adapting-an-existing-third-party-widget) demonstrates `transformedValue`; pair it with the ARIA ownership and `focus(options)` contracts above.
