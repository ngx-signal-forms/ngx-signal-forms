import { Component } from '@angular/core';
import { render, screen } from '@testing-library/angular';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { HlmInput } from '@spartan-ng/helm/input';
import {
  HlmSelect,
  HlmSelectContent,
  HlmSelectItem,
  HlmSelectPortal,
  HlmSelectTrigger,
  HlmSelectValue,
} from '@spartan-ng/helm/select';

beforeAll(() => {
  Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
    value: vi.fn(),
    configurable: true,
    writable: true,
  });
});

/**
 * Regression for audit #148 finding 1: the vendored `hlm-input` and
 * `hlm-select-trigger` had dropped upstream v1.0.4's `forceInvalid`
 * forwarding (they forward only `['id']` to their Brain host directive),
 * so consumers copying this reference lost the ability to force the
 * destructive/invalid visual state independent of live field validity.
 *
 * `hlm-checkbox` already threads `forceInvalid` through correctly — these
 * specs pin the same contract for input and select-trigger.
 */
describe('vendored helm forceInvalid forwarding (audit #148 finding 1)', () => {
  it('hlm-input forwards [forceInvalid] to BrnInput (data-matches-spartan-invalid)', async () => {
    @Component({
      selector: 'test-hlm-input-force-invalid',
      imports: [HlmInput],
      template: `<input hlmInput [forceInvalid]="true" aria-label="name" />`,
    })
    class TestHost {}

    await render(TestHost);

    const input = screen.getByLabelText('name');
    expect(input.getAttribute('data-matches-spartan-invalid')).toBe('true');
  });

  it('hlm-input does not mark data-matches-spartan-invalid when forceInvalid is false/unset', async () => {
    @Component({
      selector: 'test-hlm-input-not-force-invalid',
      imports: [HlmInput],
      template: `<input hlmInput aria-label="name" />`,
    })
    class TestHost {}

    await render(TestHost);

    const input = screen.getByLabelText('name');
    expect(input.getAttribute('data-matches-spartan-invalid')).not.toBe('true');
  });

  it('hlm-select-trigger forwards [forceInvalid] to BrnSelectTrigger (aria-invalid + data-matches-spartan-invalid)', async () => {
    @Component({
      selector: 'test-hlm-select-trigger-force-invalid',
      imports: [
        HlmSelect,
        HlmSelectTrigger,
        HlmSelectValue,
        HlmSelectContent,
        HlmSelectItem,
        HlmSelectPortal,
      ],
      template: `
        <hlm-select>
          <hlm-select-trigger [forceInvalid]="true" buttonId="plan-trigger">
            <hlm-select-value placeholder="Select a plan" />
          </hlm-select-trigger>
          <hlm-select-content *hlmSelectPortal>
            <hlm-select-item value="starter">Starter</hlm-select-item>
          </hlm-select-content>
        </hlm-select>
      `,
    })
    class TestHost {}

    await render(TestHost);

    const trigger = screen.getByRole('combobox');
    // BrnSelectTrigger's own `data-matches-spartan-invalid` host binding
    // ORs `forceInvalid()` in — this is what drives the destructive-ring
    // styling in `_computedClass`.
    expect(trigger.getAttribute('data-matches-spartan-invalid')).toBe('true');
    // `HlmSelectTrigger`'s own gated `aria-invalid` write (afterEveryRender)
    // must also honor forceInvalid, or a forced-invalid trigger would show
    // the destructive ring without announcing invalidity to assistive tech.
    expect(trigger.getAttribute('aria-invalid')).toBe('true');
  });
});
