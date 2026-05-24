import { mod } from './mod';

describe('mod', () => {
  it('should return 0 if either argument is undefined', () => {
    expect(mod(undefined, 5)).toBe(0);
    expect(mod(5, undefined)).toBe(0);
    expect(mod(undefined, undefined)).toBe(0);
  });

  it('should return correct modulo for positive numbers', () => {
    expect(mod(7, 5)).toBe(2);
    expect(mod(10, 5)).toBe(0);
  });

  it('should return correct positive modulo for negative numbers', () => {
    expect(mod(-1, 5)).toBe(4);
    expect(mod(-5, 5)).toBe(0);
  });
});
