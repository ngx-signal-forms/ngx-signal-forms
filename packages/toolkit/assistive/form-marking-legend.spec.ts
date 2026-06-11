import { Component, signal } from '@angular/core';
import { form, FormRoot, required, schema } from '@angular/forms/signals';
import {
  NgxSignalForm,
  provideNgxSignalFormsConfig,
} from '@ngx-signal-forms/toolkit';
import { render } from '@testing-library/angular';
import { describe, expect, it, vi } from 'vitest';
import { NgxFormMarkingLegend } from './form-marking-legend';

const LEGEND = '.ngx-form-marking-legend';

describe('NgxFormMarkingLegend', () => {
  describe("'required' mode (default)", () => {
    it('shows the default required legend with {marker} substituted', async () => {
      @Component({
        imports: [NgxFormMarkingLegend],
        template: `<ngx-form-marking-legend [formField]="f" />`,
      })
      class Host {
        readonly f = form(
          signal({ email: '' }),
          schema((p) => {
            required(p.email);
          }),
        );
      }

      const { container } = await render(Host);
      expect(container.querySelector(LEGEND)?.textContent?.trim()).toBe(
        '* indicates a required field',
      );
    });

    it('hides when the form has no required field', async () => {
      @Component({
        imports: [NgxFormMarkingLegend],
        template: `<ngx-form-marking-legend [formField]="f" />`,
      })
      class Host {
        readonly f = form(signal({ nickname: '' }));
      }

      const { container } = await render(Host);
      expect(container.querySelector(LEGEND)).toBeNull();
    });

    it('honours a per-instance requiredMarker for {marker}', async () => {
      @Component({
        imports: [NgxFormMarkingLegend],
        template: `<ngx-form-marking-legend
          [formField]="f"
          requiredMarker=" †"
        />`,
      })
      class Host {
        readonly f = form(
          signal({ email: '' }),
          schema((p) => {
            required(p.email);
          }),
        );
      }

      const { container } = await render(Host);
      expect(container.querySelector(LEGEND)?.textContent?.trim()).toBe(
        '† indicates a required field',
      );
    });
  });

  describe("'optional' mode", () => {
    it('shows the optional legend and substitutes {marker}', async () => {
      @Component({
        imports: [NgxFormMarkingLegend],
        template: `<ngx-form-marking-legend
          [formField]="f"
          showMarkerWhen="optional"
        />`,
      })
      class Host {
        readonly f = form(
          signal({ email: '', nickname: '' }),
          schema((p) => {
            required(p.email);
          }),
        );
      }

      const { container } = await render(Host);
      expect(container.querySelector(LEGEND)?.textContent?.trim()).toBe(
        'All fields are required unless marked (optional)',
      );
    });

    it('hides when every field is required', async () => {
      @Component({
        imports: [NgxFormMarkingLegend],
        template: `<ngx-form-marking-legend
          [formField]="f"
          showMarkerWhen="optional"
        />`,
      })
      class Host {
        readonly f = form(
          signal({ email: '' }),
          schema((p) => {
            required(p.email);
          }),
        );
      }

      const { container } = await render(Host);
      expect(container.querySelector(LEGEND)).toBeNull();
    });
  });

  describe("'none' mode", () => {
    it('renders nothing', async () => {
      @Component({
        imports: [NgxFormMarkingLegend],
        template: `<ngx-form-marking-legend
          [formField]="f"
          showMarkerWhen="none"
        />`,
      })
      class Host {
        readonly f = form(
          signal({ email: '' }),
          schema((p) => {
            required(p.email);
          }),
        );
      }

      const { container } = await render(Host);
      expect(container.querySelector(LEGEND)).toBeNull();
    });

    it('renders nothing even when [text] is set ([none] wins over text)', async () => {
      // The demo's live controls let a consumer leave a [text] binding in place
      // while flipping the mode to 'none'. `none` must still render nothing —
      // resolvedText short-circuits on the mode before consulting text().
      @Component({
        imports: [NgxFormMarkingLegend],
        template: `<ngx-form-marking-legend
          [formField]="f"
          showMarkerWhen="none"
          text="This should never show {marker}"
        />`,
      })
      class Host {
        readonly f = form(
          signal({ email: '' }),
          schema((p) => {
            required(p.email);
          }),
        );
      }

      const { container } = await render(Host);
      expect(container.querySelector(LEGEND)).toBeNull();
    });
  });

  describe('text override', () => {
    it('uses [text] and still substitutes {marker}', async () => {
      @Component({
        imports: [NgxFormMarkingLegend],
        template: `<ngx-form-marking-legend
          [formField]="f"
          text="Velden met {marker} zijn verplicht"
        />`,
      })
      class Host {
        readonly f = form(
          signal({ email: '' }),
          schema((p) => {
            required(p.email);
          }),
        );
      }

      const { container } = await render(Host);
      expect(container.querySelector(LEGEND)?.textContent?.trim()).toBe(
        'Velden met * zijn verplicht',
      );
    });
  });

  describe('config default', () => {
    it('reads showMarkerWhen / text from the global config', async () => {
      @Component({
        imports: [NgxFormMarkingLegend],
        template: `<ngx-form-marking-legend [formField]="f" />`,
      })
      class Host {
        readonly f = form(signal({ nickname: '' }));
      }

      const { container } = await render(Host, {
        providers: [
          provideNgxSignalFormsConfig({
            showMarkerWhen: 'optional',
            optionalMarker: ' (opt)',
          }),
        ],
      });

      // nickname is optional → optional legend shows, using the configured marker.
      expect(container.querySelector(LEGEND)?.textContent?.trim()).toBe(
        'All fields are required unless marked (opt)',
      );
    });
  });

  describe('form-tree resolution', () => {
    it('falls back to the ambient form context when [formField] is omitted', async () => {
      @Component({
        imports: [NgxFormMarkingLegend, FormRoot, NgxSignalForm],
        template: `
          <form [formRoot]="f" ngxSignalForm>
            <ngx-form-marking-legend />
          </form>
        `,
      })
      class Host {
        readonly f = form(
          signal({ email: '' }),
          schema((p) => {
            required(p.email);
          }),
        );
      }

      const { container } = await render(Host);
      expect(container.querySelector(LEGEND)?.textContent?.trim()).toBe(
        '* indicates a required field',
      );
    });

    it('renders nothing and warns when no form tree is resolvable', async () => {
      const errorSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => undefined);

      @Component({
        imports: [NgxFormMarkingLegend],
        template: `<ngx-form-marking-legend />`,
      })
      class Host {}

      const { container } = await render(Host);

      expect(container.querySelector(LEGEND)).toBeNull();
      expect(errorSpy).toHaveBeenCalledWith(
        expect.stringContaining('NgxFormMarkingLegend: no form tree available'),
      );

      errorSpy.mockRestore();
    });

    it('warns only once while the form tree stays missing', async () => {
      const errorSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => undefined);

      @Component({
        imports: [NgxFormMarkingLegend],
        template: `<ngx-form-marking-legend />`,
      })
      class Host {}

      const { fixture } = await render(Host);

      const callsAfterFirstRender = errorSpy.mock.calls.length;
      expect(callsAfterFirstRender).toBe(1);

      // Further change-detection cycles must not re-log the same misconfiguration.
      fixture.detectChanges();
      fixture.detectChanges();

      expect(errorSpy).toHaveBeenCalledTimes(callsAfterFirstRender);

      errorSpy.mockRestore();
    });
  });

  describe('reactivity', () => {
    it('updates when a conditionally-required field flips', async () => {
      const wantsEmail = signal(false);

      @Component({
        imports: [NgxFormMarkingLegend],
        template: `<ngx-form-marking-legend [formField]="f" />`,
      })
      class Host {
        readonly f = form(
          signal({ email: '' }),
          schema<{ email: string }>((p) => {
            required(p.email, { when: () => wantsEmail() });
          }),
        );
      }

      const { container, fixture } = await render(Host);

      // No required field yet → required legend hidden.
      expect(container.querySelector(LEGEND)).toBeNull();

      wantsEmail.set(true);
      fixture.detectChanges();

      expect(container.querySelector(LEGEND)?.textContent?.trim()).toBe(
        '* indicates a required field',
      );
    });
  });
});
