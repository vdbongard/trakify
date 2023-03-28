import { Component, EventEmitter, Input, OnChanges, Output } from '@angular/core';
import { EpisodeFull, EpisodeProgress, Show, ShowProgress, ShowWatched } from '@type/Trakt';
import { TmdbEpisode, TmdbSeason, TmdbShow } from '@type/Tmdb';
import { LoadingState } from '@type/Enum';
import { NgIf } from '@angular/common';
import { BaseEpisodeComponent } from '@shared/components/episode/base-episode.component';
import { IsShowEndedPipe } from '@shared/pipes/is-show-ended.pipe';
import { SimpleChangesTyped } from '@type/SimpleChanges';
import { RemainingPipe } from '@shared/pipes/remaining.pipe';
import { EpisodeCountComponent } from '@shared/components/episode-count/episode-count.component';

@Component({
  selector: 't-show-next-episode',
  templateUrl: './show-next-episode.component.html',
  styleUrls: ['./show-next-episode.component.scss'],
  standalone: true,
  imports: [NgIf, BaseEpisodeComponent, IsShowEndedPipe, RemainingPipe, EpisodeCountComponent],
})
export class ShowNextEpisodeComponent implements OnChanges {
  @Input() isLoggedIn?: boolean | null;
  @Input() isLoading?: boolean;
  @Input() nextEpisodeTrakt?: EpisodeFull | null;
  @Input() nextEpisodeTmdb?: TmdbEpisode | null;
  @Input() nextEpisodeProgress?: EpisodeProgress | null;
  @Input() showProgress?: ShowProgress | null;
  @Input() isNewShow?: boolean;
  @Input() tmdbShow?: TmdbShow | null;
  @Input() tmdbSeason?: TmdbSeason | null;
  @Input() show?: Show | null;
  @Input() showWatched?: ShowWatched | null;
  @Input() seenLoading?: LoadingState | null;

  @Output() addEpisode = new EventEmitter<{ episode: EpisodeFull; show: Show }>();
  @Output() removeEpisode = new EventEmitter<{ episode: EpisodeFull; show: Show }>();

  state = LoadingState;
  episodes = 0;

  ngOnChanges(changes: SimpleChangesTyped<this>): void {
    if (changes.tmdbShow) {
      this.episodes = this.tmdbShow?.number_of_episodes ?? 0;
    }
  }
}
