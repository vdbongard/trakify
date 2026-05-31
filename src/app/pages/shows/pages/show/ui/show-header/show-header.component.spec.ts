import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ShowHeaderComponent } from './show-header.component';
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

  it('renders show title and overview controls for long overview', () => {
    fixture.componentRef.setInput('show', createShow());
    fixture.componentRef.setInput('tmdbShow', createTmdbShow() as never);
    fixture.componentRef.setInput('isSmall', false);
    fixture.detectChanges();

    const title = fixture.nativeElement.querySelector('h1.title');
    const moreButton = Array.from(fixture.nativeElement.querySelectorAll('button')).find((button) =>
      (button as HTMLButtonElement).textContent?.trim().toLowerCase().includes('more'),
    );

    expect(title?.textContent).toContain('TMDB My Show');
    expect(moreButton).toBeTruthy();
  });

  it('toggles overview expansion with more button', () => {
    fixture.componentRef.setInput('show', createShow());
    fixture.componentRef.setInput('tmdbShow', createTmdbShow() as never);
    fixture.componentRef.setInput('isSmall', false);
    fixture.detectChanges();

    const moreButton = Array.from(fixture.nativeElement.querySelectorAll('button')).find((button) =>
      (button as HTMLButtonElement).textContent?.trim().toLowerCase().includes('more'),
    ) as HTMLButtonElement;
    expect(component.isMoreOverviewShown()).toBe(false);

    moreButton.click();
    fixture.detectChanges();
    expect(component.isMoreOverviewShown()).toBe(true);
  });

  it('emits favorite, watchlist, and mark seen actions', () => {
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

    const buttons = Array.from(
      fixture.nativeElement.querySelectorAll('.show-buttons button'),
    ) as HTMLButtonElement[];
    const markSeenButton = buttons.find((button) =>
      button.textContent?.trim().includes('Mark show as seen'),
    );
    const watchlistButton = buttons.find((button) =>
      button.textContent?.trim().includes('Add to watchlist'),
    );

    markSeenButton?.click();
    watchlistButton?.click();

    expect(addFavoriteSpy).toHaveBeenCalledWith(show);
    expect(addShowSpy).toHaveBeenCalledWith(show);
    expect(addWatchlistSpy).toHaveBeenCalledWith(show);
  });

  it('emits remove actions for favorite and watchlist when already set', () => {
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

    const watchlistButton = Array.from(
      fixture.nativeElement.querySelectorAll('.show-buttons button'),
    ).find((button) =>
      (button as HTMLButtonElement).textContent?.trim().includes('Remove from watchlist'),
    ) as HTMLButtonElement;
    watchlistButton.click();

    expect(removeFavoriteSpy).toHaveBeenCalledWith(show);
    expect(removeWatchlistSpy).toHaveBeenCalledWith(show);
  });

  it('hides mark seen button when next episode is in future', () => {
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

    const markSeenButton = Array.from(
      fixture.nativeElement.querySelectorAll('.show-buttons button'),
    ).find((button) =>
      (button as HTMLButtonElement).textContent?.trim().includes('Mark show as seen'),
    );
    expect(markSeenButton).toBeUndefined();
  });

  it('emits trailer action when trailer button is clicked and trailer exists', () => {
    fixture.componentRef.setInput('show', createShow());
    fixture.componentRef.setInput('tmdbShow', createTmdbShow() as never);
    fixture.componentRef.setInput('isSmall', false);

    const trailerSpy = vi.spyOn(component.showTrailer, 'emit');

    fixture.detectChanges();

    const trailerButton = Array.from(
      fixture.nativeElement.querySelectorAll('.show-buttons button'),
    ).find((button) =>
      (button as HTMLButtonElement).textContent?.trim().includes('Trailer'),
    ) as HTMLButtonElement;
    trailerButton.click();

    expect(trailerSpy).toHaveBeenCalled();
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
