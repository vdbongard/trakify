import { minutesToDays } from './minutesToDays';

describe('minutesToDays', () => {
  it('should format minutes to days, hours, and minutes', () => {
    expect(minutesToDays(1501)).toBe('1 day 1 hour 1 minute');

    expect(minutesToDays(3002)).toBe('2 days 2 hours 2 minutes');
  });

  it('should handle zero minutes correctly', () => {
    expect(minutesToDays(0)).toBe('0 days 0 hours 0 minutes');
  });
});
