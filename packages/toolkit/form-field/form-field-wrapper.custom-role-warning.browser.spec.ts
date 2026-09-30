import { ApplicationRef, Component, model, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
  FormField,
  form,
  required,
  type FormValueControl,
} from '@angular/forms/signals';
import { NgxSignalFormToolkit } from '@ngx-signal-forms/toolkit';
import { render } from '@testing-library/angular';
import { describe, expect, it, vi } from 'vitest';
import { NgxFormFieldWrapper } from './form-field-wrapper';

/**
 * #566 follow-up: the wrapper host matches auto-ARIA's `[formField]`
 * catch-all too. When it wraps a custom control whose role does not support
 * `aria-required` (`slider`, `button`), the descendant check used to miss
 * that control. The wrapper's own auto-ARIA instance then warned that "this
 * custom host has no role", although the wrapper is never the control.
 */
describe('NgxFormFieldWrapper — no missing-role warning for a wrapped custom control (#566)', () => {
  it('does not warn when the wrapped control has role="slider"', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    @Component({
      selector: 'ngx-test-slider-control',
      host: {
        role: 'slider',
        tabindex: '0',
        'aria-valuemin': '0',
        'aria-valuemax': '5',
        '[attr.aria-valuenow]': 'value()',
      },
      template: `{{ value() }} of 5`,
    })
    class SliderControl implements FormValueControl<number> {
      readonly value = model.required<number>();
    }

    @Component({
      selector: 'ngx-test-wrapped-slider',
      imports: [
        FormField,
        NgxSignalFormToolkit,
        NgxFormFieldWrapper,
        SliderControl,
      ],
      template: `
        <form [formRoot]="testForm" ngxSignalForm>
          <ngx-form-field-wrapper [formField]="testForm.rating">
            <label for="rating">Rating</label>
            <ngx-test-slider-control
              id="rating"
              aria-label="Rating"
              [formField]="testForm.rating"
            />
          </ngx-form-field-wrapper>
        </form>
      `,
    })
    class TestComponent {
      readonly testForm = form(signal({ rating: 0 }), (path) => {
        required(path.rating);
      });
    }

    await render(TestComponent);
    await TestBed.inject(ApplicationRef).whenStable();

    const autoAriaWarnings = warnSpy.mock.calls.filter(([message]) =>
      String(message).includes('NgxSignalFormAutoAria'),
    );
    expect(autoAriaWarnings).toEqual([]);

    warnSpy.mockRestore();
  });
});
