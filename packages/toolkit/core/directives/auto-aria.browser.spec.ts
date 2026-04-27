import {
  ApplicationRef,
  ChangeDetectionStrategy,
  Component,
  Directive,
  input as signalInput,
  signal,
} from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FORM_FIELD } from '@angular/forms/signals';
import { render } from '@testing-library/angular';
import { describe, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';
import { NgxSignalFormAutoAria } from './auto-aria';
import { NgxSignalFormControlSemanticsDirective } from './control-semantics';
import { NgxFormField } from '../../form-field';

@Directive({
  selector: '[formField]',
  providers: [{ provide: FORM_FIELD, useExisting: MockFormFieldDirective }],
})
class MockFormFieldDirective {
  readonly field = signalInput<unknown>(undefined, { alias: 'formField' });
  readonly state = signal<unknown>();
}

function createMockControl(
  invalid = false,
  touched = false,
  errors: unknown[] = [],
) {
  const fieldState = {
    invalid: signal(invalid),
    touched: signal(touched),
    errors: signal(errors),
    valid: signal(!invalid),
    dirty: signal(touched),
    value: signal(''),
    required: signal(false),
    focusBoundControl: vi.fn(),
  };

  return signal(() => fieldState);
}

describe('NgxSignalFormAutoAria browser mode', () => {
  it('combines projected hint and error ids inside the real wrapper DOM', async () => {
    @Component({
      selector: 'ngx-test-auto-aria-browser-wrapper',
      imports: [MockFormFieldDirective, NgxSignalFormAutoAria, NgxFormField],
      changeDetection: ChangeDetectionStrategy.OnPush,
      template: `
        <ngx-form-field-wrapper [formField]="emailControl">
          <label for="email">Email</label>
          <input id="email" [formField]="emailControl()" />
          <ngx-form-field-hint id="email-hint"> Help text </ngx-form-field-hint>
        </ngx-form-field-wrapper>
      `,
    })
    class TestComponent {
      readonly emailControl = createMockControl(true, true, [
        { kind: 'required', message: 'Required' },
      ]);
    }

    await render(TestComponent);
    await TestBed.inject(ApplicationRef).whenStable();

    await expect
      .element(page.getByRole('textbox', { name: 'Email' }))
      .toHaveAttribute('aria-describedby', 'email-hint email-error');
  });

  it('updates auto-managed aria attributes after a browser interaction changes control state', async () => {
    @Component({
      selector: 'ngx-test-auto-aria-browser-auto-update',
      imports: [MockFormFieldDirective, NgxSignalFormAutoAria],
      changeDetection: ChangeDetectionStrategy.OnPush,
      template: `
        <label for="email">Email</label>
        <input id="email" [formField]="emailControl()" />
        <button type="button" (click)="makeInvalid()">Invalidate</button>
      `,
    })
    class TestComponent {
      readonly emailControl = createMockControl(false, false);

      protected makeInvalid(): void {
        this.emailControl.update(() => () => ({
          invalid: signal(true),
          touched: signal(true),
          errors: signal([{ kind: 'required', message: 'Email is required' }]),
          valid: signal(false),
          dirty: signal(true),
          value: signal(''),
          required: signal(false),
          focusBoundControl: vi.fn(),
        }));
      }
    }

    await render(TestComponent);

    const emailInput = page.getByRole('textbox', { name: 'Email' });
    await expect.element(emailInput).toHaveAttribute('aria-invalid', 'false');

    await page.getByRole('button', { name: 'Invalidate' }).click();
    await TestBed.inject(ApplicationRef).whenStable();

    await expect.element(emailInput).toHaveAttribute('aria-invalid', 'true');
    await expect
      .element(emailInput)
      .toHaveAttribute('aria-describedby', 'email-error');
  });

  it('preserves manual aria ownership after a browser interaction updates consumer attrs', async () => {
    @Component({
      selector: 'ngx-test-auto-aria-browser-manual',
      imports: [
        MockFormFieldDirective,
        NgxSignalFormAutoAria,
        NgxSignalFormControlSemanticsDirective,
      ],
      changeDetection: ChangeDetectionStrategy.OnPush,
      template: `
        <label for="emailUpdates">Email updates</label>
        <input
          id="emailUpdates"
          type="checkbox"
          role="switch"
          [attr.aria-describedby]="describedBy()"
          [attr.aria-invalid]="ariaInvalid()"
          [attr.aria-required]="ariaRequired()"
          ngxSignalFormControl="switch"
          ngxSignalFormControlAria="manual"
          [formField]="switchControl()"
        />
        <button type="button" (click)="replaceAttrs()">Replace attrs</button>
      `,
    })
    class TestComponent {
      readonly describedBy = signal('emailUpdates-hint');
      readonly ariaInvalid = signal('mixed');
      readonly ariaRequired = signal('true');
      readonly switchControl = createMockControl(true, true, [
        { kind: 'required', message: 'Switch is required' },
      ]);

      protected replaceAttrs(): void {
        this.describedBy.set('emailUpdates-details');
        this.ariaInvalid.set('false');
        this.ariaRequired.set('false');
      }
    }

    await render(TestComponent);

    const switchInput = page.getByRole('switch', { name: 'Email updates' });
    await expect
      .element(switchInput)
      .toHaveAttribute('aria-describedby', 'emailUpdates-hint');
    await expect.element(switchInput).toHaveAttribute('aria-invalid', 'mixed');
    await expect.element(switchInput).toHaveAttribute('aria-required', 'true');

    await page.getByRole('button', { name: 'Replace attrs' }).click();
    await TestBed.inject(ApplicationRef).whenStable();

    await expect
      .element(switchInput)
      .toHaveAttribute('aria-describedby', 'emailUpdates-details');
    await expect.element(switchInput).toHaveAttribute('aria-invalid', 'false');
    await expect.element(switchInput).toHaveAttribute('aria-required', 'false');
  });

  it('clears aria-invalid when the wrapper hides the bound control and restores it when shown again', async () => {
    // User Story 2: aria-invalid must not go stale on collapsed/hidden
    // controls. The wrapper polls `Element.checkVisibility()` in its
    // `afterEveryRender` write phase and pushes the result into
    // `NgxFieldIdentity._setControlVisible`. Auto-aria's `ariaInvalid`
    // computed returns null while `isControlVisible() === false`, so
    // hiding the input via the `hidden` attribute removes the attribute.
    @Component({
      selector: 'ngx-test-auto-aria-browser-visibility',
      imports: [MockFormFieldDirective, NgxSignalFormAutoAria, NgxFormField],
      changeDetection: ChangeDetectionStrategy.OnPush,
      template: `
        <ngx-form-field-wrapper [formField]="emailControl">
          <label for="email">Email</label>
          <input id="email" [formField]="emailControl()" [hidden]="hidden()" />
        </ngx-form-field-wrapper>
        <button type="button" (click)="toggle()">Toggle</button>
      `,
    })
    class TestComponent {
      readonly emailControl = createMockControl(true, true, [
        { kind: 'required', message: 'Required' },
      ]);
      readonly hidden = signal(false);

      protected toggle(): void {
        this.hidden.update((value) => !value);
      }
    }

    await render(TestComponent);
    await TestBed.inject(ApplicationRef).whenStable();

    const emailInput = page.getByRole('textbox', {
      name: 'Email',
      includeHidden: true,
    });
    await expect.element(emailInput).toHaveAttribute('aria-invalid', 'true');

    // Hide the control. The wrapper's next `afterEveryRender` write tick
    // sees `checkVisibility() === false` and pushes that into the identity
    // service; auto-aria's `ariaInvalid` computed then returns null.
    await page.getByRole('button', { name: 'Toggle' }).click();
    await TestBed.inject(ApplicationRef).whenStable();
    await expect.element(emailInput).not.toHaveAttribute('aria-invalid');

    // Show again — visibility flips back, auto-aria restores the attribute
    // based on the field's strategy outcome.
    await page.getByRole('button', { name: 'Toggle' }).click();
    await TestBed.inject(ApplicationRef).whenStable();
    await expect.element(emailInput).toHaveAttribute('aria-invalid', 'true');
  });
});
