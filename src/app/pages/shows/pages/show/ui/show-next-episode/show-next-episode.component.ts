import { Component, computed, EventEmitter, input, Output } from '@angular/core';
import { EpisodeFull, EpisodeProgress, Show, ShowProgress, ShowWatched } from '@type/Trakt';
import { TmdbEpisode, TmdbSeason, TmdbShow } from '@type/Tmdb';
import { LoadingState } from '@type/Enum';
import { BaseEpisodeComponent } from '@shared/components/episode/base-episode.component';
import { EpisodeCountComponent } from '@shared/components/episode-count/episode-count.component';
import { isShowEnded } from '@helper/isShowEnded';

@Component({
  selector: 't-show-next-episode',
  standalone: true,
  imports: [BaseEpisodeComponent, EpisodeCountComponent],
  templateUrl: './show-next-episode.component.html',
  styleUrl: './show-next-episode.component.scss',
})
export class ShowNextEpisodeComponent {
  nextEpisode = input.required<NextEpisode>();
  showProgress = input.required<ShowProgress | undefined>();
  tmdbShow = input.required<TmdbShow | undefined>();
  tmdbSeason = input.required<TmdbSeason | undefined>();
  show = input.required<Show | undefined>();
  isLoggedIn = input<boolean | null>();
  isLoading = input<boolean>();
  isNewShow = input<boolean>();
  showWatched = input<ShowWatched | undefined | null>();
  seenLoading = input<LoadingState>();

  @Output() addEpisode = new EventEmitter<{ episode: EpisodeFull; show: Show }>();
  @Output() removeEpisode = new EventEmitter<{ episode: EpisodeFull; show: Show }>();

  state = LoadingState;

  episodes = computed(() => this.tmdbShow()?.number_of_episodes ?? 0);
  nextTraktEpisode = computed(() => this.nextEpisode()?.[0]);
  isShowEnded = computed(() => isShowEnded(this.tmdbShow()));
}

export type NextEpisode =
  | [
      EpisodeFull | undefined | null,
      TmdbEpisode | undefined | null,
      EpisodeProgress | undefined | null,
    ]
  | undefined;
