import { toEpisodeId, toSeasonId } from './toShowId';

describe('toShowId helpers', () => {
  describe('toEpisodeId', () => {
    it('should create compound episode ID string', () => {
      expect(toEpisodeId(123, 1, 5)).toBe('123-1-5');
    });
  });

  describe('toSeasonId', () => {
    it('should create compound season ID string', () => {
      expect(toSeasonId(123, 2)).toBe('123-2');
    });
  });
});
