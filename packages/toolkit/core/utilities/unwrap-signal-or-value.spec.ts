import { computed, signal } from '@angular/core';
import { describe, expect, it } from 'vitest';
import { unwrapValue } from './unwrap-signal-or-value';

describe('unwrapValue', () => {
  describe('Static Values', () => {
    it('should return string values directly', () => {
      const result = unwrapValue('on-touch');
      expect(result).toBe('on-touch');
    });

    it('should return number values directly', () => {
      const result = unwrapValue(42);
      expect(result).toBe(42);
    });

    it('should return boolean values directly', () => {
      expect(unwrapValue(true)).toBe(true);
      expect(unwrapValue(false)).toBe(false);
    });

    it('should return object values directly', () => {
      const obj = { name: 'test', value: 123 };
      const result = unwrapValue(obj);
      expect(result).toBe(obj);
      expect(result).toEqual({ name: 'test', value: 123 });
    });

    it('should return array values directly', () => {
      const arr = [1, 2, 3];
      const result = unwrapValue(arr);
      expect(result).toBe(arr);
      expect(result).toEqual([1, 2, 3]);
    });

    it('should return null directly', () => {
      const result = unwrapValue(null);
      expect(result).toBeNull();
    });

    it('should return undefined directly', () => {
      const result = unwrapValue(undefined);
      expect(result).toBeUndefined();
    });
  });

  describe('Signal Values', () => {
    it('should unwrap a signal with string value', () => {
      const sig = signal('on-touch');
      const result = unwrapValue(sig);
      expect(result).toBe('on-touch');
    });

    it('should unwrap a signal with number value', () => {
      const sig = signal(100);
      const result = unwrapValue(sig);
      expect(result).toBe(100);
    });

    it('should unwrap a signal with object value', () => {
      const obj = { id: 1, name: 'test' };
      const sig = signal(obj);
      const result = unwrapValue(sig);
      expect(result).toBe(obj);
    });

    it('should unwrap a signal with array value', () => {
      const arr = ['a', 'b', 'c'];
      const sig = signal(arr);
      const result = unwrapValue(sig);
      expect(result).toBe(arr);
    });

    it('should unwrap a signal with boolean value', () => {
      const sig = signal(true);
      expect(unwrapValue(sig)).toBe(true);

      sig.set(false);
      expect(unwrapValue(sig)).toBe(false);
    });

    it('should get updated value after signal mutation', () => {
      const sig = signal('initial');
      expect(unwrapValue(sig)).toBe('initial');

      sig.set('updated');
      expect(unwrapValue(sig)).toBe('updated');
    });
  });

  describe('Computed Values', () => {
    it('should unwrap a computed signal', () => {
      const base = signal(5);
      const comp = computed(() => base() * 2);
      const result = unwrapValue(comp);
      expect(result).toBe(10);
    });

    it('should get updated value after underlying signal changes', () => {
      const base = signal(10);
      const comp = computed(() => base() + 5);

      expect(unwrapValue(comp)).toBe(15);

      base.set(20);
      expect(unwrapValue(comp)).toBe(25);
    });

    it('should unwrap computed with complex transformations', () => {
      const items = signal([1, 2, 3, 4, 5]);
      const sum = computed(() => items().reduce((acc, val) => acc + val, 0));
      expect(unwrapValue(sum)).toBe(15);
    });
  });

  describe('Function Values', () => {
    it('should call and return value from a function', () => {
      const fn = () => 'function-result';
      const result = unwrapValue(fn);
      expect(result).toBe('function-result');
    });

    it('should call function returning number', () => {
      const fn = () => 42;
      const result = unwrapValue(fn);
      expect(result).toBe(42);
    });

    it('should call function returning object', () => {
      const obj = { type: 'test' };
      const fn = () => obj;
      const result = unwrapValue(fn);
      expect(result).toBe(obj);
    });

    it('should call function with captured state', () => {
      let counter = 0;
      const fn = () => {
        counter++;
        return counter;
      };

      expect(unwrapValue(fn)).toBe(1);
      expect(unwrapValue(fn)).toBe(2);
      expect(unwrapValue(fn)).toBe(3);
    });

    it('should call function returning null', () => {
      const fn = () => null;
      const result = unwrapValue(fn);
      expect(result).toBeNull();
    });

    it('should call function returning undefined', () => {
      const fn = () => undefined;
      const result = unwrapValue(fn);
      expect(result).toBeUndefined();
    });
  });

  describe('Type Safety', () => {
    it('should preserve string type', () => {
      const staticResult: string = unwrapValue('test');
      const signalResult: string = unwrapValue(signal('test'));
      const fnResult: string = unwrapValue(() => 'test');

      expect(staticResult).toBe('test');
      expect(signalResult).toBe('test');
      expect(fnResult).toBe('test');
    });

    it('should preserve number type', () => {
      const staticResult: number = unwrapValue(123);
      const signalResult: number = unwrapValue(signal(123));
      const fnResult: number = unwrapValue(() => 123);

      expect(staticResult).toBe(123);
      expect(signalResult).toBe(123);
      expect(fnResult).toBe(123);
    });

    it('should preserve complex object type', () => {
      interface User {
        id: number;
        name: string;
      }

      const user: User = { id: 1, name: 'John' };

      const staticResult: User = unwrapValue(user);
      const signalResult: User = unwrapValue(signal(user));
      const fnResult: User = unwrapValue(() => user);

      expect(staticResult).toEqual(user);
      expect(signalResult).toEqual(user);
      expect(fnResult).toEqual(user);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty string', () => {
      expect(unwrapValue('')).toBe('');
      expect(unwrapValue(signal(''))).toBe('');
      expect(unwrapValue(() => '')).toBe('');
    });

    it('should handle zero', () => {
      expect(unwrapValue(0)).toBe(0);
      expect(unwrapValue(signal(0))).toBe(0);
      expect(unwrapValue(() => 0)).toBe(0);
    });

    it('should handle NaN', () => {
      expect(unwrapValue(NaN)).toBeNaN();
      expect(unwrapValue(signal(NaN))).toBeNaN();
      expect(unwrapValue(() => NaN)).toBeNaN();
    });

    it('should handle empty object', () => {
      const empty = {};
      expect(unwrapValue(empty)).toEqual({});
      expect(unwrapValue(signal({}))).toEqual({});
      expect(unwrapValue(() => ({}))).toEqual({});
    });

    it('should handle empty array', () => {
      expect(unwrapValue([])).toEqual([]);
      expect(unwrapValue(signal([]))).toEqual([]);
      expect(unwrapValue(() => [])).toEqual([]);
    });

    it('should handle nested signals (signal returning signal value)', () => {
      const inner = signal('inner-value');
      const outer = signal(inner());
      expect(unwrapValue(outer)).toBe('inner-value');
    });
  });

  describe('Real-World Use Cases', () => {
    it('should work with ErrorDisplayStrategy values', () => {
      type ErrorDisplayStrategy =
        | 'immediate'
        | 'on-touch'
        | 'on-submit'
        | 'manual';

      const staticStrategy: ErrorDisplayStrategy = 'on-touch';
      const signalStrategy = signal<ErrorDisplayStrategy>('immediate');
      const fnStrategy = (): ErrorDisplayStrategy => 'on-submit';

      expect(unwrapValue(staticStrategy)).toBe('on-touch');
      expect(unwrapValue(signalStrategy)).toBe('immediate');
      expect(unwrapValue(fnStrategy)).toBe('on-submit');
    });

    it('should work with boolean flags', () => {
      const staticFlag = true;
      const signalFlag = signal(false);
      const fnFlag = () => true;

      expect(unwrapValue(staticFlag)).toBe(true);
      expect(unwrapValue(signalFlag)).toBe(false);
      expect(unwrapValue(fnFlag)).toBe(true);
    });

    it('should work with configuration objects', () => {
      interface Config {
        autoAria: boolean;
        debug: boolean;
      }

      const config: Config = { autoAria: true, debug: false };

      expect(unwrapValue(config)).toEqual({ autoAria: true, debug: false });
      expect(unwrapValue(signal(config))).toEqual({
        autoAria: true,
        debug: false,
      });
      expect(unwrapValue(() => config)).toEqual({
        autoAria: true,
        debug: false,
      });
    });
  });
});
