import {
  Component,
  provideZonelessChangeDetection,
  signal,
} from '@angular/core';
import { FormField, form, schema, validate } from '@angular/forms/signals';
import {
  NgxSignalFormToolkit,
  provideNgxSignalFormsConfig,
  warningError,
} from '@ngx-signal-forms/toolkit';
import { render } from '@testing-library/angular';
import { describe, expect, it } from 'vitest';
import { NgxMatErrorSlot, NgxMatHintSlot } from './slot-directives';

interface EmailModel {
  email: string;
}

/**
 * Pins the alias fix for the promoted pre-1.0 finding: `strategy` on
 * `*ngxMatErrorSlot` / `*ngxMatHintSlot` must be reachable from Angular's
 * structural-directive microsyntax (`*ngxMatErrorSlot="field; strategy: '…'"`),
 * which desugars to `[ngxMatErrorSlotStrategy]` / `[ngxMatHintSlotStrategy]`
 * — not the unaliased `[strategy]` the directive previously exposed. These
 * specs exercise the directives directly with plain elements (mirroring
 * `feedback-directive.spec.ts`) rather than real `<mat-error>`/`<mat-hint>`
 * so Material's own `errorState`-gated content projection can't mask
 * whether the toolkit directive itself resolved the override.
 */
describe('*ngxMatErrorSlot / *ngxMatHintSlot — strategy microsyntax alias', () => {
  it('honors a per-slot `strategy: "immediate"` override from microsyntax on an untouched field', async () => {
    @Component({
      selector: 'ngx-host',
      imports: [FormField, NgxSignalFormToolkit, NgxMatErrorSlot],
      template: `
        <form [formRoot]="form" ngxSignalForm>
          <input type="email" [formField]="form.email" />
          <div
            *ngxMatErrorSlot="form.email; strategy: 'immediate'; let message"
            data-testid="msg"
          >
            {{ message }}
          </div>
        </form>
      `,
    })
    class HostComponent {
      readonly form = form<EmailModel>(
        signal({ email: '' }),
        schema<EmailModel>((path) => {
          validate(path.email, (ctx) =>
            ctx.value() ? null : { kind: 'required', message: 'Required' },
          );
        }),
      );
    }

    const view = await render(HostComponent, {
      providers: [
        provideZonelessChangeDetection(),
        // Form-level default is 'on-touch' — the field is never touched, so
        // the error should stay hidden UNLESS the per-slot override wins.
        provideNgxSignalFormsConfig({
          defaultErrorStrategy: 'on-touch',
          autoAria: false,
        }),
      ],
    });

    expect(view.getByTestId('msg').textContent).toContain('Required');
  });

  it('does NOT render a blocking error on an untouched field without a strategy override (control assertion)', async () => {
    @Component({
      selector: 'ngx-host',
      imports: [FormField, NgxSignalFormToolkit, NgxMatErrorSlot],
      template: `
        <form [formRoot]="form" ngxSignalForm>
          <input type="email" [formField]="form.email" />
          <div *ngxMatErrorSlot="form.email; let message" data-testid="msg">
            {{ message }}
          </div>
        </form>
      `,
    })
    class HostComponent {
      readonly form = form<EmailModel>(
        signal({ email: '' }),
        schema<EmailModel>((path) => {
          validate(path.email, (ctx) =>
            ctx.value() ? null : { kind: 'required', message: 'Required' },
          );
        }),
      );
    }

    const view = await render(HostComponent, {
      providers: [
        provideZonelessChangeDetection(),
        provideNgxSignalFormsConfig({
          defaultErrorStrategy: 'on-touch',
          autoAria: false,
        }),
      ],
    });

    expect(view.queryByTestId('msg')).toBeNull();
  });

  it('honors a per-slot `strategy: "immediate"` override on *ngxMatHintSlot for an untouched field', async () => {
    @Component({
      selector: 'ngx-host',
      imports: [FormField, NgxSignalFormToolkit, NgxMatHintSlot],
      template: `
        <form [formRoot]="form" ngxSignalForm>
          <input type="text" [formField]="form.email" />
          <div *ngxMatHintSlot="form.email; strategy: 'immediate'; let warning">
            @if (warning) {
              <span data-testid="warning">{{ warning }}</span>
            } @else {
              neutral copy
            }
          </div>
        </form>
      `,
    })
    class HostComponent {
      readonly form = form<EmailModel>(
        signal({ email: '' }),
        schema<EmailModel>((path) => {
          validate(path.email, (ctx) =>
            ctx.value() ? null : warningError('warn:empty', 'Soft warning'),
          );
        }),
      );
    }

    const view = await render(HostComponent, {
      providers: [
        provideZonelessChangeDetection(),
        // Form-level default is 'on-touch' — the field is never touched, so
        // the warning should stay hidden UNLESS the per-slot override wins.
        provideNgxSignalFormsConfig({
          defaultErrorStrategy: 'on-touch',
          autoAria: false,
        }),
      ],
    });

    expect(view.getByTestId('warning').textContent).toContain('Soft warning');
  });
});
