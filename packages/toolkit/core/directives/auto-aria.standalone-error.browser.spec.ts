import { ApplicationRef, Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormField, form, required, schema } from '@angular/forms/signals';
import { NgxSignalFormToolkit } from '@ngx-signal-forms/toolkit';
import { NgxFormFieldError } from '@ngx-signal-forms/toolkit/assistive';
import { render } from '@testing-library/angular';
import { userEvent } from 'vitest/browser';
import { describe, expect, it, vi } from 'vitest';
import { expectNoA11yViolations } from '../../testing/a11y-internal';

/**
 * #566: a standalone `<ngx-form-field-error [formField]>` matches the
 * `[formField]` catch-all. It is feedback, not a control, so auto-ARIA must
 * leave its host alone. The native input next to it still gets full ARIA.
 */
describe('NgxSignalFormAutoAria — standalone ngx-form-field-error (#566)', () => {
  @Component({
    selector: 'ngx-test-standalone-error',
    imports: [FormField, NgxSignalFormToolkit, NgxFormFieldError],
    template: `
      <form [formRoot]="contactForm" ngxSignalForm errorStrategy="on-touch">
        <label for="contact-message">Message</label>
        <input id="contact-message" [formField]="contactForm.message" />
        <ngx-form-field-error
          [formField]="contactForm.message"
          fieldName="contact-message"
        />
      </form>
    `,
  })
  class TestComponent {
    readonly #model = signal({ message: '' });
    readonly contactForm = form(
      this.#model,
      schema((path) => {
        required(path.message, { message: 'Message is required' });
      }),
    );
  }

  it('writes no ARIA to the error host and logs no role warning', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const { container } = await render(TestComponent);
    await TestBed.inject(ApplicationRef).whenStable();

    const errorHost = container.querySelector('ngx-form-field-error');
    expect(errorHost).not.toHaveAttribute('aria-invalid');
    expect(errorHost).not.toHaveAttribute('aria-required');
    expect(errorHost).not.toHaveAttribute('aria-describedby');
    expect(warnSpy).not.toHaveBeenCalledWith(
      expect.stringContaining('NgxSignalFormAutoAria'),
      expect.anything(),
    );

    warnSpy.mockRestore();
  });

  it('still manages ARIA on the native input next to the error', async () => {
    const { container } = await render(TestComponent);

    const input = container.querySelector<HTMLInputElement>(
      'input#contact-message',
    )!;
    await userEvent.click(input);
    input.blur();
    await TestBed.inject(ApplicationRef).whenStable();

    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAttribute('aria-required', 'true');
    expect(input.getAttribute('aria-describedby')).toContain(
      'contact-message-error',
    );

    const errorHost = container.querySelector('ngx-form-field-error');
    expect(errorHost).not.toHaveAttribute('aria-invalid');

    await expectNoA11yViolations(container);
  });
});
