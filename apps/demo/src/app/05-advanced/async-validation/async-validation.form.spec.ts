import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { fireEvent, render } from '@testing-library/angular';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { AsyncValidationComponent } from './async-validation.form';

describe('Async Validation submission', () => {
  beforeEach(() => vi.useFakeTimers());

  afterEach(() => vi.useRealTimers());

  async function setup() {
    const { fixture, container } = await render(AsyncValidationComponent, {
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });

    const form = container.querySelector('form')!;
    const username = form.querySelector<HTMLInputElement>('#username')!;
    const usernameOnBlur =
      form.querySelector<HTMLInputElement>('#usernameOnBlur')!;
    const submit = form.querySelector<HTMLButtonElement>(
      'button[type="submit"]',
    )!;
    const status = form.querySelector('ngx-submit-status [role="status"]')!;
    const http = TestBed.inject(HttpTestingController);

    async function tick(ms = 0) {
      await vi.advanceTimersByTimeAsync(ms);
      fixture.detectChanges();
    }

    async function enterUsernames() {
      fireEvent.input(username, { target: { value: 'alice' } });
      fireEvent.input(usernameOnBlur, { target: { value: 'bob' } });
      fireEvent.blur(usernameOnBlur);
      await tick(350);
    }

    return { form, username, submit, status, http, tick, enterUsernames };
  }

  it('shows a confirmation when only warnings remain', async () => {
    const { form, status, http, tick, enterUsernames } = await setup();
    await enterUsernames();
    http.expectOne('fake-api/check-user/alice').flush(null, {
      status: 503,
      statusText: 'Service Unavailable',
    });
    http
      .expectOne('fake-api/check-user/bob')
      .flush({ username: 'bob', available: true });
    await tick();

    expect(form.textContent).toContain('Could not verify availability');
    fireEvent.submit(form);
    await tick(1000);

    expect(status).toHaveTextContent('Registration submitted.');
    http.verify();
  });

  it('focuses the first blocking error and leaves the confirmation empty', async () => {
    const { form, username, status, http, tick } = await setup();
    fireEvent.submit(form);
    await tick(1000);

    expect(username).toHaveFocus();
    expect(username).toHaveAttribute('aria-invalid', 'true');
    expect(status).toBeEmptyDOMElement();
    http.verify();
  });

  it('blocks an attempted submit while availability is pending', async () => {
    const { form, submit, status, http, tick, enterUsernames } = await setup();
    await enterUsernames();

    expect(submit).toHaveAttribute('aria-disabled', 'true');
    fireEvent.submit(form);
    await tick();
    http
      .expectOne('fake-api/check-user/alice')
      .flush({ username: 'alice', available: true });
    http
      .expectOne('fake-api/check-user/bob')
      .flush({ username: 'bob', available: true });
    await tick(1000);

    expect(submit).not.toHaveAttribute('aria-disabled', 'true');
    expect(status).toBeEmptyDOMElement();
    http.verify();
  });
});
