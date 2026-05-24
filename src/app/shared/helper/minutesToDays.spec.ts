import { minutesToDays } from './minutesToDays';

describe('minutesToDays', () => {
  it('should format minutes to days, hours, and minutes', () => {
    // 1 day = 1440 mins. 1 hour = 60 mins.
    // 1440 + 60 + 1 = 1501 mins
    expect(minutesToDays(1501)).toBe('1 day 1 hour 1 minute');

    // 2 days (2880), 2 hours (120), 2 minutes (2) = 3002 mins
    expect(minutesToDays(3002)).toBe('2 days 2 hours 2 minutes');
  });

  it('should handle zero minutes correctly', () => {
    expect(minutesToDays(0)).toBe('0 days 0 hours 0 minutes');
  });
});
