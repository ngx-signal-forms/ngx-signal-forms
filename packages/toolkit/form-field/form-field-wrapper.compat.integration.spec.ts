import { ApplicationRef, Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import type { ValidatorFn } from '@angular/forms';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { FormField, required } from '@angular/forms/signals';
import { compatForm, SignalFormControl } from '@angular/forms/signals/compat';
import { render, screen } from '@testing-library/angular';
import { describe, expect, it } from 'vitest';
import { NgxSignalFormToolkit } from '@ngx-signal-forms/toolkit';
import { NgxFormFieldWrapper } from './form-field-wrapper';

/**
 * Verifies the toolkit-layer claims in `docs/MIGRATING_FROM_REACTIVE_FORMS.md`
 * against the real, installed `@angular/forms/signals/compat` implementation
 * (not just its `.d.ts`) — see issue #229's requirement that every compat
 * claim be verified against running code.
 *
 * Both scenarios assert the wrapper/auto-aria/error-rendering pipeline
 * behaves identically whether the underlying field is a native Signal Forms
 * leaf or a Reactive control bridged through compat.
 *
 * **Confirmed divergence (documented in the guide, not a toolkit bug):** a
 * `compatForm()` leaf whose value is an `AbstractControl` does not run
 * declarative Signal Forms schema validators (`required()`, `validate()`,
 * …) registered against that same path — only the underlying control's own
 * Reactive validators determine its validity, surfaced as a
 * `CompatValidationError`. This matches Angular's own `compatForm` usage
 * example, which validates the plain sibling field (`name.first`) rather
 * than the control-backed one (`name.last`). This spec validates the
 * control-backed leaf the same way — with a Reactive `ValidatorFn` on the
 * `FormControl` — to reflect the correct top-down migration pattern.
 *
 * Uses a plain inline `ValidatorFn` instead of `Validators.required` — see
 * the `tsgolint` note in `oxlint.config.ts` for why.
 */
const requiredValidator: ValidatorFn = (control) =>
  control.value ? null : { required: true };

/**
 * A distinctive message a schema-level `required()` on the control-backed
 * leaf would produce, IF Signal Forms schema validators actually ran against
 * it. The "shows no error before touch…" spec below registers this on
 * `nameForm.last` and asserts it never surfaces — proving the divergence,
 * rather than merely asserting the (unrelated) control-side error appears.
 */
const SCHEMA_VALIDATOR_SHOULD_NOT_SURFACE_MESSAGE =
  'SCHEMA VALIDATOR SHOULD NOT SURFACE — schema validators do not run against a compat leaf backed by an AbstractControl';

async function flushAutoAria(): Promise<void> {
  // `NgxSignalFormAutoAria` writes `aria-describedby`/`aria-required` from an
  // `afterEveryRender` write phase; `ApplicationRef.whenStable()` — not
  // `fixture.whenStable()` — is what actually flushes that phase, matching
  // the toolkit's own auto-aria specs (`core/directives/auto-aria.spec.ts`).
  //
  // `aria-invalid` is deliberately NOT asserted in this jsdom spec: when a
  // control is wrapped by `NgxFormFieldWrapper`, auto-aria gates
  // `aria-invalid` on `NgxFieldIdentity.isControlVisible`, which the wrapper
  // derives from `isElementCssVisible()` (`Element.checkVisibility()` /
  // `offsetParent`). jsdom does not compute layout, so `offsetParent` is
  // unreliable for attached elements (see `field-identity.spec.ts`'s own
  // `isElementCssVisible` suite) — regardless of compat, a wrapped control's
  // `aria-invalid` is exercised in `*.browser.spec.ts`, where layout is real.
  await TestBed.inject(ApplicationRef).whenStable();
}

describe('NgxFormFieldWrapper + @angular/forms/signals/compat', () => {
  describe('top-down: compatForm() wrapping an existing FormControl', () => {
    @Component({
      selector: 'host-compat-top-down',
      standalone: true,
      imports: [FormField, NgxSignalFormToolkit, NgxFormFieldWrapper],
      template: `
        <form [formRoot]="nameForm" ngxSignalForm>
          <ngx-form-field-wrapper
            [formField]="nameForm.last"
            fieldName="last-name"
          >
            <label for="last-name">Last name</label>
            <input id="last-name" type="text" [formField]="nameForm.last" />
          </ngx-form-field-wrapper>
        </form>
      `,
    })
    class HostCompatTopDown {
      readonly lastNameControl = new FormControl('', requiredValidator);
      readonly nameModel = signal({
        first: '',
        last: this.lastNameControl,
      });
      // Deliberately registers a schema-level `required()` on the
      // control-backed `last` path too, with a distinctive message — see
      // `SCHEMA_VALIDATOR_SHOULD_NOT_SURFACE_MESSAGE` above. If Signal Forms
      // schema validators ever start running against compat leaves, this
      // message would surface and the "shows no error…" spec below would
      // fail, catching the divergence changing out from under the guide.
      readonly nameForm = compatForm(this.nameModel, (name) => {
        required(name.last, {
          message: SCHEMA_VALIDATOR_SHOULD_NOT_SURFACE_MESSAGE,
        });
      });
    }

    it('unwraps the FormControl to its raw value, not the control instance', async () => {
      const { fixture } = await render(HostCompatTopDown);
      const host = fixture.componentInstance;

      expect(host.nameForm.last().value()).toBe('');
      host.lastNameControl.setValue('Ada');
      fixture.detectChanges();
      expect(host.nameForm.last().value()).toBe('Ada');
    });

    it('shows no error before touch, then renders identically to a native field once touched', async () => {
      const { container, fixture } = await render(HostCompatTopDown);
      const host = fixture.componentInstance;
      const input = screen.getByLabelText('Last name');

      // Default 'on-touch' strategy: invalid but untouched, so no error yet.
      expect(screen.queryByText('This field is required')).toBeNull();
      expect(input.getAttribute('aria-describedby')).toBeNull();

      // Mark touched from the FieldTree side — a real blur wires up the same
      // underlying `markAsTouched()` call for a compat leaf as for a native one.
      host.nameForm.last().markAsTouched();
      fixture.detectChanges();
      await flushAutoAria();

      // The divergence itself, asserted directly on field state: the
      // schema-level `required()` registered on this exact path in
      // `HostCompatTopDown` never produces its error — only the control's
      // own `ValidatorFn`, surfaced as a `CompatValidationError`, does.
      const errors = host.nameForm.last().errors();
      expect(
        errors.some(
          (error) =>
            error.message === SCHEMA_VALIDATOR_SHOULD_NOT_SURFACE_MESSAGE,
        ),
      ).toBe(false);
      expect(errors.some((error) => error.kind === 'required')).toBe(true);

      // Toolkit's default fallback message for the built-in `required` kind —
      // resolved even though the error is a `CompatValidationError`, because
      // the registry keys purely on `error.kind`.
      expect(
        screen.queryByText(SCHEMA_VALIDATOR_SHOULD_NOT_SURFACE_MESSAGE),
      ).toBeNull();
      expect(screen.getByText('This field is required')).toBeTruthy();
      const describedBy = input.getAttribute('aria-describedby');
      expect(describedBy).toBe('last-name-error');
      expect(
        container.querySelector(`#${describedBy}`)?.textContent?.trim(),
      ).toBe('This field is required');
    });
  });

  describe('bottom-up: SignalFormControl inside a Reactive FormGroup', () => {
    @Component({
      selector: 'host-compat-bottom-up',
      standalone: true,
      imports: [
        FormField,
        ReactiveFormsModule,
        NgxSignalFormToolkit,
        NgxFormFieldWrapper,
      ],
      template: `
        <form [formGroup]="group">
          <ngx-form-field-wrapper
            [formField]="nameControl.fieldTree"
            fieldName="name"
          >
            <label for="name">Name</label>
            <input id="name" type="text" [formField]="nameControl.fieldTree" />
          </ngx-form-field-wrapper>
          <input id="age" type="number" formControlName="age" />
        </form>
      `,
    })
    class HostCompatBottomUp {
      readonly nameControl = new SignalFormControl('', (p) => {
        required(p, { message: 'Name is required' });
      });
      readonly group = new FormGroup({
        name: this.nameControl,
        age: new FormControl(25),
      });
    }

    it('resolves errors and aria through the bridge, reflecting markAsTouched() written from the Reactive side', async () => {
      const { fixture } = await render(HostCompatBottomUp);
      const host = fixture.componentInstance;
      const input = screen.getByLabelText('Name');

      // Untouched: invalid, but the default 'on-touch' strategy suppresses it.
      expect(screen.queryByText('Name is required')).toBeNull();
      expect(input.getAttribute('aria-describedby')).toBeNull();

      // Bottom-up write: mark touched via the AbstractControl API, not the DOM.
      // `SignalFormControl.markAsTouched()` writes straight through to the
      // same underlying field state the wrapper and auto-aria both read.
      host.nameControl.markAsTouched();
      fixture.detectChanges();
      await flushAutoAria();

      expect(screen.getByText('Name is required')).toBeTruthy();
      expect(input.getAttribute('aria-describedby')).toBe('name-error');
    });
  });
});
