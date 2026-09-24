import {
  Component,
  provideZonelessChangeDetection,
  signal,
  viewChild,
} from '@angular/core';
import {
  FormField,
  FormRoot,
  form,
  schema,
  validate,
} from '@angular/forms/signals';
import {
  NgxSignalForm,
  NgxSignalFormAutoAria,
  provideNgxSignalFormsConfig,
  warningError,
} from '@ngx-signal-forms/toolkit';
import { HlmInput } from '@spartan-ng/helm/input';
import { HlmLabel } from '@spartan-ng/helm/label';
import { render, screen, waitFor } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { provideNgxSpartanForms } from './index';
import {
  NgxSpartanFormBundle,
  NgxSpartanFormField,
} from './spartan-form-field';

interface WarningTimingModel {
  nickname: string;
}

const warningTimingSchema = schema<WarningTimingModel>((path) => {
  validate(path.nickname, (ctx) => {
    const trimmed = (ctx.value() ?? '').trim();
    if (trimmed.length > 0 && trimmed.length < 3) {
      return warningError(
        'short-nickname',
        'Short nicknames are easy to confuse.',
      );
    }
    return null;
  });
});

/**
 * Host harness with the form's blocking-error strategy set to `on-submit`
 * (`NgxSpartanFormField` has no `strategy` input of its own — the wrapper
 * only resolves it from the ambient `[ngxSignalForm]` context) and the
 * field's own `warningStrategy="immediate"` explicit, so the two cascades
 * can only agree by chance — never because one reads the other (ADR-0007;
 * see issue #506).
 */
@Component({
  selector: 'ngx-warning-timing-host',
  imports: [
    FormField,
    FormRoot,
    NgxSignalForm,
    NgxSignalFormAutoAria,
    NgxSpartanFormBundle,
    HlmInput,
    HlmLabel,
  ],
  template: `
    <form [formRoot]="nicknameForm" ngxSignalForm errorStrategy="on-submit">
      <spartan-form-field
        [ngxSpartanFormField]="nicknameForm.nickname"
        fieldName="nickname"
        warningStrategy="immediate"
      >
        <label hlmLabel for="nickname">Nickname</label>
        <input
          hlmInput
          id="nickname"
          type="text"
          [formField]="nicknameForm.nickname"
          ngxSignalFormControl="input-like"
        />
      </spartan-form-field>
    </form>
  `,
})
class WarningTimingHostComponent {
  protected readonly model = signal<WarningTimingModel>({ nickname: '' });
  readonly nicknameForm = form<WarningTimingModel>(
    this.model,
    warningTimingSchema,
  );

  readonly wrapper = viewChild.required(NgxSpartanFormField<string>);
}

describe('NgxSpartanFormField warning timing (#506)', () => {
  it('shows the warning before submit under warningStrategy="immediate" even though the form-level blocking-error strategy is "on-submit"', async () => {
    const user = userEvent.setup();
    const view = await render(WarningTimingHostComponent, {
      providers: [
        provideZonelessChangeDetection(),
        provideNgxSignalFormsConfig({
          defaultErrorStrategy: 'on-touch',
          autoAria: true,
        }),
      ],
    });

    const wrapper = view.fixture.componentInstance.wrapper();
    const nicknameInput = view.getByLabelText(/nickname/i);

    // Type a warning-triggering value without blurring or submitting. The
    // field has no blocking error, so the form's on-submit error strategy
    // never gates anything here — this isolates the warning cascade.
    await user.type(nicknameInput, 'Al');

    // `warningVisible` is computed via `createWarningVisibility()`, timed by
    // `effectiveWarningStrategy` — independent of the blocking-error
    // cascade (ADR-0007). It resolves `warningStrategy="immediate"` and
    // shows before submit regardless of the form's on-submit error timing.
    await waitFor(() => {
      expect(wrapper.warningVisible()).toBe(true);
    });
  });
});

/**
 * Host harness mounting the real `NgxSpartanFormFieldError` renderer (via
 * `provideNgxSpartanForms()`). The test-local config sets
 * `defaultWarningStrategy: 'immediate'` — deliberately different from the
 * app's own `main.ts` (which keeps the ADR-0007 default, `'on-touch'`) — so
 * the field's explicit `warningStrategy="on-touch"` override can only win
 * by actually reaching the renderer, not by matching an ambient default.
 */
@Component({
  selector: 'ngx-renderer-warning-timing-host',
  imports: [
    FormField,
    FormRoot,
    NgxSignalForm,
    NgxSignalFormAutoAria,
    NgxSpartanFormBundle,
    HlmInput,
    HlmLabel,
  ],
  template: `
    <form [formRoot]="nicknameForm" ngxSignalForm>
      <spartan-form-field
        [ngxSpartanFormField]="nicknameForm.nickname"
        fieldName="nickname"
        warningStrategy="on-touch"
      >
        <label hlmLabel for="nickname">Nickname</label>
        <input
          hlmInput
          id="nickname"
          type="text"
          [formField]="nicknameForm.nickname"
          ngxSignalFormControl="input-like"
        />
      </spartan-form-field>
    </form>
  `,
})
class RendererWarningTimingHostComponent {
  protected readonly model = signal<WarningTimingModel>({ nickname: '' });
  readonly nicknameForm = form<WarningTimingModel>(
    this.model,
    warningTimingSchema,
  );
}

