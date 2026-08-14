import { DEMO_PATHS } from '@ngx-signal-forms/demo-shared';
import { Locator, Page } from '@playwright/test';
import { BaseFormPage } from './base-form.page';

/**
 * Page Object for the "Advanced - Autosave" demo
 * Route: /advanced-scenarios/autosave
 *
 * Debounced, field-level autosave (`debounce()` + a dirty+valid+settled gate
 * + `httpResource`) with no submit button — see
 * `apps/demo/src/app/05-advanced/autosave/README.md`. Exposes only public
 * surfaces: the two form controls, the two fixed-role save-status live
 * regions, the Retry/Reset buttons, and the visible dirty()/valid() debug
 * readout the page renders — never internal component state.
 */
export class AutosavePage extends BaseFormPage {
  readonly displayNameInput: Locator;
  readonly bioTextarea: Locator;
  readonly retryButton: Locator;
  readonly resetButton: Locator;

  constructor(page: Page) {
    super(page);
    this.displayNameInput = this.page.locator('#autosave-display-name');
    this.bioTextarea = this.page.locator('#autosave-bio');
    this.retryButton = this.page.getByRole('button', { name: 'Retry save' });
    this.resetButton = this.page.getByRole('button', { name: 'Reset demo' });
  }

  async goto(): Promise<void> {
    await this.gotoRoute(DEMO_PATHS.autosave);
  }

  /**
   * The polite save-status live region ("Saving…" / "All changes saved.").
   * Scoped to a direct child of `<form>` — the wrapper's own per-field
   * `role="status"`/`role="alert"` regions live nested inside
   * `ngx-form-field-wrapper`, one level deeper, so this selector never
   * collides with them.
   */
  get saveStatusRegion(): Locator {
    return this.form.locator('> [role="status"]');
  }

  /** The assertive failed-save live region, paired with the Retry button. */
  get saveErrorRegion(): Locator {
    return this.form.locator('> [role="alert"]');
  }

  /**
   * The hand-rolled `displayName: dirty()=… valid()=…` debug readout line.
   * Not anchored to the start of the text: Angular's template whitespace
   * (indentation around the interpolations) survives into `textContent`, so
   * a `^`-anchored regex never matches — a substring match is what's needed.
   */
  get displayNameStateReadout(): Locator {
    return this.page.getByText(/displayName: dirty\(\)=/);
  }

  /** The hand-rolled `bio: dirty()=… valid()=…` debug readout line. */
  get bioStateReadout(): Locator {
    return this.page.getByText(/\bbio: dirty\(\)=/);
  }
}
