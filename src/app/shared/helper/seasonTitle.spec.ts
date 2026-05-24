import { seasonTitle } from './seasonTitle';

describe('seasonTitle', () => {
  it('should throw error if title is empty/null/undefined', () => {
    expect(() => seasonTitle(null)).toThrow('Empty season title');
  });

  it('should return Specials if title is Season 0', () => {
    expect(seasonTitle('Season 0')).toBe('Specials');
  });

  it('should return the original title for other seasons', () => {
    expect(seasonTitle('Season 1')).toBe('Season 1');
    expect(seasonTitle('Custom Title')).toBe('Custom Title');
  });
});
