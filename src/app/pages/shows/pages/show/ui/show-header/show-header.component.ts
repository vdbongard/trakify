import {
  afterNextRender,
  Component,
  computed,
  ElementRef,
  Injector,
  inject,
  input,
  OnDestroy,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { TmdbShow, Video } from '@type/Tmdb';
import { Show, ShowWatched } from '@type/Trakt';
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
  /** The poster path the Show page resolved (see `ShowComponent.posterPath`), so the header does
   *  not reach for the season detail the page fetches for its episodes. */
  posterPath = input<string>();
  showWatched = input<ShowWatched>();
  isLoggedIn = input<boolean>();
  isFavorite = input<boolean>();
  isSmall = input<boolean>();
  /** `undefined` while the parent cannot tell yet — the watchlist button stays hidden in that state
   *  rather than appearing and then being taken away again. */
  isNewShow = input<boolean>();
  isWatchlist = input<boolean>();
  disablePosterFadeIn = input<boolean>();

  addFavorite = output<Show>();
  removeFavorite = output<Show>();
  addToWatchlist = output<Show>();
  removeFromWatchlist = output<Show>();
  showTrailer = output<Video>();

  private readonly injector = inject(Injector);

  posterThumbnail = viewChild<ElementRef<HTMLImageElement>>('posterThumbnail');
  overviewWrapper = viewChild<ElementRef<HTMLElement>>('overviewWrapper');

  isMoreOverviewShown = signal(false);
  maxSmallOverviewLength = 184;
  maxLargeOverviewLength = 504;
  styleSheet: HTMLStyleElement | undefined;
  observer = signal<IntersectionObserver | undefined>(undefined);
  posterLoaded = signal(false);

  /** Characters the overview shows before `more` is pressed, at the current width. */
  overviewLimit = computed(() =>
    this.isSmall() ? this.maxSmallOverviewLength : this.maxLargeOverviewLength,
  );

  overviewIsLong = computed(() => (this.tmdbShow()?.overview?.length ?? 0) >= this.overviewLimit());

  showSubheading = computed(() => {
    const tmdbShow = this.tmdbShow();
    if (!tmdbShow) return;
    let heading = tmdbShow.status;
    if (tmdbShow.networks?.[0]) heading += ' · ' + tmdbShow.networks[0].name;
    return heading;
  });

  trailer = computed(() => getTrailer(this.tmdbShow()));

  /** Whether TMDB has actually told us anything about videos yet.
   *
   *  The bulk TMDB sync stores each show from `/3/tv/{id}` without the `videos` appendage, so on
   *  an in-app navigation `tmdbShow` is first populated from that cache, which has no `videos`
   *  key, and only later replaced by the extended fetch that requests it. Without this guard the
   *  Trailer button would render disabled and then switch to enabled for the majority of shows,
   *  which do have a trailer. */
  hasVideoData = computed(() => this.tmdbShow()?.videos !== undefined);

  /** Only a known-absent trailer disables the button; a not-yet-loaded one must not. */
  isTrailerDisabled = computed(() => this.hasVideoData() && !this.trailer());

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

  toggleOverview(): void {
    const wrapper = this.overviewWrapper()?.nativeElement;
    const expanded = !this.isMoreOverviewShown();

    // No measurement, no inline height: the global reduced-motion rule zeroes every transition
    // duration, so no `transitionend` would fire and the box would stay pinned at a stale height.
    if (!wrapper || this.prefersReducedMotion()) {
      this.isMoreOverviewShown.set(expanded);
      return;
    }

    // Height of the state being left, read before the flag swaps the text underneath it.
    const from = wrapper.offsetHeight;
    this.isMoreOverviewShown.set(expanded);

    afterNextRender(
      () => {
        // `scrollHeight` reports the content height of the state just rendered, even while the box
        // is clipped — so the target needs no double render.
        const to = wrapper.scrollHeight;
        if (Math.abs(to - from) < 1) {
          wrapper.style.height = '';
          return;
        }

        wrapper.style.height = `${from}px`;
        // Commit the start height: writing `from` and `to` in the same style pass collapses into a
        // single change, and a transition needs two distinct computed values to run.
        wrapper.getBoundingClientRect();
        wrapper.style.height = `${to}px`;
      },
      { injector: this.injector },
    );
  }

  onOverviewTransitionEnd(event: TransitionEvent): void {
    if (event.propertyName !== 'height') return;
    if (event.target !== event.currentTarget) return;

    (event.currentTarget as HTMLElement).style.height = '';
  }

  private prefersReducedMotion(): boolean {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }
}
