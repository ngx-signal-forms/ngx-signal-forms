import { afterEach, describe, expect, it } from 'vitest';
import { isElementCssVisible } from './field-identity';

/**
 * The real semantics of {@link isElementCssVisible}, which need a layout
 * engine and a runtime that implements `Element.checkVisibility()`. jsdom has
 * neither, so its sibling spec can only pin the fail-open contract.
 *
 * The collapsed-`<details>` case is the one that matters most: it is the
 * headline scenario for the `aria-invalid` staleness fix, and it is precisely
 * where the old `offsetParent !== null` fallback gave the wrong answer — a
 * collapsed `<details>` still reports an `offsetParent`, so the fallback
 * called a hidden control visible.
 */
describe('isElementCssVisible — real layout semantics', () => {
  const created: HTMLElement[] = [];

  function mount(html: string, selector: string): HTMLElement {
    const holder = document.createElement('div');
    holder.innerHTML = html;
    document.body.append(holder);
    created.push(holder);
    const el = holder.querySelector<HTMLElement>(selector);
    if (!el) throw new Error(`no element matched ${selector}`);
    return el;
  }

  afterEach(() => {
    for (const el of created.splice(0)) {
      el.remove();
    }
  });

  it('reports a laid-out control visible', () => {
    expect(isElementCssVisible(mount('<input id="a" />', '#a'))).toBe(true);
  });

  it('reports display:none hidden', () => {
    expect(
      isElementCssVisible(mount('<input id="a" style="display:none" />', '#a')),
    ).toBe(false);
  });

  it('reports a [hidden] control hidden', () => {
    expect(isElementCssVisible(mount('<input id="a" hidden />', '#a'))).toBe(
      false,
    );
  });

  it('reports a control inside a collapsed <details> hidden', () => {
    expect(
      isElementCssVisible(
        mount(
          '<details><summary>More</summary><input id="a" /></details>',
          '#a',
        ),
      ),
    ).toBe(false);
  });

  it('reports a control inside an open <details> visible', () => {
    expect(
      isElementCssVisible(
        mount(
          '<details open><summary>More</summary><input id="a" /></details>',
          '#a',
        ),
      ),
    ).toBe(true);
  });

  it('reports visibility:hidden hidden', () => {
    expect(
      isElementCssVisible(
        mount('<input id="a" style="visibility:hidden" />', '#a'),
      ),
    ).toBe(false);
  });

  it('reports an opacity:0 control VISIBLE', () => {
    // The standard custom-checkbox / custom-radio pattern: a real input sits
    // transparently over a styled box. It is laid out, focusable, and being
    // operated by the user — stripping its `aria-invalid` would be an a11y
    // regression, so `opacityProperty` is deliberately not passed to
    // `checkVisibility()`.
    const el = mount(
      '<input id="a" type="checkbox" style="opacity:0" />',
      '#a',
    );

    expect(isElementCssVisible(el)).toBe(true);
    el.focus();
    expect(document.activeElement).toBe(el);
  });

  it('reports a position:fixed control visible', () => {
    expect(
      isElementCssVisible(
        mount('<input id="a" style="position:fixed;top:0;left:0" />', '#a'),
      ),
    ).toBe(true);
  });
});

/**
 * Evidence for ADR-0011 §5, kept separate from the contract tests above.
 *
 * These assert the behaviour of `offsetParent`, not of `isElementCssVisible`.
 * They exist so the claim "the old fallback was wrong in both directions" is
 * demonstrated rather than asserted in prose. A failure here means the
 * rationale changed, not that the visibility contract broke — read it as a
 * prompt to revisit the ADR, not as a regression in the helper.
 */
describe('why the offsetParent fallback was removed (rationale, not contract)', () => {
  const created: HTMLElement[] = [];

  function mount(html: string, selector: string): HTMLElement {
    const holder = document.createElement('div');
    holder.innerHTML = html;
    document.body.append(holder);
    created.push(holder);
    const el = holder.querySelector<HTMLElement>(selector);
    if (!el) throw new Error(`no element matched ${selector}`);
    return el;
  }

  afterEach(() => {
    for (const el of created.splice(0)) el.remove();
  });

  it('was a false positive: a collapsed <details> still reports an offsetParent', () => {
    const el = mount(
      '<details><summary>More</summary><input id="a" /></details>',
      '#a',
    );

    expect(el.offsetParent).not.toBeNull();
    expect(isElementCssVisible(el)).toBe(false);
  });

  it('was a false negative: a visible position:fixed control has no offsetParent', () => {
    const el = mount(
      '<input id="a" style="position:fixed;top:0;left:0" />',
      '#a',
    );

    expect(el.offsetParent).toBeNull();
    expect(isElementCssVisible(el)).toBe(true);
  });
});
