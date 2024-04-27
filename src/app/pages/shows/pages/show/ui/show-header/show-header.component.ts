import {
  afterNextRender,
  afterRender,
  Component,
  computed,
  type ElementRef,
  input,
  type OnDestroy,
  output,
  signal,
  viewChild,
} from '@angular/core';
import type { TmdbSeason, TmdbShow, Video } from '@type/Tmdb';
import type { EpisodeFull, Show, ShowWatched } from '@type/Trakt';
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
  show = input<Show>();
  tmdbShow = input<TmdbShow>();
  tmdbSeason = input<TmdbSeason>();
  nextEpisode = input<EpisodeFull>();
  showWatched = input<ShowWatched>();
  isLoggedIn = input<boolean>();
  isFavorite = input<boolean>();
  isSmall = input<boolean>();
  isNewShow = input<boolean>();
  isWatchlist = input<boolean>();
  disablePosterFadeIn = input<boolean>();

  addFavorite = output<Show | undefined | null>();
  removeFavorite = output<Show | undefined | null>();
  addToWatchlist = output<Show>();
  removeFromWatchlist = output<Show>();
  addShow = output<Show>();
  showTrailer = output<Video>();

  posterThumbnail = viewChild<ElementRef<HTMLImageElement>>('posterThumbnail');

  isMoreOverviewShown = false;
  maxSmallOverviewLength = 104;
  maxLargeOverviewLength = 504;
  styleSheet: HTMLStyleElement | undefined = undefined;
  posterLoaded = signal(false);

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
      this.posterThumbnail()?.nativeElement.style.setProperty(
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
