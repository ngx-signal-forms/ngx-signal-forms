---
description: Sub-skill of ngx-signal-forms for the @ngx-signal-forms/toolkit/assistive entry point — inline error display, grouped notifications, form-level error summaries, the form-level required/optional marking legend, helper hint text, and character counters used without a full field wrapper. Not independently invocable; the hub SKILL.md routes here.
---

# Toolkit Assistive

Implements the `@ngx-signal-forms/toolkit/assistive` entry point.

Read `../references/api.md` for the full export list and component input signatures.

## Principle

The assistive entry point provides accessible feedback rendering that sits between raw Angular field state and the fully styled `form-field` wrapper. Use it when you want pre-built accessible components but full control over layout structure, including grouped notification blocks driven by aggregated `ValidationError[]`. Use `form-field/SKILL.md` instead when a complete wrapper shell is acceptable.

## Workflow

1. Import from `@ngx-signal-forms/toolkit/assistive` — these components are also re-exported by `NgxFormField` for convenience when a form-field wrapper is present.

2. **`NgxFormFieldError`** — displays validation errors (and optionally warnings) for a single field or a pre-aggregated error list:
   - Always provide `[formField]` for single-field usage.
   - Always provide `fieldName` when used standalone (not inside `ngx-form-field-wrapper`).
   - Inside a wrapper, `fieldName` is inherited automatically.
   - Use `listStyle="bullets"` for grouped summaries; default `'plain'` for inline single-field output.

3. **`NgxFormFieldHint`** — static helper text that participates in `aria-describedby` linkage. Place before or after the input; the wrapper handles ordering automatically.

4. **`NgxFormFieldCharacterCount`** — live character count with progressive color states:
   - Provide `[formField]` for the bound field.
   - Omit `maxLength` when a `maxLength` validator on the field provides it.
   - Use `colorThresholds` to customize warning/danger thresholds (default: 80% warning, 95% danger).

5. **`NgxFormFieldNotification`** — grouped validation notification for fieldsets, summary cards, or custom sections:

- Provide `[errors]` as a signal of aggregated `ValidationError[]`.
- Provide `fieldName` when the grouped block needs deterministic `aria-describedby` IDs.
- Tone routing is automatic and content-driven — there is no `tone` input: any blocking error surfaces the `role="alert"` container; a warning-only list surfaces the `role="status"` container; an empty list hides both.
- Optional `title` renders above the messages; `listStyle` (`'plain' | 'bullets'`, default `'bullets'`) controls stacked paragraphs vs a bullet list.
- Prefer this over `NgxFormFieldErrorSummary` when you already own the grouping logic and want both warning and blocking surfaces.

6. **`NgxFormFieldErrorSummary`** — form-level error summary (GOV.UK pattern):
   - Place at the top of the form, between any server status banners and the first field.
   - Always provide `[formTree]` — pass the form tree directly (e.g., `[formTree]="myForm"`), not `myForm()`.
   - `summaryLabel` defaults to `'Please fix the following errors:'`. Override with a meaningful label.
   - Renders blocking errors only (no warnings). For warnings, use `NgxHeadlessErrorSummary` instead.
   - Inherits `errorStrategy` and `submittedStatus` from `ngxSignalForm` context automatically — no extra wiring needed when used inside `form[formRoot][ngxSignalForm]`.
   - Each entry is a focusable button that calls `focusBoundControl()` on click.

- Uses `role="alert"` and relies on the role's implicit live-region semantics (no explicit `aria-live` / `aria-atomic`).

7. **`NgxFormMarkingLegend`** (`<ngx-form-marking-legend>`) — form-level legend that explains the required/optional marker (e.g. "\* indicates a required field"), the companion to the per-field markers rendered by the `form-field` wrapper:
   - Place it once wherever it reads well; there is no automatic injection.
   - `[formTree]` is optional — it falls back to the ambient `form[formRoot][ngxSignalForm]` context. Pass it explicitly when used outside a form host.
   - `showMarkerWhen` (`'required' | 'optional' | 'none'`), `text`, `requiredMarker`, and `optionalMarker` all fall back to `NgxSignalFormsConfig`, so by default the legend matches whatever the fields render.
   - Mode- and content-aware: it hides when the form has no field of the relevant kind, and renders nothing in `'none'` mode. It is plain visible text (not `aria-hidden`) with no `role`/live region.

