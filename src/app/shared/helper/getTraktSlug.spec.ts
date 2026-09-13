import { getTraktSlug } from './getTraktSlug';

describe('getTraktSlug', () => {
  it('should lowercase and replace spaces with hyphens', () => {
    expect(getTraktSlug('Bryan Cranston')).toBe('bryan-cranston');
  });

  it('should strip accents', () => {
    expect(getTraktSlug('Krzysztof Kieślowski')).toBe('krzysztof-kieslowski');
    expect(getTraktSlug('Tchéky Karyo')).toBe('tcheky-karyo');
  });

  it('should convert apostrophes and punctuation to hyphens', () => {
    expect(getTraktSlug("Ed O'Neill")).toBe('ed-o-neill');
    expect(getTraktSlug('D.B. Woodside')).toBe('d-b-woodside');
  });

  it('should trim leading and trailing hyphens', () => {
    expect(getTraktSlug('  Actor One  ')).toBe('actor-one');
    expect(getTraktSlug('.')).toBe('');
  });
});
