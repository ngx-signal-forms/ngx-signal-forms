import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  signal,
} from '@angular/core';
import { FormField, form } from '@angular/forms/signals';
import {
  type ResolvedErrorDisplayStrategy,
  type FormFieldAppearance,
  type FormFieldOrientation,
  createOnInvalidHandler,
  NgxSignalFormToolkit,
  provideErrorMessages,
  provideFieldLabels,
} from '@ngx-signal-forms/toolkit';
import { NgxFormFieldErrorSummary } from '@ngx-signal-forms/toolkit/assistive';
import { NgxFormField } from '@ngx-signal-forms/toolkit/form-field';
import { humanizeFieldPath } from '@ngx-signal-forms/toolkit/headless';
import { createInitialI18nDemoModel, type I18nDemoModel } from './i18n.model';
import {
  DEMO_LANG_LABELS,
  DEMO_LANGS,
  I18nDemoLanguageService,
  type DemoLang,
} from './i18n.language';
import { ERROR_MESSAGES, FIELD_LABELS, UI_STRINGS } from './i18n.translations';
import { i18nDemoSchema } from './i18n.validations';

/**
 * i18n Demo Component
 *
 * Everything the toolkit needs to know about the current language lives in
 * one place: `I18nDemoLanguageService`. Both `provideErrorMessages()` and
 * `provideFieldLabels()` below inject it inside their factory and read
 * `langService.lang()` from *every entry/resolver call* — that is what makes
 * them reactive. If any entry were a plain string, or a function that never
 * read `lang()`, it would freeze at whatever language was active on first
 * render (see `packages/toolkit/core/providers/error-messages.provider.ts`
 * for the underlying string-vs-function contract this demo proves).
 */
