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
  email,
  required,
} from '@angular/forms/signals';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import {
  NgxSignalFormToolkit,
  provideNgxSignalFormsConfig,
} from '@ngx-signal-forms/toolkit';
import { NgxFormFieldHint } from '@ngx-signal-forms/toolkit/assistive';
import { render, waitFor } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import {
  MatFormFieldWrapper,
  NgxMatFormBundle,
} from './mat-form-field-wrapper';

interface ContactModel {
  email: string;
}

const testSchema = schema<ContactModel>((path) => {
  required(path.email, { message: 'Required' });
  email(path.email, { message: 'Must be a valid email' });
});

/**
 * Host harness around `MatFormFieldWrapper` so the test can read the
 * directive's exposed `toolkitAriaDescribedBy` signal directly via
 * `viewChild`. The directive is declared as `exportAs: 'ngxMatFormField'`,
 * so the harness pulls it by class.
 */
@Component({
  selector: 'ngx-test-host',
  imports: [
    FormField,
    NgxSignalFormToolkit,
    NgxMatFormBundle,
    MatFormFieldModule,
    MatInputModule,
    NgxFormFieldHint,
  ],
  template: `
    <form [formRoot]="contactForm" ngxSignalForm>
      <mat-form-field
        [ngxMatFormField]="contactForm.email"
        fieldName="contact-email"
        appearance="outline"
      >
        <mat-label>Email</mat-label>
        <input
          matInput
          id="contact-email"
          type="email"
          [formField]="contactForm.email"
          ngxMatTextControl
        />
        <ngx-form-field-hint id="contact-email-custom-hint">
          We never share your email.
        </ngx-form-field-hint>
      </mat-form-field>
    </form>
  `,
})
class TestHostComponent {
  protected readonly model = signal<ContactModel>({ email: '' });
  readonly contactForm = form<ContactModel>(this.model, testSchema);

  readonly wrapper = viewChild.required(MatFormFieldWrapper<string>);
}

/**
 * Host harness with a bare `<input matInput [formField]>` — no
 * per-control directive. Used to exercise the dev-mode missing-control
 * assertion called out in ADR-0002 §6.
 */
@Component({
  selector: 'ngx-bare-host',
  imports: [
    FormField,
    NgxSignalFormToolkit,
    NgxMatFormBundle,
    MatFormFieldModule,
    MatInputModule,
  ],
  template: `
    <form [formRoot]="contactForm" ngxSignalForm>
      <mat-form-field
        [ngxMatFormField]="contactForm.email"
        fieldName="contact-email"
        appearance="outline"
      >
        <mat-label>Email</mat-label>
        <input
          matInput
          id="contact-email"
          type="email"
          [formField]="contactForm.email"
        />
      </mat-form-field>
    </form>
  `,
})
class BareControlHostComponent {
  protected readonly model = signal<ContactModel>({ email: '' });
  readonly contactForm = form<ContactModel>(this.model, testSchema);
}

