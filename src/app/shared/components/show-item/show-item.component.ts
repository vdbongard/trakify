import { Component, EventEmitter, Input, Output } from '@angular/core';
import { EpisodeFull, ShowProgress, TraktShow } from '../../../../types/interfaces/Trakt';
import { TmdbShow } from '../../../../types/interfaces/Tmdb';

@Component({
  selector: 'app-show-item',
  templateUrl: './show-item.component.html',
  styleUrls: ['./show-item.component.scss'],
})
export class ShowItemComponent {
  @Input() show?: TraktShow;
  @Input() progress?: ShowProgress;
  @Input() imgPrefix?: string;
  @Input() tmdbShow?: TmdbShow;
  @Input() favorite?: boolean;
  @Input() nextEpisode?: EpisodeFull;
  @Input() withYear?: boolean;
  @Input() withNextEpisode?: boolean;
  @Input() withRightButtons?: boolean;
  @Input() withEpisodesCount?: boolean;

  @Output() addFavorite = new EventEmitter();
  @Output() removeFavorite = new EventEmitter();
  @Output() addShow = new EventEmitter();
}
