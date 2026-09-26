import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { MatTooltip } from '@angular/material/tooltip';
import { ShowHeaderComponent } from './show-header.component';
import { page } from 'vitest/browser';
import { mockShow } from '@shared/mocks/mockShow';
import type { Show } from '@type/Trakt';

describe('ShowHeaderComponent', () => {
  let fixture: ComponentFixture<ShowHeaderComponent>;
  let component: ShowHeaderComponent;

  function createShow(): Show {
    return {
      ...mockShow,
      title: 'My Show',
      ids: {
        ...mockShow.ids,
        trakt: 99,
        slug: 'my-show',
        tmdb: 99,
        tvdb: 99,
        tvrage: 99,
        imdb: 'tt99',
      },
    };
  }

  const LOGO_PATH = 'logo_path' as const;
  const ORIGIN_COUNTRY = 'origin_country' as const;
  const ISO_639_1 = 'iso_639_1' as const;
  const ISO_3166_1 = 'iso_3166_1' as const;
  const PUBLISHED_AT = 'published_at' as const;

  const createTmdbShow = (): Record<string, unknown> => ({
    id: 99,
    name: 'TMDB My Show',
    status: 'Ended',
    networks: [{ id: 1, name: 'HBO', [LOGO_PATH]: null, [ORIGIN_COUNTRY]: 'US' }],
    poster_path: '/poster.jpg',
    overview:
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec posuere nisl vel purus suscipit, sed posuere est scelerisque. '.repeat(
        6,
      ),
    created_by: [],
    episode_run_time: [],
    genres: [],
    homepage: '',
    number_of_episodes: 10,
    seasons: [],
    type: 'Scripted',
    vote_average: 8,
    vote_count: 100,
    videos: {
      results: [
        {
          id: 'video-1',
          [ISO_639_1]: 'en',
          [ISO_3166_1]: 'US',
          key: 'abc123',
          name: 'Trailer',
          official: true,
          [PUBLISHED_AT]: '2020-01-01T00:00:00.000Z',
          site: 'YouTube',
          size: 1080,
          type: 'Trailer',
        },
      ],
    },
  });

  beforeEach(async () => {
    await TestBed.configureTestingModule({}).compileComponents();

    fixture = TestBed.createComponent(ShowHeaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render header skeleton when no data is set', () => {
    const header = fixture.nativeElement.querySelector('.header');
    const title = fixture.nativeElement.querySelector('h1.title');
    const posterPlaceholder = fixture.nativeElement.querySelector('.poster-thumbnail');

    expect(header).toBeTruthy();
    expect(title).toBeTruthy();
    expect(posterPlaceholder).toBeTruthy();
  });

  it('shows subheading from tmdb status and first network', () => {
    fixture.componentRef.setInput('tmdbShow', createTmdbShow() as never);
    fixture.detectChanges();

    expect(component.showSubheading()).toBe('Ended · HBO');
  });

  it('computes next episode future flag based on first_aired date', () => {
    fixture.componentRef.setInput('nextEpisode', {
      ids: { trakt: 1, tmdb: 1, tvdb: 1, tvrage: 1, imdb: 'tt1' },
      season: 1,
      number: 1,
      title: 'Future Episode',
      first_aired: '2099-01-01T00:00:00.000Z',
    });
    fixture.detectChanges();
    expect(component.isNextEpisodeInFuture()).toBe(true);

    fixture.componentRef.setInput('nextEpisode', {
      ids: { trakt: 1, tmdb: 1, tvdb: 1, tvrage: 1, imdb: 'tt1' },
      season: 1,
      number: 1,
      title: 'Past Episode',
      first_aired: '2001-01-01T00:00:00.000Z',
    });
    fixture.detectChanges();
    expect(component.isNextEpisodeInFuture()).toBe(false);
  });

  it('renders show title and overview controls for long overview', async () => {
    fixture.componentRef.setInput('show', createShow());
    fixture.componentRef.setInput('tmdbShow', createTmdbShow() as never);
    fixture.componentRef.setInput('isSmall', false);
    fixture.detectChanges();

    const title = fixture.nativeElement.querySelector('h1.title');

    expect(title?.textContent).toContain('TMDB My Show');
    await expect.element(page.getByText('more')).toBeVisible();
  });

  it('toggles overview expansion with more button', async () => {
    fixture.componentRef.setInput('show', createShow());
    fixture.componentRef.setInput('tmdbShow', createTmdbShow() as never);
    fixture.componentRef.setInput('isSmall', false);
    fixture.detectChanges();

    const moreButton = page.getByText('more');
    expect(component.isMoreOverviewShown()).toBe(false);

    await moreButton.click();
    fixture.detectChanges();
    expect(component.isMoreOverviewShown()).toBe(true);
  });

  it('emits favorite, watchlist, and mark seen actions', async () => {
    const show = createShow();

    fixture.componentRef.setInput('show', show);
    fixture.componentRef.setInput('tmdbShow', createTmdbShow() as never);
    fixture.componentRef.setInput('isLoggedIn', true);
    fixture.componentRef.setInput('isNewShow', true);
    fixture.componentRef.setInput('isSmall', false);
    fixture.componentRef.setInput('isFavorite', false);
    fixture.componentRef.setInput('isWatchlist', false);
    fixture.componentRef.setInput('showWatched', { show } as never);
    fixture.componentRef.setInput('nextEpisode', {
      ids: { trakt: 1, tmdb: 1, tvdb: 1, tvrage: 1, imdb: 'tt1' },
      season: 1,
      number: 1,
      title: 'Past Episode',
      first_aired: '2001-01-01T00:00:00.000Z',
    });

    const addFavoriteSpy = vi.spyOn(component.addFavorite, 'emit');
    const addWatchlistSpy = vi.spyOn(component.addToWatchlist, 'emit');
    const addShowSpy = vi.spyOn(component.addShow, 'emit');

    fixture.detectChanges();

    const favoriteButton = fixture.nativeElement.querySelector(
      '.favorite-button',
    ) as HTMLButtonElement;
    favoriteButton.click();

    await page.getByText('Mark show as seen').click();
    await page.getByText('Add to watchlist').click();

    expect(addFavoriteSpy).toHaveBeenCalledWith(show);
    expect(addShowSpy).toHaveBeenCalledWith(show);
    expect(addWatchlistSpy).toHaveBeenCalledWith(show);
  });

  it('emits remove actions for favorite and watchlist when already set', async () => {
    const show = createShow();

    fixture.componentRef.setInput('show', show);
    fixture.componentRef.setInput('tmdbShow', createTmdbShow() as never);
    fixture.componentRef.setInput('isLoggedIn', true);
    fixture.componentRef.setInput('isNewShow', true);
    fixture.componentRef.setInput('isSmall', false);
    fixture.componentRef.setInput('isFavorite', true);
    fixture.componentRef.setInput('isWatchlist', true);
    fixture.componentRef.setInput('showWatched', { show } as never);

    const removeFavoriteSpy = vi.spyOn(component.removeFavorite, 'emit');
    const removeWatchlistSpy = vi.spyOn(component.removeFromWatchlist, 'emit');

    fixture.detectChanges();

    const favoriteButton = fixture.nativeElement.querySelector(
      '.favorite-button',
    ) as HTMLButtonElement;
    favoriteButton.click();

    await page.getByText('Remove from watchlist').click();

    expect(removeFavoriteSpy).toHaveBeenCalledWith(show);
    expect(removeWatchlistSpy).toHaveBeenCalledWith(show);
  });

  it('hides mark seen button when next episode is in future', async () => {
    fixture.componentRef.setInput('show', createShow());
    fixture.componentRef.setInput('tmdbShow', createTmdbShow() as never);
    fixture.componentRef.setInput('isLoggedIn', true);
    fixture.componentRef.setInput('isNewShow', true);
    fixture.componentRef.setInput('isSmall', false);
    fixture.componentRef.setInput('nextEpisode', {
      ids: { trakt: 1, tmdb: 1, tvdb: 1, tvrage: 1, imdb: 'tt1' },
      season: 1,
      number: 1,
      title: 'Future Episode',
      first_aired: '2099-01-01T00:00:00.000Z',
    });

    fixture.detectChanges();

    await expect.element(page.getByText('Mark show as seen')).not.toBeInTheDocument();
  });

  it('emits trailer action when trailer button is clicked and trailer exists', async () => {
    fixture.componentRef.setInput('show', createShow());
    fixture.componentRef.setInput('tmdbShow', createTmdbShow() as never);
    fixture.componentRef.setInput('isSmall', false);

    const trailerSpy = vi.spyOn(component.showTrailer, 'emit');

    fixture.detectChanges();

    await page.getByText('Trailer').click();

    expect(trailerSpy).toHaveBeenCalled();
  });

  it('enables the trailer button when the show has a trailer', () => {
    fixture.componentRef.setInput('show', createShow());
    fixture.componentRef.setInput('tmdbShow', createTmdbShow() as never);
    fixture.componentRef.setInput('isSmall', false);
    fixture.detectChanges();

    const button = fixture.nativeElement.querySelector('.show-buttons button') as HTMLButtonElement;
    expect(button.textContent.trim()).toBe('Trailer');
    expect(button.disabled).toBe(false);
  });

  it('leaves the trailer button enabled while the video data is still loading', () => {
    // The bulk TMDB sync caches each show without the `videos` appendage, so this is the shape
    // `tmdbShow` has on an in-app navigation before the extended fetch resolves. Disabling here
    // would make the button flip to enabled for the majority of shows.
    const tmdbShow = createTmdbShow();
    delete tmdbShow['videos'];

    fixture.componentRef.setInput('show', createShow());
    fixture.componentRef.setInput('tmdbShow', tmdbShow as never);
    fixture.componentRef.setInput('isSmall', false);
    fixture.detectChanges();

    const button = fixture.nativeElement.querySelector('.show-buttons button') as HTMLButtonElement;
    expect(button.textContent.trim()).toBe('Trailer');
    expect(button.disabled).toBe(false);
    // Nothing to complain about yet either.
    const tooltip = fixture.debugElement.query(By.directive(MatTooltip)).injector.get(MatTooltip);
    expect(tooltip.message).toBe('');
  });

  it('disables the trailer button when the show has no trailer', () => {
    const tmdbShow = createTmdbShow();
    tmdbShow['videos'] = { results: [] };

    fixture.componentRef.setInput('show', createShow());
    fixture.componentRef.setInput('tmdbShow', tmdbShow as never);
    fixture.componentRef.setInput('isSmall', false);
    const trailerSpy = vi.spyOn(component.showTrailer, 'emit');
    fixture.detectChanges();

    const button = fixture.nativeElement.querySelector('.show-buttons button') as HTMLButtonElement;
    expect(button.textContent.trim()).toBe('Trailer');
    expect(button.disabled).toBe(true);

    // Nothing to emit, and the user gets no ripple to suggest otherwise.
    button.click();
    expect(trailerSpy).not.toHaveBeenCalled();
  });

  it('explains on hover why the trailer button is disabled', async () => {
    const tmdbShow = createTmdbShow();
    tmdbShow['videos'] = { results: [] };

    fixture.componentRef.setInput('show', createShow());
    fixture.componentRef.setInput('tmdbShow', tmdbShow as never);
    fixture.componentRef.setInput('isSmall', false);
    fixture.detectChanges();

    // The tooltip hangs off the wrapper, not the button: a disabled button receives no
    // pointer events, so a tooltip bound to it would never open.
    const anchor = fixture.nativeElement.querySelector('.trailer-button');
    const button = fixture.nativeElement.querySelector('.trailer-button button');
    expect(button.disabled).toBe(true);

    // Hover the wrapper — it, not the button, is what receives the hover in the browser too.
    await page.elementLocator(anchor).hover();
    // The overlay container is created a tick before the tooltip pane lands in it, so poll the
    // surface element itself rather than the container.
    await vi.waitFor(
      () => {
        const surface = document.querySelector('.mat-mdc-tooltip-surface');
        expect(surface?.textContent).toBe('No trailer available for this show yet.');
      },
      { timeout: 3000, interval: 50 },
    );
  });

  it('shows no trailer tooltip while a trailer exists', async () => {
    fixture.componentRef.setInput('show', createShow());
    fixture.componentRef.setInput('tmdbShow', createTmdbShow() as never);
    fixture.componentRef.setInput('isSmall', false);
    fixture.detectChanges();

    // Drive the directive's public API instead of sleeping on the DOM: an empty message is what
    // suppresses the tooltip, and there is no positive signal to wait for in this case.
    const tooltip = fixture.debugElement.query(By.directive(MatTooltip)).injector.get(MatTooltip);
    expect(tooltip.message).toBe('');

    tooltip.show(0);
    await fixture.whenStable();

    expect(document.querySelector('.mat-mdc-tooltip-surface')).toBeNull();
  });

  it('cleans up stylesheet and observer on destroy', () => {
    const remove = vi.fn();
    const unobserve = vi.fn();

    component.styleSheet = { remove } as never;
    component.posterThumbnail = (() => ({ nativeElement: document.createElement('div') })) as never;
    component.observer.set({ unobserve } as never);

    vi.useFakeTimers();
    component.ngOnDestroy();
    vi.advanceTimersByTime(3000);
    vi.useRealTimers();

    expect(unobserve).toHaveBeenCalled();
    expect(remove).toHaveBeenCalled();
  });
});
