import { signal } from '@angular/core';
import { NgxSignalFormControlSemanticsDirective } from '@ngx-signal-forms/toolkit';
import { render } from '@testing-library/angular';
import { describe, expect, it } from 'vitest';
import { NgxFormFieldWrapper } from './form-field-wrapper';

/**
 * Regression coverage for #474.
 *
 * A consumer sets the public outline label tokens
 * (`--ngx-form-field-outline-label-size`,
 * `--ngx-form-field-outline-label-color`) on an ancestor. The consumer
 * uses no descendant selector and no `!important`. Every projected label
 * inside an outline-appearance wrapper must render with those values.
 * This applies to a native `<label>` and to a `<span ngxFormFieldLabel>`.
 *
 * On Angular 22.1 and earlier, this passed even without `::ng-deep`: emulated
 * encapsulation rewrote only a rule's top-level selector, so a nested
 * `:is(label, [ngxFormFieldLabel])` selector stayed unscoped and still
 * matched the projected label.
 *
 * Angular 22.2 changed that (angular/angular#69885): nested rules are now
 * scoped too. A plain nested selector then requires the wrapper's own
 * content attribute, which a projected label never carries — it carries the
 * consumer's attribute instead. See #552.
 *
 * The outline label rule in `form-field-wrapper.css` avoids this by moving
 * the projected-element selector out of the nesting and marking it
 * `::ng-deep`, right after `:host(...)`:
 * `:host(.ngx-signal-forms-outline) ::ng-deep
 * .ngx-signal-form-field-wrapper__label :is(label, [ngxFormFieldLabel])`.
 * `::ng-deep` drops encapsulation for everything after it, so the rule keeps
 * matching the projected label on every Angular version. This spec guards
 * that match.
 */

const mockField = () => {
  const fieldState = {
    invalid: signal(false),
    touched: signal(false),
    errors: signal([]),
    valid: signal(true),
    dirty: signal(false),
    value: signal(''),
    required: signal(false),
  };
  return signal(fieldState);
};

describe('NgxFormFieldWrapper — outline label tokens (#474)', () => {
  const overrideSize = '20px'; // non-default (default caption size is 12px)
  const overrideColor = 'rgb(120, 0, 80)'; // non-default (default is a translucent gray)

  const applyAncestorTokens = (ancestor: HTMLElement) => {
    ancestor.style.setProperty(
      '--ngx-form-field-outline-label-size',
      overrideSize,
    );
    ancestor.style.setProperty(
      '--ngx-form-field-outline-label-color',
      overrideColor,
    );
  };

  it('applies the outline label tokens to a projected native <label>', async () => {
    const { container } = await render(
      `<ngx-form-field-wrapper [formField]="field" appearance="outline">
        <label for="name">Name</label>
        <input id="name" type="text" />
      </ngx-form-field-wrapper>`,
      {
        imports: [NgxFormFieldWrapper],
        componentProperties: { field: mockField() },
      },
    );

    // The ancestor is the render fixture's root. It is a real ancestor of
    // the projected light-DOM label. No descendant selector is involved.
    applyAncestorTokens(container);

    const label = container.querySelector<HTMLElement>('label[for="name"]');
    expect(label).toBeTruthy();
    const styles = getComputedStyle(label!);
    expect(styles.fontSize).toBe(overrideSize);
    expect(styles.color).toBe(overrideColor);
  });

  it('applies the outline label tokens to a projected [ngxFormFieldLabel]', async () => {
    const { container } = await render(
      `<ngx-form-field-wrapper [formField]="field" appearance="outline">
        <span ngxFormFieldLabel>Name</span>
        <input id="name-span" type="text" />
      </ngx-form-field-wrapper>`,
      {
        imports: [NgxFormFieldWrapper],
        componentProperties: { field: mockField() },
      },
    );

    applyAncestorTokens(container);

    const label = container.querySelector<HTMLElement>('[ngxFormFieldLabel]');
    expect(label).toBeTruthy();
    const styles = getComputedStyle(label!);
    expect(styles.fontSize).toBe(overrideSize);
    expect(styles.color).toBe(overrideColor);
  });
});

