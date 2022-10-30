import { Component, EventEmitter, Input, Output } from '@angular/core';
import { TmdbSeason, TmdbShow } from '@type/interfaces/Tmdb';
import { EpisodeFull, Show, ShowWatched } from '@type/interfaces/Trakt';

@Component({
  selector: 't-show-header',
  templateUrl: './show-header.component.html',
  styleUrls: ['./show-header.component.scss'],
})
export class ShowHeaderComponent {
  @Input() isLoggedIn?: boolean | null;
  @Input() tmdbSeason?: TmdbSeason | null;
  @Input() posterPrefix?: string;
  @Input() showWatched?: ShowWatched | null;
  @Input() tmdbShow?: TmdbShow | null;
  @Input() nextEpisode?: EpisodeFull | null;
  @Input() show?: Show | null;
  @Input() isFavorite?: boolean | null;
  @Input() isSmall?: boolean;
  @Input() isNewShow?: boolean;
  @Input() isWatchlist?: boolean | null;

  @Output() addFavorite = new EventEmitter<Show | undefined | null>();
  @Output() removeFavorite = new EventEmitter<Show | undefined | null>();
  @Output() addToWatchlist = new EventEmitter<Show>();
  @Output() removeFromWatchlist = new EventEmitter<Show>();
  @Output() addShow = new EventEmitter<Show>();

  posterLoaded = false;
  isMoreOverviewShown = false;
  maxSmallOverviewLength = 96;
  maxLargeOverviewLength = 504;
}
