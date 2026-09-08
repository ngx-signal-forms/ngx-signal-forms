# Headless composition reference

Load this branch reference for custom markup, host composition, renderers, or
ARIA factories. It is not a separate model-invoked skill. Exact declarations
come from the [source index](api.md).

## Visibility and aggregation

Choose state before markup:

- `createErrorState({ field, fieldName, ... })` returns raw error/warning arrays
  and timing signals. It needs an injection context or an explicit `injector`.
  Render with `resolveValidationErrorMessage()` or use resolved directive state.
- `createErrorMessageSignal()` returns `{ kind, message, id, error }` entries.
  `includeWarnings` selects blocking-only by default, both with `true`, or only
  warnings with `'only'`. Errors and warnings keep separate timing cascades.
  Message IDs do not replace wrapper container IDs. See
  [message contracts](https://github.com/ngx-signal-forms/ngx-signal-forms/blob/main/packages/toolkit/headless/README.md#createerrormessagesignal).
- `createErrorVisibility()` and `createWarningVisibility()` resolve explicit
  strategy, form context, explicit `configDefault`, then `on-touch`. Pass the
  provider default when composing these low-level helpers yourself. Higher-level
  state factories supply it. A direct `createShowErrorsComputed()` call never
  injects form context; pass submitted status for `on-submit`.
- `createFieldsetAggregation()` and `createErrorSummaryEntries()` are pure,
  with no DI requirement. Supply a reader of `field()` or `formTree()` plus
  separate pre-resolved `showErrors` and `showWarnings` signals. For aggregate
  warning timing, use `hasWarnings: true` and let aggregation test presence.
  Do not pass group-wide `errorVisibility` to suppress sibling warnings.
- `NgxHeadlessErrorState.errorsOverride` supplies already-filtered messages and
  makes both timing flags true. The caller owns timing and precedence. The
  internal `connectFieldState()` bridge is not a published consumer API.
- `NgxHeadlessNotification` accepts an array, signal, or reader through `errors`.
  Omitted/undefined means empty; use `[]`, not `null`, for no messages. A blocking
  error selects the alert container; a warning-only list selects status. There
  is no `tone` input.
- Headless counters require both `field` and `maxLength`; they do not read the
  validator limit. `createCharacterCount()` uses fractional thresholds, while
  styled counters expose percent-based CSS thresholds.
- `summarizeFieldOptionality()` and `createFieldOptionalitySummary()` report
  required/optional leaves. A mixed form can set both flags; an empty form sets
  neither. Use them for custom legends instead of traversing the tree again.

Read [headless contracts](https://github.com/ngx-signal-forms/ngx-signal-forms/blob/main/packages/toolkit/headless/README.md#reactive-primitives)
for raw versus resolved state, aggregation filtering, and result shapes.

### Summary and notification templates

In an existing form, import `NgxHeadlessErrorSummary` in the declaring template.
Each summary gate includes presence. Warning rows use their own gate, never
`shouldShow()`. Keep live regions mounted before their first message:

```html
<section ngxHeadlessErrorSummary #summary="errorSummary" [formTree]="myForm">
  <div role="alert">
    @if (summary.shouldShow()) { @for (entry of summary.entries(); track $index)
    {
    <button type="button" (click)="entry.focus()">
      {{ entry.fieldName }}: {{ entry.message }}
    </button>
    } }
  </div>
  <div role="status">
    @if (summary.shouldShowWarnings()) { @for (entry of
    summary.warningEntries(); track $index) {
    <p>{{ entry.fieldName }}: {{ entry.message }}</p>
    } }
  </div>
</section>
```

For a pre-filtered `addressErrors` source, import `NgxHeadlessNotification`:

```html
<section
  ngxHeadlessNotification
  #notice="notificationState"
  [errors]="addressErrors"
  fieldName="address"
>
  <div
    role="alert"
    [attr.id]="notice.showErrorContainer() ? notice.errorContainerId() : null"
  >
    @if (notice.showErrorContainer()) { @for (message of
    notice.resolvedMessages(); track $index) {
    <p>{{ message.message }}</p>
    } }
  </div>
  <div
    role="status"
    [attr.id]="notice.showWarningContainer() ? notice.warningContainerId() : null"
  >
    @if (notice.showWarningContainer()) { @for (message of
    notice.resolvedMessages(); track $index) {
    <p>{{ message.message }}</p>
    } }
  </div>
</section>
```

## Manual ARIA example

This standalone example uses the same feedback gates for content and description
IDs. The CSS probe reads the input that carries `aria-invalid`. Error state
returns raw errors, so the template resolves their copy. Both live-region hosts
exist before interaction.

```typescript
import {
  Component,
  computed,
  ElementRef,
  inject,
  Injector,
  signal,
  viewChild,
} from '@angular/core';
import {
  form,
  FormField,
  required,
  email,
  type FieldState,
} from '@angular/forms/signals';
import {
  NgxSignalFormToolkit,
  createControlVisibilitySignal,
  resolveValidationErrorMessage,
} from '@ngx-signal-forms/toolkit';
import {
  createErrorState,
  createAriaInvalidSignal,
  createAriaRequiredSignal,
  createAriaDescribedBySignal,
} from '@ngx-signal-forms/toolkit/headless';

@Component({
  selector: 'app-manual-email',
  imports: [FormField, NgxSignalFormToolkit],
  template: `
    <form [formRoot]="emailForm">
      <div [hidden]="emailForm.email().hidden()">
        <label for="email">Email</label>
        <input
          #control
          id="email"
          type="email"
          [formField]="emailForm.email"
          ngxSignalFormControlAria="manual"
          [attr.aria-invalid]="ariaInvalid()"
          [attr.aria-required]="ariaRequired()"
          [attr.aria-describedby]="describedBy()"
        />
        <p id="email-hint">Use an address you can access.</p>
        <div
          role="alert"
          [attr.id]="showBlocking() ? errorState.errorId() : null"
        >
          @if (showBlocking()) {
            @for (error of errorState.errors(); track $index) {
              <p>{{ message(error) }}</p>
            }
          }
        </div>
        <div
          role="status"
          [attr.id]="showWarnings() ? errorState.warningId() : null"
        >
          @if (showWarnings()) {
            @for (warning of errorState.warnings(); track $index) {
              <p>{{ message(warning) }}</p>
            }
          }
        </div>
      </div>
      <button type="submit" [disabled]="emailForm().submitting()">
        Save email
      </button>
    </form>
  `,
})
export class ManualEmailComponent {
  readonly #model = signal({ email: '' });
  protected readonly message = resolveValidationErrorMessage;
  protected readonly savedEmail = signal<string | null>(null);
  protected readonly emailForm = form(
    this.#model,
    (path) => {
      required(path.email);
      email(path.email);
    },
    {
      submission: {
        action: async (tree) => {
          this.savedEmail.set(tree().value().email);
        },
      },
    },
  );
  readonly #control = viewChild<ElementRef<HTMLInputElement>>('control');
  readonly #fieldState = computed<FieldState<unknown>>(() =>
    this.emailForm.email(),
  );
  readonly #controlVisible = createControlVisibilitySignal(
    () => this.#control()?.nativeElement ?? null,
    inject(Injector),
  );
  protected readonly errorState = createErrorState({
    field: this.emailForm.email,
    fieldName: 'email',
  });
  protected readonly showBlocking = computed(
    () => this.errorState.shouldShowErrors() && this.errorState.hasErrors(),
  );
  protected readonly showWarnings = computed(
    () =>
      !this.showBlocking() &&
      this.errorState.shouldShowWarnings() &&
      this.errorState.hasWarnings(),
  );
  protected readonly ariaInvalid = createAriaInvalidSignal(
    this.#fieldState,
    this.errorState.shouldShowErrors,
    this.#controlVisible,
  );
  protected readonly ariaRequired = createAriaRequiredSignal(this.#fieldState);
  protected readonly describedBy = createAriaDescribedBySignal({
    fieldState: this.#fieldState,
    fieldName: () => 'email',
    hintIds: signal<readonly string[]>(['email-hint']),
    preservedIds: () => null,
    visibility: this.errorState.shouldShowErrors,
    warningVisibility: this.showWarnings,
  });
}
```

For library-owned `aria-describedby`, use `createAriaDescribedByBridge()` rather
than adding a competing host binding. The factories do not decide ownership or
read layout. See the deeper [ARIA composition doc](https://github.com/ngx-signal-forms/ngx-signal-forms/blob/main/docs/CUSTOM_WRAPPERS.md#composing-aria-primitives).

## Control visibility

Manual ARIA composition owns the visibility probe. Pass the actual attribute
carrier to `createControlVisibilitySignal(resolveElement, injector)`, then pass
its result as the third argument of `createAriaInvalidSignal`. If the wrapper
already has a render hook, use `isElementCssVisible(element)` in `earlyRead`
and publish/write in `write`. Do not probe a laid-out wrapper instead of its
hidden inner input or combobox.

The helpers fail open where `checkVisibility()` is unavailable; jsdom cannot
prove layout behavior. The signal helper also stays true until the target is
available. `identity.isControlVisible()` is a cached flag;
`identity.isControlVisible(element)` is a non-reactive probe, not a render hook.
For radios, test each option independently, then the whole collapsed group.
Reopen after changing validation. Use [browser checks](../testing/guide.md#browser-state-checks).

## Host composition

For a reusable wrapper, compose error state on the host. If the control's ID is
not the field name, also compose `NgxFieldIdentityProvider` from the root:

```typescript
hostDirectives: [
  {
    directive: NgxHeadlessErrorState,
    inputs: [
      'field',
      'fieldName',
      'strategy',
      'warningStrategy',
      'submittedStatus',
    ],
  },
  { directive: NgxFieldIdentityProvider, inputs: ['fieldName'] },
];
```

This is component metadata, not a complete wrapper. Bind the shared `fieldName`
once. Use the injected error state's resolved messages with the stable-region
pattern above. Give the wrapper's own tree input the name `field` so it does not
accidentally match `[formField]` directives.

The provider is selectorless and must be on the wrapper host. It publishes only
the name, not hints or timing. A bound `fieldName: null` claims the naming
channel but marks it unresolved, so ARIA identity wiring waits rather than
falling back to a control ID. Unbound input publishes nothing but still claims
that channel. It also has no control-ID fallback. Third-party wrappers must
bind the input; identity writer methods remain internal.

Publish the other channels separately:

- `NGX_SIGNAL_FORM_FIELD_CONTEXT` supplies the resolved `fieldName` signal for
  projected hints. An optional `hintOrdinal` reader returns a zero-based
  unnamed-hint position, with `0` for unknown, never `-1`. Fallback IDs are
  `${fieldName}-hint`, then `-hint-2`, `-hint-3`. Otherwise give hints unique IDs.
- `NGX_SIGNAL_FORM_HINT_REGISTRY` supplies a reactive descriptor array of
  `{ id, fieldName }`. Map projected hint `resolvedId()` and
  `resolvedFieldName()` values. Identity `hintIds: null` means unpublished and
  permits registry fallback; `[]` is authoritative and suppresses that fallback.
  Identity precedence is per channel, not all-or-nothing.
- `NGX_SIGNAL_FORM_FIELD_VISIBILITY_REGISTRY`, supplied by `ngxSignalForm`,
  registers `fieldName`, `errorContainerVisible`, and `warningContainerVisible`
  readers. Register the booleans gating content and active IDs, not host
  existence or a strategy for auto-ARIA to resolve again. Clean up registration
  on change/destruction. Keep error and warning timing independent.

Import projected hints and auto-ARIA in the template that declares them;
wrapper imports do not apply to consumer projection. The public identity read
signals can be inspected, but do not call internal identity writers or
`connectFieldState()`. For a complete wrapper example, read the deeper
[wrapper channels doc](https://github.com/ngx-signal-forms/ngx-signal-forms/blob/main/docs/CUSTOM_WRAPPERS.md#which-seam-publishes-what).

## Renderer overrides

Inject `NGX_FORM_FIELD_ERROR_RENDERER` optionally and fall back to
`NgxFormFieldError`. The app/component `provideFormFieldErrorRenderer` helpers
select a standalone component. A shared renderer must declare the union of
both callers' Angular inputs and keep inputs absent from one caller optional:

| Caller         | Supplied inputs                                                            |
| -------------- | -------------------------------------------------------------------------- |
| Wrapper        | `formField`, `strategy`, `submittedStatus`, `warningStrategy`, `fieldName` |
| Plain fieldset | `errors`, `fieldName`, `strategy`, `submittedStatus`, `listStyle`          |

The wrapper passes a tree and a nullable resolved name. Preserve independent
warning timing. The plain fieldset passes a signal of already visibility-filtered
errors and its resolved ID. Render that array directly. If using
`NgxHeadlessErrorState.errorsOverride`, remember it bypasses timing; the caller
owns filtering and precedence. The fieldset's `auto`/`notification` branches
use the built-in panel, not this override.

Keep separate `role="alert"` and `role="status"` hosts mounted before updates.
Gate their content and active `${fieldName}-error` / `${fieldName}-warning` IDs
together. Never generate IDs from `null`. Per-message IDs do not replace those
container IDs. Verify that each description token reaches a unique element.

`NgxFormFieldHint` dispatches `NGX_FORM_FIELD_HINT_RENDERER` itself. Hint renderers
declare `resolvedFieldName: string | null`, `resolvedId: string`, and
`position: 'left' | 'right' | null` as inputs. They expose a default
`<ng-content />` slot for projected content. The hint host owns the ID; copying
it to an inner element creates a duplicate. Missing declared inputs fail at
`componentRef.setInput()`.

For provider examples and full input-map code, read the deeper
[renderer interface](https://github.com/ngx-signal-forms/ngx-signal-forms/blob/main/docs/CUSTOM_WRAPPERS.md#the-renderer-interface).
Before calling this branch complete, use the [headless Done criteria](../headless/guide.md#done)
and the [browser-state checks](../testing/guide.md#browser-state-checks).
