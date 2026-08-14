import {
  ChangeDetectionStrategy,
  Component,
  computed,
  signal,
} from '@angular/core';
import { NgxSignalFormDebugger } from '@ngx-signal-forms/debugger';
import {
  DisplayControlsCardComponent,
  ExampleCardsComponent,
  NgxPageControlsDirective,
  PageHeaderComponent,
  SplitLayoutComponent,
} from '../../ui';
import { BRAND_THEMING_CONTENT } from './brand-theming.content';
import { BrandThemingFormComponent } from './brand-theming.form';

/**
 * Brand Theming demo page.
 *
 * Everything the theming guide's semantic color scale controls — primary,
 * error, warning, text, surface, border, disabled — is re-themed to a
 * distinct violet/lavender palette purely through public CSS custom
 * properties, scoped to this page's own panel (`.brand-theming-panel--brand`)
 * so no other route's visuals change. Dark mode reuses the app-wide theme
 * switcher in the header (see `NgxThemeSwitcherComponent`); this page only
 * needs to define brand-appropriate dark values, not a second toggle.
 */
@Component({
  selector: 'ngx-brand-theming-page',
  changeDetection: ChangeDetectionStrategy.OnPush,

  imports: [
    BrandThemingFormComponent,
    DisplayControlsCardComponent,
    ExampleCardsComponent,
    NgxPageControlsDirective,
    NgxSignalFormDebugger,
    PageHeaderComponent,
    SplitLayoutComponent,
  ],
  template: `
    <ng-template ngxPageControls>
      <ngx-display-controls-card
        title="Brand theme controls"
        description="Flip the brand palette on and off without touching any other route on the site. Dark mode comes from the header's theme switcher, top right."
        [chips]="currentChips()"
        layout="single"
      >
        <div
          display-controls-primary
          class="brand-theming-toggle"
          role="group"
          aria-label="Brand theme"
        >
          <button
            type="button"
            (click)="brandThemeOn.set(true)"
            [attr.aria-pressed]="brandThemeOn()"
            [class.brand-theming-toggle__button--selected]="brandThemeOn()"
            class="brand-theming-toggle__button"
          >
            🎨 Brand theme
          </button>
          <button
            type="button"
            (click)="brandThemeOn.set(false)"
            [attr.aria-pressed]="!brandThemeOn()"
            [class.brand-theming-toggle__button--selected]="!brandThemeOn()"
            class="brand-theming-toggle__button"
          >
            Stock theme
          </button>
        </div>
      </ngx-display-controls-card>
    </ng-template>

    <ngx-page-header
      title="Brand Theming"
      subtitle="Re-theme the wrapper with a brand palette that stays WCAG 2.2 AA in both light and dark"
    />

    <ngx-example-cards
      [demonstrated]="demonstratedContent"
      [learning]="learningContent"
    >
      <div
        class="brand-theming-panel"
        [class.brand-theming-panel--brand]="brandThemeOn()"
        data-testid="brand-theming-panel"
      >
        <ngx-split-layout>
          <ngx-brand-theming-form #formComponent left />
          @if (formComponent) {
            <div right>
              <ngx-signal-form-debugger
                [formTree]="formComponent.brandThemingForm"
              />
            </div>
          }
        </ngx-split-layout>
      </div>
    </ngx-example-cards>
  `,
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      gap: 2rem;
    }

    .brand-theming-toggle {
      display: inline-flex;
      max-width: 100%;
      flex-wrap: wrap;
      align-items: center;
      gap: 0.25rem;
      border: 1px solid rgb(229 231 235 / 0.8);
      border-radius: 9999px;
      background: rgb(255 255 255 / 0.8);
      padding: 0.25rem;
      box-shadow: 0 1px 2px rgb(15 23 42 / 0.08);
      backdrop-filter: blur(10px);
    }

    .brand-theming-toggle__button {
      border: 0;
      border-radius: 9999px;
      background: transparent;
      padding: 0.375rem 1rem;
      font-size: 0.875rem;
      line-height: 1.25rem;
      font-weight: 500;
      color: rgb(75 85 99);
      transition:
        color 150ms ease,
        background-color 150ms ease,
        box-shadow 150ms ease;
    }

    .brand-theming-toggle__button:hover {
      color: rgb(17 24 39);
    }

    .brand-theming-toggle__button:focus-visible {
      outline: 2px solid #005fcc;
      outline-offset: 2px;
    }

    .brand-theming-toggle__button--selected {
      background: #ede9fe;
      box-shadow: 0 1px 2px rgb(15 23 42 / 0.08);
      color: #6d28d9;
    }

    :host-context(.dark) .brand-theming-toggle {
      border-color: rgb(55 65 81);
      background: rgb(31 41 55 / 0.9);
    }

    :host-context(.dark) .brand-theming-toggle__button {
      color: rgb(209 213 219);
    }

    :host-context(.dark) .brand-theming-toggle__button:hover {
      color: rgb(255 255 255);
    }

    :host-context(.dark) .brand-theming-toggle__button--selected {
      background: rgb(55 65 81);
      color: rgb(167 139 250);
    }

    /* ------------------------------------------------------------------ */
    /* Brand palette — scoped opt-in override, this panel only.           */
    /* Every custom property below is public API documented in            */
    /* packages/toolkit/form-field/THEMING.md. Light and dark both        */
    /* re-derived and contrast-checked (see the PR description / README). */
    /* ------------------------------------------------------------------ */

    .brand-theming-panel {
      border-radius: 1rem;
      padding: 1.5rem;
      transition:
        background-color 200ms ease,
        color 200ms ease;
    }

    .brand-theming-panel--brand {
      /* Wrapper semantic color scale (packages/toolkit/form-field/THEMING.md
         § "Semantic Color Scale"). Every ratio below is stated against BOTH
         backgrounds the color can actually render on: the input's own
         --color-surface (#fdfaf6) and this panel's background (#f5f0ff) —
         see the README's contrast table for the full light/dark matrix. */
      --ngx-form-field-color-primary: #6d28d9; /* violet-700 — focus/active borders, 6.83:1 vs surface, 6.36:1 vs panel */
      --ngx-form-field-color-error: #be123c; /* rose-700 — 6.04:1 vs surface, 5.62:1 vs panel */
      --ngx-form-field-color-warning: #92400e; /* amber-800 — 6.81:1 vs surface, 6.34:1 vs panel */
      --ngx-form-field-color-text: #1e1b4b; /* indigo-950 — 15.36:1 vs surface, 14.30:1 vs panel */
      --ngx-form-field-color-text-secondary: rgba(
        30,
        27,
        75,
        0.75
      ); /* ~6.97:1 vs surface, ~6.72:1 vs panel (effective, alpha pre-blended) */
      --ngx-form-field-color-surface: #fdfaf6; /* warm off-white, distinct from the stock pure white */
      --ngx-form-field-color-border: rgba(
        30,
        27,
        75,
        0.5
      ); /* ~3.17:1 vs surface, ~3.11:1 vs panel (non-text boundary contrast) */
      --ngx-form-field-color-border-hover: #1e1b4b;
      --ngx-form-field-color-disabled: #ede9f9;
      --ngx-form-field-radius: 0.75rem;

      /* Cross-cutting feedback text (packages/toolkit/form-field/THEMING.md
         § "Error & Warning Messages" / "Hints") — kept in sync with the
         semantic error/warning colors above so a field's border and its
         message never disagree. */
      --ngx-signal-form-error-color: #be123c;
      --ngx-signal-form-warning-color: #92400e;
      --ngx-form-field-hint-color: rgba(30, 27, 75, 0.75);

      background: #f5f0ff;
      color: #1e1b4b;
    }

    :host-context(.dark) .brand-theming-panel--brand {
      /* Same dual-background treatment as the light block above, against
         the dark --color-surface (#1e1b3a) and the dark panel bg (#120f24). */
      --ngx-form-field-color-primary: #a78bfa; /* violet-400 — 6.06:1 vs surface, 6.89:1 vs panel */
      --ngx-form-field-color-error: #fda4af; /* rose-300 — 8.72:1 vs surface, 9.92:1 vs panel */
      --ngx-form-field-color-warning: #fcd34d; /* amber-300 — 11.44:1 vs surface, 13.01:1 vs panel */
      --ngx-form-field-color-text: #f5f3ff; /* violet-50 — 15.04:1 vs surface, 17.10:1 vs panel */
      --ngx-form-field-color-text-secondary: rgba(
        245,
        243,
        255,
        0.75
      ); /* ~8.94:1 vs surface, ~9.82:1 vs panel (effective, alpha pre-blended) */
      --ngx-form-field-color-surface: #1e1b3a;
      --ngx-form-field-color-border: rgba(
        245,
        243,
        255,
        0.4
      ); /* ~3.51:1 vs surface, ~3.58:1 vs panel (non-text boundary contrast) */
      --ngx-form-field-color-border-hover: #f5f3ff;
      --ngx-form-field-color-disabled: #14112a;

      --ngx-signal-form-error-color: #fda4af;
      --ngx-signal-form-warning-color: #fcd34d;
      --ngx-form-field-hint-color: rgba(245, 243, 255, 0.75);

      background: #120f24;
      color: #f5f3ff;
    }
  `,
})
export class BrandThemingPage {
  protected readonly brandThemeOn = signal(true);

  protected readonly demonstratedContent = BRAND_THEMING_CONTENT.demonstrated;
  protected readonly learningContent = BRAND_THEMING_CONTENT.learning;

  protected readonly currentChips = computed(() => [
    { label: 'Theme', value: this.brandThemeOn() ? 'Brand' : 'Stock' },
  ]);
}
