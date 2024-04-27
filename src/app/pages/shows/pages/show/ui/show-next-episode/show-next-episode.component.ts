import { Component, computed, input, output } from '@angular/core';
import { isShowEnded } from '@helper/isShowEnded';
import { EpisodeCountComponent } from '@shared/components/episode-count/episode-count.component';
import { BaseEpisodeComponent } from '@shared/components/episode/base-episode.component';
import { LoadingState } from '@type/Enum';
import type { TmdbEpisode, TmdbSeason, TmdbShow } from '@type/Tmdb';
import type { EpisodeFull, EpisodeProgress, Show, ShowProgress, ShowWatched } from '@type/Trakt';

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

  addEpisode = output<{ episode: EpisodeFull; show: Show }>();
  removeEpisode = output<{ episode: EpisodeFull; show: Show }>();

  episodes = computed(() => this.tmdbShow()?.number_of_episodes ?? 0);
  nextTraktEpisode = computed(() => this.nextEpisode()?.[0] ?? undefined);
  isShowEnded = computed(() => this.tmdbShow() && isShowEnded(this.tmdbShow()!));

  state = LoadingState;
}

export type NextEpisode = [
  EpisodeFull | undefined | null,
  TmdbEpisode | undefined | null,
  EpisodeProgress | undefined | null,
];
