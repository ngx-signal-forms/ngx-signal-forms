/**
 * Test setup for demo application
 *
 * Configures Angular testing environment for zoneless Angular with Vitest 4.
 * Uses @analogjs/vitest-angular which handles TestBed initialization and cleanup.
 *
 * @see https://analogjs.org/docs/features/testing/vitest#zoneless-setup
 */
import '@analogjs/vitest-angular/setup-snapshots';
import '@angular/compiler';

import { setupTestBed } from '@analogjs/vitest-angular/setup-testbed';

setupTestBed({ zoneless: true });
