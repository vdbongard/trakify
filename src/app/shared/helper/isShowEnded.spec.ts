import { isShowEnded } from './isShowEnded';
import { TmdbShow } from '@type/Tmdb';

describe('isShowEnded', () => {
  it('should return true if status is Ended or Canceled', () => {
    expect(isShowEnded({ status: 'Ended' } as TmdbShow)).toBe(true);
    expect(isShowEnded({ status: 'Canceled' } as TmdbShow)).toBe(true);
  });

  it('should return false for other statuses', () => {
    expect(isShowEnded({ status: 'Returning Series' } as TmdbShow)).toBe(false);
    expect(isShowEnded({ status: 'In Production' } as TmdbShow)).toBe(false);
  });
});
