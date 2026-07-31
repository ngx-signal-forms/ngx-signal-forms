import { Component, signal } from '@angular/core';
import { FormField, form } from '@angular/forms/signals';
import { render } from '@testing-library/angular';
import { describe, expect, it } from 'vitest';
import { NgxFormFieldHint } from '@ngx-signal-forms/toolkit/assistive';
import { NgxFormFieldWrapper } from './form-field-wrapper';

/**
 * Regression coverage for #246: the assistive row reserved 1.25rem plus
 * 0.25rem top/bottom margins on every field, which is more space than a
 * single caption line needs. The row must stay reserved (no layout shift when
 * an error replaces a hint) but only as tall as one caption line.
 */
describe('NgxFormFieldWrapper — assistive row reserved space', () => {
  @Component({
    selector: 'ngx-test-assistive-space',
    imports: [NgxFormFieldWrapper, NgxFormFieldHint, FormField],
    template: `
      <ngx-form-field-wrapper [formField]="testForm.bare">
        <label for="bare">Bare</label>
        <input id="bare" [formField]="testForm.bare" />
      </ngx-form-field-wrapper>

      <ngx-form-field-wrapper [formField]="testForm.hinted">
        <label for="hinted">Hinted</label>
        <input id="hinted" [formField]="testForm.hinted" />
        <ngx-form-field-hint>Some guidance</ngx-form-field-hint>
      </ngx-form-field-wrapper>
    `,
  })
  class Host {
    protected readonly testForm = form(signal({ bare: '', hinted: '' }));
  }

  const assistiveRows = (container: Element) =>
    Array.from(
      container.querySelectorAll<HTMLElement>(
        '.ngx-signal-form-field-wrapper__assistive',
      ),
    );

  it('keeps the assistive row reserved even without assistive content', async () => {
    const { container } = await render(Host);

    const [bare] = assistiveRows(container);

    expect(getComputedStyle(bare).display).toBe('flex');
    expect(bare.getBoundingClientRect().height).toBeCloseTo(16, 1);
  });

  it('reserves exactly one caption line plus a small top margin', async () => {
    const { container } = await render(Host);

    for (const row of assistiveRows(container)) {
      const styles = getComputedStyle(row);

      expect(parseFloat(styles.minHeight)).toBeCloseTo(16, 1);
      expect(parseFloat(styles.marginTop)).toBeCloseTo(4, 1);
      expect(parseFloat(styles.marginBottom)).toBeCloseTo(0, 1);
    }
  });

  it('follows the shared feedback line-height token', async () => {
    const { container } = await render(Host);

    const [bare] = assistiveRows(container);
    const wrapper = bare.closest('ngx-form-field-wrapper') as HTMLElement;
    wrapper.style.setProperty('--ngx-signal-form-feedback-line-height', '2rem');

    expect(parseFloat(getComputedStyle(bare).minHeight)).toBeCloseTo(32, 1);
  });
});
