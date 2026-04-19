import { Component, signal } from '@angular/core';
import { render, screen } from '@testing-library/angular';
import { describe, expect, it } from 'vitest';
import {
  DEFAULT_NGX_SIGNAL_FORM_CONTROL_PRESETS,
  NGX_SIGNAL_FORM_CONTROL_PRESETS,
} from '../tokens';
import type { NgxSignalFormControlPresetRegistry } from '../types';
import { NgxSignalFormControlSemanticsDirective } from './control-semantics';

describe('NgxSignalFormControlSemanticsDirective', () => {
  describe('String kind input', () => {
    it('should write data attributes for a valid kind', async () => {
      @Component({
        template:
          '<div data-testid="host" ngxSignalFormControl="switch"></div>',
        imports: [NgxSignalFormControlSemanticsDirective],
      })
      class TestComponent {}

      await render(TestComponent);
      const host = screen.getByTestId('host');

      expect(host.getAttribute('data-ngx-signal-form-control')).toBe('');
      expect(host.getAttribute('data-ngx-signal-form-control-kind')).toBe(
        'switch',
      );
    });

    it('should resolve layout from preset when not overridden', async () => {
      @Component({
        template:
          '<div data-testid="host" ngxSignalFormControl="switch"></div>',
        imports: [NgxSignalFormControlSemanticsDirective],
      })
      class TestComponent {}

      await render(TestComponent);
      const host = screen.getByTestId('host');

      expect(host.getAttribute('data-ngx-signal-form-control-layout')).toBe(
        'inline-control',
      );
      expect(host.getAttribute('data-ngx-signal-form-control-aria-mode')).toBe(
        'auto',
      );
    });

    it('should treat invalid kind string as no semantics', async () => {
      @Component({
        template:
          '<div data-testid="host" ngxSignalFormControl="unknown"></div>',
        imports: [NgxSignalFormControlSemanticsDirective],
      })
      class TestComponent {}

      await render(TestComponent);
      const host = screen.getByTestId('host');

      expect(host.getAttribute('data-ngx-signal-form-control')).toBeNull();
      expect(host.getAttribute('data-ngx-signal-form-control-kind')).toBeNull();
    });

    it('should treat empty string as no semantics', async () => {
      @Component({
        template: '<div data-testid="host" ngxSignalFormControl=""></div>',
        imports: [NgxSignalFormControlSemanticsDirective],
      })
      class TestComponent {}

      await render(TestComponent);
      const host = screen.getByTestId('host');

      expect(host.getAttribute('data-ngx-signal-form-control')).toBeNull();
    });
  });

  describe('Object input', () => {
    it('should accept a full semantics object', async () => {
      @Component({
        template:
          '<div data-testid="host" [ngxSignalFormControl]="semantics"></div>',
        imports: [NgxSignalFormControlSemanticsDirective],
      })
      class TestComponent {
        semantics = {
          kind: 'composite' as const,
          layout: 'stacked' as const,
          ariaMode: 'manual' as const,
        };
      }

      await render(TestComponent);
      const host = screen.getByTestId('host');

      expect(host.getAttribute('data-ngx-signal-form-control-kind')).toBe(
        'composite',
      );
      expect(host.getAttribute('data-ngx-signal-form-control-layout')).toBe(
        'stacked',
      );
      expect(host.getAttribute('data-ngx-signal-form-control-aria-mode')).toBe(
        'manual',
      );
    });

    it('should accept a partial semantics object', async () => {
      @Component({
        template:
          '<div data-testid="host" [ngxSignalFormControl]="semantics"></div>',
        imports: [NgxSignalFormControlSemanticsDirective],
      })
      class TestComponent {
        semantics = { kind: 'slider' as const };
      }

      await render(TestComponent);
      const host = screen.getByTestId('host');

      expect(host.getAttribute('data-ngx-signal-form-control-kind')).toBe(
        'slider',
      );
      // Layout falls back to preset default for slider
      expect(host.getAttribute('data-ngx-signal-form-control-layout')).toBe(
        'stacked',
      );
    });
  });

  describe('Override inputs', () => {
    it('should prefer layoutOverride over object and preset', async () => {
      @Component({
        template: `<div
          data-testid="host"
          ngxSignalFormControl="switch"
          ngxSignalFormControlLayout="stacked"
        ></div>`,
        imports: [NgxSignalFormControlSemanticsDirective],
      })
      class TestComponent {}

      await render(TestComponent);
      const host = screen.getByTestId('host');

      // Switch preset default is "inline-control", but override wins
      expect(host.getAttribute('data-ngx-signal-form-control-layout')).toBe(
        'stacked',
      );
    });

    it('should prefer ariaModeOverride over object and preset', async () => {
      @Component({
        template: `<div
          data-testid="host"
          ngxSignalFormControl="slider"
          ngxSignalFormControlAria="manual"
        ></div>`,
        imports: [NgxSignalFormControlSemanticsDirective],
      })
      class TestComponent {}

      await render(TestComponent);
      const host = screen.getByTestId('host');

      // Slider preset default is "auto", but override wins
      expect(host.getAttribute('data-ngx-signal-form-control-aria-mode')).toBe(
        'manual',
      );
    });
  });

  describe('Custom presets', () => {
    it('should use custom presets when provided', async () => {
      const customPresets: NgxSignalFormControlPresetRegistry = {
        ...DEFAULT_NGX_SIGNAL_FORM_CONTROL_PRESETS,
        slider: { layout: 'custom', ariaMode: 'manual' },
      };

      @Component({
        template:
          '<div data-testid="host" ngxSignalFormControl="slider"></div>',
        imports: [NgxSignalFormControlSemanticsDirective],
      })
      class TestComponent {}

      await render(TestComponent, {
        providers: [
          {
            provide: NGX_SIGNAL_FORM_CONTROL_PRESETS,
            useValue: customPresets,
          },
        ],
      });
      const host = screen.getByTestId('host');

      expect(host.getAttribute('data-ngx-signal-form-control-layout')).toBe(
        'custom',
      );
      expect(host.getAttribute('data-ngx-signal-form-control-aria-mode')).toBe(
        'manual',
      );
    });
  });

  describe('Dynamic changes', () => {
    it('should update data attributes when kind input changes', async () => {
      @Component({
        template:
          '<div data-testid="host" [ngxSignalFormControl]="kind()"></div>',
        imports: [NgxSignalFormControlSemanticsDirective],
      })
      class TestComponent {
        readonly kind = signal('switch');
      }

      const { fixture } = await render(TestComponent);
      const host = screen.getByTestId('host');

      expect(host.getAttribute('data-ngx-signal-form-control-kind')).toBe(
        'switch',
      );
      expect(host.getAttribute('data-ngx-signal-form-control-layout')).toBe(
        'inline-control',
      );

      fixture.componentInstance.kind.set('slider');
      fixture.detectChanges();
      await fixture.whenStable();

      expect(host.getAttribute('data-ngx-signal-form-control-kind')).toBe(
        'slider',
      );
      expect(host.getAttribute('data-ngx-signal-form-control-layout')).toBe(
        'stacked',
      );
    });

    it('should clear data attributes when kind becomes invalid', async () => {
      @Component({
        template:
          '<div data-testid="host" [ngxSignalFormControl]="kind()"></div>',
        imports: [NgxSignalFormControlSemanticsDirective],
      })
      class TestComponent {
        readonly kind = signal('switch');
      }

      const { fixture } = await render(TestComponent);
      const host = screen.getByTestId('host');

      expect(host.hasAttribute('data-ngx-signal-form-control')).toBe(true);

      fixture.componentInstance.kind.set('unknown-invalid');
      fixture.detectChanges();
      await fixture.whenStable();

      expect(host.hasAttribute('data-ngx-signal-form-control')).toBe(false);
      expect(host.getAttribute('data-ngx-signal-form-control-kind')).toBeNull();
    });
  });

  describe('hasSemantics', () => {
    it('should emit data-ngx-signal-form-control marker when semantics present', async () => {
      @Component({
        template:
          '<div data-testid="host" ngxSignalFormControl="input-like"></div>',
        imports: [NgxSignalFormControlSemanticsDirective],
      })
      class TestComponent {}

      await render(TestComponent);
      const host = screen.getByTestId('host');

      expect(host.hasAttribute('data-ngx-signal-form-control')).toBe(true);
    });

    it('should emit marker when only layout override without kind', async () => {
      @Component({
        template:
          '<div data-testid="host" ngxSignalFormControlLayout="stacked"></div>',
        imports: [NgxSignalFormControlSemanticsDirective],
      })
      class TestComponent {}

      await render(TestComponent);
      const host = screen.getByTestId('host');

      // Layout override alone makes hasSemantics true
      expect(host.hasAttribute('data-ngx-signal-form-control')).toBe(true);
      expect(host.getAttribute('data-ngx-signal-form-control-kind')).toBeNull();
    });
  });
});
