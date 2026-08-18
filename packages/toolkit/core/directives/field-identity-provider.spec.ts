import { Component, input, signal } from '@angular/core';
import { FormField, form, minLength, schema } from '@angular/forms/signals';
import { render } from '@testing-library/angular';
import { describe, expect, it, vi } from 'vitest';
import { NgxFormFieldError } from '../../assistive/form-field-error';
import { NgxFormFieldWrapper } from '../../form-field/form-field-wrapper';
import { NgxSignalFormToolkit } from '../../index';
import { NgxFieldIdentity } from '../services/field-identity';
import { NgxFieldIdentityProvider } from './field-identity-provider';

/**
 * The scenario this directive exists for: the control's DOM `id` is not the
 * field's name.
 *
 * `NgxSignalFormAutoAria` derives a field name from the bound control's `id`
 * unless an ancestor provides an `NgxFieldIdentity`. A third-party widget
 * that generates its own inner input id — or a `role="group"` cluster whose
 * name belongs to the group rather than to any one control — cannot satisfy
 * that. The generated `${fieldName}-error` id then disagrees with what the
 * wrapper rendered, producing a dangling `aria-describedby` (axe
 * `aria-valid-attr-value`).
 */
@Component({
  selector: 'ngx-test-custom-wrapper',
  hostDirectives: [
    { directive: NgxFieldIdentityProvider, inputs: ['fieldName'] },
  ],
  imports: [NgxFormFieldError],
  template: `
    <ng-content />
    <ngx-form-field-error
      [formField]="errorField()"
      [fieldName]="errorFieldName()"
      strategy="immediate"
    />
  `,
})
class CustomWrapper {
  readonly errorField = input.required<unknown>();
  readonly errorFieldName = input.required<string>();
}

@Component({
  selector: 'ngx-test-custom-wrapper-host',
  imports: [CustomWrapper, FormField, NgxSignalFormToolkit],
  template: `
    <form [formRoot]="loginForm" ngxSignalForm>
      <ngx-test-custom-wrapper
        fieldName="emailAddress"
        [errorField]="loginForm.emailAddress"
        errorFieldName="emailAddress"
      >
        <label for="p-inputtext-42">Email</label>
        <input id="p-inputtext-42" [formField]="loginForm.emailAddress" />
      </ngx-test-custom-wrapper>
    </form>
  `,
})
class CustomWrapperHost {
  readonly #model = signal({ emailAddress: 'no' });
  readonly loginForm = form(
    this.#model,
    schema((path) => {
      minLength(path.emailAddress, 5, { message: 'At least 5 characters' });
    }),
  );
}

describe('NgxFieldIdentityProvider', () => {
  it('makes auto-aria use the declared field name rather than the control id', async () => {
    const { container } = await render(CustomWrapperHost);

    const input = container.querySelector('input#p-inputtext-42');
    const describedBy = input?.getAttribute('aria-describedby') ?? '';

    expect(describedBy).toContain('emailAddress-error');
    expect(describedBy).not.toContain('p-inputtext-42-error');
  });

  it('resolves aria-describedby to an element the wrapper actually rendered', async () => {
    const { container } = await render(CustomWrapperHost);

    const describedBy =
      container
        .querySelector('input#p-inputtext-42')
        ?.getAttribute('aria-describedby') ?? '';

    // Every referenced id must exist in the document, or the reference is
    // dangling — the exact axe `aria-valid-attr-value` failure this
    // directive removes.
    for (const id of describedBy.split(' ').filter(Boolean)) {
      expect(container.querySelector(`#${CSS.escape(id)}`)).not.toBeNull();
    }
    expect(describedBy).not.toBe('');
  });

  it('warns, and skips ARIA wiring, when nothing publishes a name', async () => {
    // Providing an identity claims the naming channel for the whole subtree.
    // A provider nobody drives is therefore not a harmless no-op: it
    // suppresses the DOM-`id` derivation that would otherwise have worked,
    // so the misconfiguration has to be observable.
    @Component({
      selector: 'ngx-test-inert-wrapper',
      hostDirectives: [NgxFieldIdentityProvider],
      imports: [NgxFormFieldError],
      template: `
        <ng-content />
        <ngx-form-field-error
          [formField]="errorField()"
          fieldName="username"
          strategy="immediate"
        />
      `,
    })
    class InertWrapper {
      readonly errorField = input.required<unknown>();
    }

    @Component({
      selector: 'ngx-test-inert-host',
      imports: [InertWrapper, FormField, NgxSignalFormToolkit],
      template: `
        <form [formRoot]="userForm" ngxSignalForm>
          <ngx-test-inert-wrapper [errorField]="userForm.username">
            <label for="username">Username</label>
            <input id="username" [formField]="userForm.username" />
          </ngx-test-inert-wrapper>
        </form>
      `,
    })
    class InertHost {
      readonly #model = signal({ username: 'no' });
      readonly userForm = form(
        this.#model,
        schema((path) => {
          minLength(path.username, 5, { message: 'At least 5 characters' });
        }),
      );
    }

    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    try {
      const { container } = await render(InertHost);

      const describedBy =
        container
          .querySelector('input#username')
          ?.getAttribute('aria-describedby') ?? '';

      expect(describedBy).not.toContain('username-error');
      expect(warn).toHaveBeenCalledWith(
        expect.stringContaining('NgxFieldIdentityProvider'),
      );
    } finally {
      warn.mockRestore();
    }
  });

  it('clears the name when the bound value goes null, without falling back to the control id', async () => {
    @Component({
      selector: 'ngx-test-nullable-wrapper',
      hostDirectives: [
        { directive: NgxFieldIdentityProvider, inputs: ['fieldName'] },
      ],
      template: `<ng-content />`,
    })
    class NullableWrapper {}

    @Component({
      selector: 'ngx-test-nullable-host',
      imports: [NullableWrapper, FormField, NgxSignalFormToolkit],
      template: `
        <form [formRoot]="userForm" ngxSignalForm>
          <ngx-test-nullable-wrapper [fieldName]="name()">
            <input id="username" [formField]="userForm.username" />
          </ngx-test-nullable-wrapper>
        </form>
      `,
    })
    class NullableHost {
      readonly name = input.required<string | null>();
      readonly #model = signal({ username: 'no' });
      readonly userForm = form(
        this.#model,
        schema((path) => {
          minLength(path.username, 5, { message: 'At least 5 characters' });
        }),
      );
    }

    const { fixture } = await render(NullableHost, {
      inputs: { name: 'account' },
    });
    const control = fixture.nativeElement.querySelector('input#username');

    // A resolved name drives ARIA; an explicit null means "not resolvable
    // yet", which must skip ARIA wiring rather than silently reverting to
    // the control's `id`.
    expect(control?.getAttribute('aria-invalid')).not.toBeNull();

    fixture.componentRef.setInput('name', null);
    await fixture.whenStable();
    fixture.detectChanges();

    const describedBy = control?.getAttribute('aria-describedby') ?? '';
    expect(describedBy).not.toContain('username-error');
    expect(describedBy).not.toContain('account-error');
  });
});

