/**
 * Compile-and-behavior fixture for the worked example documented in
 * `docs/CUSTOM_WRAPPERS.md` → "Composing ARIA primitives".
 *
 * The directive below is a near-verbatim copy of the example in the docs.
 * Its purpose is twofold:
 *
 * 1. **Compile guarantee.** The docs example must compile against the
 *    `@ngx-signal-forms/toolkit` and `@ngx-signal-forms/toolkit/headless`
 *    public surfaces — never internal source paths. If the public surface
 *    drifts, this fixture fails to typecheck and the docs go red with the
 *    code.
 * 2. **Behavior smoke test.** A minimal end-to-end mounts the directive on a
 *    host template with an `<input [formField]>` and asserts the three
 *    managed ARIA attributes track the factories' outputs through
 *    `afterEveryRender` phasing.
 *
 * Intentional diffs from the docs:
 *   - The docs example exports the directive
 *     (`export class MyDesignSystemAriaDirective`) so consumers can import it
 *     from their own module. This fixture drops the `export` because
 *     `eslint-plugin-jest(no-export)` forbids exports from spec files. Drop
 *     in the `export` keyword if you transplant this into a non-test source
 *     file.
 *   - `signal` is imported at the top of the spec alongside the other
 *     `@angular/core` test imports rather than inside the verbatim-copy
 *     block, so the docs example block stays focused on the directive's own
 *     dependencies.
 *
 * Keep this file in lockstep with the worked example in
 * `docs/CUSTOM_WRAPPERS.md`. If you change one, change the other.
 */
import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { form, FormField, required } from '@angular/forms/signals';
import { render } from '@testing-library/angular';
import { describe, expect, it } from 'vitest';

// -----------------------------------------------------------------------------
// BEGIN: verbatim copy of the docs example
// -----------------------------------------------------------------------------

import {
  Directive,
  ElementRef,
  Injector,
  afterEveryRender,
  computed,
  inject,
} from '@angular/core';
import { FORM_FIELD, type FieldState } from '@angular/forms/signals';
import {
  NGX_SIGNAL_FORM_HINT_REGISTRY,
  createErrorVisibility,
  generateErrorId,
  generateWarningId,
  resolveFieldName,
} from '@ngx-signal-forms/toolkit';
import {
  createAriaDescribedBySignal,
  createAriaInvalidSignal,
  createAriaRequiredSignal,
  createHintIdsSignal,
  type HintIdsRegistryLike,
} from '@ngx-signal-forms/toolkit/headless';

interface MyAriaDomSnapshot {
  readonly fieldName: string | null;
  readonly describedBy: string | null;
}

const INITIAL_DOM_SNAPSHOT: MyAriaDomSnapshot = {
  fieldName: null,
  describedBy: null,
};

