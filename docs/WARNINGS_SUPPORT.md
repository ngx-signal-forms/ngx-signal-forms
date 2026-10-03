---
title: 'Warnings, timing, and messages'
---

This guide covers three things. Warnings are validation results that give
advice but do not block submit. Timing decides when errors and warnings become
visible. Messages and field labels decide what text the user sees, including
translated text. Read it when you add a non-blocking rule, change when feedback
shows, or localize messages.

- [The `warn:` convention](#the-warn-convention)
- [Form submission behavior](#form-submission-behavior)
- [Timing and configuration](#timing-and-configuration)
- [Rendering and ARIA](#rendering-and-aria)
- [Errors and message resolution](#errors-and-message-resolution)
- [Field label resolution](#field-label-resolution)

<a id="the-warn-convention"></a>

## The `warn:` convention

An Angular validation error has a `kind` and an optional `message`. The toolkit
treats a kind that starts with `warn:` as a warning. Angular still counts a
warning as an error for `invalid()` and for ordinary submission.

| Kind            | Toolkit display                | Ordinary Angular submission | Warning-aware submission |
| --------------- | ------------------------------ | --------------------------- | ------------------------ |
| Without `warn:` | Blocking error, `role="alert"` | Blocks                      | Blocks                   |
| With `warn:`    | Warning, `role="status"`       | Blocks                      | Passes                   |

```typescript
import { validate } from '@angular/forms/signals';
import { warningError } from '@ngx-signal-forms/toolkit';

// In the schema function
validate(path.password, ({ value }) =>
  value().length < 12
    ? warningError('short-password', 'Use 12 or more characters')
    : null,
);
```

Pass the bare kind to `warningError()`. It adds the `warn:` prefix, and it does
not add it twice. A validator can also return a plain
`{ kind: 'warn:short-password', message: '...' }`. The Vest adapter adds the
prefix to Vest warnings. See the [Vest reference](/packages/toolkit/vest/README).

### When a warning is the wrong tool

Use a blocking error when saving would break a required rule. Use a hint for
static advice that does not depend on the value. Use a warning only for advice
that the user may ignore. A warning is never a way to skip a security or
business check.

## Form submission behavior

A warning is still an Angular validation error, so Angular's `submit()` blocks
it by default. You have two ways to let warnings through. Prefer pattern A.

### A. Declarative: `[formRoot]` with a warnings guard (preferred)

Keep `[formRoot]` and `ngxSignalForm` on the form. Set
`ignoreValidators: 'all'` in the submission options, and check for blocking
errors at the start of the action:

```typescript
import { Component, signal } from '@angular/core';
import { form, FormField } from '@angular/forms/signals';
import {
  createOnInvalidHandler,
  hasOnlyWarnings,
  NgxSignalFormToolkit,
} from '@ngx-signal-forms/toolkit';
import { NgxFormField } from '@ngx-signal-forms/toolkit/form-field';
import { signupSchema } from './signup.validations';

@Component({
  selector: 'app-signup',
  imports: [FormField, NgxSignalFormToolkit, NgxFormField],
  templateUrl: './signup.html',
})
export class SignupComponent {
  readonly #model = signal({ email: '', password: '' });
  readonly #onInvalid = createOnInvalidHandler();

  readonly signupForm = form(this.#model, signupSchema, {
    submission: {
      ignoreValidators: 'all',
      action: async (tree) => {
        if (!hasOnlyWarnings(tree().errorSummary())) {
          this.#onInvalid(tree);
          return;
        }
        // Save tree().value() here.
      },
    },
  });
}
```

```html
<!-- signup.html -->
<form [formRoot]="signupForm" ngxSignalForm>
  <ngx-form-field-wrapper [formField]="signupForm.password">
    <label for="signup-password">Password</label>
    <input
      id="signup-password"
      type="password"
      autocomplete="new-password"
      [formField]="signupForm.password"
    />
  </ngx-form-field-wrapper>
  <button type="submit" [disabled]="signupForm().submitting()">
    Create account
  </button>
</form>
```

Prefer this pattern. Angular owns the submit event, `submitting()` works, and
`ngxSignalForm` records every submit attempt, so `on-submit` timing and the
error summary work with no extra code. The
[warning-support demo](https://github.com/ngx-signal-forms/ngx-signal-forms/blob/77ce2f7de996cc397982199d1b3822dedb259b29/apps/demo/src/app/02-toolkit-core/warning-support/README.md)
uses it.

Never use `ignoreValidators: 'all'` without the `hasOnlyWarnings()` check. It
would also skip real errors. Check `errorSummary()`, not `errors()`:
`errors()` holds only the root's own errors, and `errorSummary()` includes
every descendant. `hasOnlyWarnings([])` returns `true`.

Do not call `submitWithWarnings()` from inside `submission.action`. It returns
`false` while `submitting()` is `true`, so it does nothing there.

### B. Imperative: `submitWithWarnings()` with a native `(submit)` handler

Use this when you do not use `[formRoot]`, for example when you must run other
code before submit. Write one native `(submit)` handler, and do not add
`[formRoot]` to the same form:

```typescript
import { Component, signal } from '@angular/core';
import { form, FormField } from '@angular/forms/signals';
import { submitWithWarnings } from '@ngx-signal-forms/toolkit';
import { NgxFormField } from '@ngx-signal-forms/toolkit/form-field';
import { profileSchema } from './profile.validations';

@Component({
  selector: 'app-profile',
  imports: [FormField, NgxFormField],
  templateUrl: './profile.html',
})
export class ProfileComponent {
  readonly #model = signal({ displayName: '' });
  readonly profileForm = form(this.#model, profileSchema);

  protected async save(event: Event): Promise<void> {
    event.preventDefault();
    await submitWithWarnings(this.profileForm, async () => {
      // Save this.profileForm().value() here.
    });
  }
}
```

```html
<!-- profile.html -->
<form novalidate (submit)="save($event)">
  <ngx-form-field-wrapper [formField]="profileForm.displayName">
    <label for="profile-name">Display name</label>
    <input id="profile-name" [formField]="profileForm.displayName" />
  </ngx-form-field-wrapper>
  <button type="submit">Save</button>
</form>
```

`submitWithWarnings(formTree, action)` does these steps:

1. Returns `false` at once if the form is already submitting or another call
   for the same form is still running.
2. Marks the form and all descendants touched.
3. Waits one microtask, so synchronous validation results are up to date.
4. Returns `false` if `errorSummary()` holds a blocking error.
5. Calls Angular `submit()` with `ignoreValidators: 'all'`, which runs your
   action and sets `submitting()` while it runs.

It returns `Promise<boolean>`: `true` after the action finishes, `false` when
it refused or dropped the call. If the action throws, the error reaches the
caller, and the form can be submitted again. `true` means only that your action
ran.

This form has no `ngxSignalForm`, so nothing records a refused submit. For
`on-submit` timing, pass your own flag to
`createSubmittedStatusTracker(form, submitAttempted)` and set it to `true` when
`submitWithWarnings()` returns `false`. Do not read every `false` as a
validation failure. A dropped double-click also returns `false`.

To disable the button, use `canSubmitWithWarnings(form)`. It is `false` while
the form is submitting or while blocking errors remain.

### Pending async validators

Neither pattern waits for async validators. A pending validator does not block
`hasOnlyWarnings()`, `canSubmitWithWarnings()`, or `submitWithWarnings()`, and
the one-microtask wait in `submitWithWarnings()` does not wait for async
results. If a check must finish before you save, enforce that in your action.
Always validate the submitted data on the server too.

## Timing and configuration

A strategy decides when feedback shows:

| Value       | Feedback shows                                   |
| ----------- | ------------------------------------------------ |
| `immediate` | As soon as validation reports it                 |
| `on-touch`  | After the user leaves the field, or after submit |
| `on-submit` | After the first submit attempt                   |

Errors and warnings each have their own strategy. They resolve separately, so a
form can hold errors until submit and still show warnings early.

For each field, the toolkit uses the first value it finds in this order:

| Step | Where you set it                                                       | Errors                 | Warnings                 |
| ---- | ---------------------------------------------------------------------- | ---------------------- | ------------------------ |
| 1    | Input on the wrapper, fieldset, error, or headless summary             | `strategy`             | `warningStrategy`        |
| 2    | `ngxSignalForm` on the `<form>`                                        | `errorStrategy`        | `warningStrategy`        |
| 3    | `provideNgxSignalFormsConfigForComponent()` in a component's providers | `defaultErrorStrategy` | `defaultWarningStrategy` |
| 4    | `provideNgxSignalFormsConfig()` in the app providers                   | `defaultErrorStrategy` | `defaultWarningStrategy` |
| 5    | Built-in default                                                       | `on-touch`             | `on-touch`               |

```typescript
// Step 4: app.config.ts
provideNgxSignalFormsConfig({
  defaultErrorStrategy: 'on-submit',
  defaultWarningStrategy: 'on-touch',
});
```

```html
<!-- Step 2: one form -->
<form [formRoot]="form" ngxSignalForm errorStrategy="on-submit">
  <!-- Step 1: one field -->
  <ngx-form-field-wrapper [formField]="form.email" strategy="immediate">
    <label for="email">Email</label>
    <input id="email" [formField]="form.email" />
  </ngx-form-field-wrapper>
</form>
```

Details:

- A field input set to `'inherit'` acts as if you left it out. The
  `ngxSignalForm` inputs and the config keys take only real values
  (`immediate`, `on-touch`, `on-submit`), not `'inherit'`.
- A component provider changes only the keys you pass. Other keys come from
  the provider above it.
- When the form has `ngxSignalForm`, step 2 always gives a value. If you do
  not set `errorStrategy`, it uses the configuration that the `<form>` element
  sees. A component provider below the form does not change timing for fields
  in that form.
- Visual settings, such as `appearance`, `orientation`, and required or
  optional markers, skip step 2. `ngxSignalForm` has no visual inputs, so the
  wrapper goes from its own input to the component provider, the app
  provider, and the built-in default.
- If you bind `errorsOverride` on `NgxHeadlessErrorState`, you own the timing.
  Both visibility signals are then `true`.

Add `ngxSignalForm` next to `[formRoot]` to share the submit status with every
field. A standalone factory that uses `on-submit` outside such a form must get
the submit status through its options.

The full list of configuration keys is in the
[toolkit configuration reference](/packages/toolkit/README#configuration).

Native `:user-invalid` uses the browser's own timing. It is not the same as
`on-touch`, and it cannot see schema errors, server errors, or warnings.

<a id="when-warnings-appear--warningstrategy"></a>

### When warnings appear — `warningStrategy`

`warningStrategy` uses the same values and the same order as the error
strategy, with a separate built-in default of `on-touch`.

When a field has a visible blocking error, the field's feedback slot shows the
error and hides the warning. Other components handle both kinds like this:

- The styled fieldset shows errors when both errors and warnings are visible.
- The styled error summary shows blocking errors only.
- The headless directives keep separate visibility signals for errors and
  warnings, so you decide what to render.

See the [summary comparison](/docs/COMPLEX_NESTED_FORMS#error-summaries-across-the-whole-form).

## Rendering and ARIA

The wrapper renders errors and warnings for you. In your own layout, import
`NgxFormFieldError` from `@ngx-signal-forms/toolkit/assistive`. Give the
control a label and a stable `id`, and pass that `id` as `fieldName`:

```html
<label for="email">Email</label>
<input id="email" type="email" [formField]="form.email" />
<ngx-form-field-error [formField]="form.email" fieldName="email" />
```

If you render feedback yourself or build a wrapper, see
[custom wrappers](/docs/CUSTOM_WRAPPERS) for the element IDs, live regions, and
ARIA rules. Always test the finished form with a screen reader.

## Errors and message resolution

`errors()` returns the field's own errors. `errorSummary()` also includes the
errors of every descendant field.

To separate warnings from blocking errors, use `splitByKind(errors)`, which
returns `{ blocking, warnings }`. For one error, use `isBlockingError()` or
`isWarningError()`. All three come from `@ngx-signal-forms/toolkit`.

### Message resolution

The toolkit picks the displayed text in this order:

1. The validator's `message`.
2. An entry in the error-message registry.
3. A built-in message for a known kind, or the kind turned into words for an
   unknown kind.

Step 3 can show an internal kind name to the user. Give every rule that users
see a `message` or a registry entry.

```typescript
import { provideErrorMessages } from '@ngx-signal-forms/toolkit';

provideErrorMessages({
  required: 'This field is required',
  email: 'Enter a valid email address',
  minLength: ({ minLength }) => `Use at least ${minLength} characters`,
});
```

In custom markup, render the resolved message, not `error.message`, which can
be empty.

### Runtime language changes

A provider factory runs once per injector. A string entry keeps the text it had
at that time. To change language at runtime, use function entries that read a
language signal each time they run. A call to a translation method that does
not read a signal does not update when the language changes. The
[i18n demo](https://github.com/ngx-signal-forms/ngx-signal-forms/blob/77ce2f7de996cc397982199d1b3822dedb259b29/apps/demo/src/app/05-advanced/i18n/README.md) shows the pattern.

## Field label resolution

The error summary shows a label for each field. By default,
`humanizeFieldPath()` from `@ngx-signal-forms/toolkit/headless` builds it from
the field path. For example, `address.postalCode` becomes
`Address / Postal code`.

To set labels, pass a map to `provideFieldLabels()`:

```typescript
import { provideFieldLabels } from '@ngx-signal-forms/toolkit';

provideFieldLabels({
  contactEmail: 'Email address',
  'address.postalCode': 'Postal code',
});
```

For paths that change, such as array indexes, pass a factory that returns a
resolver function. See
[field labels for deep paths](/docs/COMPLEX_NESTED_FORMS#field-labels-for-deep-paths).
To translate labels at runtime, the resolver must read a language signal, the
same as message functions. The
[i18n demo](https://github.com/ngx-signal-forms/ngx-signal-forms/blob/77ce2f7de996cc397982199d1b3822dedb259b29/apps/demo/src/app/05-advanced/i18n/README.md) translates both
messages and labels.

A label is display text only. It does not identify the field.

**Known limitation:** the styled error summary tracks each entry by label,
error kind, and message. Two different fields with the same label, kind, and
message get the same tracking key. Give each field a distinct label.

## Related guides

- [Grouped fields, arrays, and error summaries](/docs/COMPLEX_NESTED_FORMS)
- [Headless API](/packages/toolkit/headless/README)
- [Custom wrappers](/docs/CUSTOM_WRAPPERS)
- [Theming](/packages/toolkit/form-field/THEMING)
- [Migration from ngx-vest-forms](/docs/MIGRATING_FROM_NGX_VEST_FORMS)
