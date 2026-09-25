import { ApplicationRef, Component, signal, type Type } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
  email,
  FormField,
  form,
  required,
  schema,
  validate,
} from '@angular/forms/signals';
import {
  NgxSignalFormToolkit,
  provideNgxSignalFormsConfigForComponent,
} from '@ngx-signal-forms/toolkit';
import { NgxFormField } from '@ngx-signal-forms/toolkit/form-field';
import { render } from '@testing-library/angular';
import { afterEach, describe, expect, it } from 'vitest';
import { userEvent } from 'vitest/browser';
import { expectNoA11yViolations } from '@ngx-signal-forms/toolkit/testing';
import { NgxFormFieldError } from './form-field-error';
import { NgxFormFieldErrorSummary } from './form-field-error-summary';

/**
 * Issue #522: with an error summary on the form, a submit must make the
 * summary the only live region that announces. Each field error is a
 * `role="alert"` region too, so without this rule one submit fires N + 1
 * assertive announcements at once. NVDA and JAWS then cut speech off, stack
 * it, or read each error twice.
 *
 * A screen reader announces a live region when content is inserted into
 * it. So "does not announce" is asserted as "gets no new content": a
 * `MutationObserver` records every node inserted between the submit click
 * and the next stable tick, and the spec checks which live region each
 * insertion landed in.
 */

const LIVE_REGION = '[role="alert"], [role="status"], [aria-live]';

/**
 * Records the live regions that receive new content (inserted nodes or
 * changed text) while `action` runs and the app settles. Attribute changes
 * are ignored: they do not make a screen reader speak.
 */
async function liveRegionsChangedBy(
  root: HTMLElement,
  action: () => Promise<void>,
): Promise<Set<Element>> {
  const changed = new Set<Element>();
  const collect = (records: MutationRecord[]) => {
    for (const record of records) {
      if (
        record.type === 'childList' &&
        !Array.from(record.addedNodes).some(isContent)
      ) {
        continue;
      }
      const target =
        record.target instanceof Element
          ? record.target
          : record.target.parentElement;
      const region = target?.closest(LIVE_REGION);
      if (region) {
        changed.add(region);
      }
    }
  };
  const observer = new MutationObserver(collect);
  observer.observe(root, {
    childList: true,
    characterData: true,
    subtree: true,
  });

  await action();
  await TestBed.inject(ApplicationRef).whenStable();

  collect(observer.takeRecords());
  observer.disconnect();
  return changed;
}

/** Elements and non-blank text are content. Angular's anchor comments are not. */
function isContent(node: Node): boolean {
  if (node.nodeType === Node.ELEMENT_NODE) return true;
  if (node.nodeType === Node.TEXT_NODE) return !!node.textContent?.trim();
  return false;
}

/**
 * The field's element markup, with Angular's anchor comments and
 * per-compilation `_ngcontent`/`_nghost` attributes removed, so two renders
 * of the same state compare equal. Works on a DOM clone, not on the markup
 * string, so no string sanitization is involved.
 */
function elementMarkup(element: Element): string {
  const clone = element.cloneNode(true) as Element;

  const comments: Comment[] = [];
  const walker = document.createTreeWalker(clone, NodeFilter.SHOW_COMMENT);
  while (walker.nextNode()) {
    comments.push(walker.currentNode as Comment);
  }
  for (const comment of comments) {
    comment.remove();
  }

  for (const node of [clone, ...clone.querySelectorAll('*')]) {
    for (const name of node.getAttributeNames()) {
      if (name.startsWith('_ngcontent-') || name.startsWith('_nghost-')) {
        node.removeAttribute(name);
      }
    }
  }

  return clone.outerHTML;
}

function fieldError(container: HTMLElement, name: string): HTMLElement {
  const input = container.querySelector(`#${name}`);
  const wrapper = input?.closest('ngx-form-field-wrapper');
  const error = wrapper?.querySelector<HTMLElement>('ngx-form-field-error');
  if (!error) throw new Error(`no ngx-form-field-error for #${name}`);
  return error;
}

function fieldLiveRegion(container: HTMLElement, name: string): HTMLElement {
  const region = fieldError(container, name).querySelector<HTMLElement>(
    '[role="alert"]',
  );
  if (!region) throw new Error(`no role="alert" region for #${name}`);
  return region;
}

function summaryLiveRegion(container: HTMLElement): HTMLElement {
  const region = container.querySelector<HTMLElement>(
    'ngx-form-field-error-summary [role="alert"]',
  );
  if (!region) throw new Error('no summary live region');
  return region;
}

async function submit(container: HTMLElement): Promise<void> {
  const button = container.querySelector<HTMLButtonElement>(
    'button[type="submit"]',
  );
  if (!button) throw new Error('no submit button');
  await userEvent.click(button);
}

