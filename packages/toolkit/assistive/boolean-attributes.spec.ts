import { Component, signal } from '@angular/core';
import { form } from '@angular/forms/signals';
import { By } from '@angular/platform-browser';
import { render } from '@testing-library/angular';
import { describe, expect, it } from 'vitest';
import { NgxFormFieldCharacterCount } from './character-count';
import { NgxFormFieldErrorSummary } from './form-field-error-summary';

@Component({
  imports: [NgxFormFieldCharacterCount, NgxFormFieldErrorSummary],
  template: `
    <ngx-form-field-character-count
      [formField]="testForm.text"
      [maxLength]="10"
      showLimitColors
    />
    <ngx-form-field-character-count
      [formField]="testForm.text"
      [maxLength]="10"
      showLimitColors="false"
    />
    <ngx-form-field-character-count
      [formField]="testForm.text"
      [maxLength]="10"
      [showLimitColors]="false"
    />
    <ngx-form-field-error-summary [formTree]="testForm" autoFocus />
    <ngx-form-field-error-summary [formTree]="testForm" autoFocus="false" />
    <ngx-form-field-error-summary [formTree]="testForm" [autoFocus]="false" />
  `,
})
class Host {
  readonly testForm = form(signal({ text: '1234567890' }));
}

describe('assistive boolean attributes', () => {
  it('accepts bare, string false, and bound false values', async () => {
    const { container, fixture } = await render(Host);
    const counts = container.querySelectorAll('ngx-form-field-character-count');
    expect(
      Array.from(counts, (count) => count.getAttribute('data-limit-state')),
    ).toEqual(['danger', 'disabled', 'disabled']);
    const summaries = fixture.debugElement.queryAll(
      By.directive(NgxFormFieldErrorSummary),
    );
    expect(
      summaries.map((node) =>
        node.injector.get(NgxFormFieldErrorSummary).autoFocus(),
      ),
    ).toEqual([true, false, false]);
  });
});
