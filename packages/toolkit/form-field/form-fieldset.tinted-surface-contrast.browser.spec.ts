import {
  ApplicationRef,
  ChangeDetectionStrategy,
  Component,
  input,
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
import { NgxSignalFormToolkit } from '@ngx-signal-forms/toolkit';
import { NgxFormFieldCharacterCount } from '@ngx-signal-forms/toolkit/assistive';
import { render } from '@testing-library/angular';
import { userEvent } from 'vitest/browser';
import { describe, expect, it } from 'vitest';
import { NgxFormField } from './index';

/**
 * Regression coverage for #535.
 *
 * The light invalid fieldset tint is `#fbdddd`. On it, the default wrapper
 * label (slate at 75% alpha) was 4.35:1, the default error red `#db1818`
 * was 3.97:1 and the warning amber `#a16207` was 3.87:1. WCAG 1.4.3 asks
 * for 4.5:1. The tinted surface now gives the text inside it darker tones,
 * in light mode only, through private tokens. Public color tokens still win.
 */

type SurfaceTone = 'default' | 'danger';
type FieldAppearance = 'inherit' | 'plain';

@Component({
  selector: 'ngx-test-tinted-fieldset',
  imports: [
    FormField,
    NgxSignalFormToolkit,
    NgxFormField,
    NgxFormFieldCharacterCount,
  ],
  template: `
    <form [formRoot]="testForm" ngxSignalForm errorStrategy="immediate">
      <fieldset
        ngxFormFieldset
        [field]="testForm.group"
        [validationSurface]="validationSurface()"
        [surfaceTone]="surfaceTone()"
        feedbackAppearance="plain"
      >
        <legend>Account</legend>
        <ngx-form-field-wrapper
          [appearance]="appearance()"
          [formField]="testForm.group.name"
          fieldName="name"
        >
          <label for="name">Full name</label>
          <input id="name" type="text" [formField]="testForm.group.name" />
        </ngx-form-field-wrapper>
        <ngx-form-field-wrapper
          [appearance]="appearance()"
          [formField]="testForm.group.username"
          fieldName="username"
        >
          <label for="username">Username</label>
          <input
            id="username"
            type="text"
            [formField]="testForm.group.username"
          />
        </ngx-form-field-wrapper>
        <ngx-form-field-wrapper
          [appearance]="appearance()"
          [formField]="testForm.group.motto"
          fieldName="motto"
        >
          <label for="motto">Motto</label>
          <input id="motto" type="text" [formField]="testForm.group.motto" />
          <ngx-form-field-hint id="motto-hint"
            >A few words.</ngx-form-field-hint
          >
          <ngx-form-field-character-count
            id="motto-count"
            [formField]="testForm.group.motto"
            [maxLength]="10"
          />
        </ngx-form-field-wrapper>
        <ngx-form-field-wrapper
          [appearance]="appearance()"
          [formField]="testForm.group.tagline"
          fieldName="tagline"
        >
          <label for="tagline">Tagline</label>
          <input
            id="tagline"
            type="text"
            [formField]="testForm.group.tagline"
          />
          <ngx-form-field-character-count
            id="tagline-count"
            [formField]="testForm.group.tagline"
            [maxLength]="10"
          />
        </ngx-form-field-wrapper>
        <ngx-form-field-wrapper
          [appearance]="appearance()"
          [formField]="testForm.group.nickname"
          fieldName="nickname"
          showMarkerWhen="optional"
        >
          <label for="nickname">Nickname</label>
          <input
            id="nickname"
            type="text"
            [formField]="testForm.group.nickname"
          />
        </ngx-form-field-wrapper>
        <ngx-form-field-wrapper
          [appearance]="appearance()"
          [formField]="testForm.group.accept"
          fieldName="accept"
        >
          <input
            id="accept"
            type="checkbox"
            [formField]="testForm.group.accept"
          />
          <label for="accept">Accept the terms</label>
        </ngx-form-field-wrapper>
      </fieldset>
    </form>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class TintedFieldsetFixture {
  readonly validationSurface = input<'always' | 'never'>('always');
  readonly surfaceTone = input<SurfaceTone>('default');
  readonly appearance = input<FieldAppearance>('inherit');
  readonly testForm = form(
    signal({
      group: {
        name: '',
        username: 'ab',
        // 9/10 = 90%: the character count's warning tone.
        motto: 'Carpe die',
        // 10/10 = 100%: the character count's danger tone.
        tagline: 'Carpe diem',
        nickname: '',
        accept: false,
      },
    }),
    schema((path) => {
      required(path.group.name, { message: 'Full name is required' });
      validate(path.group.accept, (ctx) =>
        ctx.value() ? null : { kind: 'accept', message: 'Please accept' },
      );
      validate(path.group, () => ({
        kind: 'group',
        message: 'Check the account details',
      }));
      validate(path.group.username, (ctx) =>
        ctx.value().length < 3
          ? { kind: 'warn:short-username', message: 'Consider 3+ characters' }
          : null,
      );
    }),
  );
}

/**
 * Every text on the fieldset surface, by name. The fixture uses
 * `feedbackAppearance="plain"` so the group error sits on the surface too.
 * The notification card paints its own background and has its own tones.
 */
function surfaceTexts(root: HTMLElement): Record<string, HTMLElement> {
  const byText = (selector: string, text: string): HTMLElement => {
    const match = Array.from(root.querySelectorAll<HTMLElement>(selector)).find(
      (element) => element.textContent?.includes(text),
    );
    if (!match) {
      throw new Error(`Expected "${text}" in ${selector} to render.`);
    }
    return match;
  };
  const one = (selector: string): HTMLElement => {
    const element = root.querySelector<HTMLElement>(selector);
    if (!element) {
      throw new Error(`Expected ${selector} to render.`);
    }
    return element;
  };

  return {
    legend: one('legend'),
    label: one('label[for="motto"]'),
    requiredMarker: one('.ngx-signal-form-field-wrapper__required-marker'),
    optionalMarker: one('.ngx-signal-form-field-wrapper__optional-marker'),
    invalidCheckboxLabel: one('label[for="accept"]'),
    hint: one('#motto-hint'),
    countWarning: one('#motto-count'),
    countDanger: one('#tagline-count'),
    fieldError: byText('.ngx-form-field-error--error', 'Full name is required'),
    fieldWarning: byText(
      '.ngx-form-field-error--warning',
      'Consider 3+ characters',
    ),
    groupError: byText(
      '.ngx-form-field-error--error',
      'Check the account details',
    ),
  };
}

type Rgba = readonly [number, number, number, number];

/** Parses a computed color: `rgb()`, `rgba()` or `color(srgb …)` (from color-mix). */
function parseColor(value: string): Rgba {
  const srgb =
    /^color\(srgb ([\d.e-]+) ([\d.e-]+) ([\d.e-]+)(?: \/ ([\d.]+))?\)$/u.exec(
      value,
    );
  if (srgb) {
    return [
      Number(srgb[1]) * 255,
      Number(srgb[2]) * 255,
      Number(srgb[3]) * 255,
      srgb[4] === undefined ? 1 : Number(srgb[4]),
    ];
  }
  const rgb = /^rgba?\(([\d.]+), ([\d.]+), ([\d.]+)(?:, ([\d.]+))?\)$/u.exec(
    value,
  );
  if (rgb) {
    return [
      Number(rgb[1]),
      Number(rgb[2]),
      Number(rgb[3]),
      rgb[4] === undefined ? 1 : Number(rgb[4]),
    ];
  }
  throw new Error(`Cannot parse color "${value}".`);
}

function luminance([r, g, b]: Rgba): number {
  const channel = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

/**
 * WCAG contrast of a (possibly translucent) text color on an opaque surface.
 * `opacity` is the element's own `opacity`, which fades the text further.
 */
function contrastOn(text: string, surface: string, opacity = 1): number {
  const bg = parseColor(surface);
  const [r, g, b, alpha] = parseColor(text);
  const a = alpha * opacity;
  const fg: Rgba = [
    r * a + bg[0] * (1 - a),
    g * a + bg[1] * (1 - a),
    b * a + bg[2] * (1 - a),
    1,
  ];
  const [fgLum, bgLum] = [luminance(fg), luminance(bg)];
  return (Math.max(fgLum, bgLum) + 0.05) / (Math.min(fgLum, bgLum) + 0.05);
}

/** A computed color as `rgb(r, g, b)`, whatever syntax the browser used. */
function asRgb(value: string): string {
  const [r, g, b] = parseColor(value).map((channel) => Math.round(channel));
  return `rgb(${r}, ${g}, ${b})`;
}

async function renderFieldset(
  surfaceStyle: string,
  {
    validationSurface = 'always',
    surfaceTone = 'default',
    appearance = 'inherit',
  }: {
    validationSurface?: 'always' | 'never';
    surfaceTone?: SurfaceTone;
    appearance?: FieldAppearance;
  } = {},
) {
  const { container } = await render(
    `<div id="surface" style="${surfaceStyle}; padding: 1rem;"><ngx-test-tinted-fieldset validationSurface="${validationSurface}" surfaceTone="${surfaceTone}" appearance="${appearance}" /></div>`,
    { imports: [TintedFieldsetFixture] },
  );
  // Warnings show once the field is touched.
  await userEvent.click(
    container.querySelector<HTMLInputElement>('#username')!,
  );
  await userEvent.tab();
  await TestBed.inject(ApplicationRef).whenStable();
  // Let color transitions finish so computed colors are final.
  await expect
    .poll(
      () =>
        document
          .getAnimations()
          .filter((animation) => animation.playState === 'running').length,
    )
    .toBe(0);

  const surface = container.querySelector<HTMLElement>('#surface')!;
  const fieldset = surface.querySelector<HTMLElement>('fieldset')!;
  const texts = surfaceTexts(surface);
  const colors = Object.fromEntries(
    Object.entries(texts).map(([name, element]) => [
      name,
      getComputedStyle(element).color,
    ]),
  );
  const opacities = Object.fromEntries(
    Object.entries(texts).map(([name, element]) => [
      name,
      Number(getComputedStyle(element).opacity),
    ]),
  );
  return { surface, fieldset, texts, colors, opacities };
}

const LIGHT_PAGE = 'background-color: #ffffff';
const DARK_PAGE =
  'color-scheme: dark; background-color: #1f2937; color: #f9fafb';

describe('NgxFormFieldset — text on a tinted surface (#535)', () => {
  it('keeps every text on the light invalid tint at 4.5:1 or more', async () => {
    const { fieldset, colors, opacities } = await renderFieldset(LIGHT_PAGE);
    const tint = getComputedStyle(fieldset).backgroundColor;
    // The tint and the borders keep their colors: only text gets darker.
    expect(tint).toBe('rgb(251, 221, 221)');
    expect(getComputedStyle(fieldset).borderTopColor).toBe('rgb(219, 24, 24)');
    const nameBox = fieldset.querySelector<HTMLElement>(
      'ngx-form-field-wrapper[fieldName="name"] .ngx-signal-form-field-wrapper__content',
    )!;
    expect(getComputedStyle(nameBox).borderTopColor).toBe('rgb(219, 24, 24)');

    for (const [name, color] of Object.entries(colors)) {
      expect
        .soft(
          contrastOn(color, tint, opacities[name]),
          `${name} (${color} at opacity ${opacities[name]}) on ${tint}`,
        )
        .toBeGreaterThanOrEqual(4.5);
    }
  });

  it('keeps every text on the light danger surface tone at 4.5:1 or more', async () => {
    const { fieldset, colors, opacities } = await renderFieldset(LIGHT_PAGE, {
      validationSurface: 'never',
      surfaceTone: 'danger',
    });
    const tint = getComputedStyle(fieldset).backgroundColor;
    expect(tint).toBe('rgb(253, 235, 235)');

    for (const [name, color] of Object.entries(colors)) {
      expect
        .soft(
          contrastOn(color, tint, opacities[name]),
          `${name} (${color} at opacity ${opacities[name]}) on ${tint}`,
        )
        .toBeGreaterThanOrEqual(4.5);
    }
  });

  it('leaves text colors unchanged in an untinted fieldset', async () => {
    const { fieldset, colors, opacities } = await renderFieldset(LIGHT_PAGE, {
      validationSurface: 'never',
    });
    expect(getComputedStyle(fieldset).backgroundColor).toBe('rgba(0, 0, 0, 0)');

    expect(colors).toMatchObject({
      legend: 'rgb(219, 24, 24)',
      label: 'rgba(50, 65, 85, 0.75)',
      requiredMarker: 'rgb(219, 24, 24)',
      optionalMarker: 'rgba(50, 65, 85, 0.75)',
      invalidCheckboxLabel: 'rgb(219, 24, 24)',
      hint: 'rgba(50, 65, 85, 0.75)',
      fieldError: 'rgb(219, 24, 24)',
      fieldWarning: 'rgb(161, 98, 7)',
      groupError: 'rgb(219, 24, 24)',
    });
    expect(asRgb(colors['countWarning'])).toBe('rgb(161, 98, 7)');
    expect(asRgb(colors['countDanger'])).toBe('rgb(219, 24, 24)');
    expect(opacities['optionalMarker']).toBe(0.7);
  });

  it('leaves text colors unchanged on the dark invalid tint', async () => {
    const tinted = await renderFieldset(DARK_PAGE);
    expect(getComputedStyle(tinted.fieldset).backgroundColor).toBe(
      'rgba(127, 29, 29, 0.45)',
    );

    expect(tinted.colors).toMatchObject({
      legend: 'rgb(252, 165, 165)',
      label: 'rgba(249, 250, 251, 0.75)',
      requiredMarker: 'rgb(252, 165, 165)',
      optionalMarker: 'rgba(249, 250, 251, 0.75)',
      invalidCheckboxLabel: 'rgb(252, 165, 165)',
      hint: 'rgba(249, 250, 251, 0.75)',
      fieldError: 'rgb(252, 165, 165)',
      fieldWarning: 'rgb(252, 211, 77)',
      groupError: 'rgb(252, 165, 165)',
    });
    expect(asRgb(tinted.colors['countWarning'])).toBe('rgb(252, 211, 77)');
    expect(asRgb(tinted.colors['countDanger'])).toBe('rgb(252, 165, 165)');
    expect(tinted.opacities['optionalMarker']).toBe(0.7);
  });

  it('lets public color tokens on an ancestor win inside the tint', async () => {
    const override = 'rgb(120, 0, 80)';
    const { surface } = await renderFieldset(LIGHT_PAGE);
    for (const token of [
      '--ngx-signal-form-error-color',
      '--ngx-signal-form-warning-color',
      '--ngx-form-field-label-color',
      '--ngx-form-field-hint-color',
      '--ngx-form-field-required-marker-color',
      '--ngx-form-field-optional-marker-color',
      '--ngx-form-field-invalid-color',
      '--ngx-form-field-char-count-color-warning',
      '--ngx-signal-form-fieldset-invalid-legend-color',
    ]) {
      surface.style.setProperty(token, override);
    }
    await expect
      .poll(
        () =>
          document
            .getAnimations()
            .filter((animation) => animation.playState === 'running').length,
      )
      .toBe(0);

    const texts = surfaceTexts(surface);
    for (const name of [
      'legend',
      'label',
      'requiredMarker',
      'optionalMarker',
      'invalidCheckboxLabel',
      'hint',
      'countWarning',
      'fieldError',
      'fieldWarning',
      'groupError',
    ] as const) {
      expect
        .soft(asRgb(getComputedStyle(texts[name]).color), name)
        .toBe(override);
    }
  });

  it('lets an ancestor hint color win in a plain wrapper', async () => {
    const override = 'rgb(120, 0, 80)';
    const { surface } = await renderFieldset(LIGHT_PAGE, {
      appearance: 'plain',
    });
    surface.style.setProperty('--ngx-form-field-hint-color', override);

    await expect
      .poll(() => asRgb(getComputedStyle(surfaceTexts(surface).hint).color))
      .toBe(override);
  });
});

@Component({
  selector: 'ngx-test-warning-fieldset',
  imports: [FormField, NgxSignalFormToolkit, NgxFormField],
  template: `
    <form [formRoot]="testForm" ngxSignalForm errorStrategy="immediate">
      <fieldset
        ngxFormFieldset
        [field]="testForm.group"
        validationSurface="never"
        surfaceTone="danger"
        feedbackAppearance="plain"
      >
        <legend>Account</legend>
        <ngx-form-field-wrapper
          [formField]="testForm.group.username"
          fieldName="username"
        >
          <label for="username">Username</label>
          <input
            id="username"
            type="text"
            [formField]="testForm.group.username"
          />
        </ngx-form-field-wrapper>
      </fieldset>
    </form>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class WarningFieldsetFixture {
  readonly testForm = form(
    signal({ group: { username: 'ab' } }),
    schema((path) => {
      // A group-level warning and no errors: the fieldset shows its warning
      // state.
      validate(path.group, () => ({
        kind: 'warn:group',
        message: 'Check the account details',
      }));
    }),
  );
}

describe('NgxFormFieldset — warning legend on the danger surface tone (#535)', () => {
  async function renderWarningFieldset(surfaceStyle: string) {
    const { container } = await render(
      `<div id="surface" style="${surfaceStyle}; padding: 1rem;"><ngx-test-warning-fieldset /></div>`,
      { imports: [WarningFieldsetFixture] },
    );
    await userEvent.click(
      container.querySelector<HTMLInputElement>('#username')!,
    );
    await userEvent.tab();
    await TestBed.inject(ApplicationRef).whenStable();
    const surface = container.querySelector<HTMLElement>('#surface')!;
    const fieldset = surface.querySelector<HTMLElement>('fieldset')!;
    await expect
      .poll(() =>
        fieldset.classList.contains('ngx-signal-form-fieldset--warning'),
      )
      .toBe(true);
    await expect
      .poll(
        () =>
          document
            .getAnimations()
            .filter((animation) => animation.playState === 'running').length,
      )
      .toBe(0);
    const legend = fieldset.querySelector<HTMLElement>('legend')!;
    return { surface, fieldset, legend };
  }

  it('keeps the warning legend at 4.5:1 or more on the light tint', async () => {
    const { fieldset, legend } = await renderWarningFieldset(LIGHT_PAGE);
    const tint = getComputedStyle(fieldset).backgroundColor;
    expect(tint).toBe('rgb(253, 235, 235)');
    // The border keeps the base amber: only the text gets darker.
    expect(getComputedStyle(fieldset).borderTopColor).toBe('rgb(161, 98, 7)');

    const color = getComputedStyle(legend).color;
    expect(
      contrastOn(color, tint),
      `legend (${color}) on ${tint}`,
    ).toBeGreaterThanOrEqual(4.5);
  });

  it('keeps the warning legend unchanged on the dark tint', async () => {
    const { legend } = await renderWarningFieldset(DARK_PAGE);
    expect(getComputedStyle(legend).color).toBe('rgb(252, 211, 77)');
  });

  it('lets the public warning legend and border tokens color the legend', async () => {
    const { surface, legend } = await renderWarningFieldset(LIGHT_PAGE);

    surface.style.setProperty(
      '--ngx-signal-form-fieldset-warning-border-color',
      'rgb(120, 0, 80)',
    );
    await expect
      .poll(() => asRgb(getComputedStyle(legend).color))
      .toBe('rgb(120, 0, 80)');

    surface.style.setProperty(
      '--ngx-signal-form-fieldset-warning-legend-color',
      'rgb(0, 80, 120)',
    );
    await expect
      .poll(() => asRgb(getComputedStyle(legend).color))
      .toBe('rgb(0, 80, 120)');
  });
});
