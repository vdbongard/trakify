import { seasonTitle } from './seasonTitle';

describe('seasonTitle', () => {
  it('should return Specials for season 0 with no title', () => {
    expect(seasonTitle(0, null)).toBe('Specials');
    expect(seasonTitle('0', undefined)).toBe('Specials');
  });

  it('should return "Season N" for a season number with no title', () => {
    expect(seasonTitle(1, null)).toBe('Season 1');
    expect(seasonTitle('2', undefined)).toBe('Season 2');
  });

  it('should return the title as-is if it already includes "Season"', () => {
    expect(seasonTitle(1, 'Season 1')).toBe('Season 1');
    expect(seasonTitle(2, 'Season 2')).toBe('Season 2');
  });

  it('should append season number if title does not include "Season"', () => {
    expect(seasonTitle(1, 'The Beginning')).toBe('The Beginning - Season 1');
    expect(seasonTitle(5, 'Final Chapter')).toBe('Final Chapter - Season 5');
  });
});
