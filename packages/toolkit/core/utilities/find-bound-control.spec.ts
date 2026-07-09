import { describe, expect, it } from 'vitest';
import { BOUND_CONTROL_SELECTOR, findBoundControl } from './find-bound-control';

describe('findBoundControl', () => {
  const makeHost = (innerHtml: string): HTMLElement => {
    const host = document.createElement('div');
    host.innerHTML = innerHtml;
    return host;
  };

  it('finds a native input with an id', () => {
    const host = makeHost('<input id="email" type="email" />');
    const control = findBoundControl(host);
    expect(control).toBeInstanceOf(HTMLInputElement);
    expect(control?.id).toBe('email');
  });

  it('finds a native textarea with an id', () => {
    const host = makeHost('<textarea id="bio"></textarea>');
    const control = findBoundControl(host);
    expect(control?.tagName.toLowerCase()).toBe('textarea');
  });

  it('finds a native select with an id', () => {
    const host = makeHost('<select id="country"></select>');
    const control = findBoundControl(host);
    expect(control?.tagName.toLowerCase()).toBe('select');
  });

  it('finds a button[type="button"] with an id', () => {
    const host = makeHost('<button type="button" id="toggle"></button>');
    const control = findBoundControl(host);
    expect(control?.tagName.toLowerCase()).toBe('button');
  });

  it('ignores a submit/reset button even with an id (only type="button" matches)', () => {
    const host = makeHost('<button type="submit" id="submit-btn"></button>');
    expect(findBoundControl(host)).toBeNull();
  });

  it('finds a custom element carrying [id][formField]', () => {
    const host = makeHost(
      '<ngx-custom-control id="custom" formfield="true"></ngx-custom-control>',
    );
    // jsdom lowercases attribute names but the selector targets the
    // `formField` attribute case-insensitively via the DOM's attribute
    // matching, which is itself case-insensitive for HTML.
    const control = findBoundControl(host);
    expect(control?.id).toBe('custom');
  });

  it('finds an element carrying [id][data-ngx-signal-form-control] (the stable semantics attribute)', () => {
    const host = makeHost(
      '<div id="wrapped-control" data-ngx-signal-form-control="text"></div>',
    );
    const control = findBoundControl(host);
    expect(control?.id).toBe('wrapped-control');
  });

  it('returns null when nothing in the subtree matches', () => {
    const host = makeHost('<span>no control here</span>');
    expect(findBoundControl(host)).toBeNull();
  });

  it('returns null for an id-less input (id is required by the selector)', () => {
    const host = makeHost('<input type="text" />');
    expect(findBoundControl(host)).toBeNull();
  });

  it('returns the first match in document order, not necessarily the "real" control', () => {
    // Documents the caveat called out in the source: this is one
    // querySelector call, not a tiered resolution order. A `[prefix]`
    // decorative button with an id that happens to satisfy the selector can
    // win over the real control found later in the subtree.
    const host = makeHost(
      '<button type="button" id="decorative-prefix"></button>' +
        '<input id="real-control" type="text" />',
    );
    const control = findBoundControl(host);
    expect(control?.id).toBe('decorative-prefix');
  });

  it('BOUND_CONTROL_SELECTOR is the exact selector string used internally', () => {
    // Pins the public selector constant so consumers building their own
    // DOM queries (e.g. NgxFieldIdentity) can rely on it staying in sync
    // with findBoundControl's actual matching behavior.
    const host = makeHost('<input id="email" type="email" />');
    expect(host.querySelector(BOUND_CONTROL_SELECTOR)).toBe(
      findBoundControl(host),
    );
  });
});
