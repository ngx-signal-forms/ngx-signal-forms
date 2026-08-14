import { ApplicationRef, Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormField, form, required, schema } from '@angular/forms/signals';
import { render } from '@testing-library/angular';
import type axe from 'axe-core';
import { afterEach, describe, expect, expectTypeOf, it } from 'vitest';
import { NgxFormFieldError } from '@ngx-signal-forms/toolkit/assistive';
import {
  createA11yValidator,
  expectNoA11yViolations,
  WCAG_22_AA_TAGS,
} from './a11y';
import type { WCAG_22_AA_TAG } from './a11y';

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

// Shared mount/cleanup helper for every describe block below: creates a
// `<div>` fixture with the given inner HTML, appends it to `document.body`,
// and removes it after the test so specs stay isolated from one another.
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

describe('expectNoA11yViolations', () => {
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
  // `document.body` (via the shared `mount` helper, which appends into it).
  it('resolves without throwing when called with no arguments against an accessible document.body', async () => {
    mount(`
      <label for="ngx-a11y-default-context-name">Full name</label>
      <input id="ngx-a11y-default-context-name" type="text" />
    `);

    await expect(expectNoA11yViolations()).resolves.toBeUndefined();
  });

  it('throws when called with no arguments against a document.body with a violation', async () => {
    mount(`<img src="data:," />`);

    await expect(expectNoA11yViolations()).rejects.toThrow(
      /accessibility violation/u,
    );
  });
});

