import { DEMO_PATHS } from '@ngx-signal-forms/demo-shared';
import { BaseFormPage } from './base-form.page';
/**
 * Page Object for "Advanced - Global Configuration" demo
 * Route: /advanced-scenarios/global-configuration
 *
 * Demonstrates global form configuration settings
 */
export class GlobalConfigurationPage extends BaseFormPage {
  async goto(): Promise<void> {
    await this.gotoRoute(DEMO_PATHS.globalConfiguration);
  }
}
