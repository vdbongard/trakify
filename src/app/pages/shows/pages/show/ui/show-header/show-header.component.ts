import {
  afterNextRender,
  afterRender,
  Component,
  computed,
  ElementRef,
  EventEmitter,
  input,
  OnDestroy,
  Output,
  ViewChild,
} from '@angular/core';
import { TmdbSeason, TmdbShow, Video } from '@type/Tmdb';
import { EpisodeFull, Show, ShowWatched } from '@type/Trakt';
import { NgOptimizedImage, NgTemplateOutlet, SlicePipe } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { ImagePrefixOriginal, ImagePrefixW185 } from '@constants';
import { getShowId } from '@helper/IdGetters';
import { addCss } from '@helper/addCss';

@Component({
  selector: 't-show-header',
  standalone: true,
  imports: [NgOptimizedImage, MatIconModule, MatButtonModule, SlicePipe, NgTemplateOutlet],
  templateUrl: './show-header.component.html',
  styleUrl: './show-header.component.scss',
})
export class ShowHeaderComponent implements OnDestroy {
  tmdbShow = input.required<TmdbShow | undefined>();
  nextEpisode = input.required<EpisodeFull | null | undefined>();
  show = input.required<Show | undefined>();
  isLoggedIn = input<boolean | null>();
  tmdbSeason = input<TmdbSeason | null>();
  showWatched = input<ShowWatched | null>();
  isFavorite = input<boolean | null>();
  isSmall = input<boolean | null>();
  isNewShow = input<boolean>();
  isWatchlist = input<boolean | null>();

  @Output() addFavorite = new EventEmitter<Show | undefined | null>();
  @Output() removeFavorite = new EventEmitter<Show | undefined | null>();
  @Output() addToWatchlist = new EventEmitter<Show>();
  @Output() removeFromWatchlist = new EventEmitter<Show>();
  @Output() addShow = new EventEmitter<Show>();
  @Output() showTrailer = new EventEmitter<Video>();

  @ViewChild('posterThumbnail') posterThumbnail!: ElementRef<HTMLImageElement>;

  isMoreOverviewShown = false;
  maxSmallOverviewLength = 104;
  maxLargeOverviewLength = 504;
  styleSheet: HTMLStyleElement | undefined = undefined;
  posterLoaded = false;

  showSubheading = computed(() => {
    const tmdbShow = this.tmdbShow();
    if (!tmdbShow) return ' ';
    let heading = tmdbShow.status;
    if (tmdbShow.networks?.[0]) heading += ' · ' + tmdbShow.networks[0].name;
    return heading;
  });

  getTrailer = computed(() => getTrailer(this.tmdbShow()));

  isNextEpisodeInFuture = computed(() => {
    return !!this.nextEpisode() && new Date(this.nextEpisode()!.first_aired!) > new Date();
  });

  protected readonly ImagePrefixW185 = ImagePrefixW185;
  protected readonly ImagePrefixOriginal = ImagePrefixOriginal;

  constructor() {
    afterRender(() => {
      this.posterThumbnail?.nativeElement.style.setProperty(
        'view-transition-name',
        getShowId(this.show()),
      );
    });

    afterNextRender(() => {
      // Make sure the show poster is on top of the other posters in the show list when transitioning
      this.styleSheet = addCss(
        `::view-transition-group(${getShowId(this.show())}) { z-index: 50; }`,
      );
    });
  }

  ngOnDestroy(): void {
    this.removeStylesheet();
  }

  removeStylesheet(): void {
    if (this.styleSheet === undefined) return;
    const styleSheet = this.styleSheet;
    // Delay removal of the stylesheet which is needed for the view transition to work
    setTimeout(() => styleSheet.remove(), 1);
    this.styleSheet = undefined;
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
