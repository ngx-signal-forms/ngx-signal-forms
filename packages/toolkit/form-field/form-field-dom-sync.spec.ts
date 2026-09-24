import { signal } from '@angular/core';
import type { ResolvedNgxSignalFormControlSemantics } from '@ngx-signal-forms/toolkit';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { FormFieldWrapperDomSnapshot } from './form-field-dom-snapshot';
import {
  applyWrapperDomSnapshot,
  type WrapperDomIdentity,
  type WrapperDomState,
} from './form-field-dom-sync';

/*
 * These specs call the write phase directly, with plain signals and
 * detached elements. No TestBed and no render: the function takes a
 * snapshot and must not query the DOM or need an injection context.
 */

const NO_SEMANTICS: ResolvedNgxSignalFormControlSemantics = {
  kind: null,
  layout: null,
  ariaMode: null,
};
const TEXT: ResolvedNgxSignalFormControlSemantics = {
  kind: 'input-like',
  layout: 'stacked',
  ariaMode: 'auto',
};
const RADIO_GROUP: ResolvedNgxSignalFormControlSemantics = {
  kind: 'radio-group',
  layout: 'group',
  ariaMode: 'auto',
};

function createState(
  overrides: { explicitName?: string; fieldRequired?: boolean } = {},
) {
  const inputId = signal<string | null>(null);
  const state: WrapperDomState = {
    boundControl: signal<HTMLElement | null>(null),
    inputId,
    required: signal(false),
    selectionCluster: signal(false),
    selectionClusterLabelId: signal<string | null>(null),
    semantics: signal(NO_SEMANTICS),
    // Mirrors the wrapper's cascade: explicit name first, then the control id.
    resolvedFieldName: () => overrides.explicitName ?? inputId(),
    fieldRequired: () => overrides.fieldRequired ?? false,
    warnedUnresolvedKind: { current: false },
    warnedUnresolvedFieldName: { current: false },
  };
  return state;
}

function createIdentity() {
  return {
    setFieldName: vi.fn(),
    setControlElement: vi.fn(),
    setControlVisible: vi.fn(),
    setHintIds: vi.fn(),
  } satisfies WrapperDomIdentity;
}

function input(id = 'email'): HTMLInputElement {
  const el = document.createElement('input');
  el.id = id;
  return el;
}

function snapshot(
  overrides: Partial<FormFieldWrapperDomSnapshot> = {},
): FormFieldWrapperDomSnapshot {
  const inputEl = overrides.inputEl === undefined ? input() : overrides.inputEl;
  return {
    inputEl,
    inputId: inputEl?.id || null,
    semantics: TEXT,
    selectionControlCount: 0,
    label: null,
    mainSlot: null,
    controlVisible: true,
    ...overrides,
  };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('applyWrapperDomSnapshot — field name and identity', () => {
  it('derives the field name from the control id and publishes it', () => {
    // Tier 2 of the name cascade only exists after render, so this is the
    // one place the id-derived name reaches auto-aria.
    const state = createState();
    const identity = createIdentity();
    const el = input('email');

    applyWrapperDomSnapshot(snapshot({ inputEl: el }), state, identity, []);

    expect(state.inputId()).toBe('email');
    expect(identity.setFieldName).toHaveBeenCalledWith('email');
    expect(identity.setControlElement).toHaveBeenCalledWith(el);
    expect(el.getAttribute('data-signal-field')).toBe('email');
  });

  it('publishes the name before the element, for the missing-id diagnostic', () => {
    const identity = createIdentity();
    const calls: string[] = [];
    identity.setFieldName.mockImplementation(() => {
      calls.push('name');
    });
    identity.setControlElement.mockImplementation(() => {
      calls.push('element');
    });

    applyWrapperDomSnapshot(snapshot(), createState(), identity, []);

    expect(calls).toEqual(['name', 'element']);
  });

  it('publishes only the hints that belong to this field', () => {
    // A nested wrapper's hint must not end up in this control's
    // aria-describedby (WCAG 1.3.1).
    const identity = createIdentity();

    applyWrapperDomSnapshot(snapshot(), createState(), identity, [
      { id: 'email-hint', fieldName: 'email' },
      { id: 'shared-hint', fieldName: null },
      { id: 'nested-hint', fieldName: 'nested' },
    ]);

    expect(identity.setHintIds).toHaveBeenCalledWith([
      'email-hint',
      'shared-hint',
    ]);
  });

  it('passes the early-read visibility through without probing layout', () => {
    const identity = createIdentity();

    applyWrapperDomSnapshot(
      snapshot({ controlVisible: false }),
      createState(),
      identity,
      [],
    );

    expect(identity.setControlVisible).toHaveBeenCalledWith(false);
  });
});

describe('applyWrapperDomSnapshot — data-signal-field', () => {
  it('moves the attribute off a control that was swapped out', () => {
    const state = createState();
    const identity = createIdentity();
    const first = input('a');
    const second = input('b');

    applyWrapperDomSnapshot(snapshot({ inputEl: first }), state, identity, []);
    applyWrapperDomSnapshot(snapshot({ inputEl: second }), state, identity, []);

    expect(first.hasAttribute('data-signal-field')).toBe(false);
    expect(second.getAttribute('data-signal-field')).toBe('b');
    expect(state.boundControl()).toBe(second);
  });

  it('never writes the string "null" when no name resolves', () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const el = document.createElement('input');
    el.setAttribute('data-signal-field', 'stale');

    applyWrapperDomSnapshot(
      snapshot({ inputEl: el, inputId: null }),
      createState(),
      createIdentity(),
      [],
    );

    expect(el.hasAttribute('data-signal-field')).toBe(false);
  });

  it('skips the write when the attribute already holds the name', () => {
    // An equal `setAttribute` still wakes a MutationObserver.
    const el = input('email');
    el.setAttribute('data-signal-field', 'email');
    const setAttribute = vi.spyOn(el, 'setAttribute');

    applyWrapperDomSnapshot(
      snapshot({ inputEl: el }),
      createState(),
      createIdentity(),
      [],
    );

    expect(setAttribute).not.toHaveBeenCalled();
  });
});

