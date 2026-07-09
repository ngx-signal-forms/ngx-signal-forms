import { afterEach, describe, expect, it } from 'vitest';
import { expectNoA11yViolations, WCAG_22_AA_TAGS } from './a11y';

/**
 * Self-test / negative control for `expectNoA11yViolations`.
 *
 * The helper is the toolkit's sole hard-fail WCAG gate (see
 * `form-field-wrapper.a11y.browser.spec.ts`), but it had no spec of its own —
 * a future refactor that mis-merged axe options, swallowed a rejection, or
 * inverted the violation check could silently stop catching real
 * accessibility bugs. This spec pins both directions: it must throw on a
 * fixture with a known violation, and must resolve cleanly on an accessible
 * one.
 *
 * Runs in browser mode (not jsdom) because axe-core's layout-dependent rules
 * (e.g. color-contrast) need real rendering — matching every other
 * `expectNoA11yViolations` call site in this package.
 */
describe('expectNoA11yViolations', () => {
  let host: HTMLElement | undefined;

  afterEach(() => {
    host?.remove();
    host = undefined;
  });

  const mount = (innerHtml: string): HTMLElement => {
    host = document.createElement('div');
    host.innerHTML = innerHtml;
    document.body.append(host);
    return host;
  };

  it('resolves without throwing for a fixture with no accessibility violations', async () => {
    const fixture = mount(`
      <label for="ngx-a11y-self-test-name">Full name</label>
      <input id="ngx-a11y-self-test-name" type="text" />
    `);

    await expect(expectNoA11yViolations(fixture)).resolves.toBeUndefined();
  });

  it('throws for a fixture with a known violation (negative control)', async () => {
    // An <img> with no `alt` attribute is a canonical, unambiguous axe
    // violation (image-alt, WCAG 1.1.1) — a stable negative control that
    // doesn't depend on any toolkit component.
    const fixture = mount(`<img src="data:," />`);

    await expect(expectNoA11yViolations(fixture)).rejects.toThrow(
      /accessibility violation/u,
    );
  });

  it('the thrown error report names the violated rule', async () => {
    const fixture = mount(`<img src="data:," />`);

    await expect(expectNoA11yViolations(fixture)).rejects.toThrow(/image-alt/u);
  });

  it('a form control with no accessible name is caught (label, WCAG 4.1.2 / 1.3.1)', async () => {
    const fixture = mount(`<input type="text" />`);

    await expect(expectNoA11yViolations(fixture)).rejects.toThrow(
      /accessibility violation/u,
    );
  });

  it('accepts extra RunOptions merged over the WCAG 2.2 AA defaults', async () => {
    // A fixture that would normally fail `label` can be waived per-call via
    // the `options` parameter. Give it a WCAG 2.2 target-size compliant box
    // so `label` remains the only intentional violation.
    const fixture = mount(
      `<input type="text" style="box-sizing: border-box; width: 24px; height: 24px" />`,
    );

    await expect(
      expectNoA11yViolations(fixture, { rules: { label: { enabled: false } } }),
    ).resolves.toBeUndefined();
  });

  it('scopes the scan to the supplied context, ignoring violations elsewhere in the document', async () => {
    // A second, intentionally-violating element sits outside `fixture` — it
    // must not affect the result for the scoped scan.
    const distractor = document.createElement('img');
    distractor.setAttribute('src', 'data:,');
    document.body.append(distractor);

    try {
      const fixture = mount(`
        <label for="ngx-a11y-self-test-scoped">Email</label>
        <input id="ngx-a11y-self-test-scoped" type="email" />
      `);

      await expect(expectNoA11yViolations(fixture)).resolves.toBeUndefined();
    } finally {
      distractor.remove();
    }
  });
});

describe('WCAG_22_AA_TAGS', () => {
  it('covers every Level A/AA axe tag needed for WCAG 2.2 AA (additive across versions)', () => {
    expect(WCAG_22_AA_TAGS).toEqual([
      'wcag2a',
      'wcag2aa',
      'wcag21a',
      'wcag21aa',
      'wcag22aa',
    ]);
  });
});
