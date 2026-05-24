import { sum } from './sum';

describe('sum', () => {
  it('should return 0 for undefined or empty array', () => {
    expect(sum(undefined)).toBe(0);
    expect(sum([])).toBe(0);
  });

  it('should sum elements of number array correctly', () => {
    expect(sum([1, 2, 3])).toBe(6);
    expect(sum([-5, 5, 10])).toBe(10);
  });
});
