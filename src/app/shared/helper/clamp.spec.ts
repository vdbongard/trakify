import { clamp } from './clamp';

describe('clamp', () => {
  it('should clamp value to min if value is less than min', () => {
    expect(clamp(1, 5, 10)).toBe(5);
    expect(clamp(-10, -5, 5)).toBe(-5);
  });

  it('should clamp value to max if value is greater than max', () => {
    expect(clamp(15, 5, 10)).toBe(10);
    expect(clamp(10, -5, 5)).toBe(5);
  });

  it('should return value if value is between min and max', () => {
    expect(clamp(7, 5, 10)).toBe(7);
    expect(clamp(0, -5, 5)).toBe(0);
  });
});
