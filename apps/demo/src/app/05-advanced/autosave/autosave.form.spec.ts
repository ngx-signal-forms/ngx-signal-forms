import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideNgxSignalFormsConfig } from '@ngx-signal-forms/toolkit';
import { fireEvent, render, screen } from '@testing-library/angular';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { AUTOSAVE_ENDPOINT } from './autosave.api';
import { AutosaveComponent } from './autosave.form';

/**
 * Regression coverage for #366: `debounce()` marks a field `dirty()`
 * *synchronously* on input, but only updates `value()` once the 500ms
 * debounce elapses (`ReadonlyFieldState.value`'s own doc comment in
 * `@angular/forms/signals`: "updates from the UI control are eventually
 * reflected here, they may be delayed if debounced"). Before the fix in
 * `autosave.form.ts`, the `dirtyValidPatch` gate read `dirty()` and
 * `value()` together in that window and PATCHed the field's *previous*
 * settled value — not the edit the user just made — and, because the
 * mocked backend's 400ms delay is shorter than the 500ms debounce, that
 * premature save resolved before the debounce elapsed: the post-save
 * reconciliation's no-argument `reset()` then aborted the still-pending
 * debounce sync and reverted the control.
 *
 * `vi.useFakeTimers()` + `HttpTestingController` drive the debounce and
 * the HTTP round trip deterministically (no real timers, no real
 * network), which is what makes it possible to assert on the request
 * dispatched *before* 500ms has elapsed (there must be none) as well as
 * the one dispatched after. This app is zoneless (see `main.ts`), so
 * `@angular/core/testing`'s zone-based `fakeAsync`/`tick` are not
 * available here — plain `vi.advanceTimersByTimeAsync` plus
 * `fixture.detectChanges()` stands in for them.
 */
