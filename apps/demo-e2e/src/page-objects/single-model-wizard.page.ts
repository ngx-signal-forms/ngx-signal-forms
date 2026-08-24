import { DEMO_PATHS } from '@ngx-signal-forms/demo-shared';
import { Locator, Page } from '@playwright/test';
import { BaseFormPage } from './base-form.page';

/**
 * Page Object for "Advanced - Single-Model Wizard" demo
 * Route: /advanced-scenarios/single-model-wizard
 *
 * A three-step wizard (Account → Shipping → Review) driven by ONE `form()`
 * model, using the shared `ngx-wizard`'s built-in Previous/Next/Submit
 * navigation. The `ngx-wizard`'s `canNavigate` guard validates the active
 * step directly via a shared `#validateStep` helper, gating both the
 * built-in Next button and progress-header clicks alike.
 */
export class SingleModelWizardPage extends BaseFormPage {
  readonly fullNameInput: Locator;
  readonly emailInput: Locator;
  readonly streetInput: Locator;
  readonly cityInput: Locator;
  readonly postalCodeInput: Locator;
  readonly expressShippingCheckbox: Locator;
  readonly nextButton: Locator;
  readonly previousButton: Locator;
  readonly confirmOrderButton: Locator;
  readonly stepHeading: Locator;

  constructor(page: Page) {
    super(page);
    this.fullNameInput = this.page.getByLabel('Full name');
    this.emailInput = this.page.getByLabel('Email');
    this.streetInput = this.page.getByLabel('Street address');
    this.cityInput = this.page.getByLabel('City');
    this.postalCodeInput = this.page.getByLabel('Postal code');
    this.expressShippingCheckbox = this.page.getByLabel(/Express shipping/i);
    this.nextButton = this.page.getByRole('button', { name: 'Next' });
    this.previousButton = this.page.getByRole('button', { name: 'Previous' });
    this.confirmOrderButton = this.page.getByRole('button', {
      name: 'Confirm order',
    });
    // Scoped to the wizard's own step heading — the page also renders an
    // unrelated `<h2>` for the "Demonstrated" example card.
    this.stepHeading = this.page.locator('.single-model-wizard .step-heading');
  }

  async goto(): Promise<void> {
    await this.gotoRoute(DEMO_PATHS.singleModelWizard);
  }

  async fillAccountStep(fullName: string, email: string): Promise<void> {
    await this.fullNameInput.fill(fullName);
    await this.emailInput.fill(email);
  }

  async fillShippingStep(
    street: string,
    city: string,
    postalCode: string,
  ): Promise<void> {
    await this.streetInput.fill(street);
    await this.cityInput.fill(city);
    await this.postalCodeInput.fill(postalCode);
  }

  /** The always-visible running total in the status row. */
  get orderTotal(): Locator {
    return this.page.locator('.order-total');
  }

  /** The read-only order summary shown on the Review step. */
  get orderSummary(): Locator {
    return this.page.locator('.order-summary');
  }

  get successMessage(): Locator {
    return this.page.locator('.success-message');
  }

  /** The shared `ngx-wizard`'s progress-bar fill (`completedSteps.length / steps.length`). */
  get progressFill(): Locator {
    return this.page.locator('.wizard-progress-fill');
  }

  /** The review step's "some details still need attention" alert. */
  get reviewError(): Locator {
    return this.page.locator('.review-error');
  }

  /** A progress-header step button, by its visible label. */
  stepNavButton(label: 'Account' | 'Shipping' | 'Review'): Locator {
    return this.page.locator('.wizard-progress .wizard-step-button', {
      hasText: label,
    });
  }
}
