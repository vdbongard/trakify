import { setTimeoutMin } from './setTimeoutMin';
import { vi } from 'vitest';

describe('setTimeoutMin', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should immediately invoke callback if duration already exceeds minDurationMs', () => {
    const callback = vi.fn();
    const timeStart = new Date(new Date().getTime() - 1000);
    setTimeoutMin(callback, timeStart, 500);

    expect(callback).toHaveBeenCalled();
  });

  it('should delay callback if duration does not exceed minDurationMs', () => {
    const callback = vi.fn();
    const timeStart = new Date();
    setTimeoutMin(callback, timeStart, 1000);

    expect(callback).not.toHaveBeenCalled();

    vi.advanceTimersByTime(500);
    expect(callback).not.toHaveBeenCalled();

    vi.advanceTimersByTime(500);
    expect(callback).toHaveBeenCalled();
  });
});
