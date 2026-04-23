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

  it('defaults the fieldset shell appearance to outline', async () => {
    const fieldset = createFieldsetState();

    const { container } = await render(
      `<ngx-form-fieldset [fieldsetField]="fieldset">
        <div>Content</div>
      </ngx-form-fieldset>`,
      {
        imports: [NgxFormFieldset],
        componentProperties: { fieldset },
      },
    );

    expect(container.querySelector('ngx-form-fieldset')).toHaveAttribute(
      'data-appearance',
      'outline',
    );
  });

  it('exposes the semantic plain appearance on the host data attribute', async () => {
    const fieldset = createFieldsetState();

    const { container } = await render(
      `<ngx-form-fieldset [fieldsetField]="fieldset" appearance="plain">
        <div>Content</div>
      </ngx-form-fieldset>`,
      {
        imports: [NgxFormFieldset],
        componentProperties: { fieldset },
      },
    );

    expect(container.querySelector('ngx-form-fieldset')).toHaveAttribute(
      'data-appearance',
      'plain',
    );
  });

  it('treats selection-only groups like regular grouped sections in auto mode', async () => {
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

    expect(host).toHaveAttribute('data-feedback-appearance', 'notification');
    expect(
      host?.classList.contains('ngx-signal-form-fieldset--surface-invalid'),
    ).toBe(false);
    expect(container.querySelector('ngx-form-field-notification')).toBeTruthy();
    expect(container.querySelector('ngx-form-field-error')).toBeNull();
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

  it('defaults errorPlacement to bottom on the host data attribute', async () => {
    const fieldset = createFieldsetState();

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

    // Regression guard for the 1.0.0-rc.7 default change (`top` -> `bottom`).
    expect(host).toHaveAttribute('data-error-placement', 'bottom');
    expect(
      host?.classList.contains('ngx-signal-form-fieldset--messages-bottom'),
    ).toBe(true);
  });

  it('renders the compact ngx-form-field-error when feedbackAppearance="plain"', async () => {
    const fieldset = createFieldsetState({
      errors: () => [{ kind: 'required', message: 'Required' }],
      errorSummary: () => [{ kind: 'required', message: 'Required' }],
    });

    const { container } = await render(
      `<ngx-form-fieldset
        [fieldsetField]="fieldset"
        feedbackAppearance="plain"
      >
        <div>Content</div>
      </ngx-form-fieldset>`,
      {
        imports: [NgxFormFieldset],
        componentProperties: { fieldset },
      },
    );

    const host = container.querySelector('ngx-form-fieldset');
    expect(host).toHaveAttribute('data-feedback-appearance', 'plain');
    expect(container.querySelector('ngx-form-field-error')).toBeTruthy();
    expect(container.querySelector('ngx-form-field-notification')).toBeNull();
  });

  it('forces the notification card when feedbackAppearance="notification"', async () => {
    const fieldset = createFieldsetState({
      errors: () => [{ kind: 'required', message: 'Required' }],
      errorSummary: () => [{ kind: 'required', message: 'Required' }],
    });

    const { container } = await render(
      `<ngx-form-fieldset
        [fieldsetField]="fieldset"
        feedbackAppearance="notification"
      >
        <div>Content</div>
      </ngx-form-fieldset>`,
      {
        imports: [NgxFormFieldset],
        componentProperties: { fieldset },
      },
    );

    const host = container.querySelector('ngx-form-fieldset');
    expect(host).toHaveAttribute('data-feedback-appearance', 'notification');
    expect(container.querySelector('ngx-form-field-notification')).toBeTruthy();
    expect(container.querySelector('ngx-form-field-error')).toBeNull();
  });

  it('forwards notificationTitle to the grouped notification card', async () => {
    const fieldset = createFieldsetState({
      errors: () => [{ kind: 'required', message: 'Required' }],
      errorSummary: () => [{ kind: 'required', message: 'Required' }],
    });

    const { container } = await render(
      `<ngx-form-fieldset
        [fieldsetField]="fieldset"
        notificationTitle="Please review the following"
      >
        <div>Content</div>
      </ngx-form-fieldset>`,
      {
        imports: [NgxFormFieldset],
        componentProperties: { fieldset },
      },
    );

    const title = container.querySelector(
      '.ngx-form-field-notification__title',
    );
    expect(title?.textContent).toContain('Please review the following');
  });

  it('renders grouped messages as stacked paragraphs when listStyle="plain"', async () => {
    const fieldset = createFieldsetState({
      errors: () => [
        { kind: 'required', message: 'First required' },
        { kind: 'minlength', message: 'Too short' },
      ],
      errorSummary: () => [
        { kind: 'required', message: 'First required' },
        { kind: 'minlength', message: 'Too short' },
      ],
    });

    const { container } = await render(
      `<ngx-form-fieldset
        [fieldsetField]="fieldset"
        listStyle="plain"
      >
        <div>Content</div>
      </ngx-form-fieldset>`,
      {
        imports: [NgxFormFieldset],
        componentProperties: { fieldset },
      },
    );

    expect(
      container.querySelector('.ngx-form-field-notification__list'),
    ).toBeNull();
    expect(
      container.querySelectorAll('.ngx-form-field-notification__stack p'),
    ).toHaveLength(2);
  });

  it('exposes surfaceTone as a data attribute for consumer styling', async () => {
    const fieldset = createFieldsetState();

    const { container } = await render(
      `<ngx-form-fieldset
        [fieldsetField]="fieldset"
        surfaceTone="info"
      >
        <div>Content</div>
      </ngx-form-fieldset>`,
      {
        imports: [NgxFormFieldset],
        componentProperties: { fieldset },
      },
    );

    const host = container.querySelector('ngx-form-fieldset');
    expect(host).toHaveAttribute('data-surface-tone', 'info');
  });

  it('tints the surface when validationSurface="always" and errors are showing', async () => {
    const fieldset = createFieldsetState({
      errors: () => [{ kind: 'required', message: 'Required' }],
      errorSummary: () => [{ kind: 'required', message: 'Required' }],
    });

    const { container } = await render(
      `<ngx-form-fieldset
        [fieldsetField]="fieldset"
        validationSurface="always"
      >
        <div>Content</div>
      </ngx-form-fieldset>`,
      {
        imports: [NgxFormFieldset],
        componentProperties: { fieldset },
      },
    );

    const host = container.querySelector('ngx-form-fieldset');
    expect(host).toHaveAttribute('data-validation-surface', 'always');
    expect(
      host?.classList.contains('ngx-signal-form-fieldset--surface-invalid'),
    ).toBe(true);
  });

  it('tints the warning surface when validationSurface="always" and only warnings exist', async () => {
    const fieldset = createFieldsetState({
      errors: () => [{ kind: 'warn:soft', message: 'Warning' }],
      errorSummary: () => [{ kind: 'warn:soft', message: 'Warning' }],
    });

    const { container } = await render(
      `<ngx-form-fieldset
        [fieldsetField]="fieldset"
        validationSurface="always"
      >
        <div>Content</div>
      </ngx-form-fieldset>`,
      {
        imports: [NgxFormFieldset],
        componentProperties: { fieldset },
      },
    );

    const host = container.querySelector('ngx-form-fieldset');
    expect(
      host?.classList.contains('ngx-signal-form-fieldset--surface-warning'),
    ).toBe(true);
    expect(
      host?.classList.contains('ngx-signal-form-fieldset--surface-invalid'),
    ).toBe(false);
  });

  it('leaves the surface neutral when validationSurface="never"', async () => {
    const fieldset = createFieldsetState({
      errors: () => [{ kind: 'required', message: 'Required' }],
      errorSummary: () => [{ kind: 'required', message: 'Required' }],
    });

    const { container } = await render(
      `<ngx-form-fieldset
        [fieldsetField]="fieldset"
        validationSurface="never"
      >
        <div>Content</div>
      </ngx-form-fieldset>`,
      {
        imports: [NgxFormFieldset],
        componentProperties: { fieldset },
      },
    );

    const host = container.querySelector('ngx-form-fieldset');
    expect(
      host?.classList.contains('ngx-signal-form-fieldset--surface-invalid'),
    ).toBe(false);
    expect(
      host?.classList.contains('ngx-signal-form-fieldset--surface-warning'),
    ).toBe(false);
  });

  it('omits aria-describedby when showErrors is false even on an invalid fieldset', async () => {
    // Regression guard: without the `showMessages()` gate on describedByIds,
    // the host would advertise `${fieldsetId}-error` while the rendered
    // notification strips its id because the message list is empty.
    const fieldset = createFieldsetState({
      errors: () => [{ kind: 'required', message: 'Required' }],
      errorSummary: () => [{ kind: 'required', message: 'Required' }],
    });

    const { container } = await render(
      `<ngx-form-fieldset
        [fieldsetField]="fieldset"
        fieldsetId="no-announce"
        [showErrors]="false"
      >
        <div>Content</div>
      </ngx-form-fieldset>`,
      {
        imports: [NgxFormFieldset],
        componentProperties: { fieldset },
      },
    );

    const host = container.querySelector('ngx-form-fieldset');
    expect(host).not.toHaveAttribute('aria-describedby');
    expect(container.querySelector('#no-announce-error')).toBeNull();
  });
});
