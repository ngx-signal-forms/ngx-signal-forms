import { Component, input, signal } from '@angular/core';
import {
  FormField,
  form,
  minLength,
  required,
  schema,
} from '@angular/forms/signals';
import { render } from '@testing-library/angular';
import { describe, expect, it } from 'vitest';
import { NgxFormFieldError } from '../../assistive/form-field-error';
import { NgxFormFieldWrapper } from '../../form-field/form-field-wrapper';
import { NgxSignalFormToolkit } from '../../index';
import { NgxFieldIdentityProvider } from './field-identity-provider';

/**
 * `aria-invalid` must not go stale on a control that has no layout box.
 *
 * A control inside a collapsed `<details>`, an inactive tab panel, or a
 * non-current wizard step is not in the accessibility tree, so leaving
 * `aria-invalid="true"` on it means the attribute is wrong the instant the
 * container reopens with a different validation state. `NgxSignalFormAutoAria`
 * therefore probes its own host element each read phase and removes the
 * attribute while the control is not laid out.
 *
 * Browser-only by necessity: jsdom implements neither `checkVisibility()` nor
 * a real `offsetParent`, so the probe always reports "visible" there and every
 * assertion below would pass vacuously.
 */

function createForm() {
  const model = signal({ email: 'no' });
  return form(
    model,
    schema((path) => {
      minLength(path.email, 5, { message: 'At least 5 characters' });
    }),
  );
}

// ---------------------------------------------------------------------------
// Custom wrapper (the case with no workaround before this change)
// ---------------------------------------------------------------------------

@Component({
  selector: 'ngx-test-collapsible-custom-wrapper',
  hostDirectives: [
    { directive: NgxFieldIdentityProvider, inputs: ['fieldName'] },
  ],
  imports: [NgxFormFieldError],
  template: `
    <ng-content />
    <ngx-form-field-error
      [formField]="errorField()"
      fieldName="email"
      strategy="immediate"
    />
  `,
})
class CollapsibleCustomWrapper {
  readonly errorField = input.required<unknown>();
}

@Component({
  selector: 'ngx-test-collapsible-custom-host',
  imports: [CollapsibleCustomWrapper, FormField, NgxSignalFormToolkit],
  template: `
    <form [formRoot]="emailForm" ngxSignalForm>
      <details [open]="open()">
        <summary>Contact details</summary>
        <ngx-test-collapsible-custom-wrapper
          fieldName="email"
          [errorField]="emailForm.email"
        >
          <label for="widget-generated-7">Email</label>
          <input id="widget-generated-7" [formField]="emailForm.email" />
        </ngx-test-collapsible-custom-wrapper>
      </details>
    </form>
  `,
})
class CollapsibleCustomHost {
  readonly open = input.required<boolean>();
  readonly emailForm = createForm();
}

describe('auto-aria — aria-invalid on a control with no layout box (custom wrapper)', () => {
  it('sets aria-invalid while the control is laid out', async () => {
    const { container } = await render(CollapsibleCustomHost, {
      inputs: { open: true },
    });

    expect(
      container
        .querySelector('input#widget-generated-7')
        ?.getAttribute('aria-invalid'),
    ).toBe('true');
  });

  it('removes aria-invalid rather than leaving it stale when collapsed', async () => {
    const { fixture } = await render(CollapsibleCustomHost, {
      inputs: { open: true },
    });
    const control = (
      fixture.nativeElement as HTMLElement
    ).querySelector<HTMLElement>('input#widget-generated-7');
    expect(control?.getAttribute('aria-invalid')).toBe('true');

    fixture.componentRef.setInput('open', false);
    await fixture.whenStable();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(control?.checkVisibility()).toBe(false);
    expect(control?.getAttribute('aria-invalid')).toBeNull();
  });

  it('restores aria-invalid when the container reopens', async () => {
    const { fixture } = await render(CollapsibleCustomHost, {
      inputs: { open: false },
    });
    const control = (
      fixture.nativeElement as HTMLElement
    ).querySelector<HTMLElement>('input#widget-generated-7');

    fixture.componentRef.setInput('open', true);
    await fixture.whenStable();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(control?.getAttribute('aria-invalid')).toBe('true');
  });
});

// ---------------------------------------------------------------------------
// Built-in wrapper (previously the only shape the fix covered)
// ---------------------------------------------------------------------------

