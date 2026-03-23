import '@angular/compiler';
import '@analogjs/vitest-angular/setup-snapshots';
import { NgModule, provideZonelessChangeDetection } from '@angular/core';
import {
  ɵgetCleanupHook as getCleanupHook,
  getTestBed,
} from '@angular/core/testing';
import {
  BrowserTestingModule,
  platformBrowserTesting,
} from '@angular/platform-browser/testing';
import { afterEach, beforeEach } from 'vitest';

const ANGULAR_BROWSER_TESTBED_SETUP = Symbol.for(
  'ngx-signal-forms:toolkit:testbed-setup:browser',
);

beforeEach(getCleanupHook(false));
afterEach(getCleanupHook(true));

if (!Reflect.get(globalThis, ANGULAR_BROWSER_TESTBED_SETUP)) {
  @NgModule({
    providers: [provideZonelessChangeDetection()],
  })
  class ZonelessBrowserTestModule {}

  getTestBed().initTestEnvironment(
    [BrowserTestingModule, ZonelessBrowserTestModule],
    platformBrowserTesting(),
    { teardown: { destroyAfterEach: false } },
  );

  Reflect.set(globalThis, ANGULAR_BROWSER_TESTBED_SETUP, true);
}
