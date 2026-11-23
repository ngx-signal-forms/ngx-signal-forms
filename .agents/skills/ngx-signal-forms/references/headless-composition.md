# Headless composition reference

Detailed contracts for custom wrappers, headless primitives, manual ARIA, and renderer overrides.
Confirm exact signatures via [api.md](api.md).

## Field presentation for wrappers

Use `createFieldPresentation(fieldState, options?)` from `@ngx-signal-forms/toolkit` in custom wrappers so message timing matches `NgxFormFieldWrapper` and the Material, PrimeNG, and Spartan reference wrappers:

```typescript
protected readonly presentation = createFieldPresentation(
  computed(() => this.field()()),
  {
    strategy: this.strategy,
    warningStrategy: this.warningStrategy,
    identity: inject(NgxFieldIdentity, { optional: true }),
  },
);
```

- Options: `strategy`, `warningStrategy` (independent of `strategy`), `hidden` (defaults to the field's `hidden()`), `identity` (publishes resolved strategies to `NgxFieldIdentity` so auto-ARIA stays in sync), and `injector` (when called outside an injection context).
- Returned signals: `errors`, `warnings`, `hasErrors`, `hasWarnings`, `showErrors`, `showWarnings` (`false` while blocking errors show), `renderMessageSlot`, `effectiveStrategy`, and `effectiveWarningStrategy`.
- See [CUSTOM_WRAPPERS.md#createfieldpresentation](https://github.com/ngx-signal-forms/ngx-signal-forms/blob/main/docs/CUSTOM_WRAPPERS.md#createfieldpresentation).

## Visibility and aggregation

- `createErrorState({ field, fieldName, ... })`: needs an injection context or explicit `injector`. Returns raw error/warning arrays and timing signals; format copy with `resolveValidationErrorMessage()` or use resolved directive signals.
- `createErrorMessageSignal()`: returns `{ kind, message, id, error }` entries with independent error and warning cascades. `includeWarnings` accepts `false` (default, errors only), `true` (both), or `'only'` (warnings only). Per-message IDs do not replace `{fieldName}-error` / `{fieldName}-warning` container IDs.
- `createErrorVisibility()` and `createWarningVisibility()`: resolve explicit strategy -> form context -> explicit `configDefault` -> `'on-touch'`. These low-level factories do not inject `NGX_SIGNAL_FORMS_CONFIG`; pass `configDefault` when needed, and pass `submittedStatus` explicitly for `'on-submit'` outside `ngxSignalForm`.
- `createFieldsetAggregation()` and `createErrorSummaryEntries()`: pure factories (no DI). Pass a `fieldState` reader plus separate pre-resolved `showErrors` and `showWarnings` signals. For aggregate warnings, pass `hasWarnings: true` to `createWarningVisibility()` and avoid passing form-wide `errorVisibility` (an error on one field must not hide a sibling field's warning).
- Summary entries expose `key`, `kind`, `message`, `fieldName`, `focus()`, and `canFocus`. Track `@for` rows by `entry.key`, and render entries with `canFocus: false` as plain text.
- Read direct errors with `readDirectErrors()`, subtree errors with `field().errorSummary()`, and flags with `field().invalid()` or `createFieldStateFlags()`.
- `NgxHeadlessErrorState.errorsOverride` supplies already-filtered messages and sets both timing flags `true`; the caller owns timing and precedence.
- `createFieldOptionalitySummary()` reports `hasRequired()` and `hasOptional()` leaves for custom marking legends.

### Summary template

Keep live-region hosts mounted before their first message and gate errors and warnings separately:

```html
<section ngxHeadlessErrorSummary #summary="errorSummary" [formTree]="myForm">
  <div role="alert">
    @if (summary.shouldShow()) { @for (entry of summary.entries(); track
    entry.key) { @if (entry.canFocus) {
    <button type="button" (click)="entry.focus()">
      {{ entry.fieldName }}: {{ entry.message }}
    </button>
    } @else {
    <p>{{ entry.fieldName }}: {{ entry.message }}</p>
    } } }
  </div>
  <div role="status">
    @if (summary.shouldShowWarnings()) { @for (entry of
    summary.warningEntries(); track entry.key) {
    <p>{{ entry.fieldName }}: {{ entry.message }}</p>
    } }
  </div>
</section>
```

## Manual ARIA example

Opt out of auto-ARIA on the bound control with `ngxSignalFormControlAria="manual"`.
Use the same visibility gates for rendered content and `aria-describedby` IDs, probe CSS visibility on the element carrying `aria-invalid`, and keep live-region hosts mounted:

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
  email,
  form,
  FormField,
  required,
  type FieldState,
} from '@angular/forms/signals';
import {
  createControlVisibilitySignal,
  NgxSignalFormToolkit,
  resolveValidationErrorMessage,
} from '@ngx-signal-forms/toolkit';
import {
  createAriaDescribedBySignal,
  createAriaInvalidSignal,
  createAriaRequiredSignal,
  createErrorState,
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

When a third-party control library writes `aria-describedby` itself, compose `createAriaDescribedByBridge()` instead of adding a competing host binding. See [CUSTOM_WRAPPERS.md#composing-aria-primitives](https://github.com/ngx-signal-forms/ngx-signal-forms/blob/main/docs/CUSTOM_WRAPPERS.md#composing-aria-primitives).

## Control visibility

Manual ARIA composition owns the visibility probe:

- Pass a resolver for the actual element carrying `aria-invalid` (not a laid-out wrapper) to `createControlVisibilitySignal(resolveElement, injector)`, then pass the signal as the third argument of `createAriaInvalidSignal()`.
- Inside an existing `afterEveryRender` hook, call `isElementCssVisible(element)` during `earlyRead` and publish state during `write`.
- Both helpers fail open where `checkVisibility()` is unavailable (jsdom cannot prove layout visibility). `createControlVisibilitySignal()` stays `true` until its target resolves.
- Verify single-option hide, full-group collapse, and reopen in a real browser ([testing/guide.md#browser-state-checks](../testing/guide.md#browser-state-checks)).

## Host composition

Compose `NgxFieldIdentityProvider` (imported from `@ngx-signal-forms/toolkit`, not `/headless`) on your wrapper host when the control's `id` differs from the field name, and name the wrapper's field-tree input `field` (not `formField`, which triggers Angular's `[formField]` directive on the wrapper host):

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

Channel contracts (identity precedence is per channel, not all-or-nothing):

- **Name channel (`NgxFieldIdentityProvider`):** selectorless host directive that publishes only the name. Bound `fieldName: null` or an unbound input claims the channel without falling back to a control ID; always bind `fieldName` on custom wrappers.
- **Field context (`NGX_SIGNAL_FORM_FIELD_CONTEXT`):** supplies `fieldName` (`Signal<string | null>`), optional `hintOrdinal(hint)` (zero-based unnamed-hint index; return `0`, never `-1`, for unknown hints), and optional `isControlDescribedByManaged()` (return `true` only when auto-ARIA writes `aria-describedby` AND the wrapper registers `NgxFormFieldCharacterCount.limitId()` in the hint registry; otherwise omit so visible count text stays exposed).
- **Hint registry (`NGX_SIGNAL_FORM_HINT_REGISTRY`):** exposes reactive `{ id, fieldName }` descriptors from projected `NgxFormFieldHint` (`resolvedId()`, `resolvedFieldName()`) and `NgxFormFieldCharacterCount` (`limitId()`, skipping `null`). Identity `hintIds: null` falls back to the registry; `[]` is authoritative and suppresses fallback.
- **Visibility registry (`NGX_SIGNAL_FORM_FIELD_VISIBILITY_REGISTRY`):** supplied by `ngxSignalForm`. Register `fieldName`, `errorContainerVisible`, and `warningContainerVisible` (booleans gating active IDs and content). `NgxHeadlessErrorState` with a `fieldName` registers itself automatically; set its `renders` input (`'errors' | 'warnings' | 'both'`) if your template renders only one channel so `aria-describedby` omits missing IDs while `aria-invalid` still follows error state.

Import projected hints and auto-ARIA in the consumer template that declares them.
See [CUSTOM_WRAPPERS.md#which-seam-publishes-what](https://github.com/ngx-signal-forms/ngx-signal-forms/blob/main/docs/CUSTOM_WRAPPERS.md#which-seam-publishes-what).

## Renderer overrides

Use `provideFormFieldErrorRenderer()` / `provideFormFieldHintRenderer()` (and `*ForComponent` variants) to replace the default standalone renderers injected via `NGX_FORM_FIELD_ERROR_RENDERER` / `NGX_FORM_FIELD_HINT_RENDERER`.

A shared error renderer must declare the union of both callers' inputs (keeping inputs absent from one caller optional):

| Caller         | Supplied inputs                                                            |
| -------------- | -------------------------------------------------------------------------- |
| Wrapper        | `formField`, `strategy`, `submittedStatus`, `warningStrategy`, `fieldName` |
| Plain fieldset | `errors`, `fieldName`, `strategy`, `submittedStatus`, `listStyle`          |

- Plain fieldset passes already visibility-filtered `errors` and its resolved ID; render that array directly. Fieldset `auto` and `notification` modes use the built-in panel instead of this override.
- Keep separate `role="alert"` and `role="status"` hosts mounted, and gate content and `${fieldName}-error` / `${fieldName}-warning` IDs together. Skip ID generation when `fieldName` is `null`.
- Hint renderers declare optional `resolvedFieldName: string | null`, `resolvedId: string`, and `position: 'left' | 'right' | null`, plus a default `<ng-content />`. The `NgxFormFieldHint` host owns the DOM `id`; do not duplicate `resolvedId` onto an inner element.
- Angular logs dev-mode `NG0303` for undeclared inputs passed via `setInput()` (throwing if `errorOnUnknownProperties` is enabled).

See [CUSTOM_WRAPPERS.md#the-renderer-interface](https://github.com/ngx-signal-forms/ngx-signal-forms/blob/main/docs/CUSTOM_WRAPPERS.md#the-renderer-interface).