@Component({
  selector: 'ngx-test-collapsible-builtin-host',
  imports: [NgxFormFieldWrapper, FormField, NgxSignalFormToolkit],
  template: `
    <form [formRoot]="emailForm" ngxSignalForm>
      <details [open]="open()">
        <summary>Contact details</summary>
        <ngx-form-field-wrapper
          [formField]="emailForm.email"
          strategy="immediate"
        >
          <label for="email">Email</label>
          <input id="email" [formField]="emailForm.email" />
        </ngx-form-field-wrapper>
      </details>
    </form>
  `,
})
class CollapsibleBuiltinHost {
  readonly open = input.required<boolean>();
  readonly emailForm = createForm();
}

describe('auto-aria — aria-invalid on a control with no layout box (built-in wrapper)', () => {
  it('keeps the pre-existing behavior after auto-aria took over the probe', async () => {
    const { fixture } = await render(CollapsibleBuiltinHost, {
      inputs: { open: true },
    });
    const control = (
      fixture.nativeElement as HTMLElement
    ).querySelector<HTMLElement>('input#email');
    expect(control?.getAttribute('aria-invalid')).toBe('true');

    fixture.componentRef.setInput('open', false);
    await fixture.whenStable();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(control?.getAttribute('aria-invalid')).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Selection cluster — the one shape where self-probing changes behavior
// ---------------------------------------------------------------------------

@Component({
  selector: 'ngx-test-cluster-visibility-host',
  imports: [NgxFormFieldWrapper, FormField, NgxSignalFormToolkit],
  template: `
    <form [formRoot]="deliveryForm" ngxSignalForm>
      <details [open]="open()">
        <summary>Delivery</summary>
        <ngx-form-field-wrapper
          [formField]="deliveryForm.deliveryMethod"
          fieldName="deliveryMethod"
          strategy="immediate"
        >
          <div>
            <label>
              <input
                id="delivery-standard"
                type="radio"
                [formField]="deliveryForm.deliveryMethod"
                value="standard"
                [style.display]="hideFirstOption() ? 'none' : null"
              />
              Standard
            </label>
            <label>
              <input
                id="delivery-express"
                type="radio"
                [formField]="deliveryForm.deliveryMethod"
                value="express"
              />
              Express
            </label>
          </div>
        </ngx-form-field-wrapper>
      </details>
    </form>
  `,
})
class ClusterVisibilityHost {
  readonly open = input.required<boolean>();
  readonly hideFirstOption = input.required<boolean>();

  readonly #model = signal({ deliveryMethod: '' });
  readonly deliveryForm = form(
    this.#model,
    schema((path) => {
      required(path.deliveryMethod, { message: 'Pick a delivery method' });
    }),
  );
}

/**
 * A selection cluster has exactly one auto-aria instance, on the wrapper host
 * that carries the group role — the individual radios are excluded by the
 * directive's selector. Self-probing therefore moves the visibility source
 * from "whichever single control the wrapper resolved" to "the element that
 * actually carries `aria-invalid`". That is a deliberate behavior change, so
 * both halves of it are asserted rather than left to the general suite.
 */
describe('auto-aria — aria-invalid on a selection cluster', () => {
  async function renderCluster(open: boolean, hideFirstOption: boolean) {
    const { fixture } = await render(ClusterVisibilityHost, {
      inputs: { open, hideFirstOption },
    });
    return {
      fixture,
      group: (fixture.nativeElement as HTMLElement).querySelector<HTMLElement>(
        'ngx-form-field-wrapper',
      ),
    };
  }

  it('keeps the group aria-invalid when one option is hidden but the group is not', async () => {
    const { group } = await renderCluster(true, true);

    // The wrapper used to publish the *first* resolved control's visibility
    // for the whole cluster, so hiding that radio stripped `aria-invalid`
    // off a group the user can plainly see.
    expect(group?.checkVisibility()).toBe(true);
    expect(group?.getAttribute('aria-invalid')).toBe('true');
  });

  it('removes the group aria-invalid when the whole cluster loses its layout box', async () => {
    const { fixture, group } = await renderCluster(true, false);
    expect(group?.getAttribute('aria-invalid')).toBe('true');

    fixture.componentRef.setInput('open', false);
    await fixture.whenStable();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(group?.getAttribute('aria-invalid')).toBeNull();
  });
});
