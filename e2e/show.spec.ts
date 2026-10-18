import { expect, test, type Page } from '@playwright/test';
import {
  blockExternalTraffic,
  createResponseGate,
  mockEpisodeHistoryActions,
  mockShowPageApi,
  mockTmdb,
  mockTmdbImageSize,
  mockTrakt,
  mockWatchlistAdd,
  mockWatchlistRemove,
  pathEquals,
} from './helpers/api';
import { seedApp } from './helpers/seed';
import { recordedNames, recordTransitionNames, STILL_TRANSITION_NAME } from './helpers/transitions';
import {
  breakingBad,
  makeEpisode,
  makeEpisodeFull,
  makeShowProgress,
  makeTmdbEpisode,
  makeTmdbSeason,
  makeTmdbShow,
  makeWatchedShowsSeed,
  makeWatchlistItem,
  type Episode,
} from './helpers/fixtures';

const nextEpisode: Episode = makeEpisode(breakingBad, { season: 1, number: 2, title: 'The Next' });

const watchedSeed = {
  ...makeWatchedShowsSeed([{ show: breakingBad, completed: 1, next: nextEpisode }]),
  tmdbEpisodes: {
    [`${breakingBad.ids.tmdb}-1-2`]: makeTmdbEpisode(breakingBad, 1, 2),
  },
};

const episodeAfterNext: Episode = makeEpisode(breakingBad, {
  season: 1,
  number: 3,
  title: 'A New Beginning',
});
const seenFlowSeedBase = makeWatchedShowsSeed([
  { show: breakingBad, completed: 1, next: nextEpisode },
]);
const seenFlowSeed = {
  ...seenFlowSeedBase,
  showsEpisodes: {
    ...seenFlowSeedBase.showsEpisodes,
    [`${breakingBad.ids.trakt}-1-2`]: makeEpisodeFull(breakingBad, {
      season: 1,
      number: 2,
      title: 'The Next',
      firstAired: '2020-01-01T20:00:00.000Z',
    }),
    [`${breakingBad.ids.trakt}-1-3`]: makeEpisodeFull(breakingBad, {
      season: 1,
      number: 3,
      title: episodeAfterNext.title ?? 'A New Beginning',
      firstAired: '2020-01-08T20:00:00.000Z',
    }),
  },
  tmdbEpisodes: {
    [`${breakingBad.ids.tmdb}-1-2`]: makeTmdbEpisode(breakingBad, 1, 2),
    [`${breakingBad.ids.tmdb}-1-3`]: makeTmdbEpisode(breakingBad, 1, 3),
  },
  tmdbSeasons: {
    [`${breakingBad.ids.tmdb}-1`]: makeTmdbSeason(breakingBad.ids.tmdb ?? 0, {
      seasonNumber: 1,
      episodes: [makeTmdbEpisode(breakingBad, 1, 2), makeTmdbEpisode(breakingBad, 1, 3)],
    }),
  },
};

