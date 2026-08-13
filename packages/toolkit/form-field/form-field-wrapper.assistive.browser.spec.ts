import { Component, signal } from '@angular/core';
import { FormField, form } from '@angular/forms/signals';
import { render } from '@testing-library/angular';
import { describe, expect, it } from 'vitest';
import { NgxFormFieldHint } from '@ngx-signal-forms/toolkit/assistive';
import { NgxFormFieldWrapper } from './form-field-wrapper';

/**
 * Resolves the owning `<ngx-form-field-wrapper>` host for a row element, so
 * tests can set the wrapper-scoped CSS custom properties that control it.
 */
const wrapperOf = (row: Element): HTMLElement =>
  row.closest('ngx-form-field-wrapper') as HTMLElement;

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
      <ngx-form-field-wrapper appearance="outline" [formField]="testForm.bare">
        <label for="bare">Bare</label>
        <input id="bare" [formField]="testForm.bare" placeholder=" " />
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

  // Destructuring the first row yielded `HTMLElement | undefined`, and
  // `closest()` returns `Element | null`. Both were fed straight into
  // `getComputedStyle`/`style.setProperty`, so a fixture that stopped
  // rendering the row would have thrown deep inside an assertion instead of
  // reporting a missing element. Resolve each node once, loudly.
  const firstAssistiveRow = (container: Element): HTMLElement => {
    const [row] = assistiveRows(container);
    if (!row) {
      throw new Error('Expected the fixture to render an assistive row.');
    }
    return row;
  };

  const closestWrapper = (row: Element): HTMLElement => {
    const wrapper = row.closest<HTMLElement>('ngx-form-field-wrapper');
    if (!wrapper) {
      throw new Error('Expected the assistive row to sit inside a wrapper.');
    }
    return wrapper;
  };

  it('keeps the assistive row reserved even without assistive content', async () => {
    const { container } = await render(Host);

    const bare = firstAssistiveRow(container);

    expect(getComputedStyle(bare).display).toBe('flex');
    expect(bare.getBoundingClientRect().height).toBeCloseTo(16, 1);
  });

  it('reserves exactly one caption line without adding feedback spacing', async () => {
    const { container } = await render(Host);

    for (const row of assistiveRows(container)) {
      const styles = getComputedStyle(row);

      expect(parseFloat(styles.minHeight)).toBeCloseTo(16, 1);
      expect(parseFloat(styles.marginTop)).toBe(0);
      expect(parseFloat(styles.marginBottom)).toBeCloseTo(0, 1);
    }
  });

  it('does not add an outline grid gap before assistive feedback', async () => {
    const { container } = await render(Host);

    const bare = firstAssistiveRow(container);
    const wrapper = closestWrapper(bare);

    expect(getComputedStyle(wrapper).rowGap).toBe('0px');
  });

  it('uses the body-2 line-height for standard textual controls', async () => {
    const { container } = await render(Host);

    const input = container.querySelector<HTMLInputElement>('#hinted');
    if (input === null) {
      throw new Error('Expected the standard hinted input to render.');
    }

    expect(getComputedStyle(input).lineHeight).toBe('20px');
  });

  it('follows the shared feedback line-height token', async () => {
    const { container } = await render(Host);

    const bare = firstAssistiveRow(container);
    const wrapper = closestWrapper(bare);
    wrapper.style.setProperty('--ngx-form-field-assistive-transition', 'none');
    wrapper.style.setProperty('--ngx-signal-form-feedback-line-height', '2rem');

    expect(parseFloat(getComputedStyle(bare).minHeight)).toBeCloseTo(32, 1);
  });

  it('lets consumers collapse the reserved row with custom properties', async () => {
    const { container } = await render(Host);

    const bare = firstAssistiveRow(container);
    const wrapper = closestWrapper(bare);
    wrapper.style.setProperty('--ngx-form-field-assistive-transition', 'none');
    wrapper.style.setProperty('--ngx-form-field-assistive-min-height', '0');
    wrapper.style.setProperty('--ngx-form-field-assistive-margin-top', '0');

    const styles = getComputedStyle(bare);
    expect(parseFloat(styles.minHeight)).toBe(0);
    expect(parseFloat(styles.marginTop)).toBe(0);
  });

  it('transitions reservation changes unless reduced motion is requested', async () => {
    const { container } = await render(Host);

    const bare = firstAssistiveRow(container);
    expect(getComputedStyle(bare).transition).toContain('min-height');
  });
});

/**
 * Regression coverage for #297: PR #248's description advertised
 * `--ngx-form-field-assistive-empty-display`, a token that was never
 * shipped. This locks in the token that actually ships,
 * `--ngx-form-field-assistive-empty-behavior`, defaulting to `reserve`
 * (today's rendering, unchanged) with an opt-in `collapse` value.
 */
