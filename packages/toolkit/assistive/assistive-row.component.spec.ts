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
  readonly maxLength = input<number>(10);

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

    expect(
      within(left as HTMLElement).getByTestId('assistive-text'),
    ).toBeInTheDocument();

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
});
