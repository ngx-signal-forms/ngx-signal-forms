import {
  Component,
  provideZonelessChangeDetection,
  signal,
  viewChild,
} from '@angular/core';
import {
  FormField,
  form,
  schema,
  validate,
  type FieldTree,
} from '@angular/forms/signals';
import {
  NgxSignalFormControlSemanticsDirective,
  NgxSignalFormToolkit,
  provideNgxSignalFormsConfig,
  warningError,
} from '@ngx-signal-forms/toolkit';
import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { InputTextModule } from 'primeng/inputtext';
import { describe, expect, it } from 'vitest';
import { provideNgxPrimeForms } from './index';
import { PrimeFormFieldComponent } from './prime-form-field';

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
 * (`PrimeFormFieldComponent` has no `strategy` input of its own — the
 * wrapper only resolves it from the ambient `[ngxSignalForm]` context) and
 * the field's own `warningStrategy="immediate"` explicit, so the two
 * cascades can only agree by chance — never because one reads the other
 * (ADR-0007; see issue #506).
 */
@Component({
  selector: 'ngx-warning-timing-host',
  imports: [
    FormField,
    NgxSignalFormToolkit,
    PrimeFormFieldComponent,
    NgxSignalFormControlSemanticsDirective,
    InputTextModule,
  ],
  template: `
    <form [formRoot]="nicknameForm" ngxSignalForm errorStrategy="on-submit">
      <prime-form-field
        [ngxPrimeFormField]="nicknameForm.nickname"
        fieldName="nickname"
        warningStrategy="immediate"
      >
        <label for="nickname">Nickname</label>
        <input
          id="nickname"
          type="text"
          pInputText
          [formField]="nicknameForm.nickname"
          ngxSignalFormControl="input-like"
        />
      </prime-form-field>
    </form>
  `,
})
class WarningTimingHostComponent {
  protected readonly model = signal<WarningTimingModel>({ nickname: '' });
  readonly nicknameForm = form<WarningTimingModel>(
    this.model,
    warningTimingSchema,
  );

  readonly wrapper = viewChild.required(PrimeFormFieldComponent<string>);
}

describe('PrimeFormFieldComponent warning timing (#506)', () => {
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
    //
    // `waitFor` re-runs change detection on every poll, and this wrapper
    // writes attributes on every render — under a reverted fix that keeps
    // `warningVisible()` permanently `false`, that combination starves the
    // event loop and `waitFor` never times out (not even `--testTimeout`).
    // A single `whenStable()` + direct assertion fails fast instead.
    await view.fixture.whenStable();
    expect(wrapper.warningVisible()).toBe(true);
  });
});

/**
 * Host harness mounting the real `PrimeFieldErrorComponent` renderer (via
 * `provideNgxPrimeForms()`), with the app-level `defaultWarningStrategy`
 * set to `'immediate'` (matching `main.ts`) and one field overriding it to
 * `'on-touch'` — proving the wrapper's resolved `warningStrategy` actually
 * reaches the rendered DOM, not just the wrapper's own escape-hatch signal.
 */
