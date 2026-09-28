import { Component, signal } from '@angular/core';
import { FormField, form } from '@angular/forms/signals';
import { render } from '@testing-library/angular';
import { describe, expect, it } from 'vitest';
import { NgxFormFieldWrapper } from './form-field-wrapper';

/**
 * Coverage for #471: `--ngx-form-field-margin` defaults to `0` so a form
 * field contributes no outer margin of its own (container-owned spacing,
 * see CONTEXT.md). The parent layout — grid or flex `gap` — owns the space
 * between fields; a consumer opts back into the old rhythm by setting
 * `--ngx-form-field-margin` at whatever scope they choose.
 */
describe('NgxFormFieldWrapper — container-owned spacing (#471)', () => {
  @Component({
    selector: 'ngx-test-spacing-appearances',
    imports: [NgxFormFieldWrapper, FormField],
    template: `
      <ngx-form-field-wrapper
        appearance="standard"
        [formField]="testForm.standard"
      >
        <label for="standard">Standard</label>
        <input id="standard" [formField]="testForm.standard" />
      </ngx-form-field-wrapper>

      <ngx-form-field-wrapper
        appearance="outline"
        [formField]="testForm.outline"
      >
        <label for="outline">Outline</label>
        <input id="outline" [formField]="testForm.outline" />
      </ngx-form-field-wrapper>

      <ngx-form-field-wrapper appearance="plain" [formField]="testForm.plain">
        <label for="plain">Plain</label>
        <input id="plain" [formField]="testForm.plain" />
      </ngx-form-field-wrapper>

      <ngx-form-field-wrapper [formField]="testForm.agree">
        <label for="agree">Agree</label>
        <input id="agree" type="checkbox" [formField]="testForm.agree" />
      </ngx-form-field-wrapper>
    `,
  })
  class AppearancesHost {
    protected readonly testForm = form(
      signal({ standard: '', outline: '', plain: '', agree: false }),
    );
  }

  const wrappers = (container: Element) =>
    Array.from(
      container.querySelectorAll<HTMLElement>('ngx-form-field-wrapper'),
    );

  it('defaults to margin-bottom: 0px for standard, outline, plain, and a checkbox selection row', async () => {
    const { container } = await render(AppearancesHost);

    const hosts = wrappers(container);
    expect(hosts).toHaveLength(4);

    for (const host of hosts) {
      expect(getComputedStyle(host).marginBottom).toBe('0px');
    }
  });

  it('applies a non-zero ancestor override to standard, outline, plain, and selection wrappers alike', async () => {
    const { container } = await render(AppearancesHost);

    container.style.setProperty('--ngx-form-field-margin', '1.5rem');

    const hosts = wrappers(container);
    expect(hosts).toHaveLength(4);

    for (const host of hosts) {
      expect(getComputedStyle(host).marginBottom).toBe('24px');
    }
  });

  @Component({
    selector: 'ngx-test-spacing-grid',
    imports: [NgxFormFieldWrapper, FormField],
    template: `
      <div style="display: grid; gap: 1rem;">
        <ngx-form-field-wrapper [formField]="testForm.first">
          <label for="first">First</label>
          <input id="first" [formField]="testForm.first" />
        </ngx-form-field-wrapper>

        <ngx-form-field-wrapper [formField]="testForm.second">
          <label for="second">Second</label>
          <input id="second" [formField]="testForm.second" />
        </ngx-form-field-wrapper>
      </div>
    `,
  })
  class GridHost {
    protected readonly testForm = form(signal({ first: '', second: '' }));
  }

  it('yields exactly 16px between two wrappers under a parent grid gap of 1rem', async () => {
    const { container } = await render(GridHost);

    const [first, second] = wrappers(container);
    if (!first || !second) {
      throw new Error('Expected two wrapper hosts to render.');
    }

    const gap =
      second.getBoundingClientRect().top - first.getBoundingClientRect().bottom;
    expect(gap).toBeCloseTo(16, 0);
  });
});