describe('MatFormFieldWrapper.toolkitAriaDescribedBy', () => {
  async function setup() {
    return render(TestHostComponent, {
      providers: [
        provideZonelessChangeDetection(),
        provideNgxSignalFormsConfig({
          defaultErrorStrategy: 'on-touch',
          autoAria: true,
        }),
      ],
    });
  }

  it('composes preserved IDs and projected hint IDs but skips `${fieldName}-error` when the field is invalid', async () => {
    const user = userEvent.setup();
    const view = await setup();

    const emailInput = view.getByLabelText(/email/i) as HTMLInputElement;

    // Seed Material's `aria-describedby` chain by triggering touched +
    // invalid state. After blur Material registers its rendered <mat-error>
    // (and any <mat-hint>s) into `aria-describedby` on the bound control.
    await user.click(emailInput);
    await user.type(emailInput, 'not-an-email');
    await user.tab();

    const wrapper = view.fixture.componentInstance.wrapper();

    // Await zoneless CD + content-query settle: with `contentChildren` the
    // bound-control element resolves over a microtask boundary, and the
    // composed describedby chain depends on that resolution + Material's
    // own subsequent describedby write.
    let composed: string | null = null;
    await waitFor(() => {
      composed = wrapper.toolkitAriaDescribedBy();
      expect(composed).not.toBeNull();
    });

    const ids = (composed ?? '').split(/\s+/).filter(Boolean);

    // Material's preserved IDs (e.g. mat-error) live in the bound control's
    // `aria-describedby` and end up preserved verbatim in the composition.
    const preservedIds = (emailInput.getAttribute('aria-describedby') ?? '')
      .split(/\s+/)
      .filter(Boolean);
    for (const preservedId of preservedIds) {
      expect(ids).toContain(preservedId);
    }

    // Projected `<ngx-form-field-hint>` ID flows through the hint registry
    // and is appended after the preserved list.
    expect(ids).toContain('contact-email-custom-hint');

    // Critical assertion: the toolkit-owned `${fieldName}-error` ID must NOT
    // appear, even though the field is invalid and visibility is true.
    // Material renders the actual error inside `<mat-error>` with its own ID
    // (already preserved above); appending `contact-email-error` would dangle
    // because no element with that ID exists in this Material setup.
    expect(ids).not.toContain('contact-email-error');
    expect(ids).not.toContain('contact-email-warning');
  });

  /**
   * Pins the promoted pre-1.0 finding: the `preservedIds` reader must track
   * Material's `aria-describedby` rewrites reactively, not just incidentally
   * whenever some *other* tracked signal (visibility, hint IDs, field name)
   * happens to change at the same time. This test mutates the bound
   * control's `aria-describedby` attribute directly — the way Material
   * rewrites it on its own CD cycle, outside the toolkit's signal graph —
   * without touching any other reactive input, and asserts the composed
   * signal still picks up the change.
   */
  it('reacts to the bound control’s aria-describedby changing outside the signal graph', async () => {
    const view = await setup();
    const emailInput = view.getByLabelText(/email/i) as HTMLInputElement;
    const wrapper = view.fixture.componentInstance.wrapper();

    // Let the bound-control content query settle so `preservedIds` has a
    // real element to read from.
    await waitFor(() => {
      expect(wrapper.toolkitAriaDescribedBy()).toContain(
        'contact-email-custom-hint',
      );
    });

    // Simulate Material writing a fresh `aria-describedby` value on its own
    // CD cycle (e.g. a newly rendered `<mat-error>` ID) with no other
    // toolkit-tracked signal changing in the same tick.
    emailInput.setAttribute(
      'aria-describedby',
      'mat-mdc-error-simulated-0 contact-email-custom-hint',
    );

    await waitFor(() => {
      const ids = (wrapper.toolkitAriaDescribedBy() ?? '')
        .split(/\s+/)
        .filter(Boolean);
      expect(ids).toContain('mat-mdc-error-simulated-0');
    });
  });
});

describe('MatFormFieldWrapper dev-mode missing-control assertion', () => {
  let consoleError: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleError = vi.spyOn(console, 'error').mockImplementation(() => {
      // swallow — assertions read the spy's calls
    });
  });

  afterEach(() => {
    consoleError.mockRestore();
  });

  it('logs an error when no NgxMatBoundControl directive matched inside the form-field', async () => {
    await render(BareControlHostComponent, {
      providers: [
        provideZonelessChangeDetection(),
        provideNgxSignalFormsConfig({
          defaultErrorStrategy: 'on-touch',
          autoAria: true,
        }),
      ],
    });

    expect(consoleError).toHaveBeenCalledTimes(1);
    const [message] = consoleError.mock.calls[0];
    expect(message).toContain('No NgxMatBoundControl directive matched');
    expect(message).toContain('contact-email');
    expect(message).toContain('ngxMatTextControl');
  });
});
