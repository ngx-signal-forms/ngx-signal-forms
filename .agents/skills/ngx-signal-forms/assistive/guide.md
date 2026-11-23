# Toolkit Assistive

Covers `@ngx-signal-forms/toolkit/assistive`.
Use this entry point when you own the field layout and want pre-built, accessible feedback components.
Use [form-field/guide.md](../form-field/guide.md) for a complete styled field shell, or [headless/guide.md](../headless/guide.md) when you render every element yourself.

## Imports

`@ngx-signal-forms/toolkit/assistive` has no bundle; import each component you use (`NgxFormFieldError`, `NgxFormFieldErrorSummary`, `NgxFormFieldHint`, `NgxFormFieldCharacterCount`, `NgxFormMarkingLegend`).
Always import `NgxSignalFormToolkit` from `@ngx-signal-forms/toolkit` alongside them so auto-ARIA and `ngxSignalForm` are active.

## Components

### `NgxFormFieldError`

Renders blocking errors (`role="alert"`) and non-blocking warnings (`role="status"`).

- **Inline mode (`presentation="inline"`, default):** bind `[formField]` and provide `fieldName` matching the control's `id` when used outside `ngx-form-field-wrapper`. Inside a wrapper, `fieldName` is inherited. Add `ngxSignalForm` to `<form>` when setting field-level `strategy` or `warningStrategy` without a wrapper so auto-ARIA stays in sync.
- **Panel mode (`presentation="panel"`):** renders a bordered notification card for grouped fieldset or custom summaries. Pass `[errors]` (reactive or static `readonly ValidationError[]`), optional `title`, optional `fieldName` for deterministic IDs, and `listStyle="bullets"`. Tone routing is content-driven (there is no `tone` input): any blocking error uses `role="alert"`, a warning-only list uses `role="status"`, and an empty list hides both.
- **Screen-reader prefix:** each message includes a visually hidden `'Error:'` or `'Warning:'` prefix so screen readers distinguish channels. Sighted users do not see this prefix, so it does not satisfy WCAG 1.4.1 for them. Default inline icons are `none` (`--ngx-signal-form-error-icon`, `--ngx-signal-form-warning-icon`); add a visible icon or text when color alone would otherwise identify the channel. Configure via `errorPrefixText` / `warningPrefixText` in `provideNgxSignalFormsConfig()`, or pass `''` to disable. Applies even when `title` is set; not applied by `NgxFormFieldErrorSummary` or headless primitives. See `"Errors and warnings without color"` in the [assistive README](https://github.com/ngx-signal-forms/ngx-signal-forms/blob/main/packages/toolkit/assistive/README.md#errors-and-warnings-without-colour) for icon CSS hooks.

### `NgxFormFieldHint`

Static helper text.
Outside a wrapper, give the hint an `id` and include that id in the control's `aria-describedby` (auto-ARIA preserves authored ids).
Inside a wrapper, hints register automatically; unnamed hints receive `${fieldName}-hint`, `${fieldName}-hint-2`, and so on. Set an explicit `id` when stability across reordering matters.

### `NgxFormFieldCharacterCount`

Live character counter with progressive color states (`ok` -> `warning` -> `danger` -> `exceeded`).

- Bind `[formField]` to a `CharacterCountValue` field (`string | readonly string[] | null | undefined`). Unsupported value types render `0` and log a dev-mode warning.
- Omit `maxLength` to auto-detect from a `maxLength()` validator on the field.
- Outside a wrapper, set `fieldName` (one id token; inner whitespace becomes `-`) and add `${fieldName}-char-count-limit` to the control's `aria-describedby` so screen readers announce the limit on focus. Inside a wrapper, the wrapper links the limit automatically and ignores `fieldName`.
- `showLimitColors` (default `true`) and `liveAnnounce` (default `false`) are independent: `liveAnnounce` still announces threshold transitions at 80% / 95% / 100% even when `showLimitColors` is `false`. Localize announcements with `[announcementFormatter]` (`NgxCharacterCountAnnouncementFormatter`).
- Customize the visually hidden limit copy via `characterCountLimitText` in `provideNgxSignalFormsConfig()` (default `'Up to {max} characters'`).
- Override visual color thresholds in CSS only via `--ngx-form-field-char-count-warning-threshold` and `--ngx-form-field-char-count-danger-threshold` (plain numbers, percent of `maxLength`, defaults `80` and `95`).

### `NgxFormFieldErrorSummary`

Form-level blocking error summary (GOV.UK pattern).

- Place inside `<form [formRoot]="myForm" ngxSignalForm>`, above the first field.
- Pass the field tree (`[formTree]="myForm"`), not `myForm()`.
- Renders blocking errors only; use `NgxHeadlessErrorSummary` for warning entries.
- Each focusable entry renders as a button calling `focusBoundControl()`; errors without a focusable control render as plain text.
- Renders `summaryLabel` (default `'Please fix the following errors:'`) as a native `h2`-`h6` via `headingLevel` (default `2`), using `role="alert"` without redundant `aria-live` or `aria-atomic`.
- Inside `form[formRoot][ngxSignalForm]`, the summary announces alone after a submit (`errorSummaryAnnouncesAlone`, default `true`, ADR-0012): submit-revealed field errors render outside their `role="alert"` region while keeping their `${fieldName}-error` id, and later edits announce through the field as usual. Locate submit-revealed field errors in tests by `${fieldName}-error` id or text, not `[role="alert"]`.
- `autoFocus` (default `true`) moves focus to the summary after a failed submit under `'on-submit'`. Set `[autoFocus]="false"` when moving focus elsewhere (for example with `createOnInvalidHandler()`). It does not auto-focus under `'on-touch'` or `'immediate'`.

### `NgxFormMarkingLegend`

Form-level text explaining required or optional markers (plain visible text, no live region).
Place it once inside `form[formRoot][ngxSignalForm]`, or pass `[formTree]` when outside a form host.
Inherits `showMarkerWhen`, `text`, `requiredMarker`, and `optionalMarker` from `NgxSignalFormsConfig`, and hides automatically when no matching fields exist or in `'none'` mode.

## Standalone usage example

```typescript
import { Component, signal } from '@angular/core';
import {
  email,
  form,
  FormField,
  maxLength,
  required,
} from '@angular/forms/signals';
import { NgxSignalFormToolkit } from '@ngx-signal-forms/toolkit';
import {
  NgxFormFieldCharacterCount,
  NgxFormFieldError,
  NgxFormFieldErrorSummary,
  NgxFormFieldHint,
} from '@ngx-signal-forms/toolkit/assistive';

@Component({
  selector: 'app-profile-form',
  imports: [
    FormField,
    NgxSignalFormToolkit,
    NgxFormFieldError,
    NgxFormFieldErrorSummary,
    NgxFormFieldHint,
    NgxFormFieldCharacterCount,
  ],
  template: `
    <form [formRoot]="profileForm" ngxSignalForm errorStrategy="on-submit">
      <ngx-form-field-error-summary
        [formTree]="profileForm"
        summaryLabel="Please fix the following errors before submitting:"
      />

      <label for="email">Email</label>
      <input id="email" type="email" [formField]="profileForm.email" />
      <ngx-form-field-error [formField]="profileForm.email" fieldName="email" />

      <label for="bio">Bio</label>
      <textarea
        id="bio"
        aria-describedby="bio-hint bio-char-count-limit"
        [formField]="profileForm.bio"
      ></textarea>
      <ngx-form-field-hint id="bio-hint">
        A few words about you.
      </ngx-form-field-hint>
      <ngx-form-field-character-count
        [formField]="profileForm.bio"
        fieldName="bio"
      />
      <ngx-form-field-error [formField]="profileForm.bio" fieldName="bio" />

      <button type="submit" [disabled]="profileForm().submitting()">
        Save
      </button>
    </form>
  `,
})
export class ProfileFormComponent {
  readonly #model = signal({ email: '', bio: '' });
  protected readonly savedProfile = signal<{
    email: string;
    bio: string;
  } | null>(null);
  protected readonly profileForm = form(
    this.#model,
    (path) => {
      required(path.email, { message: 'Email is required' });
      email(path.email, { message: 'Enter a valid email' });
      maxLength(path.bio, 500);
    },
    {
      submission: {
        action: async (tree) => {
          this.savedProfile.set(tree().value());
        },
      },
    },
  );
}
```

## Done

Verify the checks that apply to your change:

- Standalone `fieldName` values match their control `id`, and standalone hints or character-count limit IDs appear in the control's `aria-describedby`.
- Error and warning channels use independent timing, distinct `role="alert"` / `role="status"` hosts that stay mounted, and pre-filtered arrays when using `presentation="panel"`.
- Summary buttons focus their bound controls; report any keyboard or screen-reader checks not run.
