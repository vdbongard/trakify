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
  posterPath = input<string>();
  showWatched = input<ShowWatched>();
  isLoggedIn = input<boolean>();
  isFavorite = input<boolean>();
  isSmall = input<boolean>();
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

  hasVideoData = computed(() => this.tmdbShow()?.videos !== undefined);

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

      this.styleSheet = addCss(
        `::view-transition-group(${getShowId(this.show())}) { z-index: 50; }`,
      );
    });
  }

  cleanUpPosterViewTransitionName(): void {
    this.removeStylesheet(250 + 2500);
  }

  removeStylesheet(delay: number): void {
    if (!this.styleSheet) return;
    const styleSheet = this.styleSheet;
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

    if (!wrapper || this.prefersReducedMotion()) {
      this.isMoreOverviewShown.set(expanded);
      return;
    }

    const from = wrapper.offsetHeight;
    this.isMoreOverviewShown.set(expanded);

    afterNextRender(
      () => {
        const to = wrapper.scrollHeight;
        if (Math.abs(to - from) < 1) {
          wrapper.style.height = '';
          return;
        }

        wrapper.style.height = `${from}px`;
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
