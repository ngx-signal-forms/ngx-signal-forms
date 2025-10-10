import {
  Injector,
  inject,
  runInInjectionContext,
  InjectionToken,
} from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, it, expect } from 'vitest';
import { assertInjector } from './assert-injector';

// Test tokens
const TEST_TOKEN = new InjectionToken<{ test: string }>('TEST_TOKEN');
const CUSTOM_TOKEN = new InjectionToken<{ custom: string }>('CUSTOM_TOKEN');
const OUTSIDE_TOKEN = new InjectionToken<{ outside: string }>('OUTSIDE_TOKEN');
const TEST_CONFIG = new InjectionToken<{
  default?: boolean;
  custom?: string;
  test?: string;
}>('TEST_CONFIG');
const TEST_DEP = new InjectionToken<string>('TEST_DEP');

/**
 * Tests based on ngxtension's assertInjector test suite
 * @see https://github.com/ngxtension/ngxtension-platform
 */
describe('assertInjector (ngxtension patterns)', () => {
  const token = new InjectionToken('token', {
    factory: () => 1,
  });

  function injectDummy(injector?: Injector) {
    const resolvedInjector = assertInjector(
      injectDummy as (...args: unknown[]) => unknown,
      injector,
    );
    return runInInjectionContext(resolvedInjector, () => inject(token));
  }

  function injectDummyTwo(injector?: Injector) {
    return assertInjector(
      injectDummyTwo as (...args: unknown[]) => unknown,
      injector,
      () => inject(token) + 1,
    );
  }

  it('given no custom injector, when run in injection context, then return value', () => {
    TestBed.runInInjectionContext(() => {
      const value = injectDummy();
      const valueTwo = injectDummyTwo();
      expect(value).toEqual(1);
      expect(valueTwo).toEqual(2);
    });
  });

  it('given no custom injector, when run outside injection context, then throw', () => {
    expect(() => injectDummy()).toThrow(
      /injectDummy\(\) can only be used within an injection context/i,
    );
    expect(() => injectDummyTwo()).toThrow(
      /injectDummyTwo\(\) can only be used within an injection context/i,
    );
  });

  it('given a custom injector, when run in that injector context without providing number, then throw', () => {
    expect(() => injectDummy(Injector.create({ providers: [] }))).toThrow(
      /No provider.*InjectionToken/i,
    );
    expect(() => injectDummyTwo(Injector.create({ providers: [] }))).toThrow(
      /No provider.*InjectionToken/i,
    );
  });

  it('given a custom injector, when run in that injector context and providing number, then return value', () => {
    const value = injectDummy(
      Injector.create({ providers: [{ provide: token, useValue: 2 }] }),
    );
    const valueTwo = injectDummyTwo(
      Injector.create({ providers: [{ provide: token, useValue: 2 }] }),
    );
    expect(value).toEqual(2);
    expect(valueTwo).toEqual(3);
  });
});

