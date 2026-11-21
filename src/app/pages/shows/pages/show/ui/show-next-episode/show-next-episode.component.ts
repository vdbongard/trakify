import { afterNextRender, Component, computed, inject, input, output, signal } from '@angular/core';
import { EpisodeFull, Show, ShowProgress, ShowWatched } from '@type/Trakt';
import { TmdbSeason, TmdbShow } from '@type/Tmdb';
import { LoadingState } from '@type/Loading';
import { BaseEpisodeComponent } from '@shared/components/episode/base-episode.component';
import { EpisodeCountComponent } from '@shared/components/episode-count/episode-count.component';
import { isEpisodeUrl } from '@helper/episodeUrl';
import { isShowEnded } from '@helper/isShowEnded';
import { EPISODE_STILL_TRANSITION_NAME } from '@constants';
import { EpisodeInfo, NextEpisode } from '@type/Episode';
import type { ShowProgressSummary } from '@type/ShowProgress';
import { ViewTransitionService } from '@services/view-transition.service';

@Component({
  selector: 't-show-next-episode',
  imports: [BaseEpisodeComponent, EpisodeCountComponent],
  templateUrl: './show-next-episode.component.html',
  styleUrl: './show-next-episode.component.scss',
})
export class ShowNextEpisodeComponent {
  private viewTransition = inject(ViewTransitionService);

  previousUrl = input<string>();
  nextEpisode = input<NextEpisode>();
  showProgress = input<ShowProgress>();
  progressView = input<ShowProgressSummary>();
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

  private isReturningFromNextEpisode = computed(() =>
    isEpisodeUrl(this.previousUrl() ?? '', this.show(), this.nextTraktEpisode()),
  );

  private clickedStillTransitionName = signal<string | undefined>(undefined);

  private returnMorphRan = signal(false);

  constructor() {
    afterNextRender(() => {
      if (!this.isReturningFromNextEpisode()) return;
      void this.viewTransition.whenFinished().then(() => this.returnMorphRan.set(true));
    });
  }

  stillTransitionName = computed(() =>
    !this.returnMorphRan() &&
    this.isReturningFromNextEpisode() &&
    this.nextTmdbEpisode()?.still_path
      ? EPISODE_STILL_TRANSITION_NAME
      : this.clickedStillTransitionName(),
  );

  nextEpisodeInfo = computed<EpisodeInfo | undefined>(() => {
    const show = this.show();
    if (!show) return undefined;
    return { show, tmdbEpisode: this.nextTmdbEpisode() ?? undefined };
  });

  prepareStillTransition(): void {
    if (!this.nextTmdbEpisode()?.still_path) return;
    this.clickedStillTransitionName.set(EPISODE_STILL_TRANSITION_NAME);
  }

  isUnaired = computed(() => this.showProgress()?.aired === 0);
}