describe('NgxSpartanFormFieldError follows the wrapper-resolved warningStrategy (#506)', () => {
  it('does not show the warning after typing only, and shows it after blur, under warningStrategy="on-touch"', async () => {
    const user = userEvent.setup();
    await render(RendererWarningTimingHostComponent, {
      providers: [
        provideZonelessChangeDetection(),
        provideNgxSignalFormsConfig({
          defaultErrorStrategy: 'on-touch',
          // Test-local default is 'immediate' (the app's own main.ts keeps
          // 'on-touch') — this field's explicit warningStrategy="on-touch"
          // must still win, proving the wrapper's resolved value reaches
          // the renderer rather than the renderer re-deciding warning
          // timing on its own.
          defaultWarningStrategy: 'immediate',
          autoAria: true,
        }),
        ...provideNgxSpartanForms(),
      ],
    });

    const nicknameInput = screen.getByLabelText(/nickname/i);

    await user.type(nicknameInput, 'Al');
    expect(
      screen.queryByText(/short nicknames are easy to confuse/i),
    ).toBeNull();

    await user.tab();
    expect(
      await screen.findByText(/short nicknames are easy to confuse/i),
    ).toBeTruthy();
  });
});

/**
 * Host harness with no explicit strategy overrides — both channels resolve
 * to the toolkit default, `'on-touch'`. Used to pin the C2 regression: a
 * `warn:`-only field is still `invalid()` (Angular's validation pipeline has
 * no non-invalidating channel), so a naive `errorVisibility` gate built from
 * `createErrorVisibility()` alone reads "blocking error visible" as soon as
 * the field is touched — even though there is no blocking error — and would
 * suppress the field's own warning.
 */
@Component({
  selector: 'ngx-warning-only-touch-host',
  imports: [
    FormField,
    FormRoot,
    NgxSignalForm,
    NgxSignalFormAutoAria,
    NgxSpartanFormBundle,
    HlmInput,
    HlmLabel,
  ],
  template: `
    <form [formRoot]="nicknameForm" ngxSignalForm>
      <spartan-form-field
        [ngxSpartanFormField]="nicknameForm.nickname"
        fieldName="nickname"
      >
        <label hlmLabel for="nickname">Nickname</label>
        <input
          hlmInput
          id="nickname"
          type="text"
          [formField]="nicknameForm.nickname"
          ngxSignalFormControl="input-like"
        />
      </spartan-form-field>
    </form>
  `,
})
class WarningOnlyTouchHostComponent {
  protected readonly model = signal<WarningTimingModel>({ nickname: '' });
  readonly nicknameForm = form<WarningTimingModel>(
    this.model,
    warningTimingSchema,
  );

  readonly wrapper = viewChild.required(NgxSpartanFormField<string>);
}

describe('NgxSpartanFormField does not suppress a warning-only field (#506 C2)', () => {
  it('shows the warning after touch when the field has a warning and no blocking error', async () => {
    const user = userEvent.setup();
    const view = await render(WarningOnlyTouchHostComponent, {
      providers: [
        provideZonelessChangeDetection(),
        provideNgxSignalFormsConfig({
          defaultErrorStrategy: 'on-touch',
          autoAria: true,
        }),
      ],
    });

    const wrapper = view.fixture.componentInstance.wrapper();
    const nicknameInput = view.getByLabelText(/nickname/i);

    // Touching a field that is invalid() only because of a `warn:` error —
    // never a real blocking error — must not suppress the warning.
    await user.type(nicknameInput, 'Al');
    await user.tab();

    await waitFor(() => {
      expect(wrapper.warningVisible()).toBe(true);
    });
  });
});

describe('NgxSpartanFormField toolkitAriaDescribedBy tracks the warning region (#506 C3)', () => {
  it('includes the warning id in aria-describedby when the warning renders, even while the form-level error strategy still gates on submit', async () => {
    const user = userEvent.setup();
    // Reuses `WarningTimingHostComponent`: form errorStrategy="on-submit"
    // (blocking-error visibility stays false pre-submit) + field
    // warningStrategy="immediate" (warning visibility is true immediately).
    // This is the scenario that actually distinguishes the fix: with no
    // `warningVisibility` passed, `createAriaDescribedBySignal` falls back
    // to `visibility` (the blocking-error gate), which is false here even
    // though the warning is genuinely rendering — a missing reference
    // (WCAG 1.3.1). A same-strategy scenario (both on-touch) cannot catch
    // this, because the fallback and the real warning gate happen to agree.
    const view = await render(WarningTimingHostComponent, {
      providers: [
        provideZonelessChangeDetection(),
        provideNgxSignalFormsConfig({
          defaultErrorStrategy: 'on-touch',
          autoAria: true,
        }),
      ],
    });

    const wrapper = view.fixture.componentInstance.wrapper();
    const nicknameInput = view.getByLabelText(/nickname/i);

    // No blocking error and nothing typed yet — no warning id expected.
    expect(wrapper.toolkitAriaDescribedBy() ?? '').not.toContain(
      'nickname-warning',
    );

    // Type only — no blur, no submit. The warning shows immediately
    // (warningStrategy="immediate"), while the blocking-error gate stays
    // false (errorStrategy="on-submit", unsubmitted).
    await user.type(nicknameInput, 'Al');

    await waitFor(() => {
      expect(wrapper.warningVisible()).toBe(true);
      expect(wrapper.toolkitAriaDescribedBy()).toContain('nickname-warning');
    });
  });
});
