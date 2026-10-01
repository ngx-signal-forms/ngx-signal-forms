import {
  Injector,
  inject,
  InjectionToken,
  runInInjectionContext,
} from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { assertInjector } from './assert-injector';

const TEST_TOKEN = new InjectionToken<string>('TEST_TOKEN');

describe('assertInjector', () => {
  function readToken(injector?: Injector) {
    return assertInjector(readToken, injector, () => inject(TEST_TOKEN));
  }

  it('runs work in the current injection context', () => {
    TestBed.configureTestingModule({
      providers: [{ provide: TEST_TOKEN, useValue: 'current' }],
    });

    expect(TestBed.runInInjectionContext(() => readToken())).toBe('current');
  });

  it('throws outside an injection context without an injector', () => {
    expect(() => readToken()).toThrow(
      /readToken\(\) can only be used within an injection context/i,
    );
  });

  it('runs work in a supplied injector outside an injection context', () => {
    const injector = Injector.create({
      providers: [{ provide: TEST_TOKEN, useValue: 'custom' }],
    });

    expect(readToken(injector)).toBe('custom');
  });

  it('preserves runner return values', () => {
    TestBed.runInInjectionContext(() => {
      expect(assertInjector(readToken, undefined, () => 'string')).toBe(
        'string',
      );
      expect(assertInjector(readToken, undefined, () => 42)).toBe(42);
      expect(
        assertInjector(readToken, undefined, () => ({ key: 'value' })),
      ).toEqual({ key: 'value' });
    });
  });

  it('runs the runner in the supplied context', () => {
    const injector = Injector.create({
      providers: [{ provide: TEST_TOKEN, useValue: 'custom' }],
    });

    expect(
      assertInjector(readToken, injector, () => {
        return runInInjectionContext(injector, () => inject(TEST_TOKEN));
      }),
    ).toBe('custom');
  });
});