describe('applyWrapperDomSnapshot — required marker', () => {
  it.each([
    [
      'the required attribute',
      (el: HTMLElement) => {
        el.setAttribute('required', '');
      },
    ],
    [
      'aria-required="true"',
      (el: HTMLElement) => {
        el.setAttribute('aria-required', 'true');
      },
    ],
  ])('marks the field required from %s', (_label, mark) => {
    const state = createState();
    const el = input();
    mark(el);

    applyWrapperDomSnapshot(
      snapshot({ inputEl: el }),
      state,
      createIdentity(),
      [],
    );

    expect(state.required()).toBe(true);
  });

  it("falls back to the field state's required()", () => {
    const state = createState({ fieldRequired: true });

    applyWrapperDomSnapshot(snapshot(), state, createIdentity(), []);

    expect(state.required()).toBe(true);
  });

  it('is never required without a bound control', () => {
    // No marker may flash before the control is known.
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const state = createState({ fieldRequired: true });

    applyWrapperDomSnapshot(
      snapshot({ inputEl: null, semantics: NO_SEMANTICS }),
      state,
      createIdentity(),
      [],
    );

    expect(state.required()).toBe(false);
  });
});

describe('applyWrapperDomSnapshot — selection clusters', () => {
  it('treats a single checkbox as a plain control, not a group', () => {
    const state = createState();

    applyWrapperDomSnapshot(
      snapshot({
        semantics: {
          kind: 'checkbox',
          layout: 'inline-control',
          ariaMode: 'auto',
        },
        selectionControlCount: 1,
      }),
      state,
      createIdentity(),
      [],
    );

    expect(state.selectionCluster()).toBe(false);
  });

  it('gives an unlabelled radio-group legend a generated id', () => {
    // The host's aria-labelledby points at this id, so the group gets an
    // accessible name (WCAG 4.1.2).
    const state = createState({ explicitName: 'delivery' });
    const label = document.createElement('span');

    applyWrapperDomSnapshot(
      snapshot({ semantics: RADIO_GROUP, selectionControlCount: 2, label }),
      state,
      createIdentity(),
      [],
    );

    expect(state.selectionCluster()).toBe(true);
    expect(label.id).toBe('delivery-label');
    expect(state.selectionClusterLabelId()).toBe('delivery-label');
  });

  it('sanitizes a field name with inner whitespace into one id token', () => {
    // aria-labelledby is a token list; a space would split the reference.
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const state = createState({ explicitName: 'delivery method' });
    const label = document.createElement('span');

    applyWrapperDomSnapshot(
      snapshot({ semantics: RADIO_GROUP, label }),
      state,
      createIdentity(),
      [],
    );

    expect(label.id).toBe('delivery-method-label');
    expect(state.selectionClusterLabelId()).toBe('delivery-method-label');
  });

  it("keeps an author's own label id", () => {
    const state = createState({ explicitName: 'delivery' });
    const label = document.createElement('span');
    label.id = 'custom-legend';

    applyWrapperDomSnapshot(
      snapshot({ semantics: RADIO_GROUP, label }),
      state,
      createIdentity(),
      [],
    );

    expect(label.id).toBe('custom-legend');
    expect(state.selectionClusterLabelId()).toBe('custom-legend');
  });

  it('skips the label id when no field name resolves', () => {
    // Two unnamed clusters would otherwise share one fallback id.
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const state = createState();
    const label = document.createElement('span');

    applyWrapperDomSnapshot(
      snapshot({
        inputEl: document.createElement('input'),
        inputId: null,
        semantics: RADIO_GROUP,
        label,
      }),
      state,
      createIdentity(),
      [],
    );

    expect(label.id).toBe('');
    expect(state.selectionClusterLabelId()).toBeNull();
  });
});

describe('applyWrapperDomSnapshot — semantics and diagnostics', () => {
  it('keeps the semantics signal stable when the values do not change', () => {
    // A fresh but equal object every render must not re-run every computed
    // that reads the control kind.
    const state = createState();
    applyWrapperDomSnapshot(snapshot(), state, createIdentity(), []);
    const first = state.semantics();

    applyWrapperDomSnapshot(
      snapshot({ semantics: { ...TEXT } }),
      state,
      createIdentity(),
      [],
    );

    expect(state.semantics()).toBe(first);
  });

  it('warns once when a bound control has no resolvable kind', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const state = createState();

    applyWrapperDomSnapshot(
      snapshot({ semantics: NO_SEMANTICS }),
      state,
      createIdentity(),
      [],
    );
    applyWrapperDomSnapshot(
      snapshot({ semantics: NO_SEMANTICS }),
      state,
      createIdentity(),
      [],
    );

    expect(warn).toHaveBeenCalledTimes(1);
  });

  it('reports an unresolved field name once, as an error', () => {
    const error = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);
    const state = createState();
    const nameless = () =>
      snapshot({ inputEl: document.createElement('input'), inputId: null });

    applyWrapperDomSnapshot(nameless(), state, createIdentity(), []);
    applyWrapperDomSnapshot(nameless(), state, createIdentity(), []);

    expect(error).toHaveBeenCalledTimes(1);
    expect(String(error.mock.calls[0]?.[0])).toContain(
      'Could not resolve a deterministic field name',
    );
  });
});
