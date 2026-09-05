# Warnings, timing, and message resolution

This guide describes the current source. The independent warning cascade across
all headless helpers is planned for RC.13. See the
[versioned migration guide](./migrations/v1.0.0-rc.13.md) for release scope.

## The `warn:` convention

Angular validation errors have a `kind` and optional `message`. The toolkit
treats kinds beginning with `warn:` as advisory warnings. Angular still counts
them as errors for `invalid()` and ordinary submission.

| Kind            | Toolkit display                   | Ordinary Angular submission | Warning-aware submission |
| --------------- | --------------------------------- | --------------------------- | ------------------------ |
| Without `warn:` | Blocking error, `role="alert"`    | Blocks                      | Blocks                   |
| With `warn:`    | Advisory warning, `role="status"` | Blocks                      | Passes                   |

Use a blocking error for a rule that must hold before saving. Use a hint for
static guidance. Use a warning only for advice that the user may ignore.

```typescript
import { warningError } from '@ngx-signal-forms/toolkit';

const advice = warningError('short-password', 'Consider using 12+ characters');
```

Pass the bare kind to `warningError()`. It adds `warn:`. A validator can also
return a plain `{ kind: 'warn:short-password', message: 'Consider 12+ characters' }`.
The Vest adapter prefixes its warnings automatically. See the
[Vest reference](../packages/toolkit/vest/README.md).

### When a warning is the wrong tool

Use a blocking error when saving would violate a required rule. Use ordinary
help text for static advice that does not depend on validity. A warning is
conditional advice, not a way to bypass a required security or business check.

## Form submission behavior

`submitWithWarnings(formTree, action)`:

1. Rejects overlapping calls for the same form, including native submission.
2. Marks the form and descendants touched.
3. Yields one microtask so synchronous validation updates can propagate.
4. Checks the root `errorSummary()` for blocking errors.
5. If none remain, delegates to Angular `submit()` with `ignoreValidators: 'all'`.

Pending async validators do not block this helper. The microtask is not a wait
for async validation settlement. `canSubmitWithWarnings()` uses the same
settled-blocking-error policy and returns false during native submission.

The helper returns `Promise<boolean>`. It returns true after the action settles,
or false when refused or dropped. An action rejection propagates; the re-entry
guard is released in either case. True means the action ran, not that a server
accepted the data independently of the action's own error handling.

The following is a handler excerpt for an existing form with default `on-touch`
timing. It deliberately uses one native event owner instead of `[formRoot]`:

```typescript
import { submitWithWarnings } from '@ngx-signal-forms/toolkit';

async function save(event: Event): Promise<void> {
  event.preventDefault();
  await submitWithWarnings(profileForm, async () => {
    await api.save(profileForm().value());
  });
}
```

```html
<form novalidate (submit)="save($event)">
  <!-- Existing labeled controls bound with [formField]. -->
  <button type="submit">Save</button>
</form>
```

Do not combine competing native submit handlers. A declarative alternative is
Angular submission options with `ignoreValidators: 'all'` and a blocking-error
guard in the action. The
[warning-support demo](../apps/demo/src/app/02-toolkit-core/warning-support/README.md)
uses that approach. Bypassing all validators without the guard also bypasses
real errors.

If pending checks must finish before saving, enforce that policy in the submit
path, not only with a disabled button. Recheck settled blocking errors before
the save. The server must validate the submitted snapshot too.

Successful delegation drives Angular's `submitting()` signal and the toolkit's
completed-submission tracker. A refused helper call does not enter Angular
submission. An imperative `on-submit` display therefore needs explicit failed-
attempt tracking through `createSubmittedStatusTracker(form, submitAttempted)`.
Do not treat every false return as a validation failure; overlap also returns
false. See the [submission API](../packages/toolkit/core/utilities/submission-helpers.ts).

## Timing and configuration

Error timing and warning timing resolve independently:

| Priority            | Error channel          | Warning channel          |
| ------------------- | ---------------------- | ------------------------ |
| Explicit input      | `strategy`             | `warningStrategy`        |
| Form context        | `errorStrategy`        | `warningStrategy`        |
| Applicable provider | `defaultErrorStrategy` | `defaultWarningStrategy` |
| Built-in fallback   | `on-touch`             | `on-touch`               |

