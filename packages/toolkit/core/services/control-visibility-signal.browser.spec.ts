import {
  Component,
  ElementRef,
  inject,
  Injector,
  input,
  viewChild,
} from '@angular/core';
import { render } from '@testing-library/angular';
import { describe, expect, it } from 'vitest';
import { createControlVisibilitySignal } from './control-visibility-signal';

/**
 * `createControlVisibilitySignal` is the shared form of the layout probe that
 * a wrapper composing the pure ARIA factories must own. It answers
 * `createAriaInvalidSignal`'s third parameter, so the attribute leaves a
 * control the moment that control loses its layout box.
 *
 * Browser-only by necessity: jsdom implements neither `checkVisibility()` nor
 * a real layout, so the collapse assertions below would all pass vacuously
 * there. `field-identity.spec.ts` pins the complementary jsdom case: the
 * value the signal reports before any render hook has run at all.
 */

@Component({
  selector: 'ngx-test-visibility-probe',
  template: `
    <details [open]="open()">
      <summary>Contact details</summary>
      <input #control id="probe-input" />
    </details>
  `,
})
class VisibilityProbeHost {
  readonly open = input.required<boolean>();
  readonly control = viewChild<ElementRef<HTMLInputElement>>('control');
  readonly isControlVisible = createControlVisibilitySignal(
    () => this.control()?.nativeElement ?? null,
    inject(Injector),
  );
}

@Component({
  selector: 'ngx-test-unresolvable-probe',
  template: `<input id="probe-input" />`,
})
class UnresolvableProbeHost {
  readonly isControlVisible = createControlVisibilitySignal(
    () => null,
    inject(Injector),
  );
}

describe('createControlVisibilitySignal', () => {
  it('reports a laid-out control visible', async () => {
    const { fixture } = await render(VisibilityProbeHost, {
      inputs: { open: true },
    });

    expect(fixture.componentInstance.isControlVisible()).toBe(true);
  });

  it('flips to false when an ancestor loses its layout box', async () => {
    const { fixture } = await render(VisibilityProbeHost, {
      inputs: { open: true },
    });
    expect(fixture.componentInstance.isControlVisible()).toBe(true);

    fixture.componentRef.setInput('open', false);
    await fixture.whenStable();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(fixture.componentInstance.isControlVisible()).toBe(false);
  });

  it('flips back to true when the ancestor regains its layout box', async () => {
    const { fixture } = await render(VisibilityProbeHost, {
      inputs: { open: false },
    });
    expect(fixture.componentInstance.isControlVisible()).toBe(false);

    fixture.componentRef.setInput('open', true);
    await fixture.whenStable();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(fixture.componentInstance.isControlVisible()).toBe(true);
  });

  // Fails open, deliberately. An element that has not been through layout
  // reports `false`, so guessing "hidden" from an unresolved element would
  // flicker `aria-invalid` off and back on during the first render.
  it('stays true while the element resolves to null', async () => {
    const { fixture } = await render(UnresolvableProbeHost);

    expect(fixture.componentInstance.isControlVisible()).toBe(true);

    fixture.detectChanges();
    await fixture.whenStable();

    expect(fixture.componentInstance.isControlVisible()).toBe(true);
  });
});