@Component({
  selector: 'ngx-renderer-warning-timing-host',
  imports: [
    FormField,
    NgxSignalFormToolkit,
    PrimeFormFieldComponent,
    NgxSignalFormControlSemanticsDirective,
    InputTextModule,
  ],
  template: `
    <form [formRoot]="nicknameForm" ngxSignalForm>
      <prime-form-field
        [ngxPrimeFormField]="nicknameForm.nickname"
        fieldName="nickname"
        warningStrategy="on-touch"
      >
        <label for="nickname">Nickname</label>
        <input
          id="nickname"
          type="text"
          pInputText
          [formField]="nicknameForm.nickname"
          ngxSignalFormControl="input-like"
        />
      </prime-form-field>
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

describe('PrimeFieldErrorComponent follows the wrapper-resolved warningStrategy (#506)', () => {
  it('does not show the warning after typing only, and shows it after blur, under warningStrategy="on-touch"', async () => {
    const user = userEvent.setup();
    await render(RendererWarningTimingHostComponent, {
      providers: [
        provideZonelessChangeDetection(),
        provideNgxSignalFormsConfig({
          defaultErrorStrategy: 'on-touch',
          // App default is 'immediate' (mirrors main.ts) — this field's
          // explicit warningStrategy="on-touch" must still win, proving the
          // wrapper's resolved value reaches the renderer rather than the
          // renderer re-deciding warning timing on its own.
          defaultWarningStrategy: 'immediate',
          autoAria: true,
        }),
        ...provideNgxPrimeForms(),
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
    NgxSignalFormToolkit,
    PrimeFormFieldComponent,
    NgxSignalFormControlSemanticsDirective,
    InputTextModule,
  ],
  template: `
    <form [formRoot]="nicknameForm" ngxSignalForm>
      <prime-form-field
        [ngxPrimeFormField]="nicknameForm.nickname"
        fieldName="nickname"
      >
        <label for="nickname">Nickname</label>
        <input
          id="nickname"
          type="text"
          pInputText
          [formField]="nicknameForm.nickname"
          ngxSignalFormControl="input-like"
        />
      </prime-form-field>
    </form>
  `,
})
class WarningOnlyTouchHostComponent {
  protected readonly model = signal<WarningTimingModel>({ nickname: '' });
  readonly nicknameForm = form<WarningTimingModel>(
    this.model,
    warningTimingSchema,
  );

  readonly wrapper = viewChild.required(PrimeFormFieldComponent<string>);
}

describe('PrimeFormFieldComponent does not suppress a warning-only field (#506 C2)', () => {
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

    // `waitFor` re-runs change detection on every poll, and this wrapper
    // writes attributes on every render — under a reverted fix that keeps
    // `warningVisible()` permanently `false` (the warning suppressing
    // itself), that combination starves the event loop and `waitFor`
    // never times out (not even `--testTimeout`). A single `whenStable()`
    // + direct assertion fails fast instead.
    await view.fixture.whenStable();
    expect(wrapper.warningVisible()).toBe(true);
  });
});

/**
 * A touched field with a blocking error whose `hidden()` is true.
 *
 * A real Angular form skips validation and touch on a hidden field, so it
 * never reaches this state. A custom control or a partial field state can,
 * and then the wrapper and its renderer must still agree.
 */
const hiddenInvalidField = () => ({
  value: signal(''),
  invalid: signal(true),
  valid: signal(false),
  touched: signal(true),
  dirty: signal(true),
  pending: signal(false),
  hidden: signal(true),
  disabled: signal(false),
  readonly: signal(false),
  required: signal(true),
  errors: signal([{ kind: 'required', message: 'Nickname is required.' }]),
  errorSummary: signal([
    { kind: 'required', message: 'Nickname is required.' },
  ]),
});

/**
 * Host harness for a field whose `hidden()` is true while the wrapper stays
 * mounted (the consumer forgot the `@if`). `PrimeFormFieldComponent` does
 * not set `[hidden]`, so the control stays on screen.
 */
@Component({
  selector: 'ngx-hidden-field-host',
  imports: [
    PrimeFormFieldComponent,
    NgxSignalFormControlSemanticsDirective,
    InputTextModule,
  ],
  template: `
    <prime-form-field [ngxPrimeFormField]="field" fieldName="nickname">
      <label for="nickname">Nickname</label>
      <input
        id="nickname"
        type="text"
        pInputText
        ngxSignalFormControl="input-like"
      />
    </prime-form-field>
  `,
})
class HiddenFieldHostComponent {
  protected readonly field = hiddenInvalidField as unknown as FieldTree<string>;

  readonly wrapper = viewChild.required(PrimeFormFieldComponent<string>);
}

describe('PrimeFormFieldComponent on a hidden() field (#508)', () => {
  it('keeps aria-invalid and the rendered error in agreement', async () => {
    // The renderer does not gate on hidden(), so the wrapper must not
    // either. Otherwise the error shows on screen while the wrapper reports
    // the field as valid.
    const view = await render(HiddenFieldHostComponent, {
      providers: [
        provideZonelessChangeDetection(),
        provideNgxSignalFormsConfig({ defaultErrorStrategy: 'on-touch' }),
        ...provideNgxPrimeForms(),
      ],
    });
    await view.fixture.whenStable();

    const wrapper = view.fixture.componentInstance.wrapper();
    expect(screen.getByText('Nickname is required.')).toBeTruthy();
    expect(wrapper.ariaInvalidValue()).toBe('true');
  });
});
