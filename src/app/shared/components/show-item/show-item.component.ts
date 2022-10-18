import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { MatMenu } from '@angular/material/menu';

import type { EpisodeFull, Show, ShowProgress, ShowWatched } from '@type/interfaces/Trakt';
import type { TmdbSeason, TmdbShow } from '@type/interfaces/Tmdb';
import { PosterPrefixSm } from '@constants';

@Component({
  selector: 't-show-item',
  templateUrl: './show-item.component.html',
  styleUrls: ['./show-item.component.scss'],
})
export class ShowItemComponent implements OnChanges {
  @Input() show?: Show;
  @Input() showWatched?: ShowWatched;
  @Input() progress?: ShowProgress;
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

  @Output() addFavorite = new EventEmitter<Show>();
  @Output() removeFavorite = new EventEmitter<Show>();
  @Output() addShow = new EventEmitter<Show>();
  @Output() removeShow = new EventEmitter<Show>();

  posterLoaded = false;
  initialIndex?: number;
  posterPrefixLg = PosterPrefixSm;

  ngOnChanges(changes: SimpleChanges): void {
    if (
      changes['i']?.firstChange &&
      changes['i']?.currentValue !== undefined &&
      this.initialIndex === undefined
    ) {
      this.initialIndex = changes['i'].currentValue;
    }
  }

  preventEvent(event: Event): void {
    event.stopPropagation();
    event.preventDefault();
  }
}