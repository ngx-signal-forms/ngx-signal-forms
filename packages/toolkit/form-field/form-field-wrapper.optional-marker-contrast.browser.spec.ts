import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormField, form } from '@angular/forms/signals';
import { render } from '@testing-library/angular';
import { describe, expect, it } from 'vitest';
import { NgxFormField } from './index';

/**
 * The optional marker ("(optional)" after a label) paints at 70% opacity.
 * On the default light surface it used to take the 75% slate label color as
 * its base, which gave 2.80:1 on white. WCAG 1.4.3 asks for 4.5:1. The
 * measurement includes the element's own `opacity`, because that is what
 * fades the text on screen.
 */

@Component({
  selector: 'ngx-test-optional-marker',
  imports: [FormField, NgxFormField],
  template: `
    <ngx-form-field-wrapper
      [formField]="testForm.nickname"
      fieldName="nickname"
      showMarkerWhen="optional"
    >
      <label for="nickname">Nickname</label>
      <input id="nickname" type="text" [formField]="testForm.nickname" />
    </ngx-form-field-wrapper>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class OptionalMarkerFixture {
  readonly testForm = form(signal({ nickname: '' }));
}

type Rgba = readonly [number, number, number, number];

function parseColor(value: string): Rgba {
  const rgb = /^rgba?\(([\d.]+), ([\d.]+), ([\d.]+)(?:, ([\d.]+))?\)$/u.exec(
    value,
  );
  if (!rgb) {
    throw new Error(`Cannot parse color "${value}".`);
  }
  return [
    Number(rgb[1]),
    Number(rgb[2]),
    Number(rgb[3]),
    rgb[4] === undefined ? 1 : Number(rgb[4]),
  ];
}

function luminance([r, g, b]: Rgba): number {
  const channel = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

/** WCAG contrast of a translucent text color at `opacity` on an opaque surface. */
function contrastOn(text: string, surface: string, opacity: number): number {
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

async function renderMarker(surfaceStyle: string) {
  const { container } = await render(
    `<div id="surface" style="${surfaceStyle}; padding: 1rem;"><ngx-test-optional-marker /></div>`,
    { imports: [OptionalMarkerFixture] },
  );
  const surface = container.querySelector<HTMLElement>('#surface')!;
  const marker = surface.querySelector<HTMLElement>(
    '.ngx-signal-form-field-wrapper__optional-marker',
  );
  if (!marker) {
    throw new Error('Expected the optional marker to render.');
  }
  await expect
    .poll(
      () =>
        document
          .getAnimations()
          .filter((animation) => animation.playState === 'running').length,
    )
    .toBe(0);
  return { surface, marker };
}

const LIGHT_PAGE = 'background-color: #ffffff';
const DARK_PAGE =
  'color-scheme: dark; background-color: #1f2937; color: #f9fafb';

describe('NgxFormFieldWrapper — optional marker contrast', () => {
  for (const [scheme, page] of [
    ['light', LIGHT_PAGE],
    ['dark', DARK_PAGE],
  ] as const) {
    it(`reaches 4.5:1 on the default ${scheme} surface`, async () => {
      const { surface, marker } = await renderMarker(page);
      const background = getComputedStyle(surface).backgroundColor;
      const { color, opacity } = getComputedStyle(marker);

      expect(
        contrastOn(color, background, Number(opacity)),
        `${color} at opacity ${opacity} on ${background}`,
      ).toBeGreaterThanOrEqual(4.5);
    });
  }

  it('keeps the documented 0.7 opacity default', async () => {
    const { marker } = await renderMarker(LIGHT_PAGE);
    expect(getComputedStyle(marker).opacity).toBe('0.7');
  });

  it('lets the public color and opacity tokens on an ancestor win', async () => {
    const { surface, marker } = await renderMarker(LIGHT_PAGE);
    surface.style.setProperty(
      '--ngx-form-field-optional-marker-color',
      'rgb(120, 0, 80)',
    );
    surface.style.setProperty('--ngx-form-field-optional-marker-opacity', '1');

    await expect
      .poll(() => getComputedStyle(marker).color)
      .toBe('rgb(120, 0, 80)');
    expect(getComputedStyle(marker).opacity).toBe('1');
  });
});
