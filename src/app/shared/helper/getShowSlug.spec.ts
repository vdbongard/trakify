import { getShowSlug } from './getShowSlug';
import { Show } from '@type/Trakt';

describe('getShowSlug', () => {
  it('should return empty string if show is empty', () => {
    expect(getShowSlug(null)).toBe('');
    expect(getShowSlug(undefined)).toBe('');
  });

  it('should return slug string if slug is not a number', () => {
    const show = { ids: { slug: 'breaking-bad', trakt: 123 } } as unknown as Show;
    expect(getShowSlug(show)).toBe('breaking-bad');
  });

  it('should return trakt id as string if slug is a number', () => {
    const show = { ids: { slug: '12345', trakt: 9876 } } as unknown as Show;
    expect(getShowSlug(show)).toBe('9876');
  });
});