Component-scoped configuration overrides app configuration per key. Visual
settings such as appearance have no form-context tier. See
[configuration](../packages/toolkit/README.md#configuration).

Omitting a field strategy and setting `inherit` both defer to context/config.
The form input accepts resolved values, not `inherit`; when omitted it reads
configuration. Global defaults also take resolved values.

| Value       | Visibility                               |
| ----------- | ---------------------------------------- |
| `immediate` | When validation reports feedback         |
| `on-touch`  | After touch or a recorded submit attempt |
| `on-submit` | After a recorded submit attempt          |

Use `ngxSignalForm` beside `[formRoot]` for shared submitted status. Standalone
factories using `on-submit` must receive that status explicitly.

### When warnings appear — `warningStrategy`

A visible blocking error suppresses warnings in the single-field feedback
slot. Headless aggregate signals keep warning and error visibility separate.
The styled fieldset chooses errors when both categories are visible; the
styled form error summary renders blocking errors only. See the
[summary comparison](./COMPLEX_NESTED_FORMS.md#error-summaries-across-the-whole-form).

Two exceptions matter when composing your own markup:

- `NgxHeadlessErrorState.errorsOverride` makes both visibility signals true.
  The caller supplies already-filtered errors and owns timing and precedence.
- Standalone auto-ARIA's error path currently omits the config-default tier.
  Do not assume it resolves exactly like headless error state. Prefer shared
  form context or a wrapper for consistent configured timing.

Native `:user-invalid` has its own interaction policy. It is not equivalent to
`on-touch` and cannot represent all schema, server, or warning errors.

## Rendering and ARIA

The wrapper renders feedback automatically. In your own layout, import
`NgxFormFieldError` from `/assistive`, give the control a label and stable ID,
and pass that identity as `fieldName`.

Let one system own ARIA. If your renderer binds the attributes, set
`ngxSignalFormControlAria="manual"` on the bound control. Keep live-region hosts
mounted and update their content. Use the same visibility predicate for
feedback and its description IDs.

Wrapper/assistive IDs name containers, such as `email-error` and
`email-warning`. Headless message IDs name individual entries, such as
`email-error-required`. They are not interchangeable. Preserve the containers
or update `aria-describedby` when changing renderers.

Use occurrence-safe loop keys such as `$index` for a rendered message list.
Several errors may share a kind. Do not use the kind alone as a key or DOM ID
when duplicates are possible.

The toolkit uses alert/status roles without redundant live-region attributes.
These semantics do not guarantee an announcement in every browser and screen
reader. Test the complete interaction, including focus and persistent labels.

## Errors and message resolution

`errors()` returns direct field errors. `errorSummary()` includes descendants.
Submission guards must inspect the summary, not only root `errors()`.

Use `splitByKind()` for `{ blocking, warnings }`, or `isBlockingError()` and
`isWarningError()` for one item. These helpers are exported from the root.

### Message resolution

The display message resolves in this order:

1. The validator's explicit `message`.
2. An error-message registry entry.
3. A built-in message for a known kind, or a humanized unknown kind.

The fallback is not always `Invalid`. An internal custom kind can become
visible text. Supply a message or registry entry for consumer-facing rules.

```typescript
import { provideErrorMessages } from '@ngx-signal-forms/toolkit';

provideErrorMessages({
  required: 'This field is required',
  email: 'Enter a valid email address',
  minLength: ({ minLength }) => `Use at least ${minLength} characters`,
});
```

Render resolved messages, not raw `error.message`, which can be absent.

### Runtime language changes

A provider factory runs once per injector. String registry entries capture
their text then. For runtime language changes, use function entries that read
a reactive language signal each time they resolve a message. Calling a
translation method without reading a signal does not establish a reactive
dependency. See the [i18n demo](../apps/demo/src/app/05-advanced/i18n/README.md).

### Field label resolution

Summary labels use `humanizeFieldPath()` by default. For example,
`address.postalCode` becomes `Address / Postal code`.

```typescript
import { provideFieldLabels } from '@ngx-signal-forms/toolkit';

provideFieldLabels({
  contactEmail: 'Email address',
  'address.postalCode': 'Postal code',
});
```

A factory may return a resolver for dynamic paths. That resolver must read a
reactive language signal to update on language changes. Labels are display
text, not field identity. The current styled summary can produce duplicate
render keys for distinct fields with identical labels, kinds, and messages.
Use distinct labels as a workaround; see runtime concern R02 in the
[nested-forms guide](./COMPLEX_NESTED_FORMS.md#field-labels-for-deep-paths).

## Related guides

- [Theming](../packages/toolkit/form-field/THEMING.md)
- [Headless API](../packages/toolkit/headless/README.md)
- [Custom wrappers and ARIA ownership](./CUSTOM_WRAPPERS.md)
- [Migration from Vest Forms](./MIGRATING_FROM_NGX_VEST_FORMS.md)
- [RC.13 changes](./migrations/v1.0.0-rc.13.md)