describe('NgxFieldIdentityProvider — composed by NgxFormFieldWrapper', () => {
  @Component({
    selector: 'ngx-test-builtin-wrapper-host',
    imports: [NgxFormFieldWrapper, FormField, NgxSignalFormToolkit],
    template: `
      <form [formRoot]="userForm" ngxSignalForm>
        <ngx-form-field-wrapper
          [formField]="userForm.username"
          [fieldName]="explicitName()"
          strategy="immediate"
        >
          <label for="username-control">Username</label>
          <input id="username-control" [formField]="userForm.username" />
        </ngx-form-field-wrapper>
      </form>
    `,
  })
  class BuiltinWrapperHost {
    readonly explicitName = input.required<string | undefined>();
    readonly #model = signal({ username: 'no' });
    readonly userForm = form(
      this.#model,
      schema((path) => {
        minLength(path.username, 5, { message: 'At least 5 characters' });
      }),
    );
  }

  it('provides the identity through the directive, not a duplicate providers entry', async () => {
    const { fixture } = await render(BuiltinWrapperHost, {
      inputs: { explicitName: 'account' },
    });

    const wrapperEl = (
      fixture.nativeElement as HTMLElement
    ).querySelector<HTMLElement>('ngx-form-field-wrapper');
    const wrapperNode = fixture.debugElement.query(
      (candidate) => candidate.nativeElement === wrapperEl,
    );

    // The directive must be on the wrapper's own host — that is the element
    // injector the projected control resolves `NgxFieldIdentity` through.
    expect(wrapperNode.injector.get(NgxFieldIdentityProvider)).toBeTruthy();
    expect(wrapperNode.injector.get(NgxFieldIdentity).fieldName()).toBe(
      'account',
    );
  });

  it('routes a consumer-bound fieldName through the directive (cascade tier 1)', async () => {
    const { fixture } = await render(BuiltinWrapperHost, {
      inputs: { explicitName: 'account' },
    });

    const describedBy = (fixture.nativeElement as HTMLElement)
      .querySelector('input#username-control')
      ?.getAttribute('aria-describedby');

    // The declared name wins over the control's `id`, and one `fieldName`
    // attribute feeds both the wrapper's own input and the host directive's.
    expect(describedBy).toContain('account-error');
    expect(describedBy).not.toContain('username-control-error');
  });

  it('still derives the name from the control id when nothing is bound (cascade tier 2)', async () => {
    // The directive stays inert here — a DOM-derived name is only known in the
    // wrapper's render write phase, so it can never arrive through an input.
    const { fixture } = await render(BuiltinWrapperHost, {
      inputs: { explicitName: undefined },
    });

    const describedBy = (fixture.nativeElement as HTMLElement)
      .querySelector('input#username-control')
      ?.getAttribute('aria-describedby');

    expect(describedBy).toContain('username-control-error');
  });
});
