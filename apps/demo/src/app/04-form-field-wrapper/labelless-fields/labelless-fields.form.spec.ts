import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideNgxSignalFormsConfig } from '@ngx-signal-forms/toolkit';
import { render } from '@testing-library/angular';
import { describe, expect, it } from 'vitest';
import { LabellessFieldsFormComponent } from './labelless-fields.form';

/**
 * Regression coverage: the "narrow inputs" section used to reach into the
 * toolkit's internal `.ngx-signal-form-field-wrapper__content` class via
 * `::ng-deep` to shrink the bordered field chrome. That internal class is
 * not a public styling hook (see `packages/toolkit/form-field/form-field-wrapper.css`'s
 * "PUBLIC API" layer, which does not expose one for width/sizing), so the
 * app now narrows the field from its own layer instead: it targets the
 * `ngx-form-field-wrapper` host element directly (no `::ng-deep` needed,
 * since selecting a component's own host tag from a consumer stylesheet is
 * not blocked by view encapsulation) and narrows the inputs themselves.
 *
 * Residual: shrinking the whole wrapper (not just the internal bordered
 * content box) also narrows the assistive/error-message area beneath the
 * input, so long error text now wraps into a narrower column instead of
 * staying on a single full-width line as it did with the `::ng-deep` hack.
 */
describe('LabellessFieldsFormComponent — narrow inputs (no ::ng-deep)', () => {
  it('does not reach into the toolkit wrapper internals via ::ng-deep', () => {
    const source = readFileSync(
      join(__dirname, 'labelless-fields.form.ts'),
      'utf8',
    );

    expect(source).not.toMatch(/::ng-deep/u);
    expect(source).not.toMatch(/ngx-signal-form-field-wrapper__content/u);
  });

  it('still narrows the age and zip inputs via app-owned classes', () => {
    const source = readFileSync(
      join(__dirname, 'labelless-fields.form.ts'),
      'utf8',
    );

    expect(source).toMatch(/\.narrow-age\s+ngx-form-field-wrapper/u);
    expect(source).toMatch(/\.narrow-zip\s+ngx-form-field-wrapper/u);
    expect(source).toMatch(/\.narrow-age input\[id='age'\]/u);
    expect(source).toMatch(/\.narrow-zip input\[id='zipCode'\]/u);
  });

  it('renders the age and zip fields inside their narrow-* containers', async () => {
    await render(LabellessFieldsFormComponent, {
      providers: [
        provideZonelessChangeDetection(),
        provideNgxSignalFormsConfig({
          defaultErrorStrategy: 'on-touch',
          autoAria: true,
        }),
      ],
    });

    const ageInput = document.querySelector('#age');
    const zipInput = document.querySelector('#zipCode');

    expect(ageInput?.closest('.narrow-age')).toBeTruthy();
    expect(zipInput?.closest('.narrow-zip')).toBeTruthy();
  });
});
