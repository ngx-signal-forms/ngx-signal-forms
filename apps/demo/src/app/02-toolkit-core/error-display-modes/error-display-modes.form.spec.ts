import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideNgxSignalFormsConfig } from '@ngx-signal-forms/toolkit';
import { fireEvent, render, screen } from '@testing-library/angular';
import { describe, expect, it } from 'vitest';
import { ErrorDisplayModesFormComponent } from './error-display-modes.form';

/**
 * Regression coverage for two findings fixed on this page:
 *
 * 1. Hint text (`#name-hint`, `#email-hint`, etc.) used to live in plain
 *    `<div id="…-hint">` elements that were never linked to their inputs.
 *    Now they are `<ngx-form-field-hint>` projected into `ngx-form-field-wrapper`,
 *    which composes them into the input's `aria-describedby`.
 * 2. The submission-error banner used to be driven by a hand-rolled
 *    `#submissionAttempted` signal set inside the submission `action`/`onInvalid`
 *    callbacks. Now it is derived from the toolkit's own `submittedStatus()`
 *    (exposed via `ErrorDisplayHelpersComponent`, the element actually
 *    rendered inside `<form ngxSignalForm>`) combined with `productForm().invalid()`.
 *    The banner element stays mounted and toggles its `hidden` attribute
 *    (rather than being added/removed via `@if`) — testing-library's role
 *    queries already treat a `hidden` element as absent, so the assertions
 *    below read the same either way.
 */
describe('ErrorDisplayModesFormComponent', () => {
  async function setup() {
    return render(ErrorDisplayModesFormComponent, {
      inputs: { errorDisplayMode: 'on-submit' },
      providers: [
        provideZonelessChangeDetection(),
        provideNgxSignalFormsConfig({
          defaultErrorStrategy: 'on-touch',
          autoAria: true,
        }),
      ],
    });
  }

  const hintedFields: readonly { id: string; hintId: string }[] = [
    { id: 'name', hintId: 'name-hint' },
    { id: 'email', hintId: 'email-hint' },
    { id: 'company', hintId: 'company-hint' },
    { id: 'productUsed', hintId: 'product-hint' },
    { id: 'overallRating', hintId: 'rating-hint' },
    { id: 'detailedFeedback', hintId: 'detailed-hint' },
  ];

  it.each(hintedFields)(
    'links #$id to its hint #$hintId via aria-describedby',
    async ({ id, hintId }) => {
      const { container } = await setup();

      const control = container.querySelector(`#${id}`);
      expect(control).toBeTruthy();

      const hint = container.querySelector(`#${hintId}`);
      expect(hint).toBeTruthy();
      expect(hint?.tagName.toLowerCase()).toBe('ngx-form-field-hint');

      const describedBy = control?.getAttribute('aria-describedby') ?? '';
      expect(describedBy.split(/\s+/u)).toContain(hintId);
    },
  );

  it('links the conditionally-rendered improvement field to its hint once it appears', async () => {
    const { container } = await setup();

    // Improvement suggestions only render once the rating is low (1-3).
    const ratingInput = container.querySelector(
      '#overallRating',
    ) as HTMLInputElement;
    fireEvent.input(ratingInput, { target: { value: '2' } });
    fireEvent.blur(ratingInput);

    const improvementInput =
      await screen.findByLabelText(/what could we improve/i);
    const hint = container.querySelector('#improvement-hint');
    expect(hint).toBeTruthy();

    const describedBy = improvementInput.getAttribute('aria-describedby') ?? '';
    expect(describedBy.split(/\s+/u)).toContain('improvement-hint');
  });

  /**
   * This test drives Angular's real change detection with bounded, manual
   * `fixture.detectChanges()` calls instead of `@testing-library/angular`'s
   * `render()` + `fireEvent` + `findBy*` helpers (used by every other test
   * in this file). Those helpers await `ApplicationRef.isStable` under the
   * hood, and on this page that promise never resolves once a real invalid
   * submit is fired: with a structural `@if` gated on a submit-reactive
   * signal, combined with this page's `ngx-form-field-wrapper` fields,
   * zoneless change detection did not reach stability in specs. The exact
   * mechanism inside the toolkit wrapper has not been confirmed — that
   * investigation is out of scope for this page. Bounded manual ticks route
   * around the symptom while still exercising the toolkit's real submit
   * path.
   */
  it('shows the submission-error banner only after a real submit attempt on an invalid form, and hides it once the form becomes valid', async () => {
    await TestBed.configureTestingModule({
      imports: [ErrorDisplayModesFormComponent],
      providers: [
        provideZonelessChangeDetection(),
        provideNgxSignalFormsConfig({
          defaultErrorStrategy: 'on-touch',
          autoAria: true,
        }),
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(ErrorDisplayModesFormComponent);
    fixture.componentRef.setInput('errorDisplayMode', 'on-submit');
    fixture.detectChanges();

    const tick = (times = 10) => {
      for (let i = 0; i < times; i++) {
        fixture.detectChanges();
      }
    };

    const root = fixture.nativeElement as HTMLElement;
    const banner = root.querySelector('#submission-error') as HTMLElement;
    const submitButton = root.querySelector(
      'button[type="submit"]',
    ) as HTMLButtonElement;

    // Starts hidden: no submit attempt yet.
    expect(banner.hidden).toBe(true);

    // The form starts empty/invalid. Submit it for real through the
    // toolkit's own submit flow (native form submit), not a hand-set signal.
    submitButton.click();
    tick();

    expect(banner.hidden).toBe(false);
    expect(banner).toHaveTextContent(
      /please fix the errors above before submitting/i,
    );
    expect(submitButton).toHaveAttribute(
      'aria-describedby',
      'submission-error',
    );

    // Fill in every required field with valid values.
    const setValue = (selector: string, value: string) => {
      const el = root.querySelector(selector) as HTMLInputElement | HTMLSelectElement;
      el.value = value;
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
    };
    setValue('#name', 'Ada Lovelace');
    setValue('#email', 'ada@example.com');
    setValue('#productUsed', 'Web App');
    setValue('#overallRating', '5');
    tick();

    expect(banner.hidden).toBe(true);
    expect(submitButton).not.toHaveAttribute('aria-describedby');
  });
});