/**
 * Coverage for #474's checkbox/switch case.
 *
 * The selection-row label rule in `form-field-wrapper.selection.css` used
 * to size and color the row label from the input tokens (`--_input-size`,
 * `--_input-line-height`, `--_color-text`). It did not use the label
 * tokens every other label rule consumes.
 *
 * It now reads `--_label-size`, `--_label-weight`,
 * `--_label-font-family`, `--_label-line-height`, and `--_label-color`.
 * These are the same `--ngx-form-field-label-*` tokens the
 * standard-layout label uses. A consumer that themes labels globally now
 * also reaches the checkbox and switch row label. See THEMING.md's
 * "Checkbox and switch row label typography" note.
 */
describe('NgxFormFieldWrapper — checkbox/switch row label typography (#474)', () => {
  const overrideSize = '22px'; // non-default (default label size is 12px)
  const overrideColor = 'rgb(0, 120, 80)'; // non-default

  const applyAncestorTokens = (ancestor: HTMLElement) => {
    ancestor.style.setProperty('--ngx-form-field-label-size', overrideSize);
    ancestor.style.setProperty('--ngx-form-field-label-color', overrideColor);
  };

  it('sizes and colors a checkbox row label from the label tokens', async () => {
    const { container } = await render(
      `<ngx-form-field-wrapper [formField]="field">
        <label for="agree">I agree to the terms</label>
        <input id="agree" type="checkbox" />
      </ngx-form-field-wrapper>`,
      {
        imports: [NgxFormFieldWrapper],
        componentProperties: { field: mockField() },
      },
    );

    applyAncestorTokens(container);

    const label = container.querySelector<HTMLElement>('label[for="agree"]');
    expect(label).toBeTruthy();
    const styles = getComputedStyle(label!);
    expect(styles.fontSize).toBe(overrideSize);
    expect(styles.color).toBe(overrideColor);
  });

  it('sizes and colors a switch row label from the label tokens', async () => {
    const { container } = await render(
      `<ngx-form-field-wrapper [formField]="field">
        <label for="notifications">Enable notifications</label>
        <input id="notifications" type="checkbox" role="switch" />
      </ngx-form-field-wrapper>`,
      {
        imports: [NgxFormFieldWrapper],
        componentProperties: { field: mockField() },
      },
    );

    applyAncestorTokens(container);

    const label = container.querySelector<HTMLElement>(
      'label[for="notifications"]',
    );
    expect(label).toBeTruthy();
    const styles = getComputedStyle(label!);
    expect(styles.fontSize).toBe(overrideSize);
    expect(styles.color).toBe(overrideColor);
  });
});

/**
 * Computed-style regression coverage for public label tokens (#476).
 *
 * Issue #474 covered the outline-appearance projected label and the
 * checkbox/switch selection-row label. This suite covers the remaining
 * matrix cells:
 *
 * 1. Plain appearance projected label — standard label tokens apply.
 * 2. Native `<select>` associated label — standard label tokens apply.
 * 3. Radio-group legend — bare `<legend>` is consumer-owned; label tokens
 *    do NOT reach it (ownership boundary).
 * 4. Field-shaped custom control projected label — standard label tokens
 *    apply regardless of control kind.
 *
 * The wrapper's label CSS lives on `.ngx-signal-form-field-wrapper__label`
 * (the label div). In standard and plain modes the projected `<label>`
 * inherits typography from that div. In outline mode the outline label
 * tokens are applied directly to `:is(label, [ngxFormFieldLabel])` inside
 * the div — already covered by #474.
 */
