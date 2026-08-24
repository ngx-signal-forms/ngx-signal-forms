import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import type { WritableSignal } from '@angular/core';
import { provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it } from 'vitest';
import type {
  FormFieldAppearance,
  FormFieldOrientation,
} from '@ngx-signal-forms/toolkit';

import { StoreBindingPage } from './store-binding.page';

/**
 * `selectedAppearance`/`selectedOrientation` are `protected` — tests reach
 * them through this narrow internal view instead of casting to `any`.
 */
type StoreBindingPageInternals = {
  selectedAppearance: WritableSignal<FormFieldAppearance>;
  selectedOrientation: WritableSignal<FormFieldOrientation>;
};

function internalsOf(component: StoreBindingPage): StoreBindingPageInternals {
  return component as unknown as StoreBindingPageInternals;
}

describe('StoreBindingPage orientation binding', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection(), provideRouter([])],
    });
  });

  it('normalizes orientation to vertical the instant appearance becomes outline, with no explicit flush', () => {
    const fixture = TestBed.createComponent(StoreBindingPage);
    fixture.detectChanges();
    const { selectedAppearance, selectedOrientation } = internalsOf(
      fixture.componentInstance,
    );

    // Page defaults to appearance 'outline'; move to a compatible appearance
    // first so the later `.set('outline')` is an actual source change (a
    // linkedSignal only recomputes when its source signal's value changes).
    selectedAppearance.set('standard');
    selectedOrientation.set('horizontal');
    expect(selectedOrientation()).toBe('horizontal');

    selectedAppearance.set('outline');

    // Deliberately no `fixture.detectChanges()` / `TestBed.tick()` here. The
    // previous signal+effect implementation only self-corrects once a
    // scheduled effect flush runs; `createOrientationSelection`'s
    // `linkedSignal` recomputes synchronously on read, so this must already
    // report 'vertical'.
    expect(selectedOrientation()).toBe('vertical');
  });

  it('leaves orientation untouched when appearance changes to a compatible value', () => {
    const fixture = TestBed.createComponent(StoreBindingPage);
    fixture.detectChanges();
    const { selectedAppearance, selectedOrientation } = internalsOf(
      fixture.componentInstance,
    );

    selectedAppearance.set('standard');
    selectedOrientation.set('horizontal');
    selectedAppearance.set('plain');

    expect(selectedOrientation()).toBe('horizontal');
  });

  it('does not resurrect the pre-snap orientation when appearance changes back', () => {
    const fixture = TestBed.createComponent(StoreBindingPage);
    fixture.detectChanges();
    const { selectedAppearance, selectedOrientation } = internalsOf(
      fixture.componentInstance,
    );

    selectedAppearance.set('standard');
    selectedOrientation.set('horizontal');
    selectedAppearance.set('outline');
    expect(selectedOrientation()).toBe('vertical');

    selectedAppearance.set('standard');
    expect(selectedOrientation()).toBe('vertical');
  });
});
