import { capitalize } from './capitalize';

describe('capitalize', () => {
  it('should capitalize the first letter of a string', () => {
    expect(capitalize('hello')).toBe('Hello');
    expect(capitalize('WORLD')).toBe('WORLD');
    expect(capitalize('a')).toBe('A');
  });

  it('should return empty string if input is empty', () => {
    expect(capitalize('')).toBe('');
  });
});
