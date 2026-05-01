import { signal, type Signal } from '@angular/core';
import { describe, expect, it } from 'vitest';
import type { NgxSignalFormHintDescriptor } from '../../tokens';
import type { NgxFieldIdentity } from '../../services/field-identity';
import { createHintIdsSignal } from './create-hint-ids-signal';

// ---------------------------------------------------------------------------
// Stubs
// ---------------------------------------------------------------------------

/**
 * Build a stub identity service exposing only the `hintIds` reactive surface
 * the factory consumes. Cast through `NgxFieldIdentity` so the call site
 * matches the production signature without spinning up a TestBed.
 */
function createStubIdentity(
  hintIds: Signal<readonly string[]>,
): NgxFieldIdentity {
  return { hintIds } as unknown as NgxFieldIdentity;
}

function createStubRegistry(
  hints: Signal<readonly NgxSignalFormHintDescriptor[]>,
) {
  return { hints };
}

// ---------------------------------------------------------------------------
// Identity service path
// ---------------------------------------------------------------------------

describe('createHintIdsSignal – identity-service path', () => {
  it("returns the identity service's pre-filtered hint IDs verbatim", () => {
    const identityHintIds = signal<readonly string[]>(['email-hint']);
    const identity = createStubIdentity(identityHintIds);

    const result = createHintIdsSignal({ identity });

    expect(result()).toEqual(['email-hint']);
  });

  it('reacts to the identity service updating its hint IDs', () => {
    const identityHintIds = signal<readonly string[]>([]);
    const identity = createStubIdentity(identityHintIds);

    const result = createHintIdsSignal({ identity });
    expect(result()).toEqual([]);

    identityHintIds.set(['hint-a', 'hint-b']);
    expect(result()).toEqual(['hint-a', 'hint-b']);
  });

  it('ignores a registry when both identity and registry are provided', () => {
    const identityHintIds = signal<readonly string[]>(['from-identity']);
    const registryHints = signal<readonly NgxSignalFormHintDescriptor[]>([
      { id: 'from-registry', fieldName: null },
    ]);

    const result = createHintIdsSignal({
      identity: createStubIdentity(identityHintIds),
      registry: createStubRegistry(registryHints),
      fieldName: () => 'email',
    });

    expect(result()).toEqual(['from-identity']);
  });
});

// ---------------------------------------------------------------------------
// Registry fallback path (no field-name filter)
// ---------------------------------------------------------------------------

describe('createHintIdsSignal – registry fallback path', () => {
  it('returns IDs of hints whose fieldName is null when no fieldName reader is supplied', () => {
    const hints = signal<readonly NgxSignalFormHintDescriptor[]>([
      { id: 'global-hint', fieldName: null },
      { id: 'scoped-hint', fieldName: 'email' },
    ]);

    const result = createHintIdsSignal({
      registry: createStubRegistry(hints),
    });

    expect(result()).toEqual(['global-hint']);
  });

  it('reacts to registry hints changing', () => {
    const hints = signal<readonly NgxSignalFormHintDescriptor[]>([]);

    const result = createHintIdsSignal({
      registry: createStubRegistry(hints),
    });
    expect(result()).toEqual([]);

    hints.set([
      { id: 'first', fieldName: null },
      { id: 'second', fieldName: null },
    ]);
    expect(result()).toEqual(['first', 'second']);
  });
});

// ---------------------------------------------------------------------------
// Registry + fieldName filter path
// ---------------------------------------------------------------------------

describe('createHintIdsSignal – registry-with-fieldName-filter path', () => {
  it('keeps unscoped hints and hints whose fieldName matches the current field', () => {
    const hints = signal<readonly NgxSignalFormHintDescriptor[]>([
      { id: 'global', fieldName: null },
      { id: 'email-only', fieldName: 'email' },
      { id: 'username-only', fieldName: 'username' },
    ]);

    const result = createHintIdsSignal({
      registry: createStubRegistry(hints),
      fieldName: () => 'email',
    });

    expect(result()).toEqual(['global', 'email-only']);
  });

  it('reacts to the field name reader changing', () => {
    const hints = signal<readonly NgxSignalFormHintDescriptor[]>([
      { id: 'email-hint', fieldName: 'email' },
      { id: 'username-hint', fieldName: 'username' },
    ]);
    const fieldName = signal<string | null>('email');

    const result = createHintIdsSignal({
      registry: createStubRegistry(hints),
      fieldName: () => fieldName(),
    });

    expect(result()).toEqual(['email-hint']);

    fieldName.set('username');
    expect(result()).toEqual(['username-hint']);

    fieldName.set(null);
    expect(result()).toEqual([]);
  });

  it('preserves the registry order when filtering', () => {
    const hints = signal<readonly NgxSignalFormHintDescriptor[]>([
      { id: 'second', fieldName: 'email' },
      { id: 'first', fieldName: null },
      { id: 'third', fieldName: 'email' },
    ]);

    const result = createHintIdsSignal({
      registry: createStubRegistry(hints),
      fieldName: () => 'email',
    });

    expect(result()).toEqual(['second', 'first', 'third']);
  });

  it('treats an empty-string fieldName as scoped, not unscoped', () => {
    const hints = signal<readonly NgxSignalFormHintDescriptor[]>([
      { id: 'unscoped', fieldName: null },
      { id: 'empty-scoped', fieldName: '' },
      { id: 'email-scoped', fieldName: 'email' },
    ]);

    // For a non-empty current field name, the empty-string-scoped hint must
    // NOT be matched as unscoped.
    const emailResult = createHintIdsSignal({
      registry: createStubRegistry(hints),
      fieldName: () => 'email',
    });
    expect(emailResult()).toEqual(['unscoped', 'email-scoped']);

    // The empty-string-scoped hint only matches when the current field name
    // is itself the empty string.
    const emptyResult = createHintIdsSignal({
      registry: createStubRegistry(hints),
      fieldName: () => '',
    });
    expect(emptyResult()).toEqual(['unscoped', 'empty-scoped']);
  });
});

// ---------------------------------------------------------------------------
// Both-absent path
// ---------------------------------------------------------------------------

describe('createHintIdsSignal – both-absent path', () => {
  it('returns an empty list when no identity and no registry are provided', () => {
    const result = createHintIdsSignal();
    expect(result()).toEqual([]);
  });

  it('returns an empty list when identity is null and registry is null', () => {
    const result = createHintIdsSignal({ identity: null, registry: null });
    expect(result()).toEqual([]);
  });

  it('returns an empty list when only a fieldName reader is supplied', () => {
    const result = createHintIdsSignal({ fieldName: () => 'email' });
    expect(result()).toEqual([]);
  });
});
