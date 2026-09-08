# Angular Signal Forms essentials

Toolkit guidance baseline: Angular 22.1. This is not a claim about the
consumer's installed version. Read the actual Angular and toolkit versions,
peer ranges, exports, and shipped declarations before choosing APIs. Follow
the [source policy](sources.md); installed exact-version declarations are
authoritative. Optional [official docs](https://angular.dev/guide/forms/signals/overview)
or Context7 can clarify a branch. No other skill or lookup service is required.

Angular owns values, validation, field state, and submission. The toolkit owns
presentation and integration. Preserve existing Reactive Forms unless migration
is part of the task.

## Model and field state

- Create `form(writableModel, schemaFn, options?)` in an injection context or
  pass an injector. Keep the model writable and update nested arrays immutably.
- `FieldTree<T>` is callable and has child paths. `tree.email` is a tree;
  `tree.email()` is `FieldState<T>`. Read `tree.email().value()`, `touched()`,
  `dirty()`, `errors()`, `pending()`, `hidden()`, `disabled()`, and `readonly()`.
  Navigate children before calling the tree, not from a state snapshot.
- `FormField` is the directive for `[formField]`, not a tree type. Let it own
  value, disabled/readonly, and constraint bindings. Radio options still need
  their own `value`. Checkboxes bind booleans; arrays use `select multiple`.
- Use `''` for empty native text and `false` for a checkbox. Use a supported
  nullable numeric/date representation for the matching native input.
- `!touched()` and `!dirty()` replace nonexistent `untouched()`/`pristine()`.
  With pending validation and no errors, `valid()` and `invalid()` can both
  be false. Use `errorSummary()` when descendant errors matter.
- `field().reset()` clears interaction state without changing the model.
  `field().reset(value)` also replaces the value. Neither restores an initial
  snapshot unless you retain and pass one.
- `hidden()` changes form participation, not native DOM visibility. Hide the
  control and its label/feedback together. Forward supported state inputs
  explicitly from custom controls to their inner elements.

## Validation choice

Use Angular validators for field constraints, conditional rules, cross-field
checks, and async server validation. Reuse Standard Schema when an existing
schema owns the shape/API contract. Reuse Vest for an existing suite or when
grouped policy rules are clearer as a suite. Async and cross-field work alone
do not justify adding Vest. Assign each rule once. Deeper trade-offs are in the
[validation strategy doc](https://github.com/ngx-signal-forms/ngx-signal-forms/blob/main/docs/VALIDATION_STRATEGY.md).

## Schemas and arrays

Schema paths register rules; they are not callable signals. In rule callbacks,
use `value()`, `valueOf(otherPath)`, `state`, or `stateOf(otherPath)`.

- Attach `schema<T>()` with `apply(path, schema)` and array rules with
  `applyEach(path.items, itemPath => ...)`. The callback takes one item path,
  not an index. Track dynamic form-array items by field identity, not `$index`.
  Capture an outer index alias for nested loops; Angular has no `$parent`.
- Use a rule's supported `when` for one conditional rule. Use
  `applyWhen(path, condition, schemaOrFn)` for groups and sibling dependencies.
- `applyWhenValue(path, predicate, schemaOrFn)` passes the value to its
  predicate, not a context. A type guard narrows a discriminated-union path.
  Check installed overloads rather than casting away unsupported branches.
- `validateTree(path, ctx => result)` can target a descendant with
  `fieldTree: ctx.fieldTree.child` on the error. Untargeted errors belong to
  the validated path. Keep `validate` and `validateTree` synchronous.

## Async validation

Use `validateAsync` or `validateHttp`. Both require `onError`; map failure to
the intended validation result. `validateAsync.params` is a context callback,
such as `({ value }) => value()`. Its factory receives a signal; Angular
`resource()` uses `params`, not `request`. `validateHttp` uses a `request`
callback. Verify `when` and `debounce` support in the installed declarations.

An async validator's `debounce` delays validation, not model updates. The
separate `debounce(path, durationOrBlur)` rule delays UI-to-model updates;
touch flushes the buffered update. Choose which operation should be delayed.

## Submission

Prefer `<form [formRoot]="tree">` with `FormRoot` in template imports and
`submission.action` in `form()` options. `FormRoot` supplies `novalidate`,
prevents native navigation, and invokes Angular submission. One submit event
has one owner. Do not add a competing handler.

Without `FormRoot`, own `(submit)`, call `preventDefault()`, and add `novalidate`.
`(ngSubmit)` is not this Signal Forms path. `submit(tree)` uses configured
options; an explicit action/options overload supports programmatic submission.

The action returns `Promise<TreeValidationResult>`, with or without `async`.
Map service payloads to validation errors or success as `null`, `undefined`,
or `void`; do not return arbitrary response data. Submission touches the tree.

| `ignoreValidators`   | Eligibility in the guidance baseline              |
| -------------------- | ------------------------------------------------- |
| `'pending'`, default | Errors block; pending validators do not           |
| `'none'`             | Invalid or pending validation blocks this attempt |
| `'all'`              | Ignores errors and pending validation             |

These are gates, not wait-and-retry policies. If saving requires completed
validation, use `'none'` and a later deliberate retry. Keep invalid submit
enabled so an attempt can reveal feedback; disable during `submitting()`.
Button state alone is not a programmatic guard. Handle rejection and prove
overlapping attempts do not save twice. Use `onInvalid` for invalid focus.
Read [core](../core/guide.md) and [submission checks](../testing/guide.md#submission-checks)
for toolkit timing, warning-aware gates, and required evidence.

## Custom controls

Implement `FormValueControl<T>` with a `value` model or `FormCheckboxControl`
with a boolean `checked` model. Never both. `FormUiControl<T>` is their common
optional-state base, not another editable contract. Bind the component through
`[formField]`; normal controls need no manual binding registration.

Forward optional name, disabled, readonly, required, and hidden state as needed.
Emit `touch` on blur or when focus leaves the entire composite, not on focus
entry or movement between its input, trigger, and popup. Account for popup
ownership if the library portals it outside the host subtree.

Implement `focus(options?: FocusOptions)` and pass `options` to the actual
interactive element. Verify summary focus reaches it. Select one ARIA writer
on that element; importing directives in a parent does not import them into
the child's template. Read [form-field](../form-field/guide.md) for toolkit
layout and [headless composition](headless-composition.md) for manual ownership.

## Value transformation

Use `transformedValue(valueModel, { parse, format })` when the widget's raw
type differs from the model, such as string input for `Date | null`.

- Bind the widget to the returned writable raw signal and send changes through
  its `set()`/`update()`. Preserve partial and invalid raw input.
- `parse(raw)` returns `ParseResult<T>`. `{ value }` updates the model;
  `{ error }` leaves the previous model value and reports parse errors.
  Returning both updates the model and reports errors.
- `format(modelValue)` maps external model changes back to the widget.
  `rawValue.parseErrors()` exposes errors. In a bound field context they also
  reach the nearest field; outside that context consume them explicitly.
- A bound field reset clears parse errors and reformats the unchanged current
  value or the supplied replacement. Test both reset forms and both round trips.

The deeper [widget adapter doc](https://github.com/ngx-signal-forms/ngx-signal-forms/blob/main/docs/CUSTOM_CONTROLS.md#adapting-an-existing-third-party-widget)
links a transformation demo, not a ready-made ARIA ownership or `focus(options)`
recipe. Apply the contracts above and verify the actual widget. Completion
requires invalid raw input, reset, composite focus exit, real focus forwarding,
and one ARIA writer with existing description targets.
