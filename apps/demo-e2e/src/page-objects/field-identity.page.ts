import { DEMO_PATHS } from '@ngx-signal-forms/demo-shared';
import type { Locator, Page } from '@playwright/test';
import { BaseFormPage } from './base-form.page';

/**
 * Page Object for the Field Identity demo page.
 * Route: /form-field-wrapper/field-identity
 *
 * The page's whole point is that the control's DOM `id` is *not* the field
 * name, so nothing here may address a control by a field-name id. Controls
 * are reached through their wrapper, which is keyed by the declared name.
 */
export class FieldIdentityPage extends BaseFormPage {
  readonly route = DEMO_PATHS.fieldIdentity;

  readonly emailWrapper: Locator;
  readonly deliveryWrapper: Locator;

  readonly emailControl: Locator;
  readonly deliveryControl: Locator;

  readonly emailProbe: Locator;

  readonly deliveryDetails: Locator;
  readonly deliverySummary: Locator;

  readonly onTouchModeRadio: Locator;

  constructor(page: Page) {
    super(page);

    this.emailWrapper = this.form.locator('[data-testid="email-field"]');
    this.deliveryWrapper = this.form.locator('[data-testid="delivery-field"]');

    this.emailControl = this.emailWrapper.locator('input');
    this.deliveryControl = this.deliveryWrapper.locator('input');

    this.emailProbe = this.emailWrapper.locator(
      '[data-testid="identity-probe"]',
    );
    this.deliveryDetails = this.form.locator(
      '[data-testid="delivery-details"]',
    );
    this.deliverySummary = this.deliveryDetails.locator('summary');

    this.onTouchModeRadio = this.page.getByRole('radio', {
      name: 'On Touch (Recommended)',
    });
  }

  async goto(): Promise<void> {
    await this.gotoRoute(this.route);
  }

  /**
   * Every `aria-describedby` token on a control, paired with whether it
   * resolves to an element that exists in the document.
   *
   * Deliberately mirrors the page's own on-screen readout
   * (`IdentityProbeComponent`) rather than reading it: this runs in
   * Playwright's `evaluate`, so a bug in the readout cannot hide a bug in
   * the attributes.
   */
  describedByTokens(
    control: Locator,
  ): Promise<{ id: string; resolves: boolean }[]> {
    return control.evaluate((el) =>
      (el.getAttribute('aria-describedby') ?? '')
        .split(/\s+/u)
        .filter(Boolean)
        .map((id) => ({ id, resolves: document.getElementById(id) !== null })),
    );
  }

  /** Collapse or expand the delivery section through the summary. */
  async setDeliveryExpanded(expanded: boolean): Promise<void> {
    const isOpen = await this.deliveryDetails.evaluate(
      (el) => (el as HTMLDetailsElement).open,
    );
    if (isOpen !== expanded) {
      await this.deliverySummary.click();
    }
  }
}
