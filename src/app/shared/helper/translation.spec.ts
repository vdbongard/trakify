import { translated, translatedOrUndefined } from './translation';

describe('translation helpers', () => {
  describe('translatedOrUndefined', () => {
    it('should return undefined if translationObject is missing or empty', () => {
      expect(translatedOrUndefined(undefined)).toBeUndefined();
      expect(translatedOrUndefined({})).toBeUndefined();
    });

    it('should return translated object if translationObject is present', () => {
      const show = { title: 'Old Title', overview: 'Old Overview' };
      const translation = { title: 'New Title', overview: 'New Overview' };
      const result = translatedOrUndefined(show, translation);

      expect(result?.title).toBe('New Title');
      expect(result?.overview).toBe('New Overview');
    });
  });

  describe('translated', () => {
    it('should fallback to original values if no translation is passed', () => {
      const show = {
        title: 'Original Title',
        name: 'Original Name',
        overview: 'Original Overview',
      };
      const result = translated(show);

      expect(result.title).toBe('Original Title');
      expect(result.name).toBe('Original Name');
      expect(result.overview).toBe('Original Overview');
    });
  });
});
