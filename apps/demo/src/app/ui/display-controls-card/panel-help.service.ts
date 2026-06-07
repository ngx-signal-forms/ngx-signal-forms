import { Injectable, signal } from '@angular/core';

/**
 * Controls whether the configuration panel reveals the long-form helper
 * descriptions inline. Off by default so the panel reads as a compact,
 * scannable list of controls; the pinned "Details" toggle flips it on.
 *
 * Root-scoped: only one configuration panel is visible at a time, so a single
 * shared flag is sufficient and lets the rail header drive the projected
 * control sections (which resolve DI from the page, not the card).
 */
@Injectable({ providedIn: 'root' })
export class PanelHelpService {
  /** When true, sections render their explanatory descriptions. */
  readonly showDetails = signal(false);

  toggle(): void {
    this.showDetails.update((value) => !value);
  }
}