describe('NgxFormFieldWrapper — assistive empty-row behavior (#297)', () => {
  @Component({
    selector: 'ngx-test-assistive-empty-behavior',
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

  it('defaults to reserving a content-less row at its full height', async () => {
    const { container } = await render(Host);

    const [bare] = assistiveRows(container);

    expect(bare.getBoundingClientRect().height).toBeCloseTo(16, 1);
  });

  it('collapses a content-less row to zero when opted in, without affecting a hinted row', async () => {
    const { container } = await render(Host);

    const [bare, hinted] = assistiveRows(container);
    const wrapper = wrapperOf(bare);
    // Disable the reservation transition (as the other override tests in
    // this file do) so the height change applies synchronously instead of
    // animating over 150ms.
    wrapper.style.setProperty('--ngx-form-field-assistive-transition', 'none');
    wrapper.style.setProperty(
      '--ngx-form-field-assistive-empty-behavior',
      'collapse',
    );

    expect(bare.getBoundingClientRect().height).toBe(0);
    expect(hinted.getBoundingClientRect().height).toBeGreaterThan(0);
  });

  it('reverts to the reserved height once content-less collapse is switched back to reserve', async () => {
    const { container } = await render(Host);

    const [bare] = assistiveRows(container);
    const wrapper = wrapperOf(bare);
    wrapper.style.setProperty('--ngx-form-field-assistive-transition', 'none');
    wrapper.style.setProperty(
      '--ngx-form-field-assistive-empty-behavior',
      'collapse',
    );
    wrapper.style.setProperty(
      '--ngx-form-field-assistive-empty-behavior',
      'reserve',
    );

    expect(bare.getBoundingClientRect().height).toBeCloseTo(16, 1);
  });

  /**
   * The invariant `collapse` exists to protect: a row opted into collapsing
   * when content-less must NOT collapse once an error or warning actually
   * renders into it. The CSS `:has()` guard checks the hint slot *and* the
   * absence of any other left-slot child (the error/warning renderer), so a
   * rendered error/warning keeps the row reserved even under `collapse`.
   * Without this test, a regression that collapsed the row out from under a
   * live announced error/warning would go undetected.
   */
  it('does not collapse a row opted into collapse while it shows a blocking error', async () => {
    const invalidField = signal({
      invalid: () => true,
      touched: () => true,
      errors: () => [{ kind: 'required', message: 'This field is required' }],
    });

    const { container } = await render(
      `<ngx-form-field-wrapper [formField]="field" fieldName="agree">
        <label for="agree">Agree</label>
        <input id="agree" type="text" />
      </ngx-form-field-wrapper>`,
      {
        imports: [NgxFormFieldWrapper],
        componentProperties: { field: invalidField },
      },
    );

    const row = container.querySelector<HTMLElement>(
      '.ngx-signal-form-field-wrapper__assistive',
    )!;
    const wrapper = wrapperOf(row);
    wrapper.style.setProperty('--ngx-form-field-assistive-transition', 'none');
    wrapper.style.setProperty(
      '--ngx-form-field-assistive-empty-behavior',
      'collapse',
    );

    expect(container.querySelector('[id="agree-error"]')).toBeTruthy();
    expect(row.getBoundingClientRect().height).toBeGreaterThan(0);
  });

  it('does not collapse a row opted into collapse while it shows a warning', async () => {
    const warningField = signal({
      invalid: () => true,
      touched: () => true,
      errors: () => [
        { kind: 'warn:weak-value', message: 'Consider a stronger value' },
      ],
    });

    const { container } = await render(
      `<ngx-form-field-wrapper [formField]="field" fieldName="value">
        <label for="value">Value</label>
        <input id="value" type="text" />
      </ngx-form-field-wrapper>`,
      {
        imports: [NgxFormFieldWrapper],
        componentProperties: { field: warningField },
      },
    );

    const wrapper = container.querySelector('ngx-form-field-wrapper');
    const row = container.querySelector<HTMLElement>(
      '.ngx-signal-form-field-wrapper__assistive',
    )!;
    wrapperOf(row).style.setProperty(
      '--ngx-form-field-assistive-transition',
      'none',
    );
    wrapperOf(row).style.setProperty(
      '--ngx-form-field-assistive-empty-behavior',
      'collapse',
    );

    expect(
      wrapper?.classList.contains('ngx-signal-form-field-wrapper--warning'),
    ).toBe(true);
    expect(row.getBoundingClientRect().height).toBeGreaterThan(0);
  });
});
