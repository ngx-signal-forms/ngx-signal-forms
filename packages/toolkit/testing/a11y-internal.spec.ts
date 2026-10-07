import { afterEach, describe, expect, it } from 'vitest';
import { findAlertContaining } from './a11y-internal';

/**
 * `findAlertContaining` narrows several mounted live regions (some empty, per
 * the WCAG 4.1.3 first-insertion pattern) to the one that carries a message.
 * The specs pin the selection policy that the toolkit's browser specs rely on.
 * It needs no layout, so it runs in jsdom.
 */
let mounted: HTMLElement[] = [];

afterEach(() => {
  for (const el of mounted) {
    el.remove();
  }
  mounted = [];
});

const mount = (innerHtml: string): HTMLElement => {
  const host = document.createElement('div');
  host.innerHTML = innerHtml;
  document.body.append(host);
  mounted.push(host);
  return host;
};

describe('findAlertContaining', () => {
  it('returns the first alert whose text contains the substring', () => {
    const host = mount(`
      <div role="alert"></div>
      <div role="alert" id="first">Email is required</div>
      <div role="alert" id="second">Email is required again</div>
    `);

    expect(findAlertContaining(host, 'is required')?.id).toBe('first');
  });

  it('returns undefined when no alert contains the text', () => {
    const host = mount(`
      <div role="alert"></div>
      <div role="alert">Email is required</div>
      <p>Password is required</p>
    `);

    expect(findAlertContaining(host, 'Password is required')).toBeUndefined();
  });
});
