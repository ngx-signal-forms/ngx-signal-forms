import { signal } from '@angular/core';
import { render, screen } from '@testing-library/angular';
import { describe, expect, it, vi } from 'vitest';
import { NgxHeadlessFieldName } from './field-name';

describe('NgxHeadlessFieldName', () => {
  it('resolves field name from explicit input', async () => {
    await render(
      `
      <div
        ngxHeadlessFieldName
        #fieldName="fieldName"
        id="host-id"
        [fieldName]="fieldNameInput"
      >
        <span data-testid="resolved">{{ fieldName.resolvedFieldName() }}</span>
        <span data-testid="error-id">{{ fieldName.errorId() }}</span>
        <span data-testid="warning-id">{{ fieldName.warningId() }}</span>
      </div>
      `,
      {
        imports: [NgxHeadlessFieldName],
        componentProperties: { fieldNameInput: 'email' },
      },
    );

    expect(screen.getByTestId('resolved')).toHaveTextContent('email');
    expect(screen.getByTestId('error-id')).toHaveTextContent('email-error');
    expect(screen.getByTestId('warning-id')).toHaveTextContent('email-warning');
  });

  it('falls back to host id when input is missing or blank', async () => {
    await render(
      `
      <div
        ngxHeadlessFieldName
        #fieldName="fieldName"
        id="fallback-id"
        [fieldName]="fieldNameInput"
      >
        <span data-testid="resolved">{{ fieldName.resolvedFieldName() }}</span>
      </div>
      `,
      {
        imports: [NgxHeadlessFieldName],
        componentProperties: { fieldNameInput: '   ' },
      },
    );

    expect(screen.getByTestId('resolved')).toHaveTextContent('fallback-id');
  });

  it('returns null signals and logs dev-mode error at most once when no input and no host id exist', async () => {
    const consoleErrorSpy = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);

    // Bind through a signal so we can force the `resolvedFieldName`
    // computed to re-run with another unresolvable value and verify the
    // one-shot guard actually suppresses a duplicate console.error.
    // Re-reading the computed wouldn't cover that: without a dependency
    // change Angular returns the cached result and the body never runs
    // again.
    const fieldNameInput = signal<string | undefined>(undefined);
    const { fixture } = await render(
      `
      <div
        ngxHeadlessFieldName
        #fieldName="fieldName"
        [fieldName]="fieldNameInput()"
      >
        <span data-testid="resolved">{{ fieldName.resolvedFieldName() }}</span>
        <span data-testid="error-id">{{ fieldName.errorId() }}</span>
        <span data-testid="warning-id">{{ fieldName.warningId() }}</span>
      </div>
      `,
      {
        imports: [NgxHeadlessFieldName],
        componentProperties: { fieldNameInput },
      },
    );

    // Angular interpolates `null` as empty text, so absence in the DOM
    // maps to absence of a resolvable identity.
    expect(screen.getByTestId('resolved').textContent).toBe('');
    expect(screen.getByTestId('error-id').textContent).toBe('');
    expect(screen.getByTestId('warning-id').textContent).toBe('');
    expect(consoleErrorSpy).toHaveBeenCalledOnce();
    expect(consoleErrorSpy.mock.calls[0]?.[0]).toMatch(
      /requires either a non-empty `fieldName` input or a host element `id`/u,
    );

    // Swap the bound input to another unresolvable value (whitespace-only).
    // The computed re-runs but still yields null; the one-shot guard must
    // keep the error count at one.
    fieldNameInput.set('   ');
    fixture.detectChanges();

    expect(screen.getByTestId('resolved').textContent).toBe('');
    expect(consoleErrorSpy).toHaveBeenCalledOnce();

    consoleErrorSpy.mockRestore();
  });

  it('updates resolved ids when bound field name changes', async () => {
    const fieldNameInput = signal('email');
    const { fixture } = await render(
      `
      <div
        ngxHeadlessFieldName
        #fieldName="fieldName"
        [fieldName]="fieldNameInput()"
      >
        <span data-testid="resolved">{{ fieldName.resolvedFieldName() }}</span>
        <span data-testid="error-id">{{ fieldName.errorId() }}</span>
        <span data-testid="warning-id">{{ fieldName.warningId() }}</span>
      </div>
      `,
      {
        imports: [NgxHeadlessFieldName],
        componentProperties: { fieldNameInput },
      },
    );

    expect(screen.getByTestId('resolved')).toHaveTextContent('email');

    fieldNameInput.set('username');
    fixture.detectChanges();

    expect(screen.getByTestId('resolved')).toHaveTextContent('username');
    expect(screen.getByTestId('error-id')).toHaveTextContent('username-error');
    expect(screen.getByTestId('warning-id')).toHaveTextContent(
      'username-warning',
    );
  });
});
