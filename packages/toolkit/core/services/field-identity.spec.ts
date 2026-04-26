import {
  ChangeDetectionStrategy,
  Component,
  inject,
  isDevMode,
} from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { render } from '@testing-library/angular';
import { describe, expect, it, vi } from 'vitest';
import { NgxFieldIdentity } from './field-identity';

describe('NgxFieldIdentity', () => {
  describe('unit — constructed outside a component (via TestBed)', () => {
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

    it('exposes empty hintIds by default', () => {
      const svc = createService();
      expect(svc.hintIds()).toEqual([]);
    });

    it('resolveControlElement returns null when no element is set', () => {
      const svc = createService();
      expect(svc.resolveControlElement()).toBeNull();
    });

    describe('_setFieldName', () => {
      it('updates fieldName signal', () => {
        const svc = createService();
        svc._setFieldName('email');
        expect(svc.fieldName()).toBe('email');
      });

      it('derives errorId and warningId from fieldName', () => {
        const svc = createService();
        svc._setFieldName('email');
        expect(svc.errorId()).toBe('email-error');
        expect(svc.warningId()).toBe('email-warning');
      });

      it('clears errorId and warningId when fieldName is set to null', () => {
        const svc = createService();
        svc._setFieldName('email');
        svc._setFieldName(null);
        expect(svc.errorId()).toBeNull();
        expect(svc.warningId()).toBeNull();
      });

      it('is idempotent — does not reassign when value is unchanged', () => {
        const svc = createService();
        svc._setFieldName('email');
        const snapshotBefore = svc.fieldName();
        svc._setFieldName('email');
        expect(svc.fieldName()).toBe(snapshotBefore);
      });
    });

    describe('_setControlElement', () => {
      it('updates controlId when element has an id', () => {
        const svc = createService();
        const el = document.createElement('input');
        el.id = 'email';
        svc._setControlElement(el);
        expect(svc.controlId()).toBe('email');
        expect(svc.resolveControlElement()).toBe(el);
      });

      it('controlId is null when element has no id', () => {
        const svc = createService();
        const el = document.createElement('input');
        svc._setControlElement(el);
        expect(svc.controlId()).toBeNull();
      });

      it('controlId is null after element is set to null', () => {
        const svc = createService();
        const el = document.createElement('input');
        el.id = 'email';
        svc._setControlElement(el);
        svc._setControlElement(null);
        expect(svc.controlId()).toBeNull();
        expect(svc.resolveControlElement()).toBeNull();
      });

      it('emits dev-mode warning when element has no id and no explicit fieldName', () => {
        if (!isDevMode()) return; // guard: warn only fires in dev mode

        const consoleSpy = vi
          .spyOn(console, 'warn')
          .mockImplementation(() => undefined);

        const svc = createService();
        const el = document.createElement('input'); // no id
        svc._setControlElement(el);

        expect(consoleSpy).toHaveBeenCalledWith(
          expect.stringContaining('[ngx-signal-forms] NgxFieldIdentity'),
          el,
        );
        consoleSpy.mockRestore();
      });

      it('does NOT emit warning when element has an id', () => {
        const consoleSpy = vi
          .spyOn(console, 'warn')
          .mockImplementation(() => undefined);

        const svc = createService();
        const el = document.createElement('input');
        el.id = 'email';
        svc._setControlElement(el);

        const identityWarnings = consoleSpy.mock.calls.filter(
          (args) =>
            typeof args[0] === 'string' && args[0].includes('NgxFieldIdentity'),
        );
        expect(identityWarnings).toHaveLength(0);
        consoleSpy.mockRestore();
      });

      it('does NOT emit warning when explicit fieldName is set', () => {
        const consoleSpy = vi
          .spyOn(console, 'warn')
          .mockImplementation(() => undefined);

        const svc = createService();
        svc._setFieldName('email');
        const el = document.createElement('input'); // no id
        svc._setControlElement(el);

        const identityWarnings = consoleSpy.mock.calls.filter(
          (args) =>
            typeof args[0] === 'string' && args[0].includes('NgxFieldIdentity'),
        );
        expect(identityWarnings).toHaveLength(0);
        consoleSpy.mockRestore();
      });
    });

    describe('_setHintIds', () => {
      it('updates hintIds signal', () => {
        const svc = createService();
        svc._setHintIds(['email-hint-1', 'email-hint-2']);
        expect(svc.hintIds()).toEqual(['email-hint-1', 'email-hint-2']);
      });

      it('clears hintIds when set to empty array', () => {
        const svc = createService();
        svc._setHintIds(['email-hint']);
        svc._setHintIds([]);
        expect(svc.hintIds()).toEqual([]);
      });
    });

    describe('onControlVisibilityChange', () => {
      it('returns a cleanup no-op when no control element is set', () => {
        const svc = createService();
        const cb = vi.fn();
        const cleanup = svc.onControlVisibilityChange(cb);
        expect(typeof cleanup).toBe('function');
        cleanup(); // must not throw
      });
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

      // Each wrapper creates its own NgxFieldIdentity instance.
      expect(instances.length).toBe(2);
      expect(instances[0]).not.toBe(instances[1]);
    });
  });
});
