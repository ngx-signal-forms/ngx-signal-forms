import { signal } from '@angular/core';
import { render, screen } from '@testing-library/angular';
import { describe, expect, it } from 'vitest';
import { NgxFormFieldset } from './form-fieldset';

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
  signal({
    invalid: () => true,
    valid: () => false,
    touched: () => true,
    dirty: () => false,
    pending: () => false,
    errors: () => [],
    errorSummary: () => [],
    ...overrides,
  });

describe('NgxFormFieldset', () => {
  it('renders projected content', async () => {
    const fieldset = createFieldsetState();

    const { container } = await render(
      `<ngx-form-fieldset [fieldsetField]="fieldset">
        <div class="content">Projected</div>
      </ngx-form-fieldset>`,
      {
        imports: [NgxFormFieldset],
        componentProperties: {
          fieldset,
        },
      },
    );

    expect(container.querySelector('.content')?.textContent).toBe('Projected');
  });

  it('projects legend as a direct child for semantic fieldsets', async () => {
    const fieldset = createFieldsetState();

    const { container } = await render(
      `<fieldset ngxFormFieldset [fieldsetField]="fieldset">
        <legend>Shipping Address</legend>
        <div class="content">Projected</div>
      </fieldset>`,
      {
        imports: [NgxFormFieldset],
        componentProperties: { fieldset },
      },
    );

    expect(container.querySelector('fieldset > legend')?.textContent).toBe(
      'Shipping Address',
    );
    expect(
      container.querySelector('fieldset > .ngx-signal-form-fieldset__surface'),
    ).not.toBeNull();
  });

  it('wraps grouped content in a dedicated surface layer', async () => {
    const fieldset = createFieldsetState();

    const { container } = await render(
      `<ngx-form-fieldset [fieldsetField]="fieldset">
        <div class="content">Projected</div>
      </ngx-form-fieldset>`,
      {
        imports: [NgxFormFieldset],
        componentProperties: {
          fieldset,
        },
      },
    );

    const host = container.querySelector('ngx-form-fieldset');
    const surface = host?.querySelector('.ngx-signal-form-fieldset__surface');
    const content = surface?.querySelector(
      '.ngx-signal-form-fieldset__content',
    );

    expect(surface).not.toBeNull();
    expect(content?.querySelector('.content')?.textContent).toBe('Projected');
  });

  it('aggregates errors from fieldsetField errorSummary', async () => {
    const fieldset = createFieldsetState({
      errors: () => [{ kind: 'required', message: 'Street required' }],
      errorSummary: () => [
        { kind: 'required', message: 'Street required' },
        { kind: 'required', message: 'Street required' },
      ],
    });

    const { container } = await render(
      `<ngx-form-fieldset [fieldsetField]="fieldset">
        <div>Content without nested form field</div>
      </ngx-form-fieldset>`,
      {
        imports: [NgxFormFieldset],
        componentProperties: { fieldset },
      },
    );

    const errors = screen.getAllByRole('alert');
    expect(errors).toHaveLength(1);
    expect(errors[0]?.textContent).toContain('Street required');
    expect(container.querySelector('ngx-form-field-notification')).toBeTruthy();
    expect(errors[0]?.querySelector('ul')).toBeTruthy();
    expect(errors[0]?.querySelectorAll('li')).toHaveLength(1);
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
      `<ngx-form-fieldset [fieldsetField]="fieldset">
        <div>Content without nested form field</div>
      </ngx-form-fieldset>`,
      {
        imports: [NgxFormFieldset],
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
      `<ngx-form-fieldset [fieldsetField]="fieldset">
        <div>Content without nested form field</div>
      </ngx-form-fieldset>`,
      {
        imports: [NgxFormFieldset],
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
      `<ngx-form-fieldset [fieldsetField]="fieldset" [fields]="fields">
        <div>Content without nested form field</div>
      </ngx-form-fieldset>`,
      {
        imports: [NgxFormFieldset],
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
      `<ngx-form-fieldset [fieldsetField]="fieldset">
        <div>Content</div>
      </ngx-form-fieldset>`,
      {
        imports: [NgxFormFieldset],
        componentProperties: { fieldset },
      },
    );

    const host = container.querySelector('ngx-form-fieldset');
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
      `<ngx-form-fieldset [fieldsetField]="fieldset" fieldsetId="address">
        <div>Content</div>
      </ngx-form-fieldset>`,
      {
        imports: [NgxFormFieldset],
        componentProperties: { fieldset },
      },
    );

    const errorElement = container.querySelector('#address-error');
    expect(errorElement).not.toBeNull();

    const host = container.querySelector('ngx-form-fieldset');
    expect(host).toHaveAttribute('aria-describedby', 'address-error');
  });

  it('renders aggregated messages below content by default', async () => {
    const fieldset = createFieldsetState({
      errors: () => [{ kind: 'required', message: 'Required' }],
      errorSummary: () => [{ kind: 'required', message: 'Required' }],
    });

    const { container } = await render(
      `<ngx-form-fieldset [fieldsetField]="fieldset">
        <div class="content">Content</div>
      </ngx-form-fieldset>`,
      {
        imports: [NgxFormFieldset],
        componentProperties: { fieldset },
      },
    );

    const host = container.querySelector('ngx-form-fieldset');
    const message = host?.querySelector('.ngx-signal-form-fieldset__messages');
    const content = host?.querySelector('.ngx-signal-form-fieldset__content');

    expect(
      host?.classList.contains('ngx-signal-form-fieldset--messages-bottom'),
    ).toBe(true);
    expect(message).toBeInstanceOf(Node);
    expect(content?.compareDocumentPosition(message)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    );
  });

  it('renders fieldset summaries as a bulleted list', async () => {
    const fieldset = createFieldsetState({
      errors: () => [
        { kind: 'required', message: 'Street required' },
        { kind: 'minlength', message: 'Street must be longer' },
      ],
      errorSummary: () => [
        { kind: 'required', message: 'Street required' },
        { kind: 'minlength', message: 'Street must be longer' },
      ],
    });

    const { container } = await render(
      `<ngx-form-fieldset [fieldsetField]="fieldset">
        <div>Content</div>
      </ngx-form-fieldset>`,
      {
        imports: [NgxFormFieldset],
        componentProperties: { fieldset },
      },
    );

    const errorList = container.querySelector(
      '.ngx-form-field-notification__list',
    );
    expect(errorList?.tagName).toBe('UL');
    expect(errorList?.querySelectorAll('li')).toHaveLength(2);
  });

  it('defaults regular grouped sections to notification feedback without tinting the surface', async () => {
    const fieldset = createFieldsetState({
      errors: () => [{ kind: 'required', message: 'Street required' }],
      errorSummary: () => [{ kind: 'required', message: 'Street required' }],
    });

    const { container } = await render(
      `<ngx-form-fieldset [fieldsetField]="fieldset" fieldsetId="address">
        <div class="content">Projected</div>
      </ngx-form-fieldset>`,
      {
        imports: [NgxFormFieldset],
        componentProperties: { fieldset },
      },
    );

    const host = container.querySelector('ngx-form-fieldset');

    expect(host).toHaveAttribute('data-feedback-appearance', 'notification');
    expect(
      host?.classList.contains('ngx-signal-form-fieldset--surface-invalid'),
    ).toBe(false);
    expect(container.querySelector('ngx-form-field-notification')).toBeTruthy();
    expect(container.querySelector('ngx-form-field-error')).toBeNull();

    if (!(host instanceof HTMLElement)) {
      throw new Error('expected fieldset host element');
    }

    expect(
      getComputedStyle(host).getPropertyValue('--_fieldset-clr-danger').trim(),
    ).toContain('#db1818');
    expect(
      getComputedStyle(host)
        .getPropertyValue('--_fieldset-notification-error-color')
        .trim(),
    ).toContain('--_fieldset-clr-danger');
  });

  it('uses compact feedback and tints selection-only groups in auto mode', async () => {
    const fieldset = createFieldsetState({
      errors: () => [{ kind: 'required', message: 'Choose one option' }],
      errorSummary: () => [{ kind: 'required', message: 'Choose one option' }],
    });

    const { container } = await render(
      `<fieldset ngxFormFieldset [fieldsetField]="fieldset" fieldsetId="contact-method">
        <legend>Preferred contact method</legend>
        <label><input type="radio" name="contact" />Email</label>
        <label><input type="radio" name="contact" />SMS</label>
      </fieldset>`,
      {
        imports: [NgxFormFieldset],
        componentProperties: { fieldset },
      },
    );

    const host = container.querySelector('fieldset');

    expect(host).toHaveAttribute('data-feedback-appearance', 'plain');
    expect(
      host?.classList.contains('ngx-signal-form-fieldset--selection-group'),
    ).toBe(true);
    expect(
      host?.classList.contains('ngx-signal-form-fieldset--surface-invalid'),
    ).toBe(true);
    expect(container.querySelector('ngx-form-field-notification')).toBeNull();
    expect(container.querySelector('ngx-form-field-error')).toBeTruthy();
  });

  it('marks the host aria-busy while the composed headless directive is pending', async () => {
    const fieldset = createFieldsetState({
      pending: () => true,
      errors: () => [],
      errorSummary: () => [],
    });

    const { container } = await render(
      `<ngx-form-fieldset [fieldsetField]="fieldset">
        <div>Content</div>
      </ngx-form-fieldset>`,
      {
        imports: [NgxFormFieldset],
        componentProperties: { fieldset },
      },
    );

    const host = container.querySelector('ngx-form-fieldset');
    // `[attr.aria-busy]` bound to `fieldset.isPending()` from the composed
    // host directive — this asserts the compose wiring works end-to-end.
    expect(host).toHaveAttribute('aria-busy', 'true');
  });

  it('forwards includeNestedErrors through the composed host directive', async () => {
    const fieldset = createFieldsetState({
      errors: () => [],
      errorSummary: () => [{ kind: 'required', message: 'Nested error' }],
    });

    const { container } = await render(
      `<ngx-form-fieldset
        [fieldsetField]="fieldset"
        [includeNestedErrors]="true"
      >
        <div>Content</div>
      </ngx-form-fieldset>`,
      {
        imports: [NgxFormFieldset],
        componentProperties: { fieldset },
      },
    );

    // Default is `false` (direct errors only). Because the mock's direct
    // `errors()` is empty but `errorSummary()` has an entry, a working
    // input forward of `includeNestedErrors=true` must surface it.
    const errors = container.querySelectorAll('[role="alert"]');
    expect(errors.length).toBe(1);
    expect(errors[0]?.textContent).toContain('Nested error');
  });

  it('applies role="group" and aria-labelledby on custom-element hosts', async () => {
    const fieldset = createFieldsetState();

    const { container } = await render(
      `<ngx-form-fieldset [fieldsetField]="fieldset" fieldsetId="personal-info">
        <legend>Personal Information</legend>
        <div class="content">Projected</div>
      </ngx-form-fieldset>`,
      {
        imports: [NgxFormFieldset],
        componentProperties: { fieldset },
      },
    );

    const host = container.querySelector('ngx-form-fieldset');
    const legend = container.querySelector('ngx-form-fieldset > legend');

    expect(host).toHaveAttribute('role', 'group');
    expect(legend?.id).toBe('personal-info-legend');
    expect(host).toHaveAttribute('aria-labelledby', 'personal-info-legend');
  });

  it('leaves native <fieldset> hosts to use their intrinsic group semantics', async () => {
    const fieldset = createFieldsetState();

    const { container } = await render(
      `<fieldset ngxFormFieldset [fieldsetField]="fieldset" fieldsetId="native">
        <legend>Shipping Address</legend>
        <div class="content">Projected</div>
      </fieldset>`,
      {
        imports: [NgxFormFieldset],
        componentProperties: { fieldset },
      },
    );

    const host = container.querySelector('fieldset');

    expect(host).not.toHaveAttribute('role');
    expect(host).not.toHaveAttribute('aria-labelledby');
  });

  it('renders aggregated messages above content when errorPlacement is top', async () => {
    const fieldset = createFieldsetState({
      errors: () => [{ kind: 'required', message: 'Required' }],
      errorSummary: () => [{ kind: 'required', message: 'Required' }],
    });

    const { container } = await render(
      `<ngx-form-fieldset [fieldsetField]="fieldset" errorPlacement="top">
        <div class="content">Content</div>
      </ngx-form-fieldset>`,
      {
        imports: [NgxFormFieldset],
        componentProperties: { fieldset },
      },
    );

    const host = container.querySelector('ngx-form-fieldset');
    const message = host?.querySelector('.ngx-signal-form-fieldset__messages');
    const content = host?.querySelector('.ngx-signal-form-fieldset__content');

    expect(host).toHaveAttribute('data-error-placement', 'top');
    expect(
      host?.classList.contains('ngx-signal-form-fieldset--messages-top'),
    ).toBe(true);
    expect(content).toBeInstanceOf(Node);
    expect(message?.compareDocumentPosition(content)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    );
  });
});
