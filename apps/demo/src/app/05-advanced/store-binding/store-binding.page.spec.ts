import { Component, provideZonelessChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { render, screen } from '@testing-library/angular';
import { describe, expect, it } from 'vitest';

import { StoreBindingPage } from './store-binding.page';
import { RightRailComponent } from '../../ui/right-rail/right-rail';

/**
 * Drives the rendered appearance/orientation toggle buttons (aria-pressed,
 * labeled Standard/Outline/Plain and Vertical/Horizontal) instead of reaching
 * into `StoreBindingPage`'s protected `selectedAppearance`/`selectedOrientation`
 * signals. See `createOrientationSelection` (ui/orientation-toggle/orientation.constants.ts)
 * for the linkedSignal snap-on-appearance-change contract these tests pin.
 *
 * The toggle buttons live inside an `ng-template[ngxPageControls]` that
 * `StoreBindingPage` registers with the app-root-provided `PageControlsService`
 * — they only render once something projects that template, which in the
 * real app is the shell's `<ngx-right-rail>`. This host mounts both, exactly
 * as the app shell does, so the buttons actually appear in the DOM.
 *
 * Note: the "direct-write contract" documented on `createOrientationSelection`
 * (a `.set()` of an orientation `isOrientationDisabledForAppearance` rejects
 * is NOT auto-corrected) cannot be exercised through the DOM here — the
 * `ngx-orientation-toggle` disables exactly those options, so there is no
 * rendered control that can attempt the write. That half of the contract is
 * left untested at this layer; it's enforced by the toggle being disabled.
 */
@Component({
  template: `
    <ngx-store-binding-page />
    <ngx-right-rail />
  `,
  imports: [StoreBindingPage, RightRailComponent],
})
class StoreBindingPageWithRailHost {}

describe('StoreBindingPage orientation binding', () => {
  async function setup() {
    return render(StoreBindingPageWithRailHost, {
      providers: [provideZonelessChangeDetection(), provideRouter([])],
    });
  }

  function appearanceButton(name: string) {
    return screen.getByRole('button', { name });
  }

  function orientationButton(name: string) {
    return screen.getByRole('button', { name });
  }

  it('normalizes orientation to vertical the instant appearance becomes outline, in the same render pass', async () => {
    const { fixture } = await setup();

    // Page defaults to appearance 'outline'; move to a compatible appearance
    // first so the later click on 'Outline' is an actual source change (a
    // linkedSignal only recomputes when its source signal's value changes).
    appearanceButton('Standard').click();
    fixture.detectChanges();
    orientationButton('Horizontal').click();
    fixture.detectChanges();
    expect(orientationButton('Horizontal')).toHaveAttribute(
      'aria-pressed',
      'true',
    );

    // A single detectChanges() pass after the click is enough. The previous
    // signal+effect implementation only self-corrected once a LATER
    // scheduled effect flush ran, so a stale/reverted implementation would
    // still show 'horizontal' pressed right here. `createOrientationSelection`'s
    // linkedSignal recomputes synchronously on read, so this one render
    // already reflects the snap to 'vertical'.
    appearanceButton('Outline').click();
    fixture.detectChanges();

    expect(orientationButton('Vertical')).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    const horizontalButton = orientationButton('Horizontal');
    expect(horizontalButton).toHaveAttribute('aria-pressed', 'false');
    expect(horizontalButton).toBeDisabled();
  });

  it('leaves orientation untouched when appearance changes to a compatible value', async () => {
    const { fixture } = await setup();

    appearanceButton('Standard').click();
    fixture.detectChanges();
    orientationButton('Horizontal').click();
    fixture.detectChanges();

    appearanceButton('Plain').click();
    fixture.detectChanges();

    expect(orientationButton('Horizontal')).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });

  it('does not resurrect the pre-snap orientation when appearance changes back', async () => {
    const { fixture } = await setup();

    appearanceButton('Standard').click();
    fixture.detectChanges();
    orientationButton('Horizontal').click();
    fixture.detectChanges();

    appearanceButton('Outline').click();
    fixture.detectChanges();
    expect(orientationButton('Vertical')).toHaveAttribute(
      'aria-pressed',
      'true',
    );

    appearanceButton('Standard').click();
    fixture.detectChanges();

    expect(orientationButton('Vertical')).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });
});
