import { Component, computed, input, output, signal } from '@angular/core';
import { EpisodeFull, Show, ShowProgress, ShowWatched } from '@type/Trakt';
import { TmdbSeason, TmdbShow } from '@type/Tmdb';
import { LoadingState } from '@type/Loading';
import { BaseEpisodeComponent } from '@shared/components/episode/base-episode.component';
import { EpisodeCountComponent } from '@shared/components/episode-count/episode-count.component';
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

  /** Name the still carries in a view transition out of this page, and only while one is starting:
   *  the still link sets it on the click, before the browser captures the view being left. */
  stillTransitionName = signal<string | undefined>(undefined);

  /** What the Episode page needs to render its own copy of the still before its request lands. */
  nextEpisodeInfo = computed<EpisodeInfo | undefined>(() => {
    const show = this.show();
    if (!show) return undefined;
    return { show, tmdbEpisode: this.nextTmdbEpisode() ?? undefined };
  });

  prepareStillTransition(): void {
    if (!this.nextTmdbEpisode()?.still_path) return;
    this.stillTransitionName.set(EPISODE_STILL_TRANSITION_NAME);
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