const FIELDS = `
  <ngx-form-field-wrapper [formField]="testForm.name" fieldName="name">
    <label for="name">Full name</label>
    <input id="name" type="text" [formField]="testForm.name" />
  </ngx-form-field-wrapper>
  <ngx-form-field-wrapper [formField]="testForm.email" fieldName="email">
    <label for="email">Email address</label>
    <input id="email" type="email" [formField]="testForm.email" />
  </ngx-form-field-wrapper>
  <button type="submit">Submit</button>
`;

abstract class TestFormBase {
  readonly #model = signal({ name: '', email: '' });
  readonly testForm = form(
    this.#model,
    schema((path) => {
      required(path.name, { message: 'Name is required' });
      required(path.email, { message: 'Email is required' });
      email(path.email, { message: 'Enter a valid email address' });
    }),
  );
}

@Component({
  selector: 'ngx-test-summary-announces-alone',
  imports: [
    FormField,
    NgxSignalFormToolkit,
    NgxFormField,
    NgxFormFieldErrorSummary,
  ],
  template: `
    <form [formRoot]="testForm" ngxSignalForm errorStrategy="on-submit">
      <ngx-form-field-error-summary [formTree]="testForm" />
      ${FIELDS}
    </form>
  `,
})
class WithSummaryComponent extends TestFormBase {}

@Component({
  selector: 'ngx-test-no-summary',
  imports: [FormField, NgxSignalFormToolkit, NgxFormField],
  template: `
    <form [formRoot]="testForm" ngxSignalForm errorStrategy="on-submit">
      ${FIELDS}
    </form>
  `,
})
class WithoutSummaryComponent extends TestFormBase {}

@Component({
  selector: 'ngx-test-summary-switch-off',
  imports: [
    FormField,
    NgxSignalFormToolkit,
    NgxFormField,
    NgxFormFieldErrorSummary,
  ],
  providers: [
    provideNgxSignalFormsConfigForComponent({
      errorSummaryAnnouncesAlone: false,
    }),
  ],
  template: `
    <form [formRoot]="testForm" ngxSignalForm errorStrategy="on-submit">
      <ngx-form-field-error-summary [formTree]="testForm" />
      ${FIELDS}
    </form>
  `,
})
class SwitchOffComponent extends TestFormBase {}

/**
 * A standalone `<ngx-form-field-error>` stays mounted from the first render,
 * unlike the wrapper's error slot, which mounts only while messages show.
 */
@Component({
  selector: 'ngx-test-summary-standalone-error',
  imports: [
    FormField,
    NgxSignalFormToolkit,
    NgxFormFieldError,
    NgxFormFieldErrorSummary,
  ],
  template: `
    <form [formRoot]="testForm" ngxSignalForm errorStrategy="on-submit">
      <ngx-form-field-error-summary [formTree]="testForm" />
      <label for="email">Email address</label>
      <input id="email" type="email" [formField]="testForm.email" />
      <ngx-form-field-error [formField]="testForm.email" fieldName="email" />
      <button type="submit">Submit</button>
    </form>
  `,
})
class StandaloneErrorComponent extends TestFormBase {}

/** The summary can be removed after the submit, through `showSummary`. */
@Component({
  selector: 'ngx-test-summary-removable',
  imports: [
    FormField,
    NgxSignalFormToolkit,
    NgxFormField,
    NgxFormFieldErrorSummary,
  ],
  template: `
    <form [formRoot]="testForm" ngxSignalForm errorStrategy="on-submit">
      @if (showSummary()) {
        <ngx-form-field-error-summary [formTree]="testForm" />
      }
      ${FIELDS}
    </form>
  `,
})
class RemovableSummaryComponent extends TestFormBase {
  readonly showSummary = signal(true);
}

/**
 * A validator whose two outputs collide under a naive `${kind}:${message}`
 * join: ('a', 'b:c') and ('a:b', 'c') both read "a:b:c".
 */
@Component({
  selector: 'ngx-test-summary-colliding-errors',
  imports: [
    FormField,
    NgxSignalFormToolkit,
    NgxFormField,
    NgxFormFieldErrorSummary,
  ],
  template: `
    <form [formRoot]="testForm" ngxSignalForm errorStrategy="on-submit">
      <ngx-form-field-error-summary [formTree]="testForm" />
      <ngx-form-field-wrapper [formField]="testForm.code" fieldName="code">
        <label for="code">Code</label>
        <input id="code" type="text" [formField]="testForm.code" />
      </ngx-form-field-wrapper>
      <button type="submit">Submit</button>
    </form>
  `,
})
class CollidingErrorsComponent {
  readonly #model = signal({ code: '' });
  readonly testForm = form(
    this.#model,
    schema((path) => {
      validate(path.code, ({ value }) =>
        value() === ''
          ? { kind: 'a', message: 'b:c' }
          : { kind: 'a:b', message: 'c' },
      );
    }),
  );
}