describe('expectNoA11yViolations WCAG 2.2 AA baseline', () => {
  it('an unrelated options key does not weaken the baseline', async () => {
    // `options` is typed `Omit<axe.RunOptions, 'runOnly'>`, so passing
    // `runOnly` as a literal here would not compile (see the `expectTypeOf`
    // spec below). This spec instead pins the behavioural guarantee for
    // ordinary options: passing an unrelated key (here, `resultTypes`) must
    // not weaken the WCAG 2.2 AA baseline. The fixture violates `image-alt`,
    // which `resultTypes` does not touch, so the scan must still fail.
    const fixture = mount(`<img src="data:," />`);

    await expect(
      expectNoA11yViolations(fixture, { resultTypes: ['violations'] }),
    ).rejects.toThrow(/image-alt/u);
  });

  it('a runOnly smuggled in through an axe.RunOptions-typed value is still overridden at runtime', async () => {
    // The `Omit<axe.RunOptions, 'runOnly'>` parameter type only rejects
    // fresh object literals carrying `runOnly` — TypeScript's excess-property
    // check is literal-only. A value already typed as the wider
    // `axe.RunOptions` (no cast needed — this is a legitimate, structurally
    // assignable value) can still carry a `runOnly` and pass the type
    // validator. `expectNoA11yViolations` guards against that at runtime by
    // applying its own `runOnly` after spreading `options`, so the WCAG
    // 2.2 AA baseline wins regardless. Prove it: point a laundered
    // `runOnly` at a tag ('best-practice') that does not include
    // `image-alt` (a wcag2a rule), and confirm the scan still catches the
    // violation.
    const laundered: axe.RunOptions = {
      runOnly: { type: 'tag', values: ['best-practice'] },
    };
    const fixture = mount(`<img src="data:," />`);

    await expect(expectNoA11yViolations(fixture, laundered)).rejects.toThrow(
      /image-alt/u,
    );
  });

  // Compile-time documentation of the `options` contract, independent of any
  // one call site: the second parameter must never widen back to accepting
  // `runOnly` directly, or a future refactor could silently reopen the
  // override this file's other specs guard against at runtime.
  it('excludes runOnly from the options parameter type', () => {
    expectTypeOf<
      Parameters<typeof expectNoA11yViolations>[1]
    >().not.toHaveProperty('runOnly');
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

/**
 * `createA11yValidator` conformance gate.
 *
 * `expectNoA11yViolations` above is the toolkit's own hard-coded WCAG 2.2 AA
 * baseline. `createA11yValidator` is the additive, consumer-facing
 * counterpart (issue #357): it returns a same-shaped validator scoped to a
 * caller-chosen `WCAG_22_AA_TAG` subset, for custom wrappers that don't want
 * — or can't yet satisfy — the full baseline at a given call site.
 *
 * These specs use two axe-core rules confirmed (via `axe.getRules()`, which
 * also confirms both are enabled by default — unlike `target-size`, which
 * axe-core ships `enabled: false` and never runs even when its tag is in
 * scope) to sit in disjoint tag sets, so scoping the validator demonstrably
 * changes the result rather than coincidentally passing:
 *
 * - `label` (missing accessible name on a form control) is tagged only
 *   `wcag2a`.
 * - `color-contrast` (insufficient text/background contrast) is tagged only
 *   `wcag2aa`.
 *
 * Fixtures render `NgxFormFieldError` — the post-rc.12 component
 * `NgxFormFieldNotification` was folded into (see
 * `docs/migrations/v1.0.0-rc.12.md`) — the same way the other standalone a11y
 * specs in `packages/toolkit/assistive` do, so this exercises real toolkit
 * markup rather than a synthetic fixture.
 */
describe('createA11yValidator', () => {
  @Component({
    selector: 'ngx-test-a11y-validator-labeled',
    imports: [FormField, NgxFormFieldError],
    template: `
      <form (submit)="$event.preventDefault()" novalidate>
        <label for="email">Email</label>
        <input id="email" [formField]="testForm.email" />
        <ngx-form-field-error
          [formField]="testForm.email"
          fieldName="email"
          strategy="immediate"
        />
      </form>
    `,
  })
  class LabeledFieldComponent {
    readonly #model = signal({ email: '' });
    readonly testForm = form(
      this.#model,
      schema((path) => {
        required(path.email, { message: 'Email is required' });
      }),
    );
  }

  @Component({
    selector: 'ngx-test-a11y-validator-unlabeled',
    imports: [FormField, NgxFormFieldError],
    template: `
      <form (submit)="$event.preventDefault()" novalidate>
        <!-- Deliberately no <label>: triggers axe's "label" rule, wcag2a-only. -->
        <input id="email" [formField]="testForm.email" />
        <ngx-form-field-error
          [formField]="testForm.email"
          fieldName="email"
          strategy="immediate"
        />
      </form>
    `,
  })
  class UnlabeledFieldComponent {
    readonly #model = signal({ email: '' });
    readonly testForm = form(
      this.#model,
      schema((path) => {
        required(path.email, { message: 'Email is required' });
      }),
    );
  }

  @Component({
    selector: 'ngx-test-a11y-validator-low-contrast',
    imports: [FormField, NgxFormFieldError],
    template: `
      <form (submit)="$event.preventDefault()" novalidate>
        <label for="email">Email</label>
        <input id="email" [formField]="testForm.email" />
        <ngx-form-field-error
          [formField]="testForm.email"
          fieldName="email"
          strategy="immediate"
        />
        <!--
          Fully labeled — no "label" (wcag2a) violation — but this text's
          light-grey-on-white contrast ratio is well under the WCAG AA 4.5:1
          minimum, tripping axe's "color-contrast" rule, tagged only
          wcag2aa. Unrelated to the form field above; it exists purely to
          give the fixture a violation outside a ['wcag2a']-scoped validator.
        -->
        <p style="color: #e5e5e5; background-color: #ffffff;">
          Supplementary note text
        </p>
      </form>
    `,
  })
  class LowContrastComponent {
    readonly #model = signal({ email: '' });
    readonly testForm = form(
      this.#model,
      schema((path) => {
        required(path.email, { message: 'Email is required' });
      }),
    );
  }

  it('positive control: a compliant fixture passes a scoped validator', async () => {
    const { container } = await render(LabeledFieldComponent);
    await TestBed.inject(ApplicationRef).whenStable();

    const checkLevelA = createA11yValidator({ tags: ['wcag2a'] });
    await expect(checkLevelA(container)).resolves.toBeUndefined();
  });

  it('negative control: a violation inside the scoped tags fails the scoped validator', async () => {
    const { container } = await render(UnlabeledFieldComponent);
    await TestBed.inject(ApplicationRef).whenStable();

    const checkLevelA = createA11yValidator({ tags: ['wcag2a'] });

    await expect(checkLevelA(container)).rejects.toThrow(/label/u);
  });

  it('negative control: a violation outside the scoped tags does not fail the scoped validator', async () => {
    const { container } = await render(LowContrastComponent);
    await TestBed.inject(ApplicationRef).whenStable();

    // Sanity check: the fixture genuinely has a violation under the full
    // WCAG 2.2 AA baseline (color-contrast, wcag2aa-only) — otherwise the
    // next assertion would pass for the wrong reason.
    await expect(expectNoA11yViolations(container)).rejects.toThrow(
      /color-contrast/u,
    );

    // The whole point of scoping: a validator built with `tags: ['wcag2a']`
    // never asks axe to run the wcag2aa-only `color-contrast` rule, so the
    // same fixture passes it even though it has a real, unrelated violation.
    const checkLevelA = createA11yValidator({ tags: ['wcag2a'] });
    await expect(checkLevelA(container)).resolves.toBeUndefined();
  });

  it('defaults to the full WCAG 2.2 AA baseline when no tags are given', async () => {
    const { container } = await render(LowContrastComponent);
    await TestBed.inject(ApplicationRef).whenStable();

    const checkDefault = createA11yValidator();

    await expect(checkDefault(container)).rejects.toThrow(/color-contrast/u);
  });

  it('accepts merged RunOptions the same way expectNoA11yViolations does', async () => {
    const { container } = await render(UnlabeledFieldComponent);
    await TestBed.inject(ApplicationRef).whenStable();

    const checkLevelA = createA11yValidator({ tags: ['wcag2a'] });

    await expect(
      checkLevelA(container, { rules: { label: { enabled: false } } }),
    ).resolves.toBeUndefined();
  });

  // Compile-time documentation: `tags` must stay constrained to
  // `WCAG_22_AA_TAG`, not widen to an arbitrary `string[]` — an invented or
  // typo'd tag should be a compile error, not a silently-empty scan.
  it('constrains tags to WCAG_22_AA_TAG, not arbitrary strings', () => {
    expectTypeOf(createA11yValidator)
      .parameter(0)
      .toMatchTypeOf<{ tags?: readonly WCAG_22_AA_TAG[] } | undefined>();
    // And the reverse: an arbitrary string is NOT assignable to `tags`, so
    // `createA11yValidator({ tags: ['not-a-real-tag'] })` is a compile error.
    expectTypeOf<{ tags?: readonly string[] }>().not.toMatchTypeOf<
      Parameters<typeof createA11yValidator>[0]
    >();
  });

  // Same non-overridable `runOnly` guarantee as expectNoA11yViolations,
  // carried through to every validator this factory returns.
  it('excludes runOnly from the returned validator options parameter type', () => {
    const validator = createA11yValidator({ tags: ['wcag2a'] });

    expectTypeOf<Parameters<typeof validator>[1]>().not.toHaveProperty(
      'runOnly',
    );
  });

  // `tags: []` type-checks (the type has no minimum length) but would
  // compile down to `runOnly: { type: 'tag', values: [] }` — axe-core runs
  // that as "no tagged rules", so every scan would resolve regardless of
  // real violations, silently disabling the gate. `createA11yValidator`
  // must refuse to hand back such a validator at all.
  it('throws synchronously at creation time when tags is an empty array', () => {
    expect(() => createA11yValidator({ tags: [] })).toThrow(
      /createA11yValidator: tags must not be empty/u,
    );
  });
});
