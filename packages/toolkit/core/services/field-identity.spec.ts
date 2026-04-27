import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  isDevMode,
} from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { render } from '@testing-library/angular';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { isElementCssVisible, NgxFieldIdentity } from './field-identity';

describe('NgxFieldIdentity', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('unit — constructed inside an injection context', () => {
    function createService(): NgxFieldIdentity {
      return TestBed.runInInjectionContext(() => new NgxFieldIdentity());
    }

    it('exposes null fieldName, controlId, errorId, warningId by default', () => {
      const svc = createService();
      expect(svc.fieldName()).toBeNull();
      expect(svc.controlId()).toBeNull();
      expect(svc.errorId()).toBeNull();
      expect(svc.warningId()).toBeNull();
    });

    it('exposes empty hintIds and null describedBy by default', () => {
      const svc = createService();
      expect(svc.hintIds()).toEqual([]);
      expect(svc.describedBy()).toBeNull();
    });

    it('reports control visible by default', () => {
      const svc = createService();
      expect(svc.isControlVisible()).toBe(true);
    });

    it('resolveControlElement returns null when no element is set', () => {
      const svc = createService();
      expect(svc.resolveControlElement()).toBeNull();
    });

    describe('_setFieldName', () => {
      it('updates fieldName signal', () => {
        const svc = createService();
        svc.setFieldName('email');
        expect(svc.fieldName()).toBe('email');
      });

      it('normalizes whitespace-only names to null and trims non-empty names', () => {
        const svc = createService();
        svc.setFieldName('  email  ');
        expect(svc.fieldName()).toBe('email');

        svc.setFieldName('   ');
        expect(svc.fieldName()).toBeNull();
      });

      it('derives errorId and warningId from fieldName', () => {
        const svc = createService();
        svc.setFieldName('email');
        expect(svc.errorId()).toBe('email-error');
        expect(svc.warningId()).toBe('email-warning');
      });

      it('clears errorId and warningId when fieldName is set to null', () => {
        const svc = createService();
        svc.setFieldName('email');
        svc.setFieldName(null);
        expect(svc.errorId()).toBeNull();
        expect(svc.warningId()).toBeNull();
      });

      it('is idempotent — does not reassign when value is unchanged', () => {
        const svc = createService();
        svc.setFieldName('email');
        const snapshotBefore = svc.fieldName();
        svc.setFieldName('email');
        expect(svc.fieldName()).toBe(snapshotBefore);
      });
    });

    describe('_setControlElement', () => {
      it('updates controlId when element has an id', () => {
        const svc = createService();
        const el = document.createElement('input');
        el.id = 'email';
        svc.setControlElement(el);
        expect(svc.controlId()).toBe('email');
        expect(svc.resolveControlElement()).toBe(el);
      });

      it('controlId is null when element has no id', () => {
        const svc = createService();
        const el = document.createElement('input');
        svc.setControlElement(el);
        expect(svc.controlId()).toBeNull();
      });

      it('controlId is null after element is set to null', () => {
        const svc = createService();
        const el = document.createElement('input');
        el.id = 'email';
        svc.setControlElement(el);
        svc.setControlElement(null);
        expect(svc.controlId()).toBeNull();
        expect(svc.resolveControlElement()).toBeNull();
      });

      it.skipIf(!isDevMode())(
        'emits dev-mode warning when element has no id and no explicit fieldName',
        () => {
          const consoleSpy = vi
            .spyOn(console, 'warn')
            .mockImplementation(() => undefined);

          const svc = createService();
          const el = document.createElement('input');
          svc.setControlElement(el);

          expect(consoleSpy).toHaveBeenCalledWith(
            expect.stringContaining('[ngx-signal-forms] NgxFieldIdentity'),
            el,
          );
        },
      );

      it('does NOT emit warning when element has an id', () => {
        const consoleSpy = vi
          .spyOn(console, 'warn')
          .mockImplementation(() => undefined);

        const svc = createService();
        const el = document.createElement('input');
        el.id = 'email';
        svc.setControlElement(el);

        const identityWarnings = consoleSpy.mock.calls.filter(
          (args) =>
            typeof args[0] === 'string' && args[0].includes('NgxFieldIdentity'),
        );
        expect(identityWarnings).toHaveLength(0);
      });

      it('does NOT emit warning when explicit fieldName is set', () => {
        const consoleSpy = vi
          .spyOn(console, 'warn')
          .mockImplementation(() => undefined);

        const svc = createService();
        svc.setFieldName('email');
        const el = document.createElement('input');
        svc.setControlElement(el);

        const identityWarnings = consoleSpy.mock.calls.filter(
          (args) =>
            typeof args[0] === 'string' && args[0].includes('NgxFieldIdentity'),
        );
        expect(identityWarnings).toHaveLength(0);
      });

      it.skipIf(!isDevMode())(
        'warns at most once per instance even on repeated id-less swaps',
        () => {
          const consoleSpy = vi
            .spyOn(console, 'warn')
            .mockImplementation(() => undefined);

          const svc = createService();
          const a = document.createElement('input');
          const b = document.createElement('input');
          svc.setControlElement(a);
          svc.setControlElement(b);

          const identityWarnings = consoleSpy.mock.calls.filter(
            (args) =>
              typeof args[0] === 'string' &&
              args[0].includes('NgxFieldIdentity'),
          );
          expect(identityWarnings).toHaveLength(1);
        },
      );

      it('resets visibility to true when element is unset to null', () => {
        const svc = createService();
        const el = document.createElement('input');
        el.id = 'email';
        svc.setControlElement(el);
        svc.setControlVisible(false);
        expect(svc.isControlVisible()).toBe(false);

        svc.setControlElement(null);
        expect(svc.isControlVisible()).toBe(true);
      });
    });

    describe('_setControlVisible', () => {
      it('flips isControlVisible to false and back', () => {
        const svc = createService();
        svc.setControlVisible(false);
        expect(svc.isControlVisible()).toBe(false);
        svc.setControlVisible(true);
        expect(svc.isControlVisible()).toBe(true);
      });

      it('is idempotent — repeated identical writes do not glitch consumers', () => {
        const svc = createService();
        let computeCount = 0;
        const probe = TestBed.runInInjectionContext(() =>
          computed(() => {
            computeCount += 1;
            return svc.isControlVisible();
          }),
        );
        probe();
        const before = computeCount;
        // Angular signals already short-circuit same-primitive writes,
        // so this mainly documents that `_setControlVisible` preserves that.
        svc.setControlVisible(true);
        probe();
        svc.setControlVisible(true);
        probe();
        expect(computeCount - before).toBe(0);
      });
    });

    describe('_setHintIds', () => {
      it('updates hintIds signal', () => {
        const svc = createService();
        svc.setHintIds(['email-hint-1', 'email-hint-2']);
        expect(svc.hintIds()).toEqual(['email-hint-1', 'email-hint-2']);
      });

      it('clears hintIds when set to empty array', () => {
        const svc = createService();
        svc.setHintIds(['email-hint']);
        svc.setHintIds([]);
        expect(svc.hintIds()).toEqual([]);
      });

      it('is idempotent — fresh array reference with same content does not glitch consumers', () => {
        const svc = createService();
        let computeCount = 0;
        const probe = TestBed.runInInjectionContext(() =>
          computed(() => {
            computeCount += 1;
            return svc.describedBy();
          }),
        );
        probe();
        const before = computeCount;
        svc.setHintIds(['a', 'b']);
        probe();
        // This second write uses a fresh array reference with identical
        // contents; the service's shallow-equality guard should suppress
        // recomputation.
        svc.setHintIds(['a', 'b']);
        probe();
        // One recompute for the first set, zero for the second.
        expect(computeCount - before).toBe(1);
      });
    });

    describe('describedBy aggregator', () => {
      it('joins hint IDs with spaces', () => {
        const svc = createService();
        svc.setHintIds(['a-hint', 'b-hint']);
        expect(svc.describedBy()).toBe('a-hint b-hint');
      });

      it('returns null when no hints are present', () => {
        const svc = createService();
        expect(svc.describedBy()).toBeNull();
      });
    });
  });

  describe('isElementCssVisible helper', () => {
    // jsdom does not compute layout, so `offsetParent` is unreliable for
    // attached elements. We assert only the negative cases here; the
    // positive path is exercised in browser specs where layout is real.
    it('returns false for an element with display:none', () => {
      const el = document.createElement('input');
      el.style.display = 'none';
      document.body.append(el);
      try {
        expect(isElementCssVisible(el)).toBe(false);
      } finally {
        el.remove();
      }
    });

    it('returns false for a detached element', () => {
      const el = document.createElement('input');
      expect(isElementCssVisible(el)).toBe(false);
    });
  });

  describe('integration — provided by a component', () => {
    it('is injectable into child components when provided by a parent', async () => {
      let captured: NgxFieldIdentity | null = null;

      @Component({
        selector: 'test-provider',
        template: '<ng-content />',
        providers: [NgxFieldIdentity],
        changeDetection: ChangeDetectionStrategy.OnPush,
      })
      class TestProvider {
        readonly #identity = inject(NgxFieldIdentity);
        constructor() {
          captured = this.#identity;
        }
      }

      @Component({
        selector: 'test-root',
        template: `<test-provider><span>content</span></test-provider>`,
        imports: [TestProvider],
        changeDetection: ChangeDetectionStrategy.OnPush,
      })
      class TestRoot {}

      await render(TestRoot);
      expect(captured).toBeInstanceOf(NgxFieldIdentity);
    });

    it('is provided fresh per wrapper instance', async () => {
      const instances: NgxFieldIdentity[] = [];

      @Component({
        selector: 'test-wrapper',
        template: '<ng-content />',
        providers: [NgxFieldIdentity],
        changeDetection: ChangeDetectionStrategy.OnPush,
      })
      class TestWrapper {
        readonly #identity = inject(NgxFieldIdentity);
        constructor() {
          instances.push(this.#identity);
        }
      }

      @Component({
        selector: 'test-root',
        template: `
          <test-wrapper id="a"><span>a</span></test-wrapper>
          <test-wrapper id="b"><span>b</span></test-wrapper>
        `,
        imports: [TestWrapper],
        changeDetection: ChangeDetectionStrategy.OnPush,
      })
      class TestRoot {}

      await render(TestRoot);

      expect(instances.length).toBe(2);
      expect(instances[0]).not.toBe(instances[1]);
    });
  });
});
