import { Component, EventEmitter, Input, Output } from '@angular/core';
import { TmdbSeason, TmdbShow } from '@type/interfaces/Tmdb';
import { Show, ShowWatched } from '@type/interfaces/Trakt';

@Component({
  selector: 't-show-header',
  templateUrl: './show-header.component.html',
  styleUrls: ['./show-header.component.scss'],
})
export class ShowHeaderComponent {
  @Input() tmdbSeason?: TmdbSeason | null;
  @Input() posterPrefix?: string;
  @Input() showWatched?: ShowWatched | null;
  @Input() tmdbShow?: TmdbShow | null;
  @Input() show?: Show | null;
  @Input() isFavorite?: boolean | null;
  @Input() isSmall?: boolean;

  @Output() addFavorite = new EventEmitter();
  @Output() removeFavorite = new EventEmitter();

  posterLoaded = false;
  isMoreOverviewShown = false;
  maxSmallOverviewLength = 180;
  maxLargeOverviewLength = 500;
}
