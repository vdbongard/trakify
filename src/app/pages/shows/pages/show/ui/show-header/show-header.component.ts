import { Component, computed, EventEmitter, Input, Output, Signal } from '@angular/core';
import { TmdbSeason, TmdbShow, Video } from '@type/Tmdb';
import { EpisodeFull, Show, ShowWatched } from '@type/Trakt';
import { CommonModule, NgOptimizedImage, NgTemplateOutlet, SlicePipe } from '@angular/common';
import { ShowSubheadingPipe } from '../../../../utils/pipes/show-subheading.pipe';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { ImagePrefixOriginal, ImagePrefixW185 } from '@constants';

@Component({
  selector: 't-show-header',
  templateUrl: './show-header.component.html',
  styleUrls: ['./show-header.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    NgOptimizedImage,
    ShowSubheadingPipe,
    MatIconModule,
    MatButtonModule,
    SlicePipe,
    NgTemplateOutlet,
  ],
})
export class ShowHeaderComponent {
  @Input({ required: true }) tmdbShow!: Signal<TmdbShow | undefined>;
  @Input({ required: true }) nextEpisode!: Signal<EpisodeFull | null | undefined>;
  @Input() isLoggedIn?: boolean | null;
  @Input() tmdbSeason?: TmdbSeason | null;
  @Input() showWatched?: ShowWatched | null;
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
  maxSmallOverviewLength = 104;
  maxLargeOverviewLength = 504;
  posterPrefixW185 = ImagePrefixW185;
  posterPrefixOriginal = ImagePrefixOriginal;

  getTrailer = computed(() => {
    return getTrailer(this.tmdbShow());
  });

  isNextEpisodeInFuture = computed(() => {
    return !!this.nextEpisode() && new Date(this.nextEpisode()!.first_aired!) > new Date();
  });

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

export function getTrailer(tmdbShow: TmdbShow | undefined): Video | undefined {
  if (!tmdbShow?.videos) return;
  const videos = [...tmdbShow.videos.results];
  const videosReversed = [...tmdbShow.videos.results].reverse();
  const trailer =
    videosReversed.find((video) => {
      return video.site === 'YouTube' && video.type === 'Trailer';
    }) ||
    videos.find((video) => {
      return video.site === 'YouTube' && video.type === 'Teaser';
    });
  return trailer;
}
