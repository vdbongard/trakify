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
    const timeStart = new Date(new Date().getTime() - 1000); // 1s ago
    setTimeoutMin(callback, timeStart, 500); // min 500ms

    expect(callback).toHaveBeenCalled();
  });

  it('should delay callback if duration does not exceed minDurationMs', () => {
    const callback = vi.fn();
    const timeStart = new Date(); // now
    setTimeoutMin(callback, timeStart, 1000); // min 1s

    expect(callback).not.toHaveBeenCalled();

    // Advance timers by less than 1s
    vi.advanceTimersByTime(500);
    expect(callback).not.toHaveBeenCalled();

    // Advance remaining time
    vi.advanceTimersByTime(500);
    expect(callback).toHaveBeenCalled();
  });
});
