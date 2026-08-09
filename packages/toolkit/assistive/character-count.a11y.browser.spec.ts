import { ApplicationRef, Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormField, form, maxLength } from '@angular/forms/signals';
import { render } from '@testing-library/angular';
import { userEvent } from 'vitest/browser';
import { describe, expect, it } from 'vitest';
import { NgxFormFieldCharacterCount } from './character-count';
import { expectNoA11yViolations } from '@ngx-signal-forms/toolkit/testing';

/**
 * WCAG 2.2 AA conformance gate for `NgxFormFieldCharacterCount`.
 *
 * Rendered next to the textarea it counts (its real shipped composition —
 * see the class doc's "Basic character count" example), with live
 * announcements enabled so the polite `aria-live` region is present in both
 * scanned states. The two states produce meaningfully different accessible
 * output: within the limit no announcement text is rendered, past it the
 * live region carries the "exceeded" message and the visible count changes
 * from a lighter to a bold, high-contrast color.
 */
describe('NgxFormFieldCharacterCount — WCAG 2.2 AA conformance', () => {
  it('a count within its limit has no violations', async () => {
    @Component({
      selector: 'ngx-test-a11y-char-count-ok',
      imports: [FormField, NgxFormFieldCharacterCount],
      template: `
        <label for="bio">Bio</label>
        <textarea id="bio" [formField]="testForm.bio"></textarea>
        <ngx-form-field-character-count
          [formField]="testForm.bio"
          [liveAnnounce]="true"
        />
      `,
    })
    class TestComponent {
      readonly #model = signal({ bio: 'Hello there' });
      readonly testForm = form(this.#model, (path) => {
        maxLength(path.bio, 500);
      });
    }

    const { container } = await render(TestComponent);
    await TestBed.inject(ApplicationRef).whenStable();

    expect(container.textContent).toContain('11/500');
    await expectNoA11yViolations(container);
  });

  it('a count past its limit has no violations', async () => {
    @Component({
      selector: 'ngx-test-a11y-char-count-exceeded',
      imports: [FormField, NgxFormFieldCharacterCount],
      template: `
        <label for="tweet">Tweet</label>
        <textarea id="tweet" [formField]="testForm.tweet"></textarea>
        <ngx-form-field-character-count
          [formField]="testForm.tweet"
          [maxLength]="10"
          [liveAnnounce]="true"
        />
      `,
    })
    class TestComponent {
      readonly #model = signal({ tweet: '' });
      readonly testForm = form(this.#model);
    }

    const { container } = await render(TestComponent);
    const textarea = container.querySelector('textarea')!;
    await userEvent.click(textarea);
    await userEvent.type(textarea, 'Way past the ten character limit');
    await TestBed.inject(ApplicationRef).whenStable();

    expect(container.textContent).toContain('/10');
    await expectNoA11yViolations(container);
  });
});