async function renderForm(component: Type<unknown>): Promise<HTMLElement> {
  const { container } = await render(component);
  await TestBed.inject(ApplicationRef).whenStable();
  return container;
}

describe('NgxFormFieldErrorSummary — the summary announces alone after a submit (#522)', () => {
  afterEach(() => {
    // The summary focuses itself on submit; do not leak focus across tests.
    (document.activeElement as HTMLElement | null)?.blur();
  });

  it('after a submit, only the summary live region gets new content', async () => {
    const container = await renderForm(WithSummaryComponent);

    const changed = await liveRegionsChangedBy(container, () =>
      submit(container),
    );

    // The summary still announces (and takes focus, as before).
    expect([...changed]).toEqual([summaryLiveRegion(container)]);
    expect(summaryLiveRegion(container).textContent).toContain(
      'Name is required',
    );
    expect(document.activeElement).toBe(
      container.querySelector('ngx-form-field-error-summary'),
    );

    // The field errors are still on screen and still describe their
    // controls. Only the live-region insertion is left out.
    for (const [name, message] of [
      ['name', 'Name is required'],
      ['email', 'Email is required'],
    ] as const) {
      expect(fieldLiveRegion(container, name).textContent?.trim()).toBe('');
      const described = container.querySelector(`#${name}-error`);
      expect(described?.textContent).toContain(`Error: ${message}`);
      expect(described?.closest(LIVE_REGION)).toBeNull();
      expect(described?.checkVisibility()).toBe(true);
      expect(
        container
          .querySelector(`#${name}`)
          ?.getAttribute('aria-describedby')
          ?.split(' '),
      ).toContain(`${name}-error`);
    }

    // The quiet containers are ordinary markup; the populated form stays
    // WCAG 2.2 AA clean.
    await expectNoA11yViolations(container);
  });

  it('a second submit with unchanged errors keeps the field regions quiet', async () => {
    const container = await renderForm(WithSummaryComponent);
    await submit(container);
    await TestBed.inject(ApplicationRef).whenStable();

    const changed = await liveRegionsChangedBy(container, () =>
      submit(container),
    );

    expect(changed.has(fieldLiveRegion(container, 'name'))).toBe(false);
    expect(changed.has(fieldLiveRegion(container, 'email'))).toBe(false);
  });

  it('after a submit, editing a field so its error changes updates that field live region', async () => {
    const container = await renderForm(WithSummaryComponent);
    await submit(container);
    await TestBed.inject(ApplicationRef).whenStable();

    const emailInput = container.querySelector<HTMLInputElement>('#email');
    if (!emailInput) throw new Error('no #email input');

    const changed = await liveRegionsChangedBy(container, () =>
      userEvent.type(emailInput, 'not-an-email'),
    );

    // The error changed from "required" to "invalid email": the user hears
    // it through the field's own live region, as without a summary.
    const emailRegion = fieldLiveRegion(container, 'email');
    expect(changed.has(emailRegion)).toBe(true);
    expect(emailRegion.textContent).toContain(
      'Error: Enter a valid email address',
    );
    expect(emailRegion.id).toBe('email-error');
    expect(container.querySelectorAll('#email-error')).toHaveLength(1);

    // The untouched field keeps its unchanged error out of the live region.
    expect(changed.has(fieldLiveRegion(container, 'name'))).toBe(false);
  });

  it('after a submit, an error change that a joined kind:message string cannot see still updates the field live region', async () => {
    const container = await renderForm(CollidingErrorsComponent);
    await submit(container);
    await TestBed.inject(ApplicationRef).whenStable();
    expect(fieldLiveRegion(container, 'code').textContent?.trim()).toBe('');

    const codeInput = container.querySelector<HTMLInputElement>('#code');
    if (!codeInput) throw new Error('no #code input');

    // ('a', 'b:c') becomes ('a:b', 'c'): a different error with a different
    // message. The user must hear it, so it must enter the live region.
    const changed = await liveRegionsChangedBy(container, () =>
      userEvent.type(codeInput, 'x'),
    );

    const codeRegion = fieldLiveRegion(container, 'code');
    expect(changed.has(codeRegion)).toBe(true);
    expect(codeRegion.textContent?.trim()).toBe('Error: c');
    expect(codeRegion.id).toBe('code-error');
  });

  it('when the summary goes away after a submit, the field errors move into their live regions', async () => {
    const { container, fixture } = await render(RemovableSummaryComponent);
    await TestBed.inject(ApplicationRef).whenStable();
    await submit(container);
    await TestBed.inject(ApplicationRef).whenStable();
    expect(fieldLiveRegion(container, 'email').textContent?.trim()).toBe('');

    // No summary speaks for the errors any more, so the fields must.
    const changed = await liveRegionsChangedBy(container, async () => {
      fixture.componentInstance.showSummary.set(false);
    });

    const nameRegion = fieldLiveRegion(container, 'name');
    const emailRegion = fieldLiveRegion(container, 'email');
    expect(changed).toEqual(new Set([nameRegion, emailRegion]));
    expect(emailRegion.textContent).toContain('Error: Email is required');
    expect(emailRegion.id).toBe('email-error');
    expect(container.querySelectorAll('#email-error')).toHaveLength(1);
  });

  it('after a submit, fixing a field and then breaking it again announces the new error', async () => {
    const container = await renderForm(WithSummaryComponent);
    await submit(container);
    await TestBed.inject(ApplicationRef).whenStable();

    const nameInput = container.querySelector<HTMLInputElement>('#name');
    if (!nameInput) throw new Error('no #name input');
    await userEvent.type(nameInput, 'Ada');
    await TestBed.inject(ApplicationRef).whenStable();
    expect(container.querySelector('#name-error')).toBeNull();

    const changed = await liveRegionsChangedBy(container, () =>
      userEvent.clear(nameInput),
    );

    expect(changed.has(fieldLiveRegion(container, 'name'))).toBe(true);
    expect(fieldLiveRegion(container, 'name').textContent).toContain(
      'Error: Name is required',
    );
  });

  it('a standalone field error, mounted before the submit, stays out of its live region too', async () => {
    const container = await renderForm(StandaloneErrorComponent);
    const error = container.querySelector('ngx-form-field-error');
    const region = error?.querySelector('[role="alert"]');
    if (!error || !region) throw new Error('no standalone field error');

    const changed = await liveRegionsChangedBy(container, () =>
      submit(container),
    );

    expect([...changed]).toEqual([summaryLiveRegion(container)]);
    expect(container.querySelector('#email-error')?.textContent).toContain(
      'Error: Email is required',
    );

    const emailInput = container.querySelector<HTMLInputElement>('#email');
    if (!emailInput) throw new Error('no #email input');
    const afterEdit = await liveRegionsChangedBy(container, () =>
      userEvent.type(emailInput, 'x'),
    );
    expect(afterEdit.has(region)).toBe(true);
    expect(region.textContent).toContain('Error: Enter a valid email address');
  });

  it('without a summary, a submit puts each field error into its own live region, as before', async () => {
    const container = await renderForm(WithoutSummaryComponent);

    const changed = await liveRegionsChangedBy(container, () =>
      submit(container),
    );

    const nameRegion = fieldLiveRegion(container, 'name');
    const emailRegion = fieldLiveRegion(container, 'email');
    expect(changed).toEqual(new Set([nameRegion, emailRegion]));
    expect(nameRegion.id).toBe('name-error');
    expect(nameRegion.textContent).toContain('Error: Name is required');

    // Element markup unchanged: it matches what the component rendered
    // before #522. Angular anchor comments are left out of the comparison;
    // no browser exposes them to assistive technology.
    expect(elementMarkup(fieldError(container, 'email'))).toBe(
      EXPECTED_EMAIL_ERROR_MARKUP_AFTER_SUBMIT,
    );
  });

  it('with errorSummaryAnnouncesAlone: false, a submit announces the field errors too, as before', async () => {
    const container = await renderForm(SwitchOffComponent);

    const changed = await liveRegionsChangedBy(container, () =>
      submit(container),
    );

    expect(changed).toEqual(
      new Set([
        summaryLiveRegion(container),
        fieldLiveRegion(container, 'name'),
        fieldLiveRegion(container, 'email'),
      ]),
    );
    expect(elementMarkup(fieldError(container, 'email'))).toBe(
      EXPECTED_EMAIL_ERROR_MARKUP_AFTER_SUBMIT,
    );
  });
});

/**
 * `<ngx-form-field-error>` for the email field after a failed submit, as
 * rendered before #522. Captured from the pre-change component so the
 * "without a summary" and "switch off" specs prove the markup is unchanged.
 */
const EXPECTED_EMAIL_ERROR_MARKUP_AFTER_SUBMIT =
  '<ngx-form-field-error data-presentation="inline"><div role="alert" class="ngx-form-field-error ngx-form-field-error--error" id="email-error"><p class="ngx-form-field-error__message ngx-form-field-error__message--error"><span class="ngx-form-field-error__prefix">Error: </span>Email is required </p></div><div role="status" class="ngx-form-field-error ngx-form-field-error--warning ngx-form-field-error--empty"></div></ngx-form-field-error>';
