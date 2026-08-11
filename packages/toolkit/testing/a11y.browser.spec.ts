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

describe('expectNoA11yViolations default context', () => {
  // The `context` parameter documents (a11y.ts) that a bare, zero-argument
  // call scans the whole `document.body`. Every other spec in the workspace
  // passes a fixture or container explicitly, so that default path had no
  // coverage of its own — pin both directions directly against
  // `document.body`, cleaning up whatever each test appends to it.
  let appended: HTMLElement | undefined;

  afterEach(() => {
    appended?.remove();
    appended = undefined;
  });

  it('resolves without throwing when called with no arguments against an accessible document.body', async () => {
    appended = document.createElement('div');
    appended.innerHTML = `
      <label for="ngx-a11y-default-context-name">Full name</label>
      <input id="ngx-a11y-default-context-name" type="text" />
    `;
    document.body.append(appended);

    await expect(expectNoA11yViolations()).resolves.toBeUndefined();
  });

  it('throws when called with no arguments against a document.body with a violation', async () => {
    appended = document.createElement('img');
    appended.setAttribute('src', 'data:,');
    document.body.append(appended);

    await expect(expectNoA11yViolations()).rejects.toThrow(
      /accessibility violation/u,
    );
  });
});

describe('expectNoA11yViolations WCAG 2.2 AA baseline', () => {
  let host: HTMLElement | undefined;

  afterEach(() => {
    host?.remove();
    host = undefined;
  });

  it('is not overridable via the options argument (runOnly is not a valid key)', async () => {
    // `options` used to spread AFTER the WCAG 2.2 AA `runOnly` tag set, so a
    // caller who (mis)guessed `runOnly` was accepted could silently narrow or
    // replace the baseline. `expectNoA11yViolations`'s `options` parameter is
    // now typed `Omit<axe.RunOptions, 'runOnly'>`, so that key does not
    // type-check — this spec instead pins the behavioural guarantee: passing
    // an unrelated `options` key (here, `resultTypes`) must not weaken the
    // baseline. The fixture violates `image-alt`, which `options` does not
    // touch, so the scan must still fail.
    host = document.createElement('div');
    host.innerHTML = `<img src="data:," />`;
    document.body.append(host);

    await expect(
      expectNoA11yViolations(host, { resultTypes: ['violations'] }),
    ).rejects.toThrow(/image-alt/u);
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