describe('NgxFormFieldWrapper — label token coverage (#476)', () => {
  /**
   * Overrides all four asserted standard label tokens on the wrapper host
   * and verifies the projected `<label>` element picks them up via
   * inheritance from the label div.
   */
  const assertStandardLabelTokens = (
    label: HTMLElement,
    wrapper: HTMLElement,
  ) => {
    wrapper.style.setProperty('--ngx-form-field-label-size', '1.25rem');
    wrapper.style.setProperty('--ngx-form-field-label-weight', '700');
    wrapper.style.setProperty('--ngx-form-field-label-color', 'rgb(255, 0, 0)');
    wrapper.style.setProperty('--ngx-form-field-label-line-height', '2rem');

    const style = getComputedStyle(label);
    // 1.25rem at the default 16px root = 20px
    expect(style.fontSize).toBe('20px');
    expect(style.fontWeight).toBe('700');
    expect(style.color).toBe('rgb(255, 0, 0)');
    // 2rem at the default 16px root = 32px
    expect(style.lineHeight).toBe('32px');
  };

  it('plain appearance: standard label tokens reach the projected <label>', async () => {
    const { container } = await render(
      `<ngx-form-field-wrapper [formField]="field" appearance="plain">
        <label for="plain-input">Plain label</label>
        <input id="plain-input" type="text" />
      </ngx-form-field-wrapper>`,
      {
        imports: [NgxFormFieldWrapper],
        componentProperties: { field: mockField() },
      },
    );

    const wrapper = container.querySelector<HTMLElement>(
      'ngx-form-field-wrapper',
    )!;
    const label = container.querySelector<HTMLLabelElement>(
      'label[for="plain-input"]',
    )!;
    expect(label).toBeTruthy();

    assertStandardLabelTokens(label, wrapper);
  });

  it('native <select>: standard label tokens reach the associated <label>', async () => {
    const { container } = await render(
      `<ngx-form-field-wrapper [formField]="field">
        <label for="country">Country</label>
        <select id="country">
          <option value="us">United States</option>
          <option value="nl">Netherlands</option>
        </select>
      </ngx-form-field-wrapper>`,
      {
        imports: [NgxFormFieldWrapper],
        componentProperties: { field: mockField() },
      },
    );

    const wrapper = container.querySelector<HTMLElement>(
      'ngx-form-field-wrapper',
    )!;
    const label = container.querySelector<HTMLLabelElement>(
      'label[for="country"]',
    )!;
    expect(label).toBeTruthy();

    assertStandardLabelTokens(label, wrapper);
  });

  it('radio-group legend: label tokens do NOT reach a bare <legend> (consumer-owned ownership boundary)', async () => {
    const { container } = await render(
      `<ngx-form-field-wrapper [formField]="field">
        <legend>Choose delivery method</legend>
        <label>
          <input type="radio" value="standard" /> Standard
        </label>
        <label>
          <input type="radio" value="express" /> Express
        </label>
      </ngx-form-field-wrapper>`,
      {
        imports: [NgxFormFieldWrapper],
        componentProperties: { field: mockField() },
      },
    );

    const wrapper = container.querySelector<HTMLElement>(
      'ngx-form-field-wrapper',
    )!;
    const legend = container.querySelector<HTMLLegendElement>('legend')!;
    const labelDiv = container.querySelector<HTMLElement>(
      '.ngx-signal-form-field-wrapper__label',
    )!;

    // A bare <legend> does not match the label slot's
    // `ng-content select="label, [ngxFormFieldLabel]"` selector, so it
    // falls through to the default content slot — not the label div.
    expect(labelDiv.contains(legend)).toBe(false);

    // Record the legend's computed style before overriding the tokens.
    const before = getComputedStyle(legend);
    const fontSizeBefore = before.fontSize;
    const fontWeightBefore = before.fontWeight;
    const colorBefore = before.color;
    const lineHeightBefore = before.lineHeight;

    // Override all standard label tokens on the wrapper host.
    wrapper.style.setProperty('--ngx-form-field-label-size', '1.25rem');
    wrapper.style.setProperty('--ngx-form-field-label-weight', '700');
    wrapper.style.setProperty('--ngx-form-field-label-color', 'rgb(255, 0, 0)');
    wrapper.style.setProperty('--ngx-form-field-label-line-height', '2rem');

    // The legend's computed style should NOT change — it is outside the
    // wrapper's label style encapsulation.
    const after = getComputedStyle(legend);
    expect(after.fontSize).toBe(fontSizeBefore);
    expect(after.fontWeight).toBe(fontWeightBefore);
    expect(after.color).toBe(colorBefore);
    expect(after.lineHeight).toBe(lineHeightBefore);
  });

  it('field-shaped custom control: standard label tokens reach the projected <label>', async () => {
    const { container } = await render(
      `<ngx-form-field-wrapper [formField]="field">
        <label for="framework">Framework</label>
        <button id="framework" type="button" ngxSignalFormControl="input-like">
          Select a framework
        </button>
      </ngx-form-field-wrapper>`,
      {
        imports: [NgxFormFieldWrapper, NgxSignalFormControlSemanticsDirective],
        componentProperties: { field: mockField() },
      },
    );

    const wrapper = container.querySelector<HTMLElement>(
      'ngx-form-field-wrapper',
    )!;
    const label = container.querySelector<HTMLLabelElement>(
      'label[for="framework"]',
    )!;
    expect(label).toBeTruthy();

    assertStandardLabelTokens(label, wrapper);
  });
});

