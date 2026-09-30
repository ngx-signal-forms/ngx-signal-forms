import {
  ApplicationRef,
  Component,
  Directive,
  inject,
  signal,
} from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
  FormField,
  form,
  required,
  schema,
  validate,
} from '@angular/forms/signals';
import {
  NGX_SIGNAL_FORM_FIELD_VISIBILITY_REGISTRY,
  NgxSignalFormToolkit,
} from '@ngx-signal-forms/toolkit';
import { render } from '@testing-library/angular';
import { describe, expect, it } from 'vitest';
import { NgxHeadlessErrorState } from './error-state';

/**
 * #644: a headless template can render one channel only. The directive must
 * then not hand auto-ARIA an id that no element has, while `aria-invalid`
 * keeps following the real error state.
 *
 * Every fixture uses `strategy="immediate"`, so a blocking error counts as
 * shown with no touch.
 */
const FEEDBACK = (renders: string) => `
  <div
    ngxHeadlessErrorState
    #state="errorState"
    [field]="profileForm.nickname"
    fieldName="nickname"
    strategy="immediate"
    warningStrategy="immediate"
    ${renders}
  >
    @if (state.shouldShowErrors() && state.hasErrors()) {
      <p [attr.id]="state.errorId()">{{ state.resolvedErrors()[0].message }}</p>
    }
    @if (state.shouldShowWarnings() && state.hasWarnings()) {
      <p [attr.id]="state.warningId()">{{ state.resolvedWarnings()[0].message }}</p>
    }
  </div>
`;

function createProfileForm(nickname: string) {
  return form(
    signal({ nickname }),
    schema<{ nickname: string }>((path) => {
      required(path.nickname, { message: 'Nickname is required' });
      validate(path.nickname, (ctx) =>
        ctx.value().length > 0 && ctx.value().length < 3
          ? { kind: 'warn:short', message: 'Short nicknames are hard to find' }
          : null,
      );
    }),
  );
}

function host(renders: string) {
  @Component({
    selector: 'ngx-test-headless-channels-host',
    imports: [FormField, NgxSignalFormToolkit, NgxHeadlessErrorState],
    template: `
      <form [formRoot]="profileForm" ngxSignalForm errorStrategy="on-touch">
        <label for="nickname">Nickname</label>
        <input id="nickname" [formField]="profileForm.nickname" />
        ${FEEDBACK(renders)}
      </form>
    `,
  })
  class ChannelsHost {
    // An empty nickname has a blocking error. 'ab' has a warning only.
    readonly profileForm = createProfileForm(
      renders.includes('errors') ? '' : 'ab',
    );
  }
  return ChannelsHost;
}

async function renderNickname(
  renders: string,
  nickname: '' | 'ab',
): Promise<HTMLInputElement> {
  const Host = host(renders);
  const { container, fixture } = await render(Host);
  fixture.componentInstance.profileForm.nickname().value.set(nickname);
  await TestBed.inject(ApplicationRef).whenStable();
  fixture.detectChanges();
  return container.querySelector<HTMLInputElement>('#nickname')!;
}

describe('NgxHeadlessErrorState — renders (#644)', () => {
  it('leaves the error id out of aria-describedby when only warnings render', async () => {
    // A dangling id breaks the description relationship (WCAG 1.3.1, 4.1.2).
    const input = await renderNickname('renders="warnings"', '');

    expect(input.getAttribute('aria-describedby') ?? '').not.toContain(
      'nickname-error',
    );
  });

  it('keeps aria-invalid on the real error state when only warnings render', async () => {
    // Assistive tech learns the field is invalid from aria-invalid (WCAG 3.3.1).
    const input = await renderNickname('renders="warnings"', '');

    expect(input).toHaveAttribute('aria-invalid', 'true');
  });

  it('still links the warning id when only warnings render', async () => {
    // The warning element exists, so its id must stay linked (WCAG 1.3.1).
    const input = await renderNickname('renders="warnings"', 'ab');

    expect(input.getAttribute('aria-describedby')).toContain(
      'nickname-warning',
    );
    expect(input).toHaveAttribute('aria-invalid', 'false');
  });

  it('leaves the warning id out of aria-describedby when only errors render', async () => {
    // The mirror case: no warning element, so no warning id (WCAG 1.3.1).
    const input = await renderNickname('renders="errors"', 'ab');

    expect(input.getAttribute('aria-describedby') ?? '').not.toContain(
      'nickname-warning',
    );
  });

  it('still links the error id when only errors render', async () => {
    const input = await renderNickname('renders="errors"', '');

    expect(input.getAttribute('aria-describedby')).toContain('nickname-error');
    expect(input).toHaveAttribute('aria-invalid', 'true');
  });

  it('links the error id by default, as before', async () => {
    // The default must not change existing templates.
    const input = await renderNickname('', '');

    expect(input.getAttribute('aria-describedby')).toContain('nickname-error');
    expect(input).toHaveAttribute('aria-invalid', 'true');
  });

  it('links the warning id by default, as before', async () => {
    const input = await renderNickname('', 'ab');

    expect(input.getAttribute('aria-describedby')).toContain(
      'nickname-warning',
    );
  });
});

/**
 * The registry is a public contract. A registrant that predates
 * `shouldShowErrors` must see no change, and one that sets it must be heard.
 * This stand-in registers from its constructor, before the first render, the
 * way a real message surface does.
 */
let registrantShowsErrors: boolean | undefined;

@Directive({ selector: '[ngxTestRegistrant]' })
class Registrant {
  constructor() {
    inject(NGX_SIGNAL_FORM_FIELD_VISIBILITY_REGISTRY).register({
      fieldName: 'nickname',
      errorContainerVisible: signal(false),
      warningContainerVisible: signal(false),
      ...(registrantShowsErrors === undefined
        ? {}
        : { shouldShowErrors: signal(registrantShowsErrors) }),
    });
  }
}

@Component({
  selector: 'ngx-test-registry-contract-host',
  imports: [FormField, NgxSignalFormToolkit, Registrant],
  template: `
    <form [formRoot]="profileForm" ngxSignalForm errorStrategy="on-touch">
      <label for="nickname">Nickname</label>
      <input id="nickname" [formField]="profileForm.nickname" />
      <span ngxTestRegistrant></span>
    </form>
  `,
})
class RegistryContractHost {
  readonly profileForm = createProfileForm('');
}

describe('field visibility registry — shouldShowErrors (#644)', () => {
  async function renderWith(shouldShowErrors: boolean | undefined) {
    registrantShowsErrors = shouldShowErrors;
    const { container } = await render(RegistryContractHost);
    await TestBed.inject(ApplicationRef).whenStable();
    return container.querySelector<HTMLInputElement>('#nickname')!;
  }

  it('falls back to errorContainerVisible for aria-invalid when the signal is absent', async () => {
    // Existing registrants must behave the same: no new field, no change.
    const input = await renderWith(undefined);

    expect(input).toHaveAttribute('aria-invalid', 'false');
  });

  it('uses shouldShowErrors for aria-invalid when the registrant publishes it', async () => {
    // A registrant with no error element is still an invalid field (WCAG 3.3.1).
    const input = await renderWith(true);

    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input.getAttribute('aria-describedby') ?? '').not.toContain(
      'nickname-error',
    );
  });
});