test.describe('Show page', () => {
  test.beforeEach(async ({ page }) => {
    await blockExternalTraffic(page);
  });

  /** The Show page and the Episode page of its next episode, with a still on both: the two views a
   *  morph moves between. */
  async function mockEpisodeStill(page: Page): Promise<void> {
    await seedApp(page, {
      ...watchedSeed,
      tmdbEpisodes: {
        [`${breakingBad.ids.tmdb}-1-2`]: makeTmdbEpisode(
          breakingBad,
          1,
          2,
          'The Next',
          '/still.jpg',
        ),
      },
      tmdbSeasons: {
        [`${breakingBad.ids.tmdb}-1`]: makeTmdbSeason(breakingBad.ids.tmdb ?? 0, {
          seasonNumber: 1,
          episodes: [makeTmdbEpisode(breakingBad, 1, 2, 'The Next', '/still.jpg')],
        }),
      },
    });
    await mockShowPageApi(
      page,
      breakingBad,
      makeShowProgress(breakingBad, {
        completed: 1,
        nextEpisode,
        lastEpisodeSeason: 1,
        lastEpisodeNumber: 1,
      }),
    );
    await mockTrakt(page, pathEquals(`/shows/${breakingBad.ids.trakt}/seasons/1`), [
      makeEpisodeFull(breakingBad, { season: 1, number: 2, title: 'The Next' }),
    ]);
    // The Episode page refetches this Episode when it opens, so the block on the way back reads it
    // again rather than the cached copy.
    await mockTrakt(
      page,
      pathEquals(`/shows/${breakingBad.ids.trakt}/seasons/1/episodes/2`),
      makeEpisodeFull(breakingBad, { season: 1, number: 2, title: 'The Next' }),
    );
    await mockTmdb(
      page,
      pathEquals(`/3/tv/${breakingBad.ids.tmdb}/season/1/episode/2`),
      makeTmdbEpisode(breakingBad, 1, 2, 'The Next', '/still.jpg'),
    );
    await mockTmdbImageSize(page, 'original', 1920, 1080);
    await mockTmdbImageSize(page, 'w300', 300, 169);
  }

  test('shows the show header and the next episode', async ({ page }) => {
    await seedApp(page, watchedSeed);
    await mockShowPageApi(
      page,
      breakingBad,
      makeShowProgress(breakingBad, {
        completed: 1,
        nextEpisode: nextEpisode,
        lastEpisodeSeason: 1,
        lastEpisodeNumber: 1,
      }),
    );

    await page.goto('/shows/s/breaking-bad');

    await expect(page.getByRole('heading', { name: 'Breaking Bad' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Next episode' })).toBeVisible();
    await expect(page.getByText('The Next')).toBeVisible();
  });

  test('opens the poster in the lightbox when the artwork arrives after page load', async ({
    page,
  }) => {
    await seedApp(page);
    await mockShowPageApi(page, breakingBad);
    // The poster is part of the TMDB show response; holding that back means the artwork link only
    // appears well after the page rendered. It still has to open in the lightbox instead of
    // falling through to a new tab.
    await mockTmdb(
      page,
      pathEquals(`/3/tv/${breakingBad.ids.tmdb}`),
      makeTmdbShow(breakingBad, { posterPath: '/poster.jpg' }),
      { delayMs: 900 },
    );
    await mockTmdbImageSize(page, 'w185', 185, 278);

    await page.goto('/shows/s/breaking-bad');

    const poster = page.locator('t-show-header a.image-link');
    await expect(poster).toBeVisible();
    await poster.click();

    await expect(page.locator('.pswp--open')).toBeVisible();
  });

  test('closes the poster lightbox with the browser back button instead of leaving the page', async ({
    page,
  }) => {
    await seedApp(page);
    await mockShowPageApi(page, breakingBad);
    await mockTmdb(
      page,
      pathEquals(`/3/tv/${breakingBad.ids.tmdb}`),
      makeTmdbShow(breakingBad, { posterPath: '/poster.jpg' }),
    );
    await mockTmdbImageSize(page, 'w185', 185, 278);

    await page.goto('/shows/s/breaking-bad');

    const poster = page.locator('t-show-header a.image-link');
    await expect(poster).toBeVisible();
    await poster.click();
    await expect(page.locator('.pswp--open')).toBeVisible();
    await expect(page).toHaveURL(/#artwork=poster$/);

    await page.goBack();

    // Back gives up the viewer's own history entry, so it closes the viewer and the Show page
    // stays — the route does not change under an open overlay.
    await expect(page.locator('.pswp--open')).toHaveCount(0);
    await expect(page).toHaveURL(/\/shows\/s\/breaking-bad$/);
    await expect(page.getByRole('heading', { name: 'Breaking Bad' })).toBeVisible();
  });

  test('opens the poster again when the browser goes forward onto the named entry', async ({
    page,
  }) => {
    await seedApp(page);
    await mockShowPageApi(page, breakingBad);
    await mockTmdb(
      page,
      pathEquals(`/3/tv/${breakingBad.ids.tmdb}`),
      makeTmdbShow(breakingBad, { posterPath: '/poster.jpg' }),
    );
    await mockTmdbImageSize(page, 'w185', 185, 278);

    await page.goto('/shows/s/breaking-bad');

    const poster = page.locator('t-show-header a.image-link');
    await expect(poster).toBeVisible();
    await poster.click();
    await expect(page.locator('.pswp--open')).toBeVisible();

    await page.goBack();
    await expect(page.locator('.pswp--open')).toHaveCount(0);

    await page.goForward();

    await expect(page.locator('.pswp--open')).toBeVisible();
    await expect(page).toHaveURL(/#artwork=poster$/);
  });

  test('opens the poster named by a shared URL on load', async ({ page }) => {
    await seedApp(page);
    await mockShowPageApi(page, breakingBad);
    await mockTmdb(
      page,
      pathEquals(`/3/tv/${breakingBad.ids.tmdb}`),
      makeTmdbShow(breakingBad, { posterPath: '/poster.jpg' }),
    );
    await mockTmdbImageSize(page, 'w185', 185, 278);

    await page.goto('/shows/s/breaking-bad#artwork=poster');

    // The poster is not on the page until its TMDB response arrives, so the viewer waits for it.
    await expect(page.locator('.pswp--open')).toBeVisible();
    await expect(page).toHaveURL(/#artwork=poster$/);
  });

  test('adds the show to the watchlist from the header', async ({ page }) => {
    await seedApp(page);
    await mockShowPageApi(page, breakingBad);
    mockWatchlistAdd(page, breakingBad);

    await page.goto('/shows/s/breaking-bad');

    await page.getByRole('button', { name: 'Add to watchlist' }).click();
    await expect(page.getByRole('button', { name: 'Remove from watchlist' })).toBeVisible();
  });

  test('removes the show from the watchlist from the header', async ({ page }) => {
    await seedApp(page, { watchlist: [makeWatchlistItem(breakingBad)] });
    await mockShowPageApi(page, breakingBad);
    mockWatchlistRemove(page, breakingBad);

    await page.goto('/shows/s/breaking-bad');

    await page.getByRole('button', { name: 'Remove from watchlist' }).click();
    await expect(page.getByRole('button', { name: 'Add to watchlist' })).toBeVisible();
  });

  test('marks the next episode as seen and advances to the next episode', async ({ page }) => {
    const addGate = createResponseGate();
    await seedApp(page, seenFlowSeed);
    await mockShowPageApi(
      page,
      breakingBad,
      makeShowProgress(breakingBad, {
        completed: 1,
        nextEpisode: nextEpisode,
        lastEpisodeSeason: 1,
        lastEpisodeNumber: 1,
      }),
    );
    mockEpisodeHistoryActions(page);
    await page.route('https://api.trakt.tv/sync/history', async (route) => {
      await addGate.wait;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ added: { episodes: [] }, not_found: { episodes: [] } }),
      });
    });

    await page.goto('/shows/s/breaking-bad');

    const markSeen = page.getByRole('button', { name: 'Mark as seen' });
    await expect(markSeen).toBeEnabled();
    const addRequestPromise = page.waitForRequest(
      (request) =>
        request.method() === 'POST' && new URL(request.url()).pathname === '/sync/history',
    );
    await markSeen.click();
    await expect(markSeen).toBeDisabled();
    await expect(page.locator('t-episode mat-spinner')).toHaveCount(0);

    const addRequest = await addRequestPromise;
    expect(addRequest.postDataJSON()).toMatchObject({ episodes: [{ ids: nextEpisode.ids }] });
    addGate.release();
    await expect(page.getByText('A New Beginning')).toBeVisible();
  });

  test('morphs the next episode still into the Episode page', async ({ page }) => {
    const messages: string[] = [];
    page.on('console', (message) => {
      if (message.type() === 'error' || message.type() === 'warning') {
        messages.push(message.text());
      }
    });

    await recordTransitionNames(page);
    await mockEpisodeStill(page);

    await page.goto('/shows/s/breaking-bad');

    const still = page.locator('t-episode-still a.still-wrapper');
    await expect(still).toBeVisible();
    await still.click();

    await expect(page).toHaveURL('/shows/s/breaking-bad/season/1/episode/2');
    await expect(page.locator('t-episode-still .still-wrapper')).toHaveCSS(
      'view-transition-name',
      STILL_TRANSITION_NAME,
    );

    // The click names the Show page's still, and only it: the artwork morphs into the Episode page's
    // own copy of it.
    expect((await recordedNames(page)).old).toEqual([[STILL_TRANSITION_NAME]]);
    expect(messages.filter((text) => /duplicate view-transition-name/i.test(text))).toEqual([]);
  });

  test('morphs the still back into the next episode block', async ({ page }) => {
    const messages: string[] = [];
    page.on('console', (message) => {
      if (message.type() === 'error' || message.type() === 'warning') {
        messages.push(message.text());
      }
    });

    await recordTransitionNames(page);
    await mockEpisodeStill(page);

    await page.goto('/shows/s/breaking-bad');
    await page.locator('t-episode-still a.still-wrapper').click();
    await expect(page).toHaveURL('/shows/s/breaking-bad/season/1/episode/2');

    await page.goBack();

    await expect(page).toHaveURL('/shows/s/breaking-bad');
    // A back navigation carries no Episode, so the Show page reads the URL that was left to name
    // its own still, by the time the browser captures the new view of the way back.
    await expect(page.locator('t-episode-still a.still-wrapper')).toHaveCSS(
      'view-transition-name',
      STILL_TRANSITION_NAME,
    );

    expect((await recordedNames(page)).new.at(-1)).toContain(STILL_TRANSITION_NAME);
    expect(messages.filter((text) => /duplicate view-transition-name/i.test(text))).toEqual([]);
  });
});
