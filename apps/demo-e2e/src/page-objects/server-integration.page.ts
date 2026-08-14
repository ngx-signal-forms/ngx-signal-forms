import { DEMO_PATHS } from '@ngx-signal-forms/demo-shared';
import { Locator, Page } from '@playwright/test';
import {
  ROLE_ALERT_SELECTOR,
  ROLE_STATUS_SELECTOR,
} from '../fixtures/aria-selectors';
import { BaseFormPage } from './base-form.page';

/**
 * `ProfileApiService#loadProfile()` (server-integration.api.ts) delays its
 * resolution by exactly this many milliseconds via a plain `setTimeout` —
 * not `HttpClient`/MSW, so there is nothing for `page.route` to gate. Kept
 * in sync with `SIMULATED_LATENCY_MS` in that file; only used to identify
 * the specific `setTimeout` call to hold in {@link ServerIntegrationPage.holdPrefillTimer}.
 */
const PREFILL_DELAY_MS = 400;

/**
 * Global hook name installed by {@link ServerIntegrationPage.holdPrefillTimer}
 * for {@link ServerIntegrationPage.releasePrefillTimer} to call.
 */
const RELEASE_HOOK = '__ngxE2EReleasePrefillTimer';

/**
 * Page Object for "Advanced - Server Integration" demo
 * Route: /advanced-scenarios/server-integration
 *
 * Prefills from a fake `resource()`-backed API, submits an edit, and maps
 * server-side field/form errors back onto the form via a native
 * `TreeValidationResult`.
 */
export class ServerIntegrationPage extends BaseFormPage {
  readonly nameInput: Locator;
  readonly emailInput: Locator;
  readonly saveButton: Locator;
  readonly resetButton: Locator;
  readonly reloadButton: Locator;
  readonly loadingIndicator: Locator;
  readonly successBanner: Locator;
  readonly formBanner: Locator;
  readonly emailFieldError: Locator;

  constructor(page: Page) {
    super(page);
    this.nameInput = this.page.getByRole('textbox', { name: 'Name' });
    this.emailInput = this.page.getByRole('textbox', { name: 'Email' });
    this.saveButton = this.page.getByRole('button', {
      name: /^(Save profile|Saving…)$/,
    });
    this.resetButton = this.page.getByRole('button', { name: 'Reset' });
    this.reloadButton = this.page.getByRole('button', {
      name: /^(Reload from server|Reloading…)$/,
    });
    this.loadingIndicator = this.page.locator(ROLE_STATUS_SELECTOR, {
      hasText: 'Loading profile from server',
    });
    this.successBanner = this.page.locator(ROLE_STATUS_SELECTOR, {
      hasText: 'Profile saved',
    });
    this.formBanner = this.page.locator(ROLE_ALERT_SELECTOR, {
      hasText: 'Could not save profile',
    });
    this.emailFieldError = this.page.locator(ROLE_ALERT_SELECTOR, {
      hasText: 'This email is already taken.',
    });
  }

  async goto(): Promise<void> {
    await this.gotoRoute(DEMO_PATHS.serverIntegration);
  }

  /**
   * Deterministically holds the profile prefill open before the resource
   * resolves — the same "gate on a manually-resolved promise" pattern this
   * suite uses elsewhere via `page.route`, adapted for a demo with no
   * network call to gate.
   *
   * `ProfileApiService` isn't backed by `HttpClient`/MSW, so there is no
   * request to intercept, and Playwright's Clock API is not an option
   * either: freezing time from before navigation (the only way to guarantee
   * the 400ms `setTimeout` never fires early) also freezes the timers
   * Angular's own zoneless change-detection scheduler depends on, so the
   * page never renders past the shell at all (verified: with the clock
   * paused pre-navigation, neither the loading indicator nor the form ever
   * mounts, even after `fastForward`).
   *
   * Instead, an init script installed before any app code runs intercepts
   * exactly one `setTimeout` call requesting {@link PREFILL_DELAY_MS} — the
   * one `delay()` call the prefill's `resource()` loader makes — and holds
   * it unfired. The interception is **one-shot**: the moment that first
   * matching call is captured, `window.setTimeout` is restored to the
   * native implementation immediately (not merely after release), so it
   * cannot also swallow the *later* 400ms `setTimeout` calls the Save/Reload
   * actions make on this same page (`SIMULATED_LATENCY_MS` is shared across
   * all three). Every other `setTimeout`/`setInterval` call — including
   * Angular's own scheduling — passes through untouched throughout. The
   * held timer only ever fires once {@link releasePrefillTimer} calls it
   * explicitly, so the loading indicator is guaranteed to still be mounted
   * no matter how long bootstrap itself takes.
   *
   * Must be called before {@link goto}.
   */
  async holdPrefillTimer(): Promise<void> {
    await this.page.addInitScript(
      ({ delayMs, releaseHookName }) => {
        const originalSetTimeout = window.setTimeout.bind(window);
        let held: { handler: TimerHandler; args: unknown[] } | undefined;

        (window as unknown as Record<string, () => void>)[releaseHookName] =
          () => {
            if (held) {
              originalSetTimeout(held.handler, 0, ...held.args);
              held = undefined;
            }
          };

        window.setTimeout = ((
          handler: TimerHandler,
          timeout?: number,
          ...args: unknown[]
        ) => {
          if (timeout === delayMs && !held) {
            held = { handler, args };
            // One-shot: restore the native setTimeout immediately so no
            // later 400ms call (e.g. Save/Reload, which share the same
            // simulated latency) is ever intercepted.
            window.setTimeout = originalSetTimeout;
            return 0 as unknown as ReturnType<typeof window.setTimeout>;
          }
          return originalSetTimeout(handler, timeout, ...args);
        }) as typeof window.setTimeout;
      },
      { delayMs: PREFILL_DELAY_MS, releaseHookName: RELEASE_HOOK },
    );
  }

  /** Releases the `setTimeout` held by {@link holdPrefillTimer}, letting the prefill resolve. */
  async releasePrefillTimer(): Promise<void> {
    await this.page.evaluate((releaseHookName) => {
      (window as unknown as Record<string, () => void>)[releaseHookName]();
    }, RELEASE_HOOK);
  }

  /**
   * The `invalid()`/`submitting()`/`dirty()`/`touched()` debug readout
   * rendered by the form itself (public DOM). Scoped to `this.form` because
   * the split-layout right pane also mounts `NgxSignalFormDebugger`, which
   * echoes the same `dirty()`/`touched()` text inside a `<code>` block.
   */
  debugLine(
    signalName: 'invalid' | 'submitting' | 'dirty' | 'touched',
    value: boolean,
  ): Locator {
    return this.form.getByText(`${signalName}(): ${value}`, { exact: true });
  }

  async save(): Promise<void> {
    await this.saveButton.click();
  }

  async reload(): Promise<void> {
    await this.reloadButton.click();
  }
}
