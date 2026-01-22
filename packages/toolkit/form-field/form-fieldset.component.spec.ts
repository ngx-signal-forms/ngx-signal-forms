import { signal } from '@angular/core';
import { render, screen } from '@testing-library/angular';
import { describe, expect, it } from 'vitest';
import { NgxSignalFormFieldsetComponent } from './form-fieldset.component';

type MockState = {
  invalid: () => boolean;
  valid: () => boolean;
  touched: () => boolean;
  dirty: () => boolean;
  pending: () => boolean;
  errors: () => Array<{ kind: string; message?: string }>;
  errorSummary: () => Array<{ kind: string; message?: string }>;
};

const createFieldsetState = (overrides: Partial<MockState> = {}) =>
  signal<MockState>({
    invalid: () => true,
    valid: () => false,
    touched: () => true,
    dirty: () => false,
    pending: () => false,
    errors: () => [],
    errorSummary: () => [],
    ...overrides,
  });

describe('NgxSignalFormFieldsetComponent', () => {
  it('renders projected content', async () => {
    const fieldset = createFieldsetState();

    const { container } = await render(
      `<ngx-signal-form-fieldset [fieldsetField]="fieldset">
        <div class="content">Projected</div>
      </ngx-signal-form-fieldset>`,
      {
        imports: [NgxSignalFormFieldsetComponent],
        componentProperties: {
          fieldset,
        },
      },
    );

    expect(container.querySelector('.content')?.textContent).toBe('Projected');
  });

  it('aggregates errors from fieldsetField errorSummary', async () => {
    const fieldset = createFieldsetState({
      errors: () => [{ kind: 'required', message: 'Street required' }],
      errorSummary: () => [
        { kind: 'required', message: 'Street required' },
        { kind: 'required', message: 'Street required' },
      ],
    });

    await render(
      `<ngx-signal-form-fieldset [fieldsetField]="fieldset">
        <div>Content without nested form field</div>
      </ngx-signal-form-fieldset>`,
      {
        imports: [NgxSignalFormFieldsetComponent],
        componentProperties: { fieldset },
      },
    );

    const errors = screen.getAllByRole('alert');
    expect(errors).toHaveLength(1);
    expect(errors[0]?.textContent).toContain('Street required');
  });

  it('suppresses warnings when errors are shown', async () => {
    const fieldset = createFieldsetState({
      errors: () => [
        { kind: 'required', message: 'City required' },
        { kind: 'warn:optional', message: 'State is optional' },
      ],
      errorSummary: () => [
        { kind: 'required', message: 'City required' },
        { kind: 'warn:optional', message: 'State is optional' },
      ],
    });

    await render(
      `<ngx-signal-form-fieldset [fieldsetField]="fieldset">
        <div>Content without nested form field</div>
      </ngx-signal-form-fieldset>`,
      {
        imports: [NgxSignalFormFieldsetComponent],
        componentProperties: { fieldset },
      },
    );

    /// Should show error, not warning
    const errors = screen.queryAllByRole('alert');
    expect(errors).toHaveLength(1);
    expect(errors[0]?.textContent).toContain('City required');

    /// Warning should be suppressed when error is shown
    const warnings = screen.queryAllByRole('status');
    expect(warnings).toHaveLength(0);
  });

  it('shows warnings when no blocking errors exist', async () => {
    const fieldset = createFieldsetState({
      errors: () => [{ kind: 'warn:optional', message: 'State is optional' }],
      errorSummary: () => [
        { kind: 'warn:optional', message: 'State is optional' },
      ],
    });

    await render(
      `<ngx-signal-form-fieldset [fieldsetField]="fieldset">
        <div>Content without nested form field</div>
      </ngx-signal-form-fieldset>`,
      {
        imports: [NgxSignalFormFieldsetComponent],
        componentProperties: { fieldset },
      },
    );

    const warnings = screen.queryAllByRole('status');
    expect(warnings).toHaveLength(1);
    expect(warnings[0]?.textContent).toContain('State is optional');
  });

  it('prefers fields override for aggregation', async () => {
    const fieldset = createFieldsetState({
      errors: () => [{ kind: 'required', message: 'Group error' }],
      errorSummary: () => [{ kind: 'required', message: 'Group error' }],
    });

    const field = createFieldsetState({
      errors: () => [{ kind: 'required', message: 'Override error' }],
      errorSummary: () => [{ kind: 'required', message: 'Override error' }],
    });

    await render(
      `<ngx-signal-form-fieldset [fieldsetField]="fieldset" [fields]="fields">
        <div>Content without nested form field</div>
      </ngx-signal-form-fieldset>`,
      {
        imports: [NgxSignalFormFieldsetComponent],
        componentProperties: { fieldset, fields: [field] },
      },
    );

    const errors = screen.getAllByRole('alert');
    expect(errors).toHaveLength(1);
    expect(errors[0]?.textContent).toContain('Override error');
  });

  it('applies host class for invalid state', async () => {
    const fieldset = createFieldsetState({
      errors: () => [{ kind: 'required', message: 'Required' }],
      errorSummary: () => [{ kind: 'required', message: 'Required' }],
    });

    const { container } = await render(
      `<ngx-signal-form-fieldset [fieldsetField]="fieldset">
        <div>Content</div>
      </ngx-signal-form-fieldset>`,
      {
        imports: [NgxSignalFormFieldsetComponent],
        componentProperties: { fieldset },
      },
    );

    const host = container.querySelector('ngx-signal-form-fieldset');
    expect(host?.classList.contains('ngx-signal-form-fieldset--invalid')).toBe(
      true,
    );
  });

  it('uses custom fieldsetId when provided', async () => {
    const fieldset = createFieldsetState({
      errors: () => [{ kind: 'required', message: 'Required' }],
      errorSummary: () => [{ kind: 'required', message: 'Required' }],
    });

    const { container } = await render(
      `<ngx-signal-form-fieldset [fieldsetField]="fieldset" fieldsetId="address">
        <div>Content</div>
      </ngx-signal-form-fieldset>`,
      {
        imports: [NgxSignalFormFieldsetComponent],
        componentProperties: { fieldset },
      },
    );

    const errorElement = container.querySelector('#address-error');
    expect(errorElement).not.toBeNull();
  });
});