/**
 * Regression coverage for #552.
 *
 * The invalid checkbox and switch row label rules in
 * `form-field-wrapper.selection.css` set `color: var(--_invalid-color)` on
 * the projected label. The switch rule used CSS nesting and broke on
 * Angular 22.2 for the same reason as #474's outline rule. The checkbox
 * rule never used nesting, but its selector still required the wrapper's
 * own content attribute on the label element — an attribute a projected
 * label never carries — so it never matched, on any Angular version.
 *
 * Both rules must win a real cascade fight: a consumer style that sets a
 * label colour at ordinary (single-class) specificity must not override
 * the invalid colour.
 */
describe('NgxFormFieldWrapper — invalid selection-row label color (#552)', () => {
  const invalidTouchedField = () =>
    signal({
      invalid: () => true,
      touched: () => true,
      errors: () => [{ kind: 'required', message: 'You must agree' }],
    });

  /** Reads the wrapper's `--_invalid-color` the same way the label rule does. */
  const resolveInvalidColor = (host: HTMLElement) => {
    const probe = document.createElement('span');
    probe.style.color = 'var(--_invalid-color)';
    host.append(probe);
    const color = getComputedStyle(probe).color;
    probe.remove();
    return color;
  };

  /** A consumer global stylesheet rule, at ordinary single-class specificity. */
  const withConsumerLabelColor = () => {
    const style = document.createElement('style');
    style.textContent = '.consumer-label { color: rgb(0, 0, 255); }';
    document.head.append(style);
    return style;
  };

  it('keeps the invalid color on a projected switch label when a consumer style sets a label colour', async () => {
    const consumerStyle = withConsumerLabelColor();
    try {
      const { container } = await render(
        `<ngx-form-field-wrapper [formField]="field">
          <label class="consumer-label" for="notifications">Enable notifications</label>
          <input id="notifications" type="checkbox" role="switch" />
        </ngx-form-field-wrapper>`,
        {
          imports: [NgxFormFieldWrapper],
          componentProperties: { field: invalidTouchedField() },
        },
      );

      const wrapper = container.querySelector<HTMLElement>(
        'ngx-form-field-wrapper',
      )!;
      const label = container.querySelector<HTMLLabelElement>(
        'label[for="notifications"]',
      )!;
      const expected = resolveInvalidColor(wrapper);
      // Guards against a token that silently resolves to the consumer's
      // colour, which would make the assertion below pass for the wrong
      // reason.
      expect(expected).not.toBe('rgb(0, 0, 255)');

      expect(getComputedStyle(label).color).toBe(expected);
    } finally {
      consumerStyle.remove();
    }
  });

  it('keeps the invalid color on a projected checkbox label when a consumer style sets a label colour', async () => {
    const consumerStyle = withConsumerLabelColor();
    try {
      const { container } = await render(
        `<ngx-form-field-wrapper [formField]="field">
          <label class="consumer-label" for="agree">I agree to the terms</label>
          <input id="agree" type="checkbox" />
        </ngx-form-field-wrapper>`,
        {
          imports: [NgxFormFieldWrapper],
          componentProperties: { field: invalidTouchedField() },
        },
      );

      const wrapper = container.querySelector<HTMLElement>(
        'ngx-form-field-wrapper',
      )!;
      const label =
        container.querySelector<HTMLLabelElement>('label[for="agree"]')!;
      const expected = resolveInvalidColor(wrapper);
      // Guards against a token that silently resolves to the consumer's
      // colour, which would make the assertion below pass for the wrong
      // reason.
      expect(expected).not.toBe('rgb(0, 0, 255)');

      expect(getComputedStyle(label).color).toBe(expected);
    } finally {
      consumerStyle.remove();
    }
  });
});
