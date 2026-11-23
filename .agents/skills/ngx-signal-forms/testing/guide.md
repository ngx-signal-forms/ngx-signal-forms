# Toolkit Testing

Covers `@ngx-signal-forms/toolkit/testing`.
Requires optional peer `axe-core@>=4.13.0 <5` as a devDependency.
Use [api.md](../references/api.md) for exports and signatures.

## Public API

```typescript
import {
  createA11yValidator,
  expectNoA11yViolations,
  expectVisibleFocusIndicator,
  WCAG_22_AA_TAGS,
  type A11yCheckOptions,
  type A11yValidator,
  type IncompleteResultMode,
  type WCAG_22_AA_TAG,
} from '@ngx-signal-forms/toolkit/testing';
```

- `expectNoA11yViolations(context?, options?)`: scans `context` (default `document.body`) with `WCAG_22_AA_TAGS` and throws on any violation. Waits for running finite animations on visible elements first (capped at 1,000 ms) so fading text is usually checked at final contrast; fades longer than 1,000 ms can still be sampled mid-animation.
- `options` (`A11yCheckOptions`): `Omit<axe.RunOptions, 'runOnly'> & { incomplete?: IncompleteResultMode }`. The WCAG 2.2 AA `runOnly` baseline is fixed at both compile time and runtime; `resultTypes` stays caller-overridable.
- `incomplete` (`IncompleteResultMode`, default `'ignore'`):
  - `'ignore'`: checks violations only.
  - `'warn'`: logs every axe `incomplete` result via `console.warn` without failing.
  - `'fail'`: logs like `'warn'` and also fails on incomplete `color-contrast` results. Toolkit textual controls use transparent backgrounds, so `'fail'` can report false positives; confirm manually before changing styles.
- `createA11yValidator(options?: { tags?: readonly WCAG_22_AA_TAG[] })`: creates a scoped `A11yValidator` for custom wrappers that need a subset of `WCAG_22_AA_TAGS`. Unknown tags fail to compile; `tags: []` throws synchronously at creation; omitting `tags` uses the full WCAG 2.2 AA baseline.
- `expectVisibleFocusIndicator(element)`: throws unless `element` matches `:focus-visible` (when focused directly) or `:focus-within` (when an ancestor draws the ring) and renders a visible `outline` or `box-shadow`. Move focus with keyboard input (`await userEvent.tab()`) because `element.focus()` can miss `:focus-visible`. Measures presence only; verify 3:1 contrast (WCAG 1.4.11) separately.
- `WCAG_22_AA_TAGS`: `['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']`. Automated scanning cannot check non-automatable 2.2 Level A criteria (Consistent Help, Redundant Entry); verify those manually.

## Testing rules for RC.17+ behavior

- **Drive controls through DOM events.** Click, type, and tab with `userEvent` rather than calling `model.set()` or `markAsTouched()` directly, so real focus, blur, and edit timing run.
- **Blur or submit after typing under `'on-touch'`.** Typing into an already-touched control hides errors until focus moves (`await userEvent.tab()`) or a DOM `submit` event fires.
- **Narrow live-region queries.** Toolkit surfaces keep empty `[role="alert"]` hosts mounted (WCAG 4.1.3), so a bare `getByRole('alert')` is ambiguous. Filter to the matching region:

```typescript
const errorAlert = [
  ...container.querySelectorAll<HTMLElement>('[role="alert"]'),
].find((el) => el.textContent?.includes('Email is required'));
expect(errorAlert).toBeTruthy();
```

- **Locate submit-revealed field errors by id when a summary is present.** Under `errorSummaryAnnouncesAlone` (default `true`), submit-revealed field errors render outside `[role="alert"]` while keeping their `${fieldName}-error` id.

## Submission checks

For changed submission logic, use the consumer's existing test runner and service mocks:

- Cover accepted submit, invalid submit, pending refusal (`ignoreValidators: 'none'`) with a later deliberate retry, rejected save, and overlapping attempts.
- Assert callback counts, `submitting()` cleanup, submit-only feedback, and actual focus destination.
- For warning-aware flows, cover clean, warning-only, descendant-blocking, pending, rejected, and overlapping calls, asserting `Promise<boolean>` outcomes, independent warning timing, and mounted live-region hosts.

## Browser-state checks

Choose the checks that match the changed behavior in a real browser (Vitest browser mode or Playwright):

- **Visibility and collapsed regions:** inspect the actual element carrying `aria-invalid` (including relocated inner inputs or comboboxes) before collapse, while hidden, and after reopening with changed validation state.
- **Selection groups:** hide one radio or checkbox option while siblings remain visible (the hidden option loses `aria-invalid`; visible siblings keep accurate state), then collapse and reopen the whole group.
- **Description links:** verify every `aria-describedby` token resolves to a unique DOM element across error-only, warning-only, and mixed states.
- **Live regions:** confirm alert and status hosts exist before content updates (`empty -> warning -> blocking -> clear`) without recreating the host element. Note that DOM assertions do not prove screen-reader speech.
- **Keyboard and themes:** verify keyboard navigation, `expectVisibleFocusIndicator`, composite focus exit, summary-to-control focus, and full-baseline axe scans under the app's supported `color-scheme` themes. Fix contrast failures rather than disabling `color-contrast`; any intentional fixture exclusion must document which themed browser test covers that rule.

## Example fixture

```typescript
import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { form, FormField, required } from '@angular/forms/signals';
import { NgxFormField } from '@ngx-signal-forms/toolkit/form-field';
import { expectNoA11yViolations } from '@ngx-signal-forms/toolkit/testing';
import { it } from 'vitest';
import { userEvent } from 'vitest/browser';

@Component({
  selector: 'test-field',
  imports: [FormField, NgxFormField],
  styles: `
    :host {
      display: block;
      color: #111827;
      background: #ffffff;
      padding: 1rem;
    }
  `,
  template: `
    <ngx-form-field-wrapper [formField]="profileForm.name">
      <label for="name">Name</label>
      <input id="name" [formField]="profileForm.name" />
    </ngx-form-field-wrapper>
    <button type="button">Next</button>
  `,
})
class TestField {
  readonly profileForm = form(signal({ name: '' }), (path) => {
    required(path.name, { message: 'Name is required' });
  });
}

it('has no WCAG 2.2 AA violations when showing an error', async () => {
  TestBed.configureTestingModule({ imports: [TestField] });
  const fixture = TestBed.createComponent(TestField);
  await fixture.whenStable();

  const input = fixture.nativeElement.querySelector(
    'input',
  ) as HTMLInputElement;
  await userEvent.click(input);
  await userEvent.tab();
  await fixture.whenStable();

  await expectNoA11yViolations(fixture.nativeElement);
});
```

## Done

Verify the checks that apply to your change: state-transition assertions, themed browser axe scan with full `WCAG_22_AA_TAGS`, and keyboard/focus/live-region checks where relevant.
Report any browser or screen-reader checks that did not run; an axe pass alone is not full WCAG conformance.
