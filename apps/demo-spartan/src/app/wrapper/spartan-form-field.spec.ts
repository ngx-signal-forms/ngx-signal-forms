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
import { render, waitFor } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
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
 * Host harness with `strategy="on-submit"` (blocking-error timing) and
 * `warningStrategy="immediate"` (warning timing) both explicit, so the two
 * cascades can only agree by chance — never because one reads the other
 * (the ADR-0007 requirement `createWarningVisibility` restores at the
 * wrapper level, see issue #506).
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
    <form [formRoot]="nicknameForm" ngxSignalForm>
      <spartan-form-field
        [ngxSpartanFormField]="nicknameForm.nickname"
        fieldName="nickname"
        strategy="on-submit"
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
  it('shows the warning before submit under warningStrategy="immediate" even though the blocking-error strategy is "on-submit"', async () => {
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
    // field has no blocking error, so `strategy="on-submit"` never gates
    // anything here — this isolates the warning cascade.
    await user.type(nicknameInput, 'Al');

    // Before the fix, the wrapper had no warning-visibility computed at
    // all — `createWarningVisibility()` was never called, so
    // `warningStrategy` had no wrapper-level effect. This pins the seam
    // now resolving `warningStrategy="immediate"` independently of the
    // blocking-error cascade (ADR-0007).
    await waitFor(() => {
      expect(wrapper.warningVisible()).toBe(true);
    });
  });
});
