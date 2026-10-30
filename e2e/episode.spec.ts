import { expect, test } from '@playwright/test';
import {
  blockExternalTraffic,
  createResponseGate,
  mockEpisodeHistoryActions,
  mockShowPageApi,
  mockTmdb,
  mockTmdbImageSize,
  mockTrakt,
  pathEquals,
} from './helpers/api';
import { seedApp } from './helpers/seed';
import { recordTransitionNames, STILL_TRANSITION_NAME } from './helpers/transitions';
import {
  breakingBad,
  makeEpisodeFull,
  makeEpisode,
  makeShowProgress,
  makeTmdbEpisode,
  makeTmdbSeason,
  makeWatchedShowsSeed,
} from './helpers/fixtures';

const episode1 = makeEpisodeFull(breakingBad, { season: 1, number: 1, title: 'Pilot' });
const episode2 = makeEpisodeFull(breakingBad, {
  season: 1,
  number: 2,
  title: "Cat's in the Bag",
});

/** Where the fade test below leaves the state it saw the returned still mount in. */
type StillObservationWindow = Window & { stillStartsHidden?: boolean | null };

test.describe('Episode page', () => {
  test.beforeEach(async ({ page }) => {
    await blockExternalTraffic(page);
    await mockShowPageApi(page, breakingBad);
    await mockTrakt(page, pathEquals('/shows/1/seasons/1'), [episode1, episode2]);
    await mockEpisodeHistoryActions(page);
  });

  test('shows the episode header with breadcrumbs', async ({ page }) => {
    await seedApp(page);

    await page.goto('/shows/s/breaking-bad/season/1/episode/1');

    await expect(page.getByRole('heading', { name: 'Pilot', level: 1 })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Breaking Bad' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Season 1' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Episode 1' })).toBeVisible();
  });

  test('disables previous on the first episode and navigates to the next', async ({ page }) => {
    await seedApp(page);

    await page.goto('/shows/s/breaking-bad/season/1/episode/1');

    await expect(page.getByLabel('Previous episode')).toBeDisabled();
    await expect(page.getByLabel('Next episode')).toHaveAttribute(
      'href',
      '/shows/s/breaking-bad/season/1/episode/2',
    );

    await page.getByLabel('Next episode').click();
    await expect(page).toHaveURL(/\/shows\/s\/breaking-bad\/season\/1\/episode\/2$/);
  });

  test('shows the next episode title from the season list before its detail lands', async ({
    page,
  }) => {
    await seedApp(page);
    const detailGate = createResponseGate();
    await page.route(
      (url) => url.pathname === '/shows/1/seasons/1/episodes/2',
      async (route) => {
        await detailGate.wait;
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(episode2),
        });
      },
    );

    await page.goto('/shows/s/breaking-bad/season/1/episode/1');
    await expect(page.getByRole('heading', { name: 'Pilot', level: 1 })).toBeVisible();

    const detailRequest = page.waitForRequest(
      (request) => new URL(request.url()).pathname === '/shows/1/seasons/1/episodes/2',
    );
    await page.getByLabel('Next episode').click();
    await detailRequest;

    await expect(page).toHaveURL(/\/shows\/s\/breaking-bad\/season\/1\/episode\/2$/);
    // The season list already carries the title; the header must not fall back to "Episode 2"
    // while the Episode detail request is still in flight.
    await expect(page.getByRole('heading', { name: "Cat's in the Bag", level: 1 })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Episode 2', level: 1 })).toHaveCount(0);

    // Once the detail lands, the same title stays — no swap and no late number fallback.
    detailGate.release();
    await expect(page.locator('t-episode')).toBeVisible();
    await expect(page.getByRole('heading', { name: "Cat's in the Bag", level: 1 })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Episode 2', level: 1 })).toHaveCount(0);
  });

  test('keeps the still of the episode the Show page linked to out of the next episode', async ({
    page,
  }) => {
    const secondEpisode = makeEpisodeFull(breakingBad, {
      season: 1,
      number: 2,
      title: "Cat's in the Bag",
    });
    const thirdEpisode = makeEpisodeFull(breakingBad, {
      season: 1,
      number: 3,
      title: 'A New Beginning',
    });
    const nextEpisode = makeEpisode(breakingBad, {
      season: 1,
      number: 2,
      title: "Cat's in the Bag",
    });
    const secondStill = makeTmdbEpisode(breakingBad, 1, 2, "Cat's in the Bag", '/second.jpg');
    const thirdStill = makeTmdbEpisode(breakingBad, 1, 3, 'A New Beginning', '/third.jpg');
    const thirdDetailGate = createResponseGate();

    await seedApp(page, {
      ...makeWatchedShowsSeed([{ show: breakingBad, completed: 1, next: nextEpisode }]),
      tmdbEpisodes: {
        [`${breakingBad.ids.tmdb}-1-2`]: secondStill,
        [`${breakingBad.ids.tmdb}-1-3`]: thirdStill,
      },
      tmdbSeasons: {
        [`${breakingBad.ids.tmdb}-1`]: makeTmdbSeason(breakingBad.ids.tmdb ?? 0, {
          seasonNumber: 1,
          episodes: [secondStill, thirdStill],
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
      episode1,
      secondEpisode,
      thirdEpisode,
    ]);
    await mockTrakt(
      page,
      pathEquals(`/shows/${breakingBad.ids.trakt}/seasons/1/episodes/2`),
      secondEpisode,
    );
    await mockTmdb(
      page,
      pathEquals(`/3/tv/${breakingBad.ids.tmdb}/season/1/episode/2`),
      secondStill,
    );
    await mockTmdb(
      page,
      pathEquals(`/3/tv/${breakingBad.ids.tmdb}/season/1/episode/3`),
      thirdStill,
    );
    await page.route(
      (url) => url.pathname === `/shows/${breakingBad.ids.trakt}/seasons/1/episodes/3`,
      async (route) => {
        await thirdDetailGate.wait;
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(thirdEpisode),
        });
      },
    );

    // Arrive from the Show page, so the Episode page carries the still of Episode 2 through the
    // view transition.
    await page.goto('/shows/s/breaking-bad');
    await page.locator('t-episode-still a.still-wrapper').click();
    await expect(page).toHaveURL('/shows/s/breaking-bad/season/1/episode/2');
    await expect(page.locator('t-episode-still img[alt="Episode still"]')).toHaveAttribute(
      'src',
      /second\.jpg/,
    );

    await page.getByLabel('Next episode').click();
    await expect(page).toHaveURL(/\/season\/1\/episode\/3$/);
    await expect(page.getByRole('heading', { name: 'A New Beginning', level: 1 })).toBeVisible();

    // Episode 3's detail is still in flight. The page knows nothing about Episode 3's artwork
    // yet, so it must hold the still's slot open instead of flashing Episode 2's still — and it
    // has no still to morph into either.
    await expect(page.locator('t-episode-still img[alt="Episode still"]')).toHaveCount(0);
    await expect(page.locator('t-episode-still .still-wrapper')).not.toHaveCSS(
      'view-transition-name',
      STILL_TRANSITION_NAME,
    );

    thirdDetailGate.release();
    await expect(page.locator('t-episode-still img[alt="Episode still"]')).toHaveAttribute(
      'src',
      /third\.jpg/,
    );
  });

  test('morphs the still back through the episodes and onto the Show page', async ({ page }) => {
    /** How many transitions the browser has run so far, to pick out the one a navigation starts. */
    const countTransitions = (): Promise<{ old: number; new: number }> =>
      page.evaluate(() => {
        const recorded = (
          window as unknown as {
            recorded: { old: string[][]; new: string[][] };
          }
        ).recorded;
        return { old: recorded.old.length, new: recorded.new.length };
      });

    /** The names on both sides of the transition that started after `before`. The names of the new
     *  view are recorded once its render has been committed, so this waits for that capture. */
    const transitionAfter = async (before: {
      old: number;
      new: number;
    }): Promise<{ old: string[]; new: string[] }> =>
      page.evaluate(async (beforeCounts) => {
        const recorded = (
          window as unknown as {
            recorded: { old: string[][]; new: string[][] };
          }
        ).recorded;
        const deadline = performance.now() + 5000;
        while (
          performance.now() < deadline &&
          (recorded.old.length <= beforeCounts.old || recorded.new.length < recorded.old.length)
        ) {
          await new Promise((resolve) => requestAnimationFrame(resolve));
        }
        return { old: recorded.old.at(-1) ?? [], new: recorded.new.at(-1) ?? [] };
      }, before);

    const firstEpisode = makeEpisode(breakingBad, { season: 1, number: 1, title: 'Pilot' });
    const firstStill = makeTmdbEpisode(breakingBad, 1, 1, 'Pilot', '/first.jpg');
    const secondEpisode = makeEpisodeFull(breakingBad, {
      season: 1,
      number: 2,
      title: "Cat's in the Bag",
    });
    const secondStill = makeTmdbEpisode(breakingBad, 1, 2, "Cat's in the Bag", '/second.jpg');

    await recordTransitionNames(page);
    await seedApp(page, {
      ...makeWatchedShowsSeed([{ show: breakingBad, completed: 0, next: firstEpisode }]),
      tmdbEpisodes: {
        [`${breakingBad.ids.tmdb}-1-1`]: firstStill,
        [`${breakingBad.ids.tmdb}-1-2`]: secondStill,
      },
      tmdbSeasons: {
        [`${breakingBad.ids.tmdb}-1`]: makeTmdbSeason(breakingBad.ids.tmdb ?? 0, {
          seasonNumber: 1,
          episodes: [firstStill, secondStill],
        }),
      },
    });
    await mockShowPageApi(
      page,
      breakingBad,
      makeShowProgress(breakingBad, { completed: 0, nextEpisode: firstEpisode }),
    );
    await mockTrakt(page, pathEquals(`/shows/${breakingBad.ids.trakt}/seasons/1`), [
      episode1,
      secondEpisode,
    ]);
    await mockTrakt(
      page,
      pathEquals(`/shows/${breakingBad.ids.trakt}/seasons/1/episodes/1`),
      episode1,
    );
    await mockTrakt(
      page,
      pathEquals(`/shows/${breakingBad.ids.trakt}/seasons/1/episodes/2`),
      secondEpisode,
    );
    await mockTmdb(
      page,
      pathEquals(`/3/tv/${breakingBad.ids.tmdb}/season/1/episode/1`),
      firstStill,
    );
    await mockTmdb(
      page,
      pathEquals(`/3/tv/${breakingBad.ids.tmdb}/season/1/episode/2`),
      secondStill,
    );
    await mockTmdbImageSize(page, 'original', 1920, 1080);
    await mockTmdbImageSize(page, 'w300', 300, 169);

    await page.goto('/shows/s/breaking-bad');
    await page.locator('t-episode-still a.still-wrapper').click();
    await expect(page).toHaveURL('/shows/s/breaking-bad/season/1/episode/1');
    await expect(page.locator('t-episode-still img[alt="Episode still"]')).toHaveAttribute(
      'src',
      /first\.jpg/,
    );

    await page.getByLabel('Next episode').click();
    await expect(page).toHaveURL(/\/season\/1\/episode\/2$/);
    await expect(page.locator('t-episode-still img[alt="Episode still"]')).toHaveAttribute(
      'src',
      /second\.jpg/,
    );

    // Back to Episode 1: the still of the Episode being left and the one being returned to both
    // carry the name, so the browser morphs between their artwork.
    let before = await countTransitions();
    await page.goBack();
    await expect(page).toHaveURL(/\/season\/1\/episode\/1$/);
    await expect(page.locator('t-episode-still img[alt="Episode still"]')).toHaveAttribute(
      'src',
      /first\.jpg/,
    );
    let names = await transitionAfter(before);
    expect(names.old).toContain(STILL_TRANSITION_NAME);
    expect(names.new).toContain(STILL_TRANSITION_NAME);

    // Back to the Show page: the Show page names its next episode's still on the way back, so the
    // Episode still has to be named too for the two copies to morph.
    before = await countTransitions();
    await page.goBack();
    await expect(page).toHaveURL('/shows/s/breaking-bad');
    await expect(page.locator('t-episode-still a.still-wrapper')).toHaveCSS(
      'view-transition-name',
      STILL_TRANSITION_NAME,
    );
    names = await transitionAfter(before);
    expect(names.old).toContain(STILL_TRANSITION_NAME);
    expect(names.new).toContain(STILL_TRANSITION_NAME);
  });

  test('shows a still it has already had on screen straight away when navigating back', async ({
    page,
  }) => {
    const firstEpisode = makeEpisode(breakingBad, { season: 1, number: 1, title: 'Pilot' });
    const firstStill = makeTmdbEpisode(breakingBad, 1, 1, 'Pilot', '/first.jpg');
    const secondStill = makeTmdbEpisode(breakingBad, 1, 2, "Cat's in the Bag", '/second.jpg');

    await seedApp(page, {
      ...makeWatchedShowsSeed([{ show: breakingBad, completed: 0, next: firstEpisode }]),
      tmdbEpisodes: {
        [`${breakingBad.ids.tmdb}-1-1`]: firstStill,
        [`${breakingBad.ids.tmdb}-1-2`]: secondStill,
      },
      tmdbSeasons: {
        [`${breakingBad.ids.tmdb}-1`]: makeTmdbSeason(breakingBad.ids.tmdb ?? 0, {
          seasonNumber: 1,
          episodes: [firstStill, secondStill],
        }),
      },
    });
    await mockShowPageApi(
      page,
      breakingBad,
      makeShowProgress(breakingBad, { completed: 0, nextEpisode: firstEpisode }),
    );
    await mockTrakt(page, pathEquals(`/shows/${breakingBad.ids.trakt}/seasons/1`), [
      episode1,
      episode2,
    ]);
    await mockTrakt(
      page,
      pathEquals(`/shows/${breakingBad.ids.trakt}/seasons/1/episodes/1`),
      episode1,
    );
    await mockTrakt(
      page,
      pathEquals(`/shows/${breakingBad.ids.trakt}/seasons/1/episodes/2`),
      episode2,
    );
    await mockTmdb(
      page,
      pathEquals(`/3/tv/${breakingBad.ids.tmdb}/season/1/episode/1`),
      firstStill,
    );
    await mockTmdb(
      page,
      pathEquals(`/3/tv/${breakingBad.ids.tmdb}/season/1/episode/2`),
      secondStill,
    );
    await mockTmdbImageSize(page, 'original', 1920, 1080);

    const still = page.locator('t-episode-still img[alt="Episode still"]');

    await page.goto('/shows/s/breaking-bad/season/1/episode/1');
    await expect(still).toHaveAttribute('src', /first\.jpg/);

    await page.getByLabel('Next episode').click();
    await expect(still).toHaveAttribute('src', /second\.jpg/);

    // Episode 1's detail is cached from the visit, so the page comes back to its still without
    // fetching it again. The artwork is already in the browser cache; watch what class the image
    // carries the moment it is pointed back at Episode 1's file, before any frame is painted.
    await page.evaluate(() => {
      const observedWindow = window as StillObservationWindow;
      observedWindow.stillStartsHidden = null;

      const observer = new MutationObserver(() => {
        const image = document.querySelector<HTMLImageElement>(
          't-episode-still img[alt="Episode still"]',
        );
        if (!image?.src.endsWith('/first.jpg')) return;

        observer.disconnect();
        observedWindow.stillStartsHidden = image.classList.contains('not-loaded');
      });
      observer.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['src'],
      });
    });

    await page.getByLabel('Previous episode').click();
    await expect(still).toHaveAttribute('src', /first\.jpg/);

    expect(await page.evaluate(() => (window as StillObservationWindow).stillStartsHidden)).toBe(
      false,
    );
  });

  test('is reachable without being logged in', async ({ page }) => {
    await seedApp(page, {}, { auth: false });

    await page.goto('/shows/s/breaking-bad/season/1/episode/1');

    await expect(page.getByRole('heading', { name: 'Pilot', level: 1 })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Breaking Bad' })).toBeVisible();
  });

  test('opens the still in the lightbox when the artwork arrives after page load', async ({
    page,
  }) => {
    await seedApp(page);
    // The still is part of the TMDB episode response; holding that back means the artwork link
    // only appears well after the page rendered. It still has to open in the lightbox instead of
    // falling through to a new tab.
    await mockTmdb(
      page,
      pathEquals(`/3/tv/${breakingBad.ids.tmdb}/season/1/episode/1`),
      makeTmdbEpisode(breakingBad, 1, 1, 'Pilot', '/still.jpg'),
      { delayMs: 900 },
    );

    await page.goto('/shows/s/breaking-bad/season/1/episode/1');

    const still = page.locator('t-episode a.image-link');
    await expect(still).toBeVisible();
    await still.click();

    await expect(page.locator('.pswp--open')).toBeVisible();
  });

  test('closes the still lightbox with the browser back button instead of leaving the page', async ({
    page,
  }) => {
    await seedApp(page);
    await mockTmdb(
      page,
      pathEquals(`/3/tv/${breakingBad.ids.tmdb}/season/1/episode/1`),
      makeTmdbEpisode(breakingBad, 1, 1, 'Pilot', '/still.jpg'),
    );

    await page.goto('/shows/s/breaking-bad/season/1/episode/1');

    const still = page.locator('t-episode a.image-link');
    await expect(still).toBeVisible();
    await still.click();

    await expect(page.locator('.pswp--open')).toBeVisible();
    await expect(page).toHaveURL(/#artwork=still$/);

    await page.goBack();

    // Back gives up the viewer's own history entry, so it closes the viewer and the Episode page
    // stays — the route does not change under an open overlay.
    await expect(page.locator('.pswp--open')).toHaveCount(0);
    await expect(page).toHaveURL(/\/shows\/s\/breaking-bad\/season\/1\/episode\/1$/);
    await expect(page.getByRole('heading', { name: 'Pilot', level: 1 })).toBeVisible();
  });

  test('opens the still again when the browser goes forward onto the named entry', async ({
    page,
  }) => {
    await seedApp(page);
    await mockTmdb(
      page,
      pathEquals(`/3/tv/${breakingBad.ids.tmdb}/season/1/episode/1`),
      makeTmdbEpisode(breakingBad, 1, 1, 'Pilot', '/still.jpg'),
    );

    await page.goto('/shows/s/breaking-bad/season/1/episode/1');

    const still = page.locator('t-episode a.image-link');
    await expect(still).toBeVisible();
    await still.click();
    await expect(page.locator('.pswp--open')).toBeVisible();

    await page.goBack();
    await expect(page.locator('.pswp--open')).toHaveCount(0);

    await page.goForward();

    // The entry the viewer named is still there, so forward opens the still again.
    await expect(page.locator('.pswp--open')).toBeVisible();
    await expect(page).toHaveURL(/#artwork=still$/);

    await page.goBack();

    // One back still closes it: forward did not leave a second entry behind.
    await expect(page.locator('.pswp--open')).toHaveCount(0);
    await expect(page).toHaveURL(/\/shows\/s\/breaking-bad\/season\/1\/episode\/1$/);
  });

  test('opens the still named by a shared URL on load', async ({ page }) => {
    await seedApp(page);
    await mockTmdb(
      page,
      pathEquals(`/3/tv/${breakingBad.ids.tmdb}/season/1/episode/1`),
      makeTmdbEpisode(breakingBad, 1, 1, 'Pilot', '/still.jpg'),
    );

    await page.goto('/shows/s/breaking-bad/season/1/episode/1#artwork=still');

    // The still is not on the page until its TMDB response arrives, so the viewer waits for it.
    await expect(page.locator('.pswp--open')).toBeVisible();
    await expect(page).toHaveURL(/#artwork=still$/);
  });

  test('toggles an episode from seen to unseen and back through history actions', async ({
    page,
  }) => {
    const removeGate = createResponseGate();
    const addGate = createResponseGate();
    const watchedNext = makeEpisode(breakingBad, {
      season: 1,
      number: 2,
      title: "Cat's in the Bag",
    });
    await seedApp(
      page,
      makeWatchedShowsSeed([
        {
          show: breakingBad,
          completed: 1,
          next: watchedNext,
        },
      ]),
    );
    // The page refetches the detailed progress on open (syncShowProgress) and the
    // generic beforeEach mock answers `completed: 0`; override it with the seeded
    // progress so episode 1 starts out seen.
    await mockTrakt(
      page,
      pathEquals('/shows/1/progress/watched'),
      makeShowProgress(breakingBad, {
        completed: 1,
        nextEpisode: watchedNext,
        lastEpisodeSeason: 1,
        lastEpisodeNumber: 1,
      }),
    );
    await page.route('https://api.trakt.tv/sync/history/remove', async (route) => {
      await removeGate.wait;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ deleted: { episodes: [] }, not_found: { episodes: [] } }),
      });
    });
    await page.route('https://api.trakt.tv/sync/history', async (route) => {
      await addGate.wait;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ added: { episodes: [] }, not_found: { episodes: [] } }),
      });
    });

    await page.goto('/shows/s/breaking-bad/season/1/episode/1');

    const markUnseen = page.getByRole('button', { name: 'Mark as unseen' });
    await expect(markUnseen).toBeEnabled();
    const removeRequestPromise = page.waitForRequest(
      (request) =>
        request.method() === 'POST' && new URL(request.url()).pathname === '/sync/history/remove',
    );
    await markUnseen.click();
    await expect(markUnseen).toBeDisabled();
    await expect(page.locator('t-episode mat-spinner')).toHaveCount(0);
    const removeRequest = await removeRequestPromise;
    expect(removeRequest.postDataJSON()).toMatchObject({ episodes: [{ ids: episode1.ids }] });
    removeGate.release();
    await expect(page.getByRole('button', { name: 'Mark as seen' })).toBeVisible();

    const markSeen = page.getByRole('button', { name: 'Mark as seen' });
    const addRequestPromise = page.waitForRequest(
      (request) =>
        request.method() === 'POST' && new URL(request.url()).pathname === '/sync/history',
    );
    await markSeen.click();
    await expect(markSeen).toBeDisabled();
    await expect(page.locator('t-episode mat-spinner')).toHaveCount(0);
    const addRequest = await addRequestPromise;
    expect(addRequest.postDataJSON()).toMatchObject({ episodes: [{ ids: episode1.ids }] });
    addGate.release();
    await expect(page.getByRole('button', { name: 'Mark as unseen' })).toBeVisible();
  });
});
