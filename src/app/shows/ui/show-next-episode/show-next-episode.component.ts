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
import { NgIf } from '@angular/common';
import { BaseEpisodeComponent } from '@shared/components/episode/base-episode.component';
import { IsShowEndedPipe } from '@shared/pipes/is-show-ended.pipe';

@Component({
  selector: 't-show-next-episode',
  templateUrl: './show-next-episode.component.html',
  styleUrls: ['./show-next-episode.component.scss'],
  standalone: true,
  imports: [NgIf, BaseEpisodeComponent, IsShowEndedPipe],
})
export class ShowNextEpisodeComponent {
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
}
