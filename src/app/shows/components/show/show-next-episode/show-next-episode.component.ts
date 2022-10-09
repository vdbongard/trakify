import { Component, EventEmitter, Input, Output } from '@angular/core';
import {
  EpisodeFull,
  EpisodeProgress,
  Show,
  ShowProgress,
  ShowWatched,
} from '@type/interfaces/Trakt';
import { TmdbEpisode, TmdbShow } from '@type/interfaces/Tmdb';
import { LoadingState } from '@type/enum';

@Component({
  selector: 't-show-next-episode',
  templateUrl: './show-next-episode.component.html',
  styleUrls: ['./show-next-episode.component.scss'],
})
export class ShowNextEpisodeComponent {
  @Input() isLoading?: boolean;
  @Input() nextEpisodeTrakt?: EpisodeFull | null;
  @Input() nextEpisodeTmdb?: TmdbEpisode | null;
  @Input() nextEpisodeProgress?: EpisodeProgress | null;
  @Input() showProgress?: ShowProgress | null;
  @Input() isNewShow?: boolean;
  @Input() isOnWatchlist?: boolean | null;
  @Input() tmdbShow?: TmdbShow | null;
  @Input() show?: Show | null;
  @Input() showWatched?: ShowWatched | null;
  @Input() seenLoading?: LoadingState | null;

  @Output() addEpisode = new EventEmitter<{ episode: EpisodeFull; show: Show }>();
  @Output() addSeason = new EventEmitter<{ episode: EpisodeFull; show: Show }>();
  @Output() addShow = new EventEmitter<{ show: Show }>();
  @Output() addToWatchlist = new EventEmitter<{ show: Show }>();
  @Output() removeFromWatchlist = new EventEmitter<{ show: Show }>();

  state = LoadingState;
}
