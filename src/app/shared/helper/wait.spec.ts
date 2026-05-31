import { wait } from './wait';
import { vi } from 'vitest';

describe('wait', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should resolve the promise after timeout', async () => {
    const promise = wait(1000);

    let resolved = false;
    promise.then(() => {
      resolved = true;
    });

    expect(resolved).toBe(false);

    vi.advanceTimersByTime(1000);
    await vi.runAllTimersAsync();

    expect(resolved).toBe(true);
  });
});