@Directive({
  selector: '[myDesignSystemAria][formField]',
})
class MyDesignSystemAriaDirective {
  readonly #element = inject<ElementRef<HTMLElement>>(ElementRef);
  readonly #injector = inject(Injector);
  readonly #formField = inject(FORM_FIELD);
  readonly #hintRegistry = inject<HintIdsRegistryLike | null>(
    NGX_SIGNAL_FORM_HINT_REGISTRY,
    { optional: true },
  );

  readonly #fieldState = computed<FieldState<unknown> | null>(() => {
    const field = this.#formField.field();
    const state =
      typeof field === 'function' ? field() : this.#formField.state();
    return state ?? null;
  });

  readonly #domSnapshot = signal(INITIAL_DOM_SNAPSHOT);

  readonly #visibility = createErrorVisibility(this.#fieldState);

  readonly #hintIds = createHintIdsSignal({
    registry: this.#hintRegistry,
    fieldName: () => this.#domSnapshot().fieldName,
  });

  readonly #ariaInvalid = createAriaInvalidSignal(
    this.#fieldState,
    this.#visibility,
  );

  readonly #ariaRequired = createAriaRequiredSignal(this.#fieldState);

  readonly #ariaDescribedBy = createAriaDescribedBySignal({
    fieldState: this.#fieldState,
    hintIds: this.#hintIds,
    visibility: this.#visibility,
    preservedIds: () => this.#domSnapshot().describedBy,
    fieldName: () => this.#domSnapshot().fieldName,
  });

  constructor() {
    afterEveryRender(
      {
        earlyRead: () => this.#readDomSnapshot(),
        write: (snapshot) => {
          if (
            snapshot.fieldName !== this.#domSnapshot().fieldName ||
            snapshot.describedBy !== this.#domSnapshot().describedBy
          ) {
            this.#domSnapshot.set(snapshot);
          }

          this.#writeAttribute('aria-invalid', this.#ariaInvalid());
          this.#writeAttribute('aria-required', this.#ariaRequired());
          this.#writeAttribute('aria-describedby', this.#ariaDescribedBy());
        },
      },
      { injector: this.#injector },
    );
  }

  #readDomSnapshot(): MyAriaDomSnapshot {
    const el = this.#element.nativeElement;
    const fieldName = resolveFieldName(el);
    const raw = el.getAttribute('aria-describedby');

    if (!raw || !fieldName) {
      return { fieldName, describedBy: raw };
    }

    const managed = new Set<string>([
      ...this.#hintIds(),
      generateErrorId(fieldName),
      generateWarningId(fieldName),
    ]);
    const preserved = raw
      .split(' ')
      .filter((part) => part && !managed.has(part))
      .join(' ');

    return {
      fieldName,
      describedBy: preserved.length > 0 ? preserved : null,
    };
  }

  #writeAttribute(name: string, value: string | null): void {
    if (value === null) {
      this.#element.nativeElement.removeAttribute(name);
    } else {
      this.#element.nativeElement.setAttribute(name, value);
    }
  }
}

// -----------------------------------------------------------------------------
// END: verbatim copy of the docs example
// -----------------------------------------------------------------------------

@Component({
  selector: 'ngx-docs-aria-host',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormField, MyDesignSystemAriaDirective],
  template: `
    <input id="email" myDesignSystemAria [formField]="userForm.email" />
  `,
})
class DocsAriaHostComponent {
  readonly model = signal({ email: '' });
  readonly userForm = form(this.model, (path) => {
    required(path.email);
  });
}

describe('docs/CUSTOM_WRAPPERS.md — Composing ARIA primitives example', () => {
  it('compiles against the public toolkit + headless surfaces', () => {
    // The act of importing this module without TypeScript errors is the
    // primary assertion. The runtime smoke test below adds a sanity check
    // that the wired factories also drive the DOM correctly under the
    // documented `afterEveryRender` phasing.
    expect(MyDesignSystemAriaDirective).toBeDefined();
  });

  it('writes the managed ARIA attributes through the documented afterEveryRender phasing', async () => {
    const { container, detectChanges } = await render(DocsAriaHostComponent);

    // Allow the first afterEveryRender pass to commit DOM writes.
    detectChanges();

    const input = container.querySelector('input#email') as HTMLInputElement;

    // `required(path.email)` flows through `createAriaRequiredSignal` and
    // lands on the host element via the directive's write phase.
    expect(input.getAttribute('aria-required')).toBe('true');

    // No interaction yet, so the default `'on-touch'` strategy keeps
    // visibility false → aria-invalid is `'false'` (control is reachable but
    // not announcing). The presence of the attribute confirms the directive
    // is in scope and the factory is wired; the value confirms the
    // visibility cascade is participating.
    expect(input.getAttribute('aria-invalid')).toBe('false');

    // Without hints, errors visible, or preserved IDs, the describedBy
    // factory accumulates nothing and the directive removes the attribute.
    expect(input.hasAttribute('aria-describedby')).toBe(false);
  });
});
