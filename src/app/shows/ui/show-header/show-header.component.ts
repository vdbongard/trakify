import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { TmdbSeason, TmdbShow, Video } from '@type/interfaces/Tmdb';
import { EpisodeFull, Show, ShowWatched } from '@type/interfaces/Trakt';
import { NgIf, NgOptimizedImage, SlicePipe } from '@angular/common';
import { ShowSubheadingPipe } from '../../utils/pipes/show-subheading.pipe';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { GetTrailerPipe } from '@shared/pipes/has-trailer.pipe';
import { IsInFuturePipe } from '@shared/pipes/is-in-future.pipe';
import { ImagePrefixOriginal, ImagePrefixW185 } from '@constants';

@Component({
  selector: 't-show-header',
  templateUrl: './show-header.component.html',
  styleUrls: ['./show-header.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    NgIf,
    NgOptimizedImage,
    ShowSubheadingPipe,
    MatIconModule,
    MatButtonModule,
    SlicePipe,
    GetTrailerPipe,
    IsInFuturePipe,
  ],
})
export class ShowHeaderComponent {
  @Input() isLoggedIn?: boolean | null;
  @Input() tmdbSeason?: TmdbSeason | null;
  @Input() showWatched?: ShowWatched | null;
  @Input() tmdbShow?: TmdbShow | null;
  @Input() nextEpisode?: EpisodeFull | null;
  @Input() show?: Show | null;
  @Input() isFavorite?: boolean | null;
  @Input() isSmall?: boolean | null;
  @Input() isNewShow?: boolean;
  @Input() isWatchlist?: boolean | null;

  @Output() addFavorite = new EventEmitter<Show | undefined | null>();
  @Output() removeFavorite = new EventEmitter<Show | undefined | null>();
  @Output() addToWatchlist = new EventEmitter<Show>();
  @Output() removeFromWatchlist = new EventEmitter<Show>();
  @Output() addShow = new EventEmitter<Show>();
  @Output() showTrailer = new EventEmitter<Video>();
  @Output() showImage = new EventEmitter<{ url: string; name: string }>();

  posterLoaded = false;
  isMoreOverviewShown = false;
  maxSmallOverviewLength = 96;
  maxLargeOverviewLength = 504;
  posterPrefixW185 = ImagePrefixW185;
  posterPrefixOriginal = ImagePrefixOriginal;

  showImageFunction(posterPath: string): void {
    this.showImage.emit({
      url: this.posterPrefixOriginal + posterPath,
      name:
        this.tmdbShow || this.show
          ? (this.tmdbShow?.name ?? this.show?.title) + ' Poster'
          : 'Poster',
    });
  }
}
