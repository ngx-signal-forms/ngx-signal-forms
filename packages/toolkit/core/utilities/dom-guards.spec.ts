import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  isHtmlButtonElement,
  isHtmlElement,
  isHtmlInputElement,
  isHtmlSelectElement,
  isHtmlTextAreaElement,
} from './dom-guards';

/**
 * The guards exist so a render pass without the DOM constructor globals — a
 * Node/SSR pass, a worker, a plain Node unit test — reads an element as an
 * element instead of throwing `ReferenceError: HTMLElement is not defined`.
 *
 * jsdom always defines the constructors, so "no DOM globals" is approximated
 * by stubbing each one to `undefined`. That is exactly the condition the
 * guards branch on (`typeof HTMLElement === 'function'`).
 */
describe('dom-guards', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  const stubConstructorsAway = (): void => {
    vi.stubGlobal('HTMLElement', undefined);
    vi.stubGlobal('HTMLInputElement', undefined);
    vi.stubGlobal('HTMLTextAreaElement', undefined);
    vi.stubGlobal('HTMLSelectElement', undefined);
    vi.stubGlobal('HTMLButtonElement', undefined);
  };

  describe('in a browser (constructors available)', () => {
    it('matches the `instanceof` checks it replaces', () => {
      const input = document.createElement('input');
      const textarea = document.createElement('textarea');
      const select = document.createElement('select');
      const button = document.createElement('button');
      const div = document.createElement('div');

      expect(isHtmlElement(div)).toBe(true);
      expect(isHtmlInputElement(input)).toBe(true);
      expect(isHtmlTextAreaElement(textarea)).toBe(true);
      expect(isHtmlSelectElement(select)).toBe(true);
      expect(isHtmlButtonElement(button)).toBe(true);

      expect(isHtmlInputElement(div)).toBe(false);
      expect(isHtmlTextAreaElement(input)).toBe(false);
      expect(isHtmlSelectElement(input)).toBe(false);
      expect(isHtmlButtonElement(input)).toBe(false);
    });

    it('rejects non-element values', () => {
      expect(isHtmlElement(null)).toBe(false);
      expect(isHtmlElement(undefined)).toBe(false);
      expect(isHtmlElement('input')).toBe(false);
      expect(isHtmlElement(document.createTextNode('text'))).toBe(false);
    });
  });

  describe('off the DOM (constructors missing)', () => {
    it('reads an element by shape instead of throwing', () => {
      const input = document.createElement('input');
      const div = document.createElement('div');

      stubConstructorsAway();

      expect(isHtmlElement(div)).toBe(true);
      expect(isHtmlInputElement(input)).toBe(true);
      expect(isHtmlTextAreaElement(input)).toBe(false);
      expect(isHtmlSelectElement(input)).toBe(false);
      expect(isHtmlButtonElement(input)).toBe(false);
    });

    it('still rejects non-element values', () => {
      const text = document.createTextNode('text');

      stubConstructorsAway();

      expect(isHtmlElement(null)).toBe(false);
      expect(isHtmlElement(text)).toBe(false);
      expect(isHtmlElement({ tagName: 'INPUT' })).toBe(false);
      expect(isHtmlElement({ nodeType: 1 })).toBe(false);
    });
  });
});
