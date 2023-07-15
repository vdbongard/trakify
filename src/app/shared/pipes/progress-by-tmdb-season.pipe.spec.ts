import { SeasonProgressBySeasonNumberPipe } from './progress-by-tmdb-season.pipe';

describe('ProgressByTmdbSeasonPipe', () => {
  it('create an instance', () => {
    const pipe = new SeasonProgressBySeasonNumberPipe();
    expect(pipe).toBeTruthy();
  });
});