describe('AutosaveComponent (#366 — settled-value autosave)', () => {
  let httpMock: HttpTestingController;

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    httpMock?.verify();
    vi.useRealTimers();
  });

  async function setup() {
    const rendered = await render(AutosaveComponent, {
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideNgxSignalFormsConfig({
          defaultErrorStrategy: 'on-touch',
          autoAria: true,
        }),
      ],
    });
    httpMock = TestBed.inject(HttpTestingController);
    return rendered;
  }

  it('never PATCHes before the debounce settles, then PATCHes exactly the settled value', async () => {
    const { fixture } = await setup();

    const bio = screen.getByLabelText(/bio/i) as HTMLTextAreaElement;
    const settledValue = 'Historian of computing, and so much more.';

    fireEvent.input(bio, { target: { value: settledValue } });
    fixture.detectChanges();

    // Right after the input event — `dirty()` is already true, but the
    // 500ms debounce has not elapsed. The fix must not have dispatched
    // anything yet.
    await vi.advanceTimersByTimeAsync(400);
    fixture.detectChanges();
    httpMock.expectNone(AUTOSAVE_ENDPOINT);

    // Past the debounce window: exactly one PATCH, carrying the settled
    // value (not the pre-edit value).
    await vi.advanceTimersByTimeAsync(200);
    fixture.detectChanges();
    const req = httpMock.expectOne(AUTOSAVE_ENDPOINT);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({ bio: settledValue });

    req.flush({ savedAt: new Date().toISOString() });
    await vi.advanceTimersByTimeAsync(0);
    fixture.detectChanges();

    // The control must retain the settled edit — not revert.
    expect(bio.value).toBe(settledValue);
  });

  it('leaves the field pristine once the settled save resolves', async () => {
    const { fixture } = await setup();
    const component = fixture.componentInstance;

    const bio = screen.getByLabelText(/bio/i) as HTMLTextAreaElement;
    fireEvent.input(bio, { target: { value: 'A settled edit.' } });
    fixture.detectChanges();

    await vi.advanceTimersByTimeAsync(500);
    fixture.detectChanges();
    const req = httpMock.expectOne(AUTOSAVE_ENDPOINT);
    req.flush({ savedAt: new Date().toISOString() });
    await vi.advanceTimersByTimeAsync(0);
    fixture.detectChanges();

    expect(component.profileForm.bio().dirty()).toBe(false);
  });

  it('reaches the failure state on a settled value containing the failure marker, and Retry save reissues it', async () => {
    const { fixture } = await setup();

    const bio = screen.getByLabelText(/bio/i) as HTMLTextAreaElement;
    fireEvent.input(bio, { target: { value: 'FAIL_SAVE this please' } });
    fixture.detectChanges();

    await vi.advanceTimersByTimeAsync(500);
    fixture.detectChanges();
    const req = httpMock.expectOne(AUTOSAVE_ENDPOINT);
    expect(req.request.body).toEqual({ bio: 'FAIL_SAVE this please' });
    req.flush(
      { error: 'Could not persist this change.' },
      { status: 500, statusText: 'Internal Server Error' },
    );
    await vi.advanceTimersByTimeAsync(0);
    fixture.detectChanges();

    const retryButton = screen.getByRole('button', { name: /retry save/i });
    expect(retryButton).toBeInTheDocument();
    // The field is still unsaved after a failure.
    expect(bio.value).toBe('FAIL_SAVE this please');

    fireEvent.click(retryButton);
    fixture.detectChanges();
    await vi.advanceTimersByTimeAsync(0);
    fixture.detectChanges();

    const retryReq = httpMock.expectOne(AUTOSAVE_ENDPOINT);
    // Retry re-issues the same (still-failing) value.
    expect(retryReq.request.body).toEqual({ bio: 'FAIL_SAVE this please' });
    retryReq.flush({ savedAt: new Date().toISOString() });
    await vi.advanceTimersByTimeAsync(0);
    fixture.detectChanges();
  });

  it('succeeds on the next debounce cycle once the failure marker is removed', async () => {
    const { fixture } = await setup();

    const bio = screen.getByLabelText(/bio/i) as HTMLTextAreaElement;
    fireEvent.input(bio, { target: { value: 'FAIL_SAVE this please' } });
    fixture.detectChanges();
    await vi.advanceTimersByTimeAsync(500);
    fixture.detectChanges();

    const failingReq = httpMock.expectOne(AUTOSAVE_ENDPOINT);
    failingReq.flush(
      { error: 'Could not persist this change.' },
      { status: 500, statusText: 'Internal Server Error' },
    );
    await vi.advanceTimersByTimeAsync(0);
    fixture.detectChanges();

    fireEvent.input(bio, { target: { value: 'This is fine now.' } });
    fixture.detectChanges();
    await vi.advanceTimersByTimeAsync(500);
    fixture.detectChanges();

    const req = httpMock.expectOne(AUTOSAVE_ENDPOINT);
    expect(req.request.body).toEqual({ bio: 'This is fine now.' });
    req.flush({ savedAt: new Date().toISOString() });
    await vi.advanceTimersByTimeAsync(0);
    fixture.detectChanges();

    expect(bio.value).toBe('This is fine now.');
    expect(
      screen.queryByRole('button', { name: /retry save/i }),
    ).not.toBeInTheDocument();
  });

  it('omits an invalid field without blocking a valid sibling from saving', async () => {
    const { fixture } = await setup();

    const displayName = screen.getByLabelText(
      /display name/i,
    ) as HTMLInputElement;
    const bio = screen.getByLabelText(/bio/i) as HTMLTextAreaElement;

    // Invalid: below the 2-character minimum.
    fireEvent.input(displayName, { target: { value: 'A' } });
    fireEvent.input(bio, { target: { value: 'A valid bio update.' } });
    fixture.detectChanges();

    await vi.advanceTimersByTimeAsync(500);
    fixture.detectChanges();

    const req = httpMock.expectOne(AUTOSAVE_ENDPOINT);
    expect(req.request.body).toEqual({ bio: 'A valid bio update.' });
    req.flush({ savedAt: new Date().toISOString() });
    await vi.advanceTimersByTimeAsync(0);
    fixture.detectChanges();
  });

  it('keeps a field dirty when it is edited again, mid-debounce, while its earlier save is still in flight', async () => {
    const { fixture } = await setup();
    const component = fixture.componentInstance;

    const bio = screen.getByLabelText(/bio/i) as HTMLTextAreaElement;

    // First edit settles and dispatches a PATCH.
    fireEvent.input(bio, { target: { value: 'First settled edit.' } });
    fixture.detectChanges();
    await vi.advanceTimersByTimeAsync(500);
    fixture.detectChanges();
    const firstReq = httpMock.expectOne(AUTOSAVE_ENDPOINT);
    expect(firstReq.request.body).toEqual({ bio: 'First settled edit.' });

    // Before that request resolves, the user types again. This starts a
    // new debounce for `bio`; `controlValue()` moves on immediately, but
    // `value()` won't catch up until this second debounce elapses.
    fireEvent.input(bio, { target: { value: 'Second edit, mid-flight.' } });
    fixture.detectChanges();
    // Still short of the second debounce's own 500ms.
    await vi.advanceTimersByTimeAsync(200);
    fixture.detectChanges();

    // The first request now resolves. At this instant,
    // `profileForm().value()` still equals what was sent (the second
    // debounce hasn't synced yet), so `fieldsSafeToMarkSaved()` alone
    // would call this field safe to mark saved. The reconcile guard must
    // still refuse to reset it, because doing so would abort the second,
    // still-pending debounce sync and discard "Second edit, mid-flight."
    firstReq.flush({ savedAt: new Date().toISOString() });
    await vi.advanceTimersByTimeAsync(0);
    fixture.detectChanges();

    expect(component.profileForm.bio().dirty()).toBe(true);
    expect(bio.value).toBe('Second edit, mid-flight.');

    // Once the second debounce elapses, the newer value settles and the
    // next cycle autosaves it for real.
    await vi.advanceTimersByTimeAsync(300);
    fixture.detectChanges();
    const secondReq = httpMock.expectOne(AUTOSAVE_ENDPOINT);
    expect(secondReq.request.body).toEqual({
      bio: 'Second edit, mid-flight.',
    });
    secondReq.flush({ savedAt: new Date().toISOString() });
    await vi.advanceTimersByTimeAsync(0);
    fixture.detectChanges();

    expect(component.profileForm.bio().dirty()).toBe(false);
    expect(bio.value).toBe('Second edit, mid-flight.');
  });

  it('reset demo restores the initial model and pristine state', async () => {
    const { fixture } = await setup();
    const component = fixture.componentInstance;

    const bio = screen.getByLabelText(/bio/i) as HTMLTextAreaElement;
    fireEvent.input(bio, { target: { value: 'A throwaway edit.' } });
    fixture.detectChanges();

    // A throwaway edit that never gets the chance to settle/save.
    fireEvent.click(screen.getByRole('button', { name: /reset demo/i }));
    fixture.detectChanges();
    await vi.advanceTimersByTimeAsync(0);
    fixture.detectChanges();

    expect(component.profileForm.bio().dirty()).toBe(false);
    expect(bio.value.startsWith('Mathematician and writer')).toBe(true);

    // `reset(value)` must actually cancel the throwaway edit's pending
    // debounce sync, not just leave it racing in the background — advance
    // past its 500ms window before asserting nothing was ever dispatched,
    // so a debounce that (wrongly) survived the reset would still have
    // time to fire and be caught here.
    await vi.advanceTimersByTimeAsync(600);
    fixture.detectChanges();
    httpMock.expectNone(AUTOSAVE_ENDPOINT);
  });
});
