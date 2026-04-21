import { signal } from '@angular/core';
import { render } from '@testing-library/angular';
import { describe, expect, it } from 'vitest';
import { NgxFormFieldWrapper } from './form-field-wrapper';

const mockField = () =>
  signal({
    invalid: () => false,
    touched: () => false,
    errors: () => [],
  });

describe('NgxFormFieldWrapper — without a label', () => {
  it('hides the label div in the standard layout', async () => {
    const { container } = await render(
      `<ngx-form-field-wrapper [formField]="field">
        <input id="anon" type="text" />
      </ngx-form-field-wrapper>`,
      {
        imports: [NgxFormFieldWrapper],
        componentProperties: { field: mockField() },
      },
    );

    const labelDiv = container.querySelector<HTMLElement>(
      '.ngx-signal-form-field-wrapper__label',
    );
    expect(labelDiv).toBeTruthy();
    expect(getComputedStyle(labelDiv!).display).toBe('none');
  });

  it('collapses top padding on the outline content container', async () => {
    const { container } = await render(
      `<ngx-form-field-wrapper [formField]="field" appearance="outline">
        <input id="anon-outline" type="text" />
      </ngx-form-field-wrapper>`,
      {
        imports: [NgxFormFieldWrapper],
        componentProperties: { field: mockField() },
      },
    );

    const content = container.querySelector<HTMLElement>(
      '.ngx-signal-form-field-wrapper__content',
    );
    expect(content).toBeTruthy();
    const paddingTop = parseFloat(getComputedStyle(content!).paddingTop);
    // With a label the stack is label-line-height (16px) + gap (0) +
    // padding-vertical (4px) = 20px. Without a label we want only the
    // 4px vertical padding. Assert well below the labelled value.
    expect(paddingTop).toBeLessThan(10);
  });

  it('collapses the horizontal label column in the standard layout', async () => {
    const { container } = await render(
      `<ngx-form-field-wrapper [formField]="field" orientation="horizontal">
        <input id="anon-h" type="text" />
      </ngx-form-field-wrapper>`,
      {
        imports: [NgxFormFieldWrapper],
        componentProperties: { field: mockField() },
      },
    );

    const host = container.querySelector<HTMLElement>('ngx-form-field-wrapper');
    const input = container.querySelector<HTMLInputElement>('#anon-h');
    expect(host && input).toBeTruthy();
    // With a reserved label column, the input would sit ~8rem (128px) to
    // the right of the host. Without it, the input is flush left.
    const hostLeft = host!.getBoundingClientRect().left;
    const inputLeft = input!.getBoundingClientRect().left;
    expect(inputLeft - hostLeft).toBeLessThan(24);
  });

  it('keeps existing label behavior when a label is projected', async () => {
    const { container } = await render(
      `<ngx-form-field-wrapper [formField]="field">
        <label for="labelled">Labelled</label>
        <input id="labelled" type="text" />
      </ngx-form-field-wrapper>`,
      {
        imports: [NgxFormFieldWrapper],
        componentProperties: { field: mockField() },
      },
    );

    const labelDiv = container.querySelector<HTMLElement>(
      '.ngx-signal-form-field-wrapper__label',
    );
    expect(getComputedStyle(labelDiv!).display).not.toBe('none');
  });

  it('keeps outline content padding when a label is projected', async () => {
    const { container } = await render(
      `<ngx-form-field-wrapper [formField]="field" appearance="outline">
        <label for="labelled-outline">Labelled</label>
        <input id="labelled-outline" type="text" />
      </ngx-form-field-wrapper>`,
      {
        imports: [NgxFormFieldWrapper],
        componentProperties: { field: mockField() },
      },
    );

    const content = container.querySelector<HTMLElement>(
      '.ngx-signal-form-field-wrapper__content',
    );
    expect(content).toBeTruthy();
    const paddingTop = parseFloat(getComputedStyle(content!).paddingTop);
    // Labelled outline reserves label-line-height + padding-vertical.
    // Assert well above the labelless threshold to guard against a
    // future regression that collapses padding for labelled wrappers.
    expect(paddingTop).toBeGreaterThan(12);
  });

  it('does not collapse the label slot for the plain appearance', async () => {
    const { container } = await render(
      `<ngx-form-field-wrapper [formField]="field" appearance="plain">
        <input id="anon-plain" type="text" />
      </ngx-form-field-wrapper>`,
      {
        imports: [NgxFormFieldWrapper],
        componentProperties: { field: mockField() },
      },
    );

    const labelDiv = container.querySelector<HTMLElement>(
      '.ngx-signal-form-field-wrapper__label',
    );
    expect(labelDiv).toBeTruthy();
    // Plain is a non-goal for the labelless collapse. If it regresses to
    // `display: none`, the spec's stated scope has drifted from the CSS.
    expect(getComputedStyle(labelDiv!).display).not.toBe('none');
  });

  it('collapses the label column for horizontal + errorPlacement="top" without a label', async () => {
    const { container } = await render(
      `<ngx-form-field-wrapper [formField]="field" orientation="horizontal" errorPlacement="top">
        <input id="anon-h-top" type="text" />
      </ngx-form-field-wrapper>`,
      {
        imports: [NgxFormFieldWrapper],
        componentProperties: { field: mockField() },
      },
    );

    const host = container.querySelector<HTMLElement>('ngx-form-field-wrapper');
    const input = container.querySelector<HTMLInputElement>('#anon-h-top');
    expect(host && input).toBeTruthy();
    // Without a reserved label column the input sits flush against the
    // wrapper's left edge. Use the same 24px threshold as the bottom
    // errorPlacement variant so both are consistent.
    const hostLeft = host!.getBoundingClientRect().left;
    const inputLeft = input!.getBoundingClientRect().left;
    expect(inputLeft - hostLeft).toBeLessThan(24);
    // The grid should carry the messages-top area so errors render above
    // the content row rather than below.
    const gridTemplateAreas = getComputedStyle(host!).gridTemplateAreas;
    expect(gridTemplateAreas).toMatch(/messages/);
  });

  it('keeps the horizontal label column when a label is projected', async () => {
    const { container } = await render(
      `<ngx-form-field-wrapper [formField]="field" orientation="horizontal">
        <label for="labelled-h">Labelled</label>
        <input id="labelled-h" type="text" />
      </ngx-form-field-wrapper>`,
      {
        imports: [NgxFormFieldWrapper],
        componentProperties: { field: mockField() },
      },
    );

    const host = container.querySelector<HTMLElement>('ngx-form-field-wrapper');
    const input = container.querySelector<HTMLInputElement>('#labelled-h');
    expect(host && input).toBeTruthy();
    // With a label column (~8rem / 128px) reserved, the input sits well
    // past the wrapper's left edge. Threshold comfortably above the
    // labelless guard (24px) so either regression fails loudly.
    const offset =
      input!.getBoundingClientRect().left - host!.getBoundingClientRect().left;
    expect(offset).toBeGreaterThan(64);
  });
});
