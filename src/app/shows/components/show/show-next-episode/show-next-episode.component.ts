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
  @Input() nextEpisode?: [
    EpisodeFull | null | undefined,
    TmdbEpisode | null | undefined,
    EpisodeProgress | undefined
  ];
  @Input() showProgress?: ShowProgress | null;
  @Input() tmdbShow?: TmdbShow | null;
  @Input() show?: Show;
  @Input() showWatched?: ShowWatched | null;
  @Input() seenLoading?: LoadingState | null;

  @Output() addToHistory = new EventEmitter();

  state = LoadingState;
}
