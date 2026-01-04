/**
 * Test setup for @ngx-signal-forms/toolkit
 *
 * Configures Angular testing environment for zoneless Angular with Vitest 4.
 *
 * Angular's testing module auto-registers beforeEach/afterEach cleanup hooks
 * when globals are enabled. These hooks call resetTestingModule() based on
 * the destroyAfterEach setting.
 *
 * We set destroyAfterEach: false to prevent automatic teardown and handle
 * cleanup manually to ensure TestBed stays properly initialized.
 */
import '@analogjs/vitest-angular/setup-snapshots';
import '@angular/compiler';
import '@testing-library/jest-dom/vitest';

import { NgModule, provideZonelessChangeDetection } from '@angular/core';
import { getTestBed } from '@angular/core/testing';
import {
  BrowserTestingModule,
  platformBrowserTesting,
} from '@angular/platform-browser/testing';

@NgModule({
  providers: [provideZonelessChangeDetection()],
})
class ZonelessTestModule {}

getTestBed().initTestEnvironment(
  [BrowserTestingModule, ZonelessTestModule],
  platformBrowserTesting(),
  { teardown: { destroyAfterEach: false } },
);
