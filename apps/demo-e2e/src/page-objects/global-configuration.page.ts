import { Page } from '@playwright/test';
import { BaseFormPage } from './base-form.page';

/**
 * Page Object for "Advanced - Global Configuration" demo
 * Route: /advanced/global-configuration
 *
 * Demonstrates global form configuration settings
 */
export class GlobalConfigurationPage extends BaseFormPage {
  constructor(page: Page) {
    super(page);
  }

  async goto(): Promise<void> {
    await this.page.goto('/advanced/global-configuration');
    await this.waitForReady();
  }
}
