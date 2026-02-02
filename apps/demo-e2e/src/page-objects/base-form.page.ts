import { Locator, Page } from '@playwright/test';

/**
 * Base Page Object for all forms in the demo app
 * Provides common functionality and patterns
 */
export abstract class BaseFormPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  /**
   * Helper to construct absolute URL if baseURL is missing in context
   */
  protected getFullUrl(route: string): string {
    // If validation fails in CI due to missing baseURL, fallback to manual construction
    // This provides robustness across different runners
    if (route.startsWith('/')) {
      const baseUrl = process.env['BASE_URL'] || 'http://localhost:4200';
      // Remove trailing slash from base and leading from route to avoid double slash
      const cleanBase = baseUrl.replace(/\/$/, '');
      const cleanRoute = route.replace(/^\//, '');
      return `${cleanBase}/${cleanRoute}`;
    }
    return route;
  }

  /**
   * Navigate to the form page
   * Must be implemented by subclasses
   */
  abstract goto(): Promise<void>;

  /**
   * Get the main form element
   */
  get form(): Locator {
    return this.page.locator('form').first();
  }

  /**
   * Get all error alert elements
   */
  get errorAlerts(): Locator {
    return this.page.locator('[role="alert"]');
  }

  /**
   * Get all warning status elements
   */
  get warningStatuses(): Locator {
    return this.page.locator('[role="status"]');
  }

  /**
   * Get submit button by text pattern
   */
  getSubmitButton(namePattern: string | RegExp): Locator {
    return this.page.getByRole('button', { name: namePattern });
  }

  /**
   * Get input field by id
   */
  getInputById(id: string): Locator {
    return this.page.locator(`input#${id}`);
  }

  /**
   * Get textarea by id
   */
  getTextareaById(id: string): Locator {
    return this.page.locator(`textarea#${id}`);
  }

  /**
   * Get select by id
   */
  getSelectById(id: string): Locator {
    return this.page.locator(`select#${id}`);
  }

  /**
   * Fill form field by id
   */
  async fillField(id: string, value: string): Promise<void> {
    const field = this.page.locator(`#${id}`);
    await field.fill(value);
  }

  /**
   * Wait for page to be ready
   */
  async waitForReady(): Promise<void> {
    await this.page.waitForLoadState('domcontentloaded');
  }
}

/**
 * Base Page Object for forms with error mode switching
 */
export abstract class ErrorStrategyFormPage extends BaseFormPage {
  /**
   * Get error mode radio buttons
   */
  get errorModeRadios() {
    return {
      immediate: this.page.getByRole('radio', { name: 'Immediate' }),
      onTouch: this.page.getByRole('radio', {
        name: 'On Touch (Recommended)',
      }),
      onSubmit: this.page.getByRole('radio', { name: 'On Submit' }),
      manual: this.page.getByRole('radio', { name: 'Manual' }),
    };
  }

  /**
   * Select an error display mode
   */
  async selectErrorMode(
    mode: 'immediate' | 'onTouch' | 'onSubmit' | 'manual',
  ): Promise<void> {
    await this.errorModeRadios[mode].check();
  }
}
