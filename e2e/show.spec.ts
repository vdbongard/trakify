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
import {
  recordedNames,
  recordTransitionNames,
  stretchStillTransition,
  STILL_TRANSITION_NAME,
} from './helpers/transitions';
import {
  breakingBad,
  makeEpisode,
  makeEpisodeFull,
  makeShowProgress,
  makeTmdbEpisode,
  makeTmdbSeason,
  makeTmdbShow,
  makeTmdbShowSeason,
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

  /** The Show page and the Episode page of its next episode, with the same artwork on both: the two
   *  views a morph moves between. A null still leaves both showing the fallback image. */
  async function mockEpisodeStill(
    page: Page,
    stillPath: string | null = '/still.jpg',
  ): Promise<void> {
    await seedApp(page, {
      ...watchedSeed,
      tmdbEpisodes: {
        [`${breakingBad.ids.tmdb}-1-2`]: makeTmdbEpisode(breakingBad, 1, 2, 'The Next', stillPath),
      },
      tmdbSeasons: {
        [`${breakingBad.ids.tmdb}-1`]: makeTmdbSeason(breakingBad.ids.tmdb ?? 0, {
          seasonNumber: 1,
          episodes: [makeTmdbEpisode(breakingBad, 1, 2, 'The Next', stillPath)],
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
      makeTmdbEpisode(breakingBad, 1, 2, 'The Next', stillPath),
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

  test('keeps the Progress list poster when the Show page opens', async ({ page }) => {
    const seasonTwo = makeEpisode(breakingBad, { season: 2, number: 1, title: 'The Next' });
    await seedApp(
      page,
      makeWatchedShowsSeed([{ show: breakingBad, completed: 1, next: seasonTwo }]),
    );
    await mockTrakt(page, pathEquals(`/shows/${breakingBad.ids.slug}`), breakingBad);
    await mockTrakt(
      page,
      pathEquals(`/shows/${breakingBad.ids.trakt}/progress/watched`),
      makeShowProgress(breakingBad, {
        completed: 1,
        nextEpisode: seasonTwo,
        lastEpisodeSeason: 1,
        lastEpisodeNumber: 1,
      }),
    );
    // The response the Progress list row and the Show page both carry, with its season posters.
    await mockTmdb(
      page,
      pathEquals(`/3/tv/${breakingBad.ids.tmdb}`),
      makeTmdbShow(breakingBad, {
        posterPath: '/show.jpg',
        seasons: [makeTmdbShowSeason(2, '/season-2.jpg')],
      }),
    );
    // The season detail the Show page fetches for its episodes. It holds the same poster, and
    // answering it late is what used to swap the artwork after the page opened.
    await mockTmdb(
      page,
      pathEquals(`/3/tv/${breakingBad.ids.tmdb}/season/2`),
      {
        ...makeTmdbSeason(breakingBad.ids.tmdb ?? 0, { seasonNumber: 2 }),
        poster_path: '/season-2.jpg',
      },
      { delayMs: 600 },
    );
    await mockTmdbImageSize(page, 'w185', 185, 278);

    await page.goto('/shows/progress');

    const listPoster = page.locator('t-show-list-item img.poster-image').first();
    await expect(listPoster).toHaveAttribute('src', /season-2\.jpg$/);

    // Record every source the header poster takes. Keeping the poster the row showed means the
    // page never paints a different artwork, not that it settles on the right one before a retry
    // gives up.
    await page.evaluate(() => {
      const sources: string[] = [];
      (window as Window & { posterSources?: string[] }).posterSources = sources;
      new MutationObserver(() => {
        const poster = document.querySelector('t-show-header img.poster-thumbnail');
        if (!poster) return;
        const src = (poster as HTMLImageElement).src;
        if (sources[sources.length - 1] !== src) sources.push(src);
      }).observe(document.body, {
        subtree: true,
        childList: true,
        attributes: true,
        attributeFilter: ['src'],
      });
    });

    await page.locator('t-show-list-item-wrapper a').first().click();

    const headerPoster = page.locator('t-show-header img.poster-thumbnail');
    await expect(headerPoster).toHaveAttribute('src', /season-2\.jpg$/);
    // The delayed season response lands here without moving the poster.
    await page.waitForTimeout(900);

    const posterSources = await page.evaluate(
      () => (window as Window & { posterSources?: string[] }).posterSources,
    );
    expect(posterSources).toEqual([expect.stringMatching(/season-2\.jpg$/)]);
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

  test('links the fallback still of the next episode to the Episode page', async ({ page }) => {
    await mockEpisodeStill(page, null);

    await page.goto('/shows/s/breaking-bad');

    const still = page.locator('t-episode-still a.still-wrapper');
    await expect(still.locator('img[alt="Still"]')).toBeVisible();
    await still.click();

    await expect(page).toHaveURL('/shows/s/breaking-bad/season/1/episode/2');
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

  test('holds the outgoing still while there is a copy to morph it into', async ({ page }) => {
    await mockEpisodeStill(page);

    await page.goto('/shows/s/breaking-bad');
    await page.locator('t-episode-still a.still-wrapper').click();
    await expect(page).toHaveURL('/shows/s/breaking-bad/season/1/episode/2');
    await expect(page.locator('t-episode-still .still-wrapper')).toHaveCSS(
      'view-transition-name',
      STILL_TRANSITION_NAME,
    );

    await stretchStillTransition(page);

    await page.goBack();
    await expect(page).toHaveURL('/shows/s/breaking-bad');

    const { outgoingAnimation, incomingBlend } = await page.evaluate(async () => {
      const oldStyle = (): CSSStyleDeclaration =>
        getComputedStyle(document.documentElement, '::view-transition-old(episode-still)');
      const newStyle = (): CSSStyleDeclaration =>
        getComputedStyle(document.documentElement, '::view-transition-new(episode-still)');
      const deadline = performance.now() + 2000;
      // The Show page's still comes up named, so the incoming pseudo is there (and carries this
      // stylesheet's blend override); only then does the outgoing one being held mean anything.
      while (performance.now() < deadline && newStyle().mixBlendMode !== 'normal') {
        await new Promise((resolve) => requestAnimationFrame(resolve));
      }
      return {
        outgoingAnimation: oldStyle().animationName,
        incomingBlend: newStyle().mixBlendMode,
      };
    });
    expect(incomingBlend).toBe('normal');
    // Both sides exist, so the old artwork is held rather than cross-fading to the empty box the
    // Episode page shows until its own still request lands.
    expect(outgoingAnimation).toBe('none');
  });

  test('fades the still out with the page when it has no still to morph into', async ({ page }) => {
    await recordTransitionNames(page);
    await mockEpisodeStill(page);

    await page.goto('/shows/s/breaking-bad');
    await page.locator('t-episode-still a.still-wrapper').click();
    await expect(page).toHaveURL('/shows/s/breaking-bad/season/1/episode/2');
    // The Episode page is left holding the still's name, so it can morph it back onto the Show
    // page or the History row it came from.
    await expect(page.locator('t-episode-still .still-wrapper')).toHaveCSS(
      'view-transition-name',
      STILL_TRANSITION_NAME,
    );

    await stretchStillTransition(page);

    // The Progress page shows no still of this Episode, so there is nothing to morph it into.
    await page.getByRole('link', { name: 'Trakify' }).first().click();
    await expect(page).toHaveURL('/shows/progress');
    await expect(page.getByRole('heading', { name: 'Breaking Bad' })).toBeVisible();

    const names = await recordedNames(page);
    expect(names.old.at(-1)).toContain(STILL_TRANSITION_NAME);
    expect(names.new.at(-1)).not.toContain(STILL_TRANSITION_NAME);

    // With nowhere to morph to, the old copy is the only child of its image pair and has to fade
    // out with the page. Held on top instead, it covers the page arriving behind it for the whole
    // transition (see _view-transition.scss).
    const animationName = await page.evaluate(async () => {
      const read = (): string =>
        getComputedStyle(document.documentElement, '::view-transition-old(episode-still)')
          .animationName;
      const deadline = performance.now() + 2000;
      while (performance.now() < deadline) {
        const name = read();
        if (name && name !== 'none') return name;
        await new Promise((resolve) => requestAnimationFrame(resolve));
      }
      return read();
    });
    expect(animationName).not.toBe('none');
  });

  test('takes the still name off again once the morph back has run', async ({ page }) => {
    await mockEpisodeStill(page);

    await page.goto('/shows/s/breaking-bad');
    await page.locator('t-episode-still a.still-wrapper').click();
    await expect(page).toHaveURL('/shows/s/breaking-bad/season/1/episode/2');

    await page.goBack();

    const still = page.locator('t-episode-still a.still-wrapper');
    await expect(still).toHaveCSS('view-transition-name', STILL_TRANSITION_NAME);
    // The name belongs to that one morph, not to the artwork. Left on, the next navigation out of
    // here — to the Progress page, say, which shows no still of this Episode to morph it into —
    // captures it too, and the browser then holds the artwork on top of the page arriving there
    // instead of morphing it anywhere (see _view-transition.scss).
    await expect(still).not.toHaveCSS('view-transition-name', STILL_TRANSITION_NAME);
  });
});
