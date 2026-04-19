import { FormRoot } from '@angular/forms/signals';
import { describe, expect, it } from 'vitest';
import { NgxSignalFormAutoAria } from './directives/auto-aria';
import { NgxSignalFormControlSemanticsDirective } from './directives/control-semantics';
import { NgxSignalForm } from './directives/ngx-signal-form';
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
  it('contains exactly four members (guards against accidental additions)', () => {
    expect(NgxSignalFormToolkit).toHaveLength(4);
  });

  it('exposes FormRoot and the three toolkit-core directives (order-independent)', () => {
    // Order-independent presence check. Angular's `imports` array is
    // order-insensitive, so we don't pin order here — adding/removing a
    // member is a breaking change, but reordering for readability is not.
    expect(NgxSignalFormToolkit).toContain(FormRoot);
    expect(NgxSignalFormToolkit).toContain(NgxSignalForm);
    expect(NgxSignalFormToolkit).toContain(NgxSignalFormAutoAria);
    expect(NgxSignalFormToolkit).toContain(
      NgxSignalFormControlSemanticsDirective,
    );
  });
});
