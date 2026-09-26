import {
  afterNextRender,
  Component,
  computed,
  ElementRef,
  input,
  OnDestroy,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { TmdbSeason, TmdbShow, Video } from '@type/Tmdb';
import { EpisodeFull, Show, ShowWatched } from '@type/Trakt';
import { NgOptimizedImage, NgTemplateOutlet, SlicePipe } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ImagePrefixOriginal, ImagePrefixW185 } from '@constants';
import { getShowId } from '@helper/IdGetters';
import { addCss } from '@helper/addCss';
import { getTrailer } from '@helper/getTrailer';

@Component({
  selector: 't-show-header',
  imports: [
    NgOptimizedImage,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    SlicePipe,
    NgTemplateOutlet,
  ],
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
  /** `undefined` while the parent cannot tell yet — the action buttons stay hidden in that state
   *  rather than appearing and then being taken away again. */
  isNewShow = input<boolean | undefined>();
  isWatchlist = input<boolean>();
  disablePosterFadeIn = input<boolean>();

  addFavorite = output<Show | undefined | null>();
  removeFavorite = output<Show | undefined | null>();
  addToWatchlist = output<Show>();
  removeFromWatchlist = output<Show>();
  addShow = output<Show>();
  showTrailer = output<Video>();

  posterThumbnail = viewChild<ElementRef<HTMLImageElement>>('posterThumbnail');

  isMoreOverviewShown = signal(false);
  maxSmallOverviewLength = 184;
  maxLargeOverviewLength = 504;
  styleSheet: HTMLStyleElement | undefined;
  observer = signal<IntersectionObserver | undefined>(undefined);
  posterLoaded = signal(false);

  showSubheading = computed(() => {
    const tmdbShow = this.tmdbShow();
    if (!tmdbShow) return;
    let heading = tmdbShow.status;
    if (tmdbShow.networks?.[0]) heading += ' · ' + tmdbShow.networks[0].name;
    return heading;
  });

  getTrailer = computed(() => getTrailer(this.tmdbShow()));

  /** Whether TMDB has actually told us anything about videos yet.
   *
   *  The bulk TMDB sync stores each show from `/3/tv/{id}` without the `videos` appendage, so on
   *  an in-app navigation `tmdbShow` is first populated from that cache, which has no `videos`
   *  key, and only later replaced by the extended fetch that requests it. Without this guard the
   *  Trailer button would render disabled and then switch to enabled for the majority of shows,
   *  which do have a trailer. */
  hasVideoData = computed(() => this.tmdbShow()?.videos !== undefined);

  /** Only a known-absent trailer disables the button; a not-yet-loaded one must not. */
  isTrailerDisabled = computed(() => this.hasVideoData() && !this.getTrailer());

  isNextEpisodeInFuture = computed(() => {
    return !!this.nextEpisode() && new Date(this.nextEpisode()!.first_aired!) > new Date();
  });

  protected readonly ImagePrefixW185 = ImagePrefixW185;
  protected readonly ImagePrefixOriginal = ImagePrefixOriginal;

  constructor() {
    this.initPosterViewTransitionName();
    this.initPosterThumbnailOutOfView();
  }

  ngOnDestroy(): void {
    this.cleanUpPosterViewTransitionName();
    this.destroyPosterThumbnailOutOfView();
  }

  initPosterViewTransitionName(): void {
    afterNextRender(() => {
      const posterThumbnail = this.posterThumbnail()?.nativeElement;
      if (!posterThumbnail) return;

      posterThumbnail.style.setProperty('view-transition-name', getShowId(this.show()));

      // Make sure the show poster is on top of the other posters in the show list when transitioning
      this.styleSheet = addCss(
        `::view-transition-group(${getShowId(this.show())}) { z-index: 50; }`,
      );
    });
  }

  cleanUpPosterViewTransitionName(): void {
    // Delay removal until view transition finishes (250ms default duration + offset)
    this.removeStylesheet(250 + 2500);
  }

  removeStylesheet(delay: number): void {
    if (!this.styleSheet) return;
    const styleSheet = this.styleSheet;
    // Delay removal of the stylesheet
    setTimeout(() => styleSheet.remove(), delay);
    this.styleSheet = undefined;
  }

  initPosterThumbnailOutOfView(): void {
    if (!window.IntersectionObserver) {
      return;
    }

    afterNextRender(() => {
      const posterThumbnail = this.posterThumbnail()?.nativeElement;
      if (!posterThumbnail) return;

      this.observer()?.observe(posterThumbnail);
    });

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          this.posterThumbnail()?.nativeElement.style.setProperty(
            'view-transition-name',
            getShowId(this.show()),
          );
        } else {
          this.posterThumbnail()?.nativeElement.style.removeProperty('view-transition-name');
        }
      });
    });

    this.observer.set(observer);
  }

  destroyPosterThumbnailOutOfView(): void {
    const posterThumbnail = this.posterThumbnail()?.nativeElement;
    if (!posterThumbnail) return;

    this.observer()?.unobserve(posterThumbnail);
  }
}
