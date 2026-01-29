import { signal } from '@angular/core';
import { ngxStatusClasses } from './status-classes';

describe('ngxStatusClasses', () => {
  // Mock form field state where properties are SIGNALS
  const createMockField = (
    state: Partial<{
      touched: boolean;
      dirty: boolean;
      valid: boolean;
      invalid: boolean;
    }> = {},
  ) => {
    // Create signals for each property
    const touchedSig = signal(state.touched ?? false);
    const dirtySig = signal(state.dirty ?? false);
    const validSig = signal(state.valid ?? true);
    const invalidSig = signal(state.invalid ?? false);

    // Derived signals
    const pristineSig = signal(!(state.dirty ?? false));

    // Mock the state object returned by formField.state()
    // It must have properties that are signals
    const stateObject = {
      touched: touchedSig,
      dirty: dirtySig,
      valid: validSig,
      invalid: invalidSig,
      pristine: pristineSig,
    };

    return {
      // formField.state() returns the stateObject
      state: signal(stateObject),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any;
  };

  describe('strategy: "on-touch" (default)', () => {
    const classes = ngxStatusClasses({ strategy: 'on-touch' });

    it('should apply ng-touched when touched is true', () => {
      const field = createMockField({ touched: true });
      expect(classes?.['ng-touched']?.(field)).toBe(true);
    });

    it('should apply ng-untouched when touched is false', () => {
      const field = createMockField({ touched: false });
      expect(classes?.['ng-untouched']?.(field)).toBe(true);
    });

    it('should apply ng-dirty when dirty is true', () => {
      const field = createMockField({ dirty: true });
      expect(classes?.['ng-dirty']?.(field)).toBe(true);
    });

    it('should apply ng-pristine when dirty is false', () => {
      const field = createMockField({ dirty: false });
      expect(classes?.['ng-pristine']?.(field)).toBe(true);
    });

    it('should NOT apply ng-invalid when invalid but untouched', () => {
      const field = createMockField({ invalid: true, touched: false });
      expect(classes?.['ng-invalid']?.(field)).toBe(false);
    });

    it('should apply ng-invalid when invalid AND touched', () => {
      const field = createMockField({ invalid: true, touched: true });
      expect(classes?.['ng-invalid']?.(field)).toBe(true);
    });

    it('should NOT apply ng-valid when valid but untouched', () => {
      const field = createMockField({ valid: true, touched: false });
      expect(classes?.['ng-valid']?.(field)).toBe(false);
    });

    it('should apply ng-valid when valid AND touched', () => {
      const field = createMockField({ valid: true, touched: true });
      expect(classes?.['ng-valid']?.(field)).toBe(true);
    });
  });

  describe('strategy: "immediate"', () => {
    const classes = ngxStatusClasses({ strategy: 'immediate' });

    it('should apply ng-invalid immediately even if untouched', () => {
      const field = createMockField({ invalid: true, touched: false });
      expect(classes?.['ng-invalid']?.(field)).toBe(true);
    });

    it('should apply ng-valid immediately even if untouched', () => {
      const field = createMockField({ valid: true, touched: false });
      expect(classes?.['ng-valid']?.(field)).toBe(true);
    });
  });

  describe('custom class names', () => {
    const classes = ngxStatusClasses({
      strategy: 'immediate',
      validClass: 'is-valid',
      invalidClass: 'is-invalid',
      touchedClass: 'is-touched',
      untouchedClass: 'is-untouched',
      dirtyClass: 'is-dirty',
      pristineClass: 'is-pristine',
    });

    it('should use custom class names', () => {
      expect(classes?.['is-touched']).toBeDefined();
      expect(classes?.['is-untouched']).toBeDefined();
      expect(classes?.['is-dirty']).toBeDefined();
      expect(classes?.['is-pristine']).toBeDefined();
      expect(classes?.['is-valid']).toBeDefined();
      expect(classes?.['is-invalid']).toBeDefined();

      expect(classes?.['ng-touched']).toBeUndefined();
    });
  });
});
