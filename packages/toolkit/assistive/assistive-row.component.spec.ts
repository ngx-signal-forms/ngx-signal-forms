import {
  ChangeDetectionStrategy,
  Component,
  input,
  inputBinding,
  signal,
} from '@angular/core';
import { form } from '@angular/forms/signals';
import { render, screen, within } from '@testing-library/angular';
import { describe, expect, it } from 'vitest';
import { NgxFormFieldAssistiveRowComponent } from './assistive-row.component';
import { NgxFormFieldCharacterCountComponent } from './character-count.component';

@Component({
  selector: 'ngx-test-assistive-row',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    NgxFormFieldAssistiveRowComponent,
    NgxFormFieldCharacterCountComponent,
  ],
  template: `
    <ngx-signal-form-field-assistive-row [align]="alignment()">
      <span data-testid="assistive-text">Helpful hint</span>
      <ngx-signal-form-field-character-count
        characterCount
        [formField]="testForm.text"
        [maxLength]="maxLength()"
      />
    </ngx-signal-form-field-assistive-row>
  `,
})
class TestWrapperComponent {
  readonly alignment = input<'start' | 'center' | 'end'>('start');
  readonly maxLength = input(10);

  readonly #model = signal({ text: '' });
  protected readonly testForm = form(this.#model);
}

describe('NgxFormFieldAssistiveRowComponent', () => {
  it('projects assistive content on the left and character count on the right', async () => {
    const { container } = await render(TestWrapperComponent);

    const left = container.querySelector('.ngx-form-field-assistive-row__left');
    const right = container.querySelector(
      '.ngx-form-field-assistive-row__right',
    );

    expect(left).toBeTruthy();
    expect(right).toBeTruthy();

    expect(left).toBeInstanceOf(HTMLElement);
    if (!(left instanceof HTMLElement)) {
      throw new Error(
        'Expected left assistive row container to be an HTMLElement',
      );
    }

    expect(within(left).getByTestId('assistive-text')).toBeInTheDocument();

    const rightHost = right?.querySelector(
      'ngx-signal-form-field-character-count',
    );
    expect(rightHost).toBeTruthy();
    expect(screen.getByText('0/10')).toBeInTheDocument();
  });

  it('defaults align attribute to start', async () => {
    const { container } = await render(TestWrapperComponent);

    const host = container.querySelector('ngx-signal-form-field-assistive-row');
    expect(host).toHaveAttribute('align', 'start');
  });

  it('updates align attribute from input bindings', async () => {
    const alignment = signal<'start' | 'center' | 'end'>('center');
    const { container, fixture } = await render(TestWrapperComponent, {
      bindings: [inputBinding('alignment', alignment)],
    });

    const host = container.querySelector('ngx-signal-form-field-assistive-row');
    expect(host).toHaveAttribute('align', 'center');

    alignment.set('end');
    fixture.detectChanges();

    expect(host).toHaveAttribute('align', 'end');
  });

  it('projects content flagged with the `characterCount` attribute into the right slot', async () => {
    @Component({
      selector: 'ngx-test-assistive-row-attr-slot',
      changeDetection: ChangeDetectionStrategy.OnPush,
      imports: [NgxFormFieldAssistiveRowComponent],
      template: `
        <ngx-signal-form-field-assistive-row>
          <span data-testid="left-text">Helpful hint</span>
          <span characterCount data-testid="right-custom">3 / 10</span>
        </ngx-signal-form-field-assistive-row>
      `,
    })
    class AttributeSlotHost {}

    const { container } = await render(AttributeSlotHost);

    const right = container.querySelector(
      '.ngx-form-field-assistive-row__right',
    );
    const left = container.querySelector('.ngx-form-field-assistive-row__left');

    expect(right?.querySelector('[data-testid="right-custom"]')).toBeTruthy();
    // The generic `span[characterCount]` should NOT fall through to the
    // left slot — `ng-content` without `select=` catches the rest, which
    // would double-project if projection were misconfigured.
    expect(left?.querySelector('[data-testid="right-custom"]')).toBeNull();
    expect(left?.querySelector('[data-testid="left-text"]')).toBeTruthy();
  });

  it('applies :has() alignment override when the right slot is populated (character count present)', async () => {
    // We test the stylesheet indirectly: the `:host:has(...)` selector
    // sets `--ngx-form-field-hint-align: left` when the right slot has
    // content, and removes it when it does not. getComputedStyle on the
    // host lets us verify the custom property flip without needing an
    // actual rendered layout.
    const { container } = await render(TestWrapperComponent);
    const host = container.querySelector(
      'ngx-signal-form-field-assistive-row',
    );
    if (!(host instanceof HTMLElement)) {
      throw new Error('expected host element');
    }

    const hintAlignWithRight = getComputedStyle(host).getPropertyValue(
      '--ngx-form-field-hint-align',
    );
    expect(hintAlignWithRight.trim()).toBe('left');
  });

  it('hides empty slots via display: none (no layout space)', async () => {
    @Component({
      selector: 'ngx-test-assistive-row-empty-right',
      changeDetection: ChangeDetectionStrategy.OnPush,
      imports: [NgxFormFieldAssistiveRowComponent],
      template: `
        <ngx-signal-form-field-assistive-row>
          <span data-testid="left-text">Only a hint</span>
        </ngx-signal-form-field-assistive-row>
      `,
    })
    class HintOnlyHost {}

    const { container } = await render(HintOnlyHost);

    const right = container.querySelector(
      '.ngx-form-field-assistive-row__right',
    );
    if (!(right instanceof HTMLElement)) {
      throw new Error('expected right slot element');
    }

    expect(right.textContent?.trim() ?? '').toBe('');
    expect(getComputedStyle(right).display).toBe('none');
  });
});