8. Keep warning and error semantics distinct. Errors use `role="alert"` (assertive); warnings use `role="status"` (polite). Do not homogenize them.

## Error Summary Usage Example

```typescript
import { Component, signal } from '@angular/core';
import { form, FormField } from '@angular/forms/signals';
import { NgxSignalFormToolkit } from '@ngx-signal-forms/toolkit';
import { NgxFormFieldErrorSummary } from '@ngx-signal-forms/toolkit/assistive';

@Component({
  selector: 'app-registration-form',
  imports: [FormField, NgxSignalFormToolkit, NgxFormFieldErrorSummary],
  template: `
    <form [formRoot]="registrationForm" ngxSignalForm errorStrategy="on-submit">
      <!-- Error summary at top of form — inherits strategy from ngxSignalForm context -->
      <ngx-form-field-error-summary
        [formTree]="registrationForm"
        summaryLabel="Please fix the following errors before submitting:"
      />

      <label for="email">Email</label>
      <input id="email" type="email" [formField]="registrationForm.email" />

      <button type="submit">Submit</button>
    </form>
  `,
})
export class RegistrationFormComponent {
  readonly #model = signal({ email: '' });
  protected readonly registrationForm = form(this.#model, {/* validators */});
}
```

## Standalone Usage Example

```typescript
import { Component, signal } from '@angular/core';
import { form, FormField, required, maxLength } from '@angular/forms/signals';
import {
  NgxFormFieldError,
  NgxFormFieldHint,
  NgxFormFieldCharacterCount,
} from '@ngx-signal-forms/toolkit/assistive';
import { NgxSignalFormToolkit } from '@ngx-signal-forms/toolkit';

@Component({
  selector: 'app-bio-field',
  imports: [
    FormField,
    NgxSignalFormToolkit,
    NgxFormFieldError,
    NgxFormFieldHint,
    NgxFormFieldCharacterCount,
  ],
  template: `
    <form [formRoot]="profileForm" ngxSignalForm>
      <label for="bio">Bio</label>
      <textarea id="bio" [formField]="profileForm.bio"></textarea>
      <ngx-form-field-hint>Briefly describe yourself.</ngx-form-field-hint>
      <ngx-form-field-character-count [formField]="profileForm.bio" />
      <ngx-form-field-error [formField]="profileForm.bio" fieldName="bio" />
    </form>
  `,
})
export class BioFieldComponent {
  readonly #model = signal({ bio: '' });
  protected readonly profileForm = form(this.#model, (path) => {
    maxLength(path.bio, 500);
  });
}
```

## Warning Semantics

`warningError()` and friends are also available from `@ngx-signal-forms/toolkit/assistive` (they are also exported from the root entry point — use whichever import location is already in the file):

```typescript
import {
  warningError,
  isWarningError,
  isBlockingError,
} from '@ngx-signal-forms/toolkit/assistive';
```

`NgxFormFieldError` automatically renders warnings with `role="status"` — no manual ARIA needed.

`NgxFormFieldNotification` follows the same separation at the grouped level, automatically and content-driven (no `tone` input): any blocking error routes to the assertive `role="alert"` container, a warning-only list to the polite `role="status"` container, and an empty list hides both. This prevents accidentally downgrading real errors or over-announcing non-blocking guidance.

## Error Handling

- If errors don't display: check that `fieldName` is provided when the component is used standalone.
- If character count doesn't update: verify the field value is a string and `[formField]` is bound.
- If hints don't appear in `aria-describedby`: confirm the component is inside a `ngx-form-field-wrapper` or use `NgxHeadlessFieldName` to wire it manually.
- If a grouped notification announces with the wrong urgency: check the `[errors]` list you pass in — routing is content-driven, so a stray blocking error will force the assertive `role="alert"` container. There is no `tone` input to override it.
- For grouped summaries or fieldset-level output, switch to `form-field/SKILL.md` (`NgxFormFieldset`).
- If error summary does not show: verify `ngxSignalForm` is applied to the `<form>` element so context is active, or provide `strategy` and `submittedStatus` explicitly.
- If error summary entries don't focus controls on click: ensure the bound `<input>` / `<textarea>` / `<select>` has a stable `id` attribute — `focusBoundControl()` requires it.
- For warning entries in the summary, use `NgxHeadlessErrorSummary` from `@ngx-signal-forms/toolkit/headless`, or use `NgxFormFieldNotification` when you already have aggregated `ValidationError[]`.
