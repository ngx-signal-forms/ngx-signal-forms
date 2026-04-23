import { DEMO_PATHS } from '@ngx-signal-forms/demo-shared';
import type { Locator, Page } from '@playwright/test';
import { BaseFormPage } from './base-form.page';

/**
 * Page Object for Fieldset Appearance demo page.
 * Route: /form-field-wrapper/fieldset-appearance
 */
export class FieldsetAppearancePage extends BaseFormPage {
  readonly route = DEMO_PATHS.fieldsetAppearance;

  readonly borderedShellButton: Locator;
  readonly semanticOnlyShellButton: Locator;
  readonly autoFeedbackButton: Locator;
  readonly plainFeedbackButton: Locator;
  readonly notificationFeedbackButton: Locator;
  readonly defaultToneButton: Locator;
  readonly successToneButton: Locator;
  readonly messageOnlyButton: Locator;
  readonly tintSurfaceButton: Locator;
  readonly topPlacementButton: Locator;
  readonly bottomPlacementButton: Locator;
  readonly groupOnlyButton: Locator;
  readonly includeNestedButton: Locator;
  readonly titleOnButton: Locator;
  readonly titleOffButton: Locator;

  readonly shippingStreetInput: Locator;
  readonly credentialsPasswordInput: Locator;
  readonly credentialsConfirmPasswordInput: Locator;
  readonly deliveryMethodRadios: Locator;

  readonly shippingAddressFieldset: Locator;
  readonly deliveryMethodOptionsFieldset: Locator;
  readonly credentialsFieldset: Locator;

  constructor(page: Page) {
    super(page);

    const fieldsetAppearanceGroup = this.page.getByRole('group', {
      name: 'Fieldset appearance',
    });
    const feedbackAppearanceGroup = this.page.getByRole('group', {
      name: 'Grouped feedback appearance',
    });
    const toneGroup = this.page.getByRole('group', {
      name: 'Fieldset surface tone',
    });
    const validationSurfaceGroup = this.page.getByRole('group', {
      name: 'Validation surface behavior',
    });
    const placementGroup = this.page.getByRole('group', {
      name: 'Grouped message placement',
    });
    const aggregationGroup = this.page.getByRole('group', {
      name: 'Grouped error aggregation mode',
    });
    const titleGroup = this.page.getByRole('group', {
      name: 'Notification title visibility',
    });

    this.borderedShellButton = fieldsetAppearanceGroup.getByRole('button', {
      name: 'Bordered',
    });
    this.semanticOnlyShellButton = fieldsetAppearanceGroup.getByRole('button', {
      name: 'Semantic only',
    });

    this.autoFeedbackButton = feedbackAppearanceGroup.getByRole('button', {
      name: 'Auto',
    });
    this.plainFeedbackButton = feedbackAppearanceGroup.getByRole('button', {
      name: 'Plain',
    });
    this.notificationFeedbackButton = feedbackAppearanceGroup.getByRole(
      'button',
      {
        name: 'Notification',
      },
    );

    this.defaultToneButton = toneGroup.getByRole('button', {
      name: 'Default',
    });
    this.successToneButton = toneGroup.getByRole('button', {
      name: 'Success',
    });

    this.messageOnlyButton = validationSurfaceGroup.getByRole('button', {
      name: 'Message only',
    });
    this.tintSurfaceButton = validationSurfaceGroup.getByRole('button', {
      name: 'Tint surface',
    });

    this.topPlacementButton = placementGroup.getByRole('button', {
      name: 'Top',
    });
    this.bottomPlacementButton = placementGroup.getByRole('button', {
      name: 'Bottom',
    });

    this.groupOnlyButton = aggregationGroup.getByRole('button', {
      name: 'Group only',
    });
    this.includeNestedButton = aggregationGroup.getByRole('button', {
      name: 'Include nested',
    });

    this.titleOnButton = titleGroup.getByRole('button', {
      name: 'Title on',
    });
    this.titleOffButton = titleGroup.getByRole('button', {
      name: 'Title off',
    });

    this.shippingStreetInput = this.form.locator('#shippingStreet');
    this.credentialsPasswordInput = this.form.locator('#password');
    this.credentialsConfirmPasswordInput =
      this.form.locator('#confirmPassword');
    this.deliveryMethodRadios = this.form
      .locator('fieldset[fieldsetid="delivery-method-options"]')
      .getByRole('radio');

    this.shippingAddressFieldset = this.form.locator(
      'fieldset[fieldsetid="shipping-address"]',
    );
    this.deliveryMethodOptionsFieldset = this.form.locator(
      'fieldset[fieldsetid="delivery-method-options"]',
    );
    this.credentialsFieldset = this.form.locator(
      'fieldset[fieldsetid="credentials"]',
    );
  }

  override async goto(): Promise<void> {
    await this.page.goto(this.getFullUrl(this.route));
    await this.waitForReady();
  }

  getFieldsetSurface(fieldset: Locator): Locator {
    return fieldset.locator(':scope > .ngx-signal-form-fieldset__surface');
  }

  getGroupedMessages(fieldset: Locator): Locator {
    return fieldset.locator(
      ':scope > .ngx-signal-form-fieldset__surface > .ngx-signal-form-fieldset__messages',
    );
  }

  getGroupedAlert(fieldset: Locator): Locator {
    return this.getGroupedMessages(fieldset).getByRole('alert').first();
  }

  getNotificationTitle(fieldset: Locator): Locator {
    return fieldset.locator('.ngx-form-field-notification__title').first();
  }

  async showSemanticOnlyShell(): Promise<void> {
    await this.semanticOnlyShellButton.click();
  }

  async showBorderedShell(): Promise<void> {
    await this.borderedShellButton.click();
  }

  async showPlainFeedback(): Promise<void> {
    await this.plainFeedbackButton.click();
  }

  async showNotificationFeedback(): Promise<void> {
    await this.notificationFeedbackButton.click();
  }

  async showSuccessTone(): Promise<void> {
    await this.successToneButton.click();
  }

  async showTintSurface(): Promise<void> {
    await this.tintSurfaceButton.click();
  }

  async showTopPlacement(): Promise<void> {
    await this.topPlacementButton.click();
  }

  async showBottomPlacement(): Promise<void> {
    await this.bottomPlacementButton.click();
  }

  async showGroupOnlyAggregation(): Promise<void> {
    await this.groupOnlyButton.click();
  }

  async showIncludeNestedAggregation(): Promise<void> {
    await this.includeNestedButton.click();
  }

  async hideNotificationTitle(): Promise<void> {
    await this.titleOffButton.click();
  }

  async showNotificationTitleToggle(): Promise<void> {
    await this.titleOnButton.click();
  }

  async triggerShippingStreetTouchedError(): Promise<void> {
    await this.shippingStreetInput.focus();
    await this.shippingStreetInput.blur();
  }

  async triggerCredentialsMismatch(): Promise<void> {
    await this.credentialsPasswordInput.fill('abc12345');
    await this.credentialsConfirmPasswordInput.fill('different1');
    await this.credentialsConfirmPasswordInput.focus();
    await this.credentialsConfirmPasswordInput.blur();
  }

  async triggerDeliveryMethodRequiredError(): Promise<void> {
    await this.deliveryMethodRadios.first().focus();
    await this.deliveryMethodRadios.first().blur();
  }
}
