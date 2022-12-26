import { Component, EventEmitter, Input, OnChanges, Output } from '@angular/core';
import { EpisodeFull, EpisodeProgress, Show, ShowProgress, ShowWatched } from '@type/Trakt';
import { TmdbEpisode, TmdbShow } from '@type/Tmdb';
import { LoadingState } from '@type/Enum';
import { NgIf } from '@angular/common';
import { BaseEpisodeComponent } from '@shared/components/episode/base-episode.component';
import { IsShowEndedPipe } from '@shared/pipes/is-show-ended.pipe';
import { SimpleChangesTyped } from '@type/SimpleChanges';

@Component({
  selector: 't-show-next-episode',
  templateUrl: './show-next-episode.component.html',
  styleUrls: ['./show-next-episode.component.scss'],
  standalone: true,
  imports: [NgIf, BaseEpisodeComponent, IsShowEndedPipe],
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
  @Input() show?: Show | null;
  @Input() showWatched?: ShowWatched | null;
  @Input() seenLoading?: LoadingState | null;

  @Output() addEpisode = new EventEmitter<{ episode: EpisodeFull; show: Show }>();
  @Output() removeEpisode = new EventEmitter<{ episode: EpisodeFull; show: Show }>();

  state = LoadingState;
  episodes = 0;
  episodesRemaining = 0;

  ngOnChanges(changes: SimpleChangesTyped<this>): void {
    if (changes.tmdbShow) {
      this.episodes = this.tmdbShow?.number_of_episodes ?? 0;
    }
    if (changes.showProgress) {
      this.episodesRemaining =
        this.showProgress && this.showProgress.completed > 0
          ? this.showProgress.aired - this.showProgress.completed
          : 0;
    }
  }
}
