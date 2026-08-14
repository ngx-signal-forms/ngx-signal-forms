import { DEMO_PATHS } from '@ngx-signal-forms/demo-shared';
import { BaseFormPage } from './base-form.page';

const LANG_NAMES = {
  en: 'English',
  nl: 'Nederlands',
  ja: '日本語',
} as const;

/**
 * Page Object for "Advanced - i18n: Runtime Language Switch" demo
 * Route: /advanced-scenarios/i18n
 *
 * Demonstrates provideErrorMessages()/provideFieldLabels() factories that
 * react to a runtime language switch.
 */
export class I18nDemoPage extends BaseFormPage {
  async goto(): Promise<void> {
    await this.gotoRoute(DEMO_PATHS.i18n);
  }

  get fullNameInput() {
    return this.page.locator('#i18n-full-name');
  }

  get emailInput() {
    return this.page.locator('#i18n-email');
  }

  get emailLabel() {
    return this.page.locator('label[for="i18n-email"]');
  }

  langSwitch(lang: keyof typeof LANG_NAMES) {
    return this.page.getByRole('button', { name: LANG_NAMES[lang] });
  }

  get errorSummary() {
    return this.page.locator(
      '[data-testid="i18n-error-summary"] [role="alert"]',
    );
  }
}
