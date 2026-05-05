import {
  Component,
  provideZonelessChangeDetection,
  signal,
} from '@angular/core';
import { FormField, form, schema, validate } from '@angular/forms/signals';
import {
  NgxSignalFormToolkit,
  provideErrorMessages,
  provideNgxSignalFormsConfig,
  warningError,
} from '@ngx-signal-forms/toolkit';
import { render } from '@testing-library/angular';
import { describe, expect, it } from 'vitest';
import { NgxMatFeedback } from './feedback-directive';

interface AgreeModel {
  agree: boolean;
}

/**
 * Pins the registry-bypass fix from issue #66: before the migration to
 * `createErrorMessageSignal`, `*ngxMatFeedback` resolved messages by reading
 * `error.message` directly and never consulted `NGX_ERROR_MESSAGES`. The
 * second test pins the "warnings hidden when blocking errors are present"
 * Material convention preserved by the migration.
 */
describe('*ngxMatFeedback — registry resolution + severity precedence', () => {
  it('renders a registry-provided message when the validator omits `message:`', async () => {
    @Component({
      selector: 'ngx-host',
      imports: [FormField, NgxSignalFormToolkit, NgxMatFeedback],
      template: `
        <form [formRoot]="form" ngxSignalForm>
          <input type="checkbox" [formField]="form.agree" />
          <ng-container
            *ngxMatFeedback="
              form.agree;
              fieldName: 'agree';
              let messages;
              severity as severity;
              id as id
            "
          >
            <div
              [attr.role]="severity === 'error' ? 'alert' : 'status'"
              [id]="id"
            >
              @for (message of messages; track message) {
                <span data-testid="msg">{{ message }}</span>
              }
            </div>
          </ng-container>
        </form>
      `,
    })
    class HostComponent {
      readonly form = form<AgreeModel>(
        signal({ agree: false }),
        schema<AgreeModel>((path) => {
          // No `message:` — the resolver must fall through to the registry.
          validate(path.agree, (ctx) =>
            ctx.value() ? null : { kind: 'required' },
          );
        }),
      );
    }

    const view = await render(HostComponent, {
      providers: [
        provideZonelessChangeDetection(),
        provideNgxSignalFormsConfig({
          defaultErrorStrategy: 'immediate',
          autoAria: false,
        }),
        provideErrorMessages({ required: 'Please agree before continuing' }),
      ],
    });

    expect(view.getByTestId('msg').textContent).toContain(
      'Please agree before continuing',
    );
  });

  it('suppresses the warning block when blocking errors are present', async () => {
    @Component({
      selector: 'ngx-host',
      imports: [FormField, NgxSignalFormToolkit, NgxMatFeedback],
      template: `
        <form [formRoot]="form" ngxSignalForm>
          <input type="checkbox" [formField]="form.agree" />
          <ng-container
            *ngxMatFeedback="
              form.agree;
              fieldName: 'agree';
              let messages;
              severity as severity
            "
          >
            <div [attr.data-severity]="severity">
              @for (message of messages; track message) {
                <span data-testid="msg">{{ message }}</span>
              }
            </div>
          </ng-container>
        </form>
      `,
    })
    class HostComponent {
      readonly form = form<AgreeModel>(
        signal({ agree: false }),
        schema<AgreeModel>((path) => {
          validate(path.agree, (ctx) => {
            if (!ctx.value()) {
              return [
                { kind: 'required', message: 'Required' },
                warningError('warn:weak', 'Soft warning'),
              ];
            }
            return null;
          });
        }),
      );
    }

    const view = await render(HostComponent, {
      providers: [
        provideZonelessChangeDetection(),
        provideNgxSignalFormsConfig({
          defaultErrorStrategy: 'immediate',
          autoAria: false,
        }),
      ],
    });

    const block = view.container.querySelector('[data-severity]');
    expect(block?.getAttribute('data-severity')).toBe('error');
    const messages = view.queryAllByTestId('msg').map((el) => el.textContent);
    expect(messages).toEqual(['Required']);
    expect(messages.join(' ')).not.toContain('Soft warning');
  });
});
