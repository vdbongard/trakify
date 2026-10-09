import { expect, test } from '@playwright/test';
import {
  blockExternalTraffic,
  mockTmdb,
  mockTrakt,
  pathEquals,
  pathStartsWith,
} from './helpers/api';
import { seedApp } from './helpers/seed';
import {
  breakingBad,
  makeEpisode,
  makeTmdbShow,
  theWire,
  type Episode,
  type Show,
} from './helpers/fixtures';

function makeAiring(show: Show, episode: Episode, firstAired: string): unknown {
  return { episode, first_aired: firstAired, show };
}

function futureIso(daysFromNow: number): string {
  return new Date(Date.now() + daysFromNow * 24 * 60 * 60 * 1000).toISOString();
}

test.describe('Upcoming', () => {
  test.beforeEach(async ({ page }) => {
    await blockExternalTraffic(page);
    await seedApp(page);
  });

  test('shows no episodes for an account without upcoming episodes', async ({ page }) => {
    await mockTrakt(page, pathStartsWith('/calendars/my/shows/'), []);
    await page.goto('/shows/upcoming');

    await expect(page.getByRole('button', { name: /Load more/ })).toBeVisible();
    await expect(page.getByRole('heading')).toHaveCount(0);
  });

  test('shows upcoming episodes with their next episode details', async ({ page }) => {
    const nextBreakingBad = makeEpisode(breakingBad, { season: 1, number: 2, title: 'The Next' });
    const nextWire = makeEpisode(theWire, { season: 1, number: 3, title: 'The Target' });
    await mockTrakt(page, pathStartsWith('/calendars/my/shows/'), [
      makeAiring(breakingBad, nextBreakingBad, futureIso(7)),
      makeAiring(theWire, nextWire, futureIso(8)),
    ]);
    await mockTmdb(page, pathEquals(`/3/tv/${breakingBad.ids.tmdb}`), makeTmdbShow(breakingBad));
    await mockTmdb(page, pathEquals(`/3/tv/${theWire.ids.tmdb}`), makeTmdbShow(theWire));

    await page.goto('/shows/upcoming');

    await expect(page.getByRole('heading', { name: 'Breaking Bad' }).first()).toBeVisible();
    await expect(page.getByRole('heading', { name: 'The Wire' }).first()).toBeVisible();
    await expect(page.getByText('The Next').first()).toBeVisible();
    await expect(page.getByText('The Target').first()).toBeVisible();
    await expect(page.getByText('S01E02').first()).toBeVisible();
    await expect(page.getByText('S01E03').first()).toBeVisible();
  });

  test('hides past episodes from the upcoming list', async ({ page }) => {
    const upcomingEpisode = makeEpisode(breakingBad, {
      season: 1,
      number: 2,
      title: 'The Next',
    });
    const pastEpisode = makeEpisode(theWire, { season: 1, number: 3, title: 'The Past' });
    await mockTrakt(page, pathStartsWith('/calendars/my/shows/'), [
      makeAiring(breakingBad, upcomingEpisode, futureIso(7)),
      makeAiring(
        theWire,
        pastEpisode,
        new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      ),
    ]);
    await mockTmdb(page, pathEquals(`/3/tv/${breakingBad.ids.tmdb}`), makeTmdbShow(breakingBad));
    await mockTmdb(page, pathEquals(`/3/tv/${theWire.ids.tmdb}`), makeTmdbShow(theWire));

    await page.goto('/shows/upcoming');

    await expect(page.getByRole('heading', { name: 'Breaking Bad' }).first()).toBeVisible();
    await expect(page.getByText('The Next').first()).toBeVisible();
    await expect(page.getByRole('heading', { name: 'The Wire' })).toHaveCount(0);
    await expect(page.getByText('The Past')).toHaveCount(0);
  });
});
