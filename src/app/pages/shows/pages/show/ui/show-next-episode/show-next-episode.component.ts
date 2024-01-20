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
  nextEpisode = input<NextEpisode>();
  showProgress = input<ShowProgress>();
  tmdbShow = input<TmdbShow>();
  tmdbSeason = input<TmdbSeason>();
  show = input<Show>();
  showWatched = input<ShowWatched>();
  seenLoading = input<LoadingState>();
  isLoggedIn = input<boolean>();
  isLoading = input<boolean>();
  isNewShow = input<boolean>();

  @Output() addEpisode = new EventEmitter<{ episode: EpisodeFull; show: Show }>();
  @Output() removeEpisode = new EventEmitter<{ episode: EpisodeFull; show: Show }>();

  episodes = computed(() => this.tmdbShow()?.number_of_episodes ?? 0);
  nextTraktEpisode = computed(() => this.nextEpisode()?.[0] ?? undefined);
  isShowEnded = computed(() => isShowEnded(this.tmdbShow()));

  state = LoadingState;
}

export type NextEpisode = [
  EpisodeFull | undefined | null,
  TmdbEpisode | undefined | null,
  EpisodeProgress | undefined | null,
];
