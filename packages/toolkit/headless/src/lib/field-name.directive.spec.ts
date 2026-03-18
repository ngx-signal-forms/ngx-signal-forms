import { signal } from '@angular/core';
import { render, screen } from '@testing-library/angular';
import { describe, expect, it } from 'vitest';
import { NgxHeadlessFieldNameDirective } from './field-name.directive';

describe('NgxHeadlessFieldNameDirective', () => {
  it('resolves field name from explicit input', async () => {
    await render(
      `
      <div
        ngxSignalFormHeadlessFieldName
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
        imports: [NgxHeadlessFieldNameDirective],
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
        ngxSignalFormHeadlessFieldName
        #fieldName="fieldName"
        id="fallback-id"
        [fieldName]="fieldNameInput"
      >
        <span data-testid="resolved">{{ fieldName.resolvedFieldName() }}</span>
      </div>
      `,
      {
        imports: [NgxHeadlessFieldNameDirective],
        componentProperties: { fieldNameInput: '   ' },
      },
    );

    expect(screen.getByTestId('resolved')).toHaveTextContent('fallback-id');
  });

  it('throws when no input and no host id exist', async () => {
    await expect(
      render(
        `
        <div ngxSignalFormHeadlessFieldName #fieldName="fieldName">
          <span data-testid="resolved">{{ fieldName.resolvedFieldName() }}</span>
        </div>
        `,
        {
          imports: [NgxHeadlessFieldNameDirective],
        },
      ),
    ).rejects.toThrow(
      /requires either a non-empty `fieldName` input or a host element `id`/u,
    );
  });

  it('updates resolved ids when bound field name changes', async () => {
    const fieldNameInput = signal('email');
    const { fixture } = await render(
      `
      <div
        ngxSignalFormHeadlessFieldName
        #fieldName="fieldName"
        [fieldName]="fieldNameInput()"
      >
        <span data-testid="resolved">{{ fieldName.resolvedFieldName() }}</span>
        <span data-testid="error-id">{{ fieldName.errorId() }}</span>
        <span data-testid="warning-id">{{ fieldName.warningId() }}</span>
      </div>
      `,
      {
        imports: [NgxHeadlessFieldNameDirective],
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
