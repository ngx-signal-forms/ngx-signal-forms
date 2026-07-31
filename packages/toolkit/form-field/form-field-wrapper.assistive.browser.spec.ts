import { Component, signal } from '@angular/core';
import { FormField, form } from '@angular/forms/signals';
import { render } from '@testing-library/angular';
import { describe, expect, it } from 'vitest';
import { NgxFormFieldHint } from '@ngx-signal-forms/toolkit/assistive';
import { NgxFormFieldWrapper } from './form-field-wrapper';

/**
 * Regression coverage for #246: the assistive row reserved
 * `--ngx-form-field-assistive-min-height` (plus its margins) on *every*
 * field, even ones that never project a hint, message or character count.
 * The reservation must only apply once the row actually carries content.
 *
 * The collapse is driven by `:has()`, which jsdom does not evaluate, so the
 * rendered heights are asserted here rather than in the jsdom suite (which
 * locks in the CSS source contract instead).
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

  it('collapses the assistive row when no assistive content is projected', async () => {
    const { container } = await render(Host);

    const [bare, hinted] = assistiveRows(container);

    expect(getComputedStyle(bare).display).toBe('none');
    expect(bare.getBoundingClientRect().height).toBe(0);
    expect(getComputedStyle(hinted).display).toBe('flex');
    expect(hinted.getBoundingClientRect().height).toBeGreaterThan(0);
  });

  it('reserves the min-height line for rows that do carry content', async () => {
    const { container } = await render(Host);

    const [, hinted] = assistiveRows(container);

    // 1.25rem default reservation, so the row keeps a stable height when the
    // hint is swapped for an error message.
    expect(parseFloat(getComputedStyle(hinted).minHeight)).toBeCloseTo(20, 1);
  });

  it('restores the reserved row when the opt-in escape hatch is set', async () => {
    const { container } = await render(Host);

    const [bare] = assistiveRows(container);
    const wrapper = bare.closest('ngx-form-field-wrapper') as HTMLElement;
    wrapper.style.setProperty(
      '--ngx-form-field-assistive-empty-display',
      'flex',
    );

    expect(getComputedStyle(bare).display).toBe('flex');
    expect(bare.getBoundingClientRect().height).toBeGreaterThan(0);
  });
});
