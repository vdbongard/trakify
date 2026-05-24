import { toUrl } from './toUrl';

describe('toUrl', () => {
  it('should replace placeholders in order', () => {
    const template = 'shows/%/seasons/%/episodes/%';
    const result = toUrl(template, ['breaking-bad', '1', '5']);
    expect(result).toBe('shows/breaking-bad/seasons/1/episodes/5');
  });

  it('should clear remaining placeholders if too few arguments are provided', () => {
    const template = 'shows/%/seasons/%';
    const result = toUrl(template, ['breaking-bad']);
    expect(result).toBe('shows/breaking-bad/seasons/');
  });
});
