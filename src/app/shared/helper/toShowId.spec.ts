import { toEpisodeId, toSeasonId } from './toShowId';

describe('toShowId helpers', () => {
  describe('toEpisodeId', () => {
    it('should create compound episode ID string', () => {
      expect(toEpisodeId(123, 1, 5)).toBe('123-1-5');
    });

    it('should throw error if any parameter is missing', () => {
      expect(() => toEpisodeId(null, 1, 5)).toThrow('Argument is empty (episodeId)');
      expect(() => toEpisodeId(123, undefined, 5)).toThrow('Argument is empty (episodeId)');
      expect(() => toEpisodeId(123, 1, undefined)).toThrow('Argument is empty (episodeId)');
    });
  });

  describe('toSeasonId', () => {
    it('should create compound season ID string', () => {
      expect(toSeasonId(123, 2)).toBe('123-2');
    });

    it('should throw error if parameters are missing', () => {
      expect(() => toSeasonId(null, 2)).toThrow('Argument is empty (seasonId)');
      expect(() => toSeasonId(123, undefined)).toThrow('Argument is empty (seasonId)');
    });
  });
});
