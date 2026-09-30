import { afterEach, describe, expect, it, vi } from 'vitest';
import { ProfileApiService } from './server-integration.api';

/**
 * `failNextLoad` is a one-shot switch for the request that starts next. A
 * visitor who toggles it while a load is in flight must not change the
 * outcome of that load.
 */
describe('ProfileApiService.failNextLoad', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('applies to the load that starts after it is set, and clears itself', async () => {
    vi.useFakeTimers();
    const api = new ProfileApiService();
    api.failNextLoad.set(true);

    const failing = api.loadProfile().catch((error: unknown) => error);
    expect(api.failNextLoad()).toBe(false);
    await vi.runAllTimersAsync();
    expect(await failing).toEqual(
      expect.objectContaining({
        message: expect.stringContaining('unavailable'),
      }),
    );

    const next = api.loadProfile();
    await vi.runAllTimersAsync();
    await expect(next).resolves.toEqual({
      name: 'Grace Hopper',
      email: 'grace@example.com',
    });
  });

  it('does not fail a load that is already in flight when the flag is set', async () => {
    vi.useFakeTimers();
    const api = new ProfileApiService();

    const inFlight = api.loadProfile();
    api.failNextLoad.set(true);
    await vi.runAllTimersAsync();

    await expect(inFlight).resolves.toBeDefined();
    expect(api.failNextLoad()).toBe(true);
  });
});