@Component({
  selector: 'ngx-i18n-demo',
  changeDetection: ChangeDetectionStrategy.OnPush,

  providers: [
    I18nDemoLanguageService,

    // Every entry is a function that reads `langService.lang()` — the
    // reactive dependency that makes a runtime language switch update
    // already-rendered errors with no reload and no re-submit.
    provideErrorMessages(() => {
      const langService = inject(I18nDemoLanguageService);

      return {
        required: () => ERROR_MESSAGES[langService.lang()].required,
        email: () => ERROR_MESSAGES[langService.lang()].email,
        minLength: ({ minLength }) =>
          ERROR_MESSAGES[langService.lang()].minLength({ minLength }),
      };
    }),

    // The factory itself runs once, but it returns a *resolver function*
    // that the toolkit calls on every render — same contract, just phrased
    // as "the returned function reads the signal" instead of "the registry
    // entry reads the signal".
    provideFieldLabels(() => {
      const langService = inject(I18nDemoLanguageService);

      return (fieldPath) => {
        const dict = FIELD_LABELS[langService.lang()];
        return dict[fieldPath] ?? humanizeFieldPath(fieldPath);
      };
    }),
  ],

  imports: [
    FormField,
    NgxSignalFormToolkit,
    NgxFormField,
    NgxFormFieldErrorSummary,
  ],
  template: `
    <div class="px-6 pt-0 pb-6">
      <h2 class="mb-4 text-2xl font-bold">Runtime Language Switch</h2>
      <p class="mb-6 text-gray-600 dark:text-gray-400">
        Every registry entry below is a function that reads
        <code>langService.lang()</code>. Flip the language while a field is
        invalid — the visible error text and the error-summary labels update
        immediately, without reloading or re-submitting the form.
      </p>

      <!--
        WCAG 2.2 SC 3.1.2 (Language of Parts): everything inside this region
        (switcher, labels, inputs' accessible names, errors, summary, submit
        UI) is in \`langService.lang()\` right now, while the surrounding page
        chrome (this heading, the intro paragraph above, nav, etc.) stays
        English under <html lang="en">. [attr.lang] marks that boundary so
        assistive tech switches pronunciation/voice for this region only. See
        the README's "Document lang vs. region lang" section for why the
        document-level lang deliberately stays English.
      -->
      <div [attr.lang]="langService.lang()">
        <div
          class="mb-6 inline-flex max-w-full flex-wrap items-center gap-1 rounded-full border border-gray-200/80 bg-white/80 p-1 shadow-sm backdrop-blur-sm dark:border-gray-700 dark:bg-gray-800/90"
          role="group"
          [attr.aria-label]="uiStrings().languageGroupLabel"
        >
          @for (lang of langs; track lang) {
            <button
              type="button"
              (click)="langService.setLang(lang)"
              [attr.aria-pressed]="langService.lang() === lang"
              [attr.lang]="lang"
              [class.bg-[#e8f4fb]]="langService.lang() === lang"
              [class.shadow-sm]="langService.lang() === lang"
              [class.text-[#005d96]]="langService.lang() === lang"
              [class.dark:bg-gray-700]="langService.lang() === lang"
              [class.dark:text-blue-300]="langService.lang() === lang"
              class="rounded-full px-3 py-1.5 text-sm font-medium text-gray-600 transition-all hover:text-gray-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#005fcc] dark:text-gray-300 dark:hover:text-white"
            >
              {{ langLabels[lang] }}
            </button>
          }
        </div>

        <form
          [formRoot]="demoForm"
          ngxSignalForm
          [errorStrategy]="errorDisplayMode()"
          class="max-w-xl space-y-6"
        >
          <ngx-form-field-error-summary
            [formTree]="demoForm"
            [summaryLabel]="uiStrings().summaryLabel"
            [autoFocus]="false"
            data-testid="i18n-error-summary"
          />

          <ngx-form-field-wrapper
            [formField]="demoForm.fullName"
            [appearance]="appearance()"
            [orientation]="orientation()"
          >
            <label for="i18n-full-name">{{
              fieldLabel('fullName', 'Full name')
            }}</label>
            <input
              id="i18n-full-name"
              type="text"
              [formField]="demoForm.fullName"
            />
          </ngx-form-field-wrapper>

          <ngx-form-field-wrapper
            [formField]="demoForm.email"
            [appearance]="appearance()"
            [orientation]="orientation()"
          >
            <label for="i18n-email">{{ fieldLabel('email', 'Email') }}</label>
            <input id="i18n-email" type="email" [formField]="demoForm.email" />
          </ngx-form-field-wrapper>

          <div class="flex gap-4">
            <button type="submit" class="btn-primary">
              @if (demoForm().submitting()) {
                {{ uiStrings().saving }}
              } @else {
                {{ uiStrings().submit }}
              }
            </button>
            <button type="button" (click)="resetForm()" class="btn-secondary">
              {{ uiStrings().reset }}
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
})
export class I18nDemoComponent {
  readonly errorDisplayMode = input<ResolvedErrorDisplayStrategy>('on-touch');
  readonly appearance = input<FormFieldAppearance>('outline');
  readonly orientation = input<FormFieldOrientation>('vertical');

  protected readonly langService = inject(I18nDemoLanguageService);
  protected readonly langs = DEMO_LANGS;
  protected readonly langLabels = DEMO_LANG_LABELS;

  readonly #model = signal<I18nDemoModel>(createInitialI18nDemoModel());

  readonly demoForm = form(this.#model, i18nDemoSchema, {
    submission: {
      action: async () => {
        await new Promise<void>((resolve) => {
          setTimeout(resolve, 500);
        });
        this.#model.set(createInitialI18nDemoModel());
        this.demoForm().reset();
      },
      onInvalid: createOnInvalidHandler(),
    },
  });

  /**
   * `<label>` text is plain interpolation, not a registry — labels there are
   * translated by hand so the demo also shows the "surrounding UI copy" case,
   * separate from `provideFieldLabels()` (which only affects the error
   * summary and any other consumer that resolves field paths, e.g.
   * assistive components).
   */
  protected fieldLabel(
    field: keyof I18nDemoModel,
    fallbackKey: string,
  ): string {
    const dict = FIELD_LABELS[this.langService.lang()];
    return dict[field] ?? fallbackKey;
  }

  /**
   * Submit/Reset/Saving text, translated so nothing under the region-scoped
   * `[attr.lang]` on the template's wrapping `<div>` is left in English while
   * that `lang` attribute claims otherwise.
   */
  protected uiStrings(): (typeof UI_STRINGS)[DemoLang] {
    return UI_STRINGS[this.langService.lang()];
  }

  protected resetForm(): void {
    this.demoForm().reset();
    this.#model.set(createInitialI18nDemoModel());
  }
}

export type { DemoLang };
