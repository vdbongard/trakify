import { Component, computed, EventEmitter, Input, Output, Signal } from '@angular/core';
import { EpisodeFull, EpisodeProgress, Show, ShowProgress, ShowWatched } from '@type/Trakt';
import { TmdbEpisode, TmdbSeason, TmdbShow } from '@type/Tmdb';
import { LoadingState } from '@type/Enum';
import { CommonModule } from '@angular/common';
import { BaseEpisodeComponent } from '@shared/components/episode/base-episode.component';
import { IsShowEndedPipe } from '@shared/pipes/is-show-ended.pipe';
import { EpisodeCountComponent } from '@shared/components/episode-count/episode-count.component';

@Component({
  selector: 't-show-next-episode',
  templateUrl: './show-next-episode.component.html',
  styleUrls: ['./show-next-episode.component.scss'],
  standalone: true,
  imports: [CommonModule, BaseEpisodeComponent, IsShowEndedPipe, EpisodeCountComponent],
})
export class ShowNextEpisodeComponent {
  @Input() isLoggedIn?: boolean | null;
  @Input() isLoading?: boolean;
  @Input({ required: true }) nextEpisode!: Signal<NextEpisode>;
  @Input({ required: true }) showProgress!: Signal<ShowProgress | undefined>;
  @Input() isNewShow!: boolean;
  @Input({ required: true }) tmdbShow!: Signal<TmdbShow | undefined>;
  @Input({ required: true }) tmdbSeason!: Signal<TmdbSeason | undefined>;
  @Input() show?: Show | null;
  @Input() showWatched: ShowWatched | undefined | null;
  @Input() seenLoading?: LoadingState | null;

  @Output() addEpisode = new EventEmitter<{ episode: EpisodeFull; show: Show }>();
  @Output() removeEpisode = new EventEmitter<{ episode: EpisodeFull; show: Show }>();

  state = LoadingState;

  episodes = computed(() => this.tmdbShow()?.number_of_episodes ?? 0);
  nextTraktEpisode = computed(() => this.nextEpisode()?.[0]);
}

export type NextEpisode =
  | [
      EpisodeFull | undefined | null,
      TmdbEpisode | undefined | null,
      EpisodeProgress | undefined | null,
    ]
  | undefined;
