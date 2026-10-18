import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ShowNextEpisodeComponent } from './show-next-episode.component';
import { provideRouter } from '@angular/router';
import { mockShow } from '@shared/mocks/mockShow';
import { EPISODE_STILL_TRANSITION_NAME } from '@constants';
import { ViewTransitionService } from '@services/view-transition.service';
import type { NextEpisode } from '@type/Episode';
import type { ShowProgress, ShowWatched } from '@type/Trakt';
import type { TmdbEpisode, TmdbShow } from '@type/Tmdb';

describe('ShowNextEpisodeComponent', () => {
  let fixture: ComponentFixture<ShowNextEpisodeComponent>;

  const baseTmdbShow = {
    number_of_episodes: 24,
    seasons: [],
    type: 'Scripted',
    status: 'Returning Series',
  } as unknown as TmdbShow;

  const baseNextEpisode: NextEpisode = [
    {
      season: 1,
      number: 5,
      title: 'Ep 5',
      ids: { trakt: 1, tmdb: 1, tvdb: 1, tvrage: 1 },
      first_aired: '2023-01-15T00:00:00.000Z',
    } as unknown as null,
    null,
    null,
  ];

  function createComponent(overrides?: {
    isLoading?: boolean;
    nextEpisode?: NextEpisode;
    tmdbShow?: TmdbShow;
    show?: typeof mockShow;
    showWatched?: ShowWatched;
    showProgress?: ShowProgress;
    seenFeedbackEpisodeId?: number;
    previousUrl?: string;
  }): void {
    fixture = TestBed.createComponent(ShowNextEpisodeComponent);
    if (overrides?.isLoading !== undefined)
      fixture.componentRef.setInput('isLoading', overrides.isLoading);
    if (overrides?.nextEpisode !== undefined)
      fixture.componentRef.setInput('nextEpisode', overrides.nextEpisode);
    if (overrides?.tmdbShow !== undefined)
      fixture.componentRef.setInput('tmdbShow', overrides.tmdbShow);
    if (overrides?.show !== undefined) fixture.componentRef.setInput('show', overrides.show);
    if (overrides?.showWatched !== undefined)
      fixture.componentRef.setInput('showWatched', overrides.showWatched);
    if (overrides?.showProgress !== undefined)
      fixture.componentRef.setInput('showProgress', overrides.showProgress);
    if (overrides?.seenFeedbackEpisodeId !== undefined)
      fixture.componentRef.setInput('seenFeedbackEpisodeId', overrides.seenFeedbackEpisodeId);
    if (overrides?.previousUrl !== undefined)
      fixture.componentRef.setInput('previousUrl', overrides.previousUrl);
    fixture.detectChanges();
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [provideRouter([])],
    }).compileComponents();
  });

  it('should create', () => {
    createComponent();
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render nothing while loading', () => {
    // The block is up to ~700px tall once the episode arrives, so a placeholder box reserved
    // nothing worth the flash it caused on every page load.
    createComponent({ isLoading: true, nextEpisode: baseNextEpisode, tmdbShow: baseTmdbShow });
    expect(fixture.nativeElement.querySelector('.loading')).toBeFalsy();
    expect(fixture.nativeElement.querySelector('h2')).toBeFalsy();
    expect(fixture.nativeElement.textContent.trim()).toBe('');
  });

  it('should show next episode heading when nextEpisode and episodes exist', () => {
    createComponent({ nextEpisode: baseNextEpisode, tmdbShow: baseTmdbShow });
    const heading = fixture.nativeElement.querySelector('h2');
    expect(heading.textContent.trim()).toBe('Next episode');
  });

  it('should show "No next episode" when episodes is 0', () => {
    createComponent({
      nextEpisode: baseNextEpisode,
      tmdbShow: { ...baseTmdbShow, number_of_episodes: 0 },
    });
    const noNext = fixture.nativeElement.querySelector('.no-next-episode');
    expect(noNext).toBeTruthy();
  });

  it('should show "No next episode" when show is watched and no next episode', () => {
    createComponent({
      tmdbShow: baseTmdbShow,
      showWatched: {} as ShowWatched,
    });
    const noNext = fixture.nativeElement.querySelector('.no-next-episode');
    expect(noNext).toBeTruthy();
  });

  it('should not say "No next episode" for a show that has not aired yet', () => {
    // Trakt reports `aired: 0` when nothing has aired, and TMDB has no season data either (so
    // `episodes()` is 0). The other unaired shows render an empty block here, so this one must
    // too -- there is no episode to be next, and nothing to have caught up on.
    createComponent({
      tmdbShow: { ...baseTmdbShow, number_of_episodes: 0, seasons: [] },
      showProgress: { aired: 0, next_episode: null } as unknown as ShowProgress,
    });
    const noNext = fixture.nativeElement.querySelector('.no-next-episode');
    expect(noNext).toBeFalsy();
  });

  it('should still say "No next episode" for a fully watched show', () => {
    // A caught-up show also reports `next_episode: null`, but it has aired and finished, so the
    // message is the whole point of the block.
    createComponent({
      tmdbShow: baseTmdbShow,
      showWatched: {} as ShowWatched,
      showProgress: { aired: 208, completed: 208, next_episode: null } as unknown as ShowProgress,
    });
    const noNext = fixture.nativeElement.querySelector('.no-next-episode');
    expect(noNext).toBeTruthy();
  });

  it('should render t-episode child when show and tmdbShow are provided', () => {
    createComponent({
      nextEpisode: baseNextEpisode,
      tmdbShow: baseTmdbShow,
      show: mockShow,
    });
    const episode = fixture.nativeElement.querySelector('t-episode');
    expect(episode).toBeTruthy();
  });

  describe('view transition to the Episode page', () => {
    function clickStill(): void {
      fixture.nativeElement
        .querySelector('t-episode-still')
        ?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    }

    /** Hands the service a transition this test decides the end of, the way the router hands it the
     *  ones it runs. Returns the end of it. */
    function trackTransition(): () => void {
      let finish!: () => void;
      const finished = new Promise<void>((resolve) => (finish = resolve));
      TestBed.inject(ViewTransitionService).track({ finished } as ViewTransition);
      return () => finish();
    }

    it('names the still when its link is followed, so it morphs onto the Episode page', () => {
      createComponent({
        nextEpisode: [baseNextEpisode[0], makeTmdbEpisode('/still.jpg'), null],
        tmdbShow: baseTmdbShow,
        show: mockShow,
      });

      clickStill();

      expect(fixture.componentInstance.stillTransitionName()).toBe(EPISODE_STILL_TRANSITION_NAME);
    });

    it('leaves the still unnamed when there is no still to morph', () => {
      createComponent({
        nextEpisode: [baseNextEpisode[0], makeTmdbEpisode(null), null],
        tmdbShow: baseTmdbShow,
        show: mockShow,
      });

      clickStill();

      expect(fixture.componentInstance.stillTransitionName()).toBeUndefined();
    });

    it('hands the Episode page the Episode it already showed', () => {
      const tmdb = makeTmdbEpisode('/still.jpg');
      createComponent({
        nextEpisode: [baseNextEpisode[0], tmdb, null],
        tmdbShow: baseTmdbShow,
        show: mockShow,
      });

      expect(fixture.componentInstance.nextEpisodeInfo()).toEqual({
        show: mockShow,
        tmdbEpisode: tmdb,
      });
    });

    it('names the still when this page is where the Episode page comes back to', () => {
      createComponent({
        nextEpisode: [baseNextEpisode[0], makeTmdbEpisode('/still.jpg'), null],
        tmdbShow: baseTmdbShow,
        show: mockShow,
        previousUrl: `/shows/s/${mockShow.ids.slug}/season/1/episode/5`,
      });

      expect(fixture.componentInstance.stillTransitionName()).toBe(EPISODE_STILL_TRANSITION_NAME);
    });

    it('leaves the still unnamed when the navigation came back from another Episode', () => {
      createComponent({
        nextEpisode: [baseNextEpisode[0], makeTmdbEpisode('/still.jpg'), null],
        tmdbShow: baseTmdbShow,
        show: mockShow,
        previousUrl: `/shows/s/${mockShow.ids.slug}/season/1/episode/4`,
      });

      expect(fixture.componentInstance.stillTransitionName()).toBeUndefined();
    });

    it('leaves a still that fell back to another image unnamed on the way back', () => {
      createComponent({
        nextEpisode: [baseNextEpisode[0], makeTmdbEpisode(null), null],
        tmdbShow: baseTmdbShow,
        show: mockShow,
        previousUrl: `/shows/s/${mockShow.ids.slug}/season/1/episode/5`,
      });

      expect(fixture.componentInstance.stillTransitionName()).toBeUndefined();
    });

    it('drops the name again once the morph back has run', async () => {
      // The name belongs to that one morph. Left on the artwork, the next navigation out of here
      // captures it too, and the browser then holds the still over the page arriving there — the
      // Progress page, which has no still of its own to morph it into.
      const finishMorphBack = trackTransition();
      createComponent({
        nextEpisode: [baseNextEpisode[0], makeTmdbEpisode('/still.jpg'), null],
        tmdbShow: baseTmdbShow,
        show: mockShow,
        previousUrl: `/shows/s/${mockShow.ids.slug}/season/1/episode/5`,
      });

      expect(fixture.componentInstance.stillTransitionName()).toBe(EPISODE_STILL_TRANSITION_NAME);

      finishMorphBack();

      await vi.waitFor(() =>
        expect(fixture.componentInstance.stillTransitionName()).toBeUndefined(),
      );
    });

    it('names the still for a click on it after the morph back has run', async () => {
      const finishMorphBack = trackTransition();
      createComponent({
        nextEpisode: [baseNextEpisode[0], makeTmdbEpisode('/still.jpg'), null],
        tmdbShow: baseTmdbShow,
        show: mockShow,
        previousUrl: `/shows/s/${mockShow.ids.slug}/season/1/episode/5`,
      });
      finishMorphBack();
      await vi.waitFor(() =>
        expect(fixture.componentInstance.stillTransitionName()).toBeUndefined(),
      );

      clickStill();

      expect(fixture.componentInstance.stillTransitionName()).toBe(EPISODE_STILL_TRANSITION_NAME);
    });
  });
});

function makeTmdbEpisode(stillPath: string | null): TmdbEpisode {
  return {
    id: 1,
    name: 'Ep 5',
    season_number: 1,
    episode_number: 5,
    still_path: stillPath,
    air_date: '2023-01-15',
  };
}
