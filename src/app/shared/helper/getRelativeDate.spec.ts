import { getRelativeDate } from './getRelativeDate';
import { vi } from 'vitest';

describe('getRelativeDate', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-05-24T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should return empty string if no date is provided', () => {
    expect(getRelativeDate(null, 'yyyy-MM-dd')).toBe('');
    expect(getRelativeDate(undefined, 'yyyy-MM-dd')).toBe('');
  });

  it('should return formatted absolute date if it is more than a week away', () => {
    const farDate = '2026-06-15T12:00:00Z';
    // Angular formatDate will be called.
    const result = getRelativeDate(farDate, 'yyyy-MM-dd');
    expect(result).toBe('2026-06-15');
  });

  it('should return relative day string if within a week', () => {
    const nearDate = '2026-05-27T12:00:00Z'; // 3 days later
    const result = getRelativeDate(nearDate, 'yyyy-MM-dd');
    expect(result).toBe('In 3 days (Wed.)');
  });
});
