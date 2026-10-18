import { Component, computed, input, output, signal } from '@angular/core';
import { EpisodeFull, Show, ShowProgress, ShowWatched } from '@type/Trakt';
import { TmdbSeason, TmdbShow } from '@type/Tmdb';
import { LoadingState } from '@type/Loading';
import { BaseEpisodeComponent } from '@shared/components/episode/base-episode.component';
import { EpisodeCountComponent } from '@shared/components/episode-count/episode-count.component';
import { isEpisodeUrl } from '@helper/episodeUrl';
import { isShowEnded } from '@helper/isShowEnded';
import { EPISODE_STILL_TRANSITION_NAME } from '@constants';
import { EpisodeInfo, NextEpisode } from '@type/Episode';

@Component({
  selector: 't-show-next-episode',
  imports: [BaseEpisodeComponent, EpisodeCountComponent],
  templateUrl: './show-next-episode.component.html',
  styleUrl: './show-next-episode.component.scss',
})
export class ShowNextEpisodeComponent {
  /** The URL the navigation that brought this page up left. Read by the Show page and handed down
   *  rather than read here: a child first renders after the router clears the navigation it belongs
   *  to. A back navigation carries no Episode, so the URL that was left is the only record of where
   *  the reader came from. */
  previousUrl = input<string>();
  nextEpisode = input<NextEpisode>();
  showProgress = input<ShowProgress>();
  tmdbShow = input<TmdbShow>();
  tmdbSeason = input<TmdbSeason>();
  show = input<Show>();
  showWatched = input<ShowWatched>();
  seenLoading = input<LoadingState>();
  seenFeedbackEpisodeId = input<number>();
  isLoggedIn = input<boolean>();
  isLoading = input<boolean>();
  isNewShow = input<boolean>();

  addEpisode = output<{ episode: EpisodeFull; show: Show }>();
  removeEpisode = output<{ episode: EpisodeFull; show: Show }>();

  episodes = computed(() => this.tmdbShow()?.number_of_episodes ?? 0);
  nextTraktEpisode = computed(() => this.nextEpisode()?.[0] ?? undefined);
  nextTmdbEpisode = computed(() => this.nextEpisode()?.[1] ?? undefined);
  isShowEnded = computed(() => this.tmdbShow() && isShowEnded(this.tmdbShow()!));

  /** Whether this view is being returned to from the Episode it shows: the artwork then keeps its
   *  name, so it morphs out of the Episode page. */
  private isReturningFromNextEpisode = computed(() =>
    isEpisodeUrl(this.previousUrl() ?? '', this.show(), this.nextTraktEpisode()),
  );

  /** Names the still for the view transition a click on it starts, before the browser captures the
   *  view being left. */
  private clickedStillTransitionName = signal<string | undefined>(undefined);

  /** Name the still carries in a view transition, on either side of a navigation to its Episode
   *  page: named when the click that starts one lands, and up front when this page is what a
   *  navigation comes back to — the browser captures that new view before this page does anything.
   *  A still that falls back to another image stays unnamed: a transition between two different
   *  images is not a morph. */
  stillTransitionName = computed(() =>
    this.isReturningFromNextEpisode() && this.nextTmdbEpisode()?.still_path
      ? EPISODE_STILL_TRANSITION_NAME
      : this.clickedStillTransitionName(),
  );

  /** What the Episode page needs to render its own copy of the still before its request lands. */
  nextEpisodeInfo = computed<EpisodeInfo | undefined>(() => {
    const show = this.show();
    if (!show) return undefined;
    return { show, tmdbEpisode: this.nextTmdbEpisode() ?? undefined };
  });

  prepareStillTransition(): void {
    if (!this.nextTmdbEpisode()?.still_path) return;
    this.clickedStillTransitionName.set(EPISODE_STILL_TRANSITION_NAME);
  }

  /**
   * A show Trakt reports as having aired no episodes at all. Such a show has no episode to be
   * next and nothing to have caught up on, so the block stays empty instead of claiming there is
   * "No next episode." -- which TMDB's missing season data (a `0` episode count) would otherwise
   * trigger on its own.
   *
   * `aired` is the discriminator, not `next_episode: null`: a fully watched show also reports
   * `next_episode: null`, and it *does* deserve the "No next episode." message.
   */
  isUnaired = computed(() => this.showProgress()?.aired === 0);
}