describe('assertInjector', () => {
  describe('when used inside injection context', () => {
    it('should return the current injector when no runner provided', () => {
      TestBed.runInInjectionContext(() => {
        const result = assertInjector(testFunction, undefined);
        // Angular's runtime injector may not be a direct instance of Injector, but must have .get()
        expect(typeof result.get).toBe('function');
        expect(result).toBe(inject(Injector));
      });
    });

    it('should execute runner with current injector', () => {
      TestBed.runInInjectionContext(() => {
        const result = assertInjector(testFunction, undefined, () => {
          return inject(Injector);
        });
        // Angular's runtime injector may not be a direct instance of Injector, but must have .get()
        expect(typeof result.get).toBe('function');
      });
    });

    it('should allow runner to use inject() for dependencies', () => {
      const testValue = { test: 'value' };
      TestBed.configureTestingModule({
        providers: [{ provide: TEST_TOKEN, useValue: testValue }],
      });

      const result = TestBed.runInInjectionContext(() => {
        return assertInjector(testFunction, undefined, () => {
          return inject(TEST_TOKEN);
        });
      });

      expect(result).toBe(testValue);
    });
  });

  describe('when used with custom injector', () => {
    it('should return the provided injector when no runner provided', () => {
      const customInjector = Injector.create({
        providers: [],
      });

      const result = assertInjector(testFunction, customInjector);

      expect(result).toBe(customInjector);
    });

    it('should execute runner with provided injector', () => {
      const testValue = { custom: 'injector' };
      const customInjector = Injector.create({
        providers: [{ provide: CUSTOM_TOKEN, useValue: testValue }],
      });

      const result = assertInjector(testFunction, customInjector, () => {
        return inject(CUSTOM_TOKEN);
      });

      expect(result).toBe(testValue);
    });

    it('should work outside injection context with custom injector', () => {
      const customInjector = Injector.create({
        providers: [],
      });

      // This call is NOT in injection context
      const result = assertInjector(testFunction, customInjector);

      expect(result).toBe(customInjector);
    });

    it('should allow runner to inject from custom injector outside injection context', () => {
      const testValue = { outside: 'context' };
      const customInjector = Injector.create({
        providers: [{ provide: OUTSIDE_TOKEN, useValue: testValue }],
      });

      // This call is NOT in injection context
      const result = assertInjector(testFunction, customInjector, () => {
        return inject(OUTSIDE_TOKEN);
      });

      expect(result).toBe(testValue);
    });
  });

  describe('when used incorrectly', () => {
    it('should throw error when called outside injection context without injector', () => {
      // This call is NOT in injection context and has no custom injector
      expect(() => {
        assertInjector(testFunction, undefined);
      }).toThrow();
    });

    it('should throw error when runner is provided outside injection context without injector', () => {
      // This call is NOT in injection context and has no custom injector
      expect(() => {
        assertInjector(testFunction, undefined, () => 'test');
      }).toThrow();
    });
  });

  describe('return type inference', () => {
    it('should correctly infer return type from runner function', () => {
      TestBed.runInInjectionContext(() => {
        const stringResult = assertInjector(
          testFunction,
          undefined,
          () => 'string',
        );
        const numberResult = assertInjector(testFunction, undefined, () => 42);
        const objectResult = assertInjector(testFunction, undefined, () => ({
          key: 'value',
        }));

        // Verify runtime values
        expect(stringResult).toBe('string');
        expect(numberResult).toBe(42);
        expect(objectResult).toEqual({ key: 'value' });
      });
    });
  });

  describe('real-world usage patterns', () => {
    it('should support the Custom Inject Function (CIF) pattern', () => {
      // Simulating a CIF like injectFormConfig
      function injectTestConfig(injector?: Injector) {
        return assertInjector(
          injectTestConfig as () => unknown,
          injector,
          () => {
            return inject(TEST_CONFIG, { optional: true }) ?? { default: true };
          },
        );
      }

      const config = { custom: 'config' };
      TestBed.configureTestingModule({
        providers: [{ provide: TEST_CONFIG, useValue: config }],
      });

      const result = TestBed.runInInjectionContext(() => {
        return injectTestConfig();
      });

      expect(result).toBe(config);
    });

    it('should support manual injector passing for testing', () => {
      // Simulating a CIF with manual injector
      function injectTestConfig(injector?: Injector) {
        return assertInjector(
          injectTestConfig as () => unknown,
          injector,
          () => {
            return inject(TEST_CONFIG, { optional: true }) ?? { default: true };
          },
        );
      }

      const config = { test: 'config' };
      const customInjector = Injector.create({
        providers: [{ provide: TEST_CONFIG, useValue: config }],
      });

      // Can be called outside injection context with custom injector
      const result = injectTestConfig(customInjector);

      expect(result).toBe(config);
    });

    it('should support returning injector for manual runInInjectionContext', () => {
      // Simulating alternative CIF pattern
      function injectTestDependency(injector?: Injector) {
        const resolvedInjector = assertInjector(
          injectTestDependency as () => unknown,
          injector,
        );
        return runInInjectionContext(resolvedInjector, () => {
          return inject(TEST_DEP, { optional: true }) ?? 'default';
        });
      }

      const dep = 'custom-dependency';
      TestBed.configureTestingModule({
        providers: [{ provide: TEST_DEP, useValue: dep }],
      });

      const result = TestBed.runInInjectionContext(() => {
        return injectTestDependency();
      });

      expect(result).toBe(dep);
    });
  });
});

// Helper function for testing
function testFunction() {
  return 'test';
}
