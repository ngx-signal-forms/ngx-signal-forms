import { type Signal, signal } from '@angular/core';
import { render } from '@testing-library/angular';
import { page, userEvent } from 'vitest/browser';
import { describe, expect, it } from 'vitest';
import { NgxFormFieldWrapper } from './form-field-wrapper';

/**
 * Regression coverage for #253: `--_field-touch-target` (checkbox, switch,
 * and padded-control row sizing) was private, so a consumer could not retune
 * selection density from outside the package. This locks in the public
 * override — `--ngx-form-field-touch-target`, default `2rem` (32px) — and
 * the resulting rendered geometry.
 *
 * 32px is not a WCAG figure itself: SC 2.5.8 Target Size (Minimum, AA) is
 * 24x24 CSS px; SC 2.5.5 Target Size (Enhanced, AAA) is 44x44. 32px is 24px
 * plus deliberate headroom so a border or sub-pixel rounding cannot drop the
 * rendered box under the AA minimum.
 */
describe('NgxFormFieldWrapper — selection target size (#253)', () => {
  type MockField = Signal<{
    invalid: () => boolean;
    touched: () => boolean;
    errors: () => { kind: string; message: string }[];
  }>;

  const validCheckboxField = (): MockField =>
    signal({
      invalid: () => false,
      touched: () => false,
      errors: () => [],
    });

  const invalidTouchedCheckboxField = (): MockField =>
    signal({
      invalid: () => true,
      touched: () => true,
      errors: () => [{ kind: 'required', message: 'You must agree' }],
    });

  /** Renders `controlHtml` inside a wrapper bound to `field` and locates the row. */
  const renderRow = async (field: MockField, controlHtml: string) => {
    const { container } = await render(
      `<ngx-form-field-wrapper [formField]="field">${controlHtml}</ngx-form-field-wrapper>`,
      {
        imports: [NgxFormFieldWrapper],
        componentProperties: { field },
      },
    );

    return {
      wrapper: container.querySelector<HTMLElement>('ngx-form-field-wrapper')!,
      row: container.querySelector<HTMLElement>(
        '.ngx-signal-form-field-wrapper__content',
      )!,
    };
  };

  const selectionRows = [
    {
      name: 'checkbox',
      html: `<label for="agree">I agree to the terms</label>
        <input id="agree" type="checkbox" />`,
    },
    {
      name: 'switch',
      html: `<label for="notifications">Enable notifications</label>
        <input id="notifications" type="checkbox" role="switch" />`,
    },
  ];

  describe.each(selectionRows)('$name row', ({ html }) => {
    it('keeps the row at least the WCAG 2.5.8 AA minimum (24px) by default, at the 32px toolkit default', async () => {
      const { row } = await renderRow(validCheckboxField(), html);

      expect(row.getBoundingClientRect().height).toBeGreaterThanOrEqual(24);
      expect(row.getBoundingClientRect().height).toBeCloseTo(32, 0);
    });

    it('resizes when --ngx-form-field-touch-target is overridden, staying at or above 24px', async () => {
      const { wrapper, row } = await renderRow(validCheckboxField(), html);
      const before = row.getBoundingClientRect().height;

      wrapper.style.setProperty('--ngx-form-field-touch-target', '3rem');
      const grown = row.getBoundingClientRect().height;

      wrapper.style.setProperty('--ngx-form-field-touch-target', '1.5rem');
      const shrunk = row.getBoundingClientRect().height;

      expect(before).toBeCloseTo(32, 0);
      expect(grown).toBeCloseTo(48, 0);
      expect(shrunk).toBeCloseTo(24, 0);
      expect(shrunk).toBeGreaterThanOrEqual(24);
    });
  });

  it('keeps the checkbox row at or above 24px in its initial valid state', async () => {
    const { row } = await renderRow(
      validCheckboxField(),
      `<label for="agree-valid">I agree to the terms</label>
      <input id="agree-valid" type="checkbox" />`,
    );

    expect(row.getBoundingClientRect().height).toBeGreaterThanOrEqual(24);
  });

  it('keeps the checkbox row at or above 24px while showing a blocking error', async () => {
    const { wrapper, row } = await renderRow(
      invalidTouchedCheckboxField(),
      `<label for="agree-invalid">I agree to the terms</label>
      <input id="agree-invalid" type="checkbox" />`,
    );
    const errorElement = wrapper.querySelector('[id="agree-invalid-error"]');

    expect(errorElement).toBeTruthy();
    expect(row.getBoundingClientRect().height).toBeGreaterThanOrEqual(24);
  });

  it('does not change keyboard focus affordances when the touch-target token is overridden', async () => {
    const { wrapper } = await renderRow(
      validCheckboxField(),
      `<label for="agree-focus">I agree to the terms</label>
      <input id="agree-focus" type="checkbox" />`,
    );
    const input = wrapper.querySelector<HTMLInputElement>('#agree-focus');

    await userEvent.click(
      page.getByRole('checkbox', { name: 'I agree to the terms' }),
    );
    expect(document.activeElement).toBe(input);
    const outlineBefore = getComputedStyle(input!).outlineStyle;

    wrapper.style.setProperty('--ngx-form-field-touch-target', '3rem');

    expect(document.activeElement).toBe(input);
    expect(getComputedStyle(input!).outlineStyle).toBe(outlineBefore);
  });

  it("keeps a lone radio row's rendered height at or above 24px, but leaves it consumer-owned (unaffected by --ngx-form-field-touch-target)", async () => {
    // Deviation from #253's "already shipped" inventory, surfaced here and
    // in THEMING.md's "Selection target size" section: that inventory
    // treats `--_selection-row-min-block-size` (which checkbox/switch rows
    // consume) as already covering selection-group rows generally,
    // including grouped radios. It does not, for a lone radio specifically.
    //
    // `inferNgxSignalFormControlKind` maps every `<input type="radio">` to
    // the `radio-group` kind unconditionally (no "grouped vs. solo" check).
    // `isSelectionCluster` in form-field-wrapper.ts then becomes `true`
    // whenever `semantics.kind === 'radio-group'` — again unconditionally,
    // with no count gate (unlike checkbox, which only clusters past one
    // control). The selection-cluster rule in
    // form-field-wrapper.selection.css sets `.content`/`.main` to
    // `min-height: 0`, and — because it has equal selector specificity to
    // the earlier selection-group rule but appears later in the
    // stylesheet — wins by source order. Net effect: a lone radio's row
    // never reaches `--_field-touch-target` at all; its `.content` height
    // below comes entirely from the selection-cluster's own padding token,
    // not the shared touch-target token. This is intentional per the
    // "Selection-cluster container and label layout is consumer-owned"
    // comment in form-field-wrapper.selection.css — not something this
    // spec re-decides.
    const { wrapper, row } = await renderRow(
      validCheckboxField(),
      `<label for="plan-basic">Basic plan</label>
      <input id="plan-basic" type="radio" value="basic" />`,
    );
    const before = row.getBoundingClientRect().height;

    wrapper.style.setProperty('--ngx-form-field-touch-target', '3rem');
    const after = row.getBoundingClientRect().height;

    expect(before).toBeGreaterThanOrEqual(24);
    expect(after).toBe(before);
  });
});
