import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MatMenu } from '@angular/material/menu';

import type {
  EpisodeFull,
  ShowProgress,
  ShowWatched,
  Show,
} from '../../../../types/interfaces/Trakt';
import type { TmdbSeason, TmdbShow } from '../../../../types/interfaces/Tmdb';

@Component({
  selector: 't-show-item',
  templateUrl: './show-item.component.html',
  styleUrls: ['./show-item.component.scss'],
})
export class ShowItemComponent {
  @Input() show?: Show;
  @Input() showWatched?: ShowWatched;
  @Input() progress?: ShowProgress;
  @Input() imgPrefix?: string;
  @Input() tmdbShow?: TmdbShow;
  @Input() tmdbSeason?: TmdbSeason | null;
  @Input() isFavorite?: boolean;
  @Input() isWatchlist?: boolean;
  @Input() episode?: EpisodeFull | null;
  @Input() withYear?: boolean;
  @Input() withEpisode?: boolean;
  @Input() withAddButtons?: boolean;
  @Input() withEpisodesCount?: boolean;
  @Input() withProgressbar?: boolean;
  @Input() withRelativeDate?: boolean;
  @Input() menu?: MatMenu;

  @Output() addFavorite = new EventEmitter();
  @Output() removeFavorite = new EventEmitter();
  @Output() addShow = new EventEmitter();
  @Output() removeShow = new EventEmitter();
  @Output() manageLists = new EventEmitter();

  posterLoaded = false;

  preventEvent(event: Event): void {
    event.stopPropagation();
    event.preventDefault();
  }
}
