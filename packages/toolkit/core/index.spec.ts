import { FormRoot } from '@angular/forms/signals';
import { describe, expect, it } from 'vitest';
import { NgxSignalFormAutoAriaDirective } from './directives/auto-aria.directive';
import { NgxSignalFormControlSemanticsDirective } from './directives/control-semantics.directive';
import { NgxSignalFormDirective } from './directives/ngx-signal-form.directive';
import { NgxSignalFormToolkit } from './index';

/**
 * Stability contract for the `NgxSignalFormToolkit` bundle.
 *
 * The bundle is a public, ergonomic shortcut consumers add to a component's
 * `imports`. Adding/removing/reordering its members is a breaking change —
 * pin the contents here so a regression is caught at test time instead of
 * surfacing as a runtime "directive not declared" failure in consumer apps.
 */
describe('NgxSignalFormToolkit bundle', () => {
  it('contains the four toolkit-core directives in their documented order', () => {
    expect(NgxSignalFormToolkit).toEqual([
      FormRoot,
      NgxSignalFormDirective,
      NgxSignalFormAutoAriaDirective,
      NgxSignalFormControlSemanticsDirective,
    ]);
  });

  it('contains exactly four members (guards against accidental additions)', () => {
    expect(NgxSignalFormToolkit).toHaveLength(4);
  });

  it('exposes NgxSignalFormDirective, NgxSignalFormAutoAriaDirective, and NgxSignalFormControlSemanticsDirective', () => {
    // Negative-lookup form: confirm each expected directive is present
    // regardless of order. If any sibling agent removes one, this fails
    // independently of the order assertion above.
    expect(NgxSignalFormToolkit).toContain(NgxSignalFormDirective);
    expect(NgxSignalFormToolkit).toContain(NgxSignalFormAutoAriaDirective);
    expect(NgxSignalFormToolkit).toContain(
      NgxSignalFormControlSemanticsDirective,
    );
  });
});
