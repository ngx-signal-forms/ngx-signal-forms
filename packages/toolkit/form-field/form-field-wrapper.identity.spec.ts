import { signal } from '@angular/core';
import { render } from '@testing-library/angular';
import { describe, expect, it } from 'vitest';
import { NgxFormFieldWrapper } from './form-field-wrapper';

const invalidField = () =>
  signal({
    invalid: () => true,
    touched: () => true,
    errors: () => [{ kind: 'required', message: 'Required' }],
  });

describe('NgxFormFieldWrapper — shared field-identity convergence', () => {
  it('label `for`, control id, and rendered error container id all share one field name', async () => {
    const { container, fixture } = await render(
      `<ngx-form-field-wrapper [formField]="field">
        <label for="email">Email</label>
        <input id="email" type="text" />
      </ngx-form-field-wrapper>`,
      {
        imports: [NgxFormFieldWrapper],
        componentProperties: { field: invalidField() },
      },
    );
    await fixture.whenStable();

    const label = container.querySelector('label');
    const input = container.querySelector('input');
    const errorContainer = container.querySelector('[id="email-error"]');

    expect(label?.getAttribute('for')).toBe('email');
    expect(input?.id).toBe('email');
    expect(errorContainer).toBeTruthy();
  });

  it('does not drift when the projected control element is swapped', async () => {
    const useA = signal(true);

    const { container, fixture } = await render(
      `<ngx-form-field-wrapper [formField]="field">
        <label [attr.for]="useA() ? 'a' : 'b'">Label</label>
        @if (useA()) {
          <input id="a" type="text" />
        } @else {
          <input id="b" type="text" />
        }
      </ngx-form-field-wrapper>`,
      {
        imports: [NgxFormFieldWrapper],
        componentProperties: { field: invalidField(), useA },
      },
    );
    await fixture.whenStable();

    expect(container.querySelector('input')?.id).toBe('a');
    expect(container.querySelector('label')?.getAttribute('for')).toBe('a');
    expect(container.querySelector('[id="a-error"]')).toBeTruthy();

    useA.set(false);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(container.querySelector('input')?.id).toBe('b');
    expect(container.querySelector('label')?.getAttribute('for')).toBe('b');
    expect(container.querySelector('[id="b-error"]')).toBeTruthy();
    expect(container.querySelector('[id="a-error"]')).toBeNull();
  });
});
