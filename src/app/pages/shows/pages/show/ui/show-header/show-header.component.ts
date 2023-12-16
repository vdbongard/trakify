import {
  afterRender,
  Component,
  computed,
  ElementRef,
  EventEmitter,
  Input,
  OnDestroy,
  Output,
  Signal,
  ViewChild,
} from '@angular/core';
import { TmdbSeason, TmdbShow, Video } from '@type/Tmdb';
import { EpisodeFull, Show, ShowWatched } from '@type/Trakt';
import { NgOptimizedImage, NgTemplateOutlet, SlicePipe } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { ImagePrefixOriginal, ImagePrefixW185 } from '@constants';
import { getShowId } from '@helper/IdGetters';

@Component({
  selector: 't-show-header',
  standalone: true,
  imports: [NgOptimizedImage, MatIconModule, MatButtonModule, SlicePipe, NgTemplateOutlet],
  templateUrl: './show-header.component.html',
  styleUrl: './show-header.component.scss',
})
export class ShowHeaderComponent implements OnDestroy {
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

  @ViewChild('posterThumbnail') posterThumbnail!: ElementRef<HTMLImageElement>;

  isMoreOverviewShown = false;
  maxSmallOverviewLength = 104;
  maxLargeOverviewLength = 504;
  ruleIndex: number | undefined = undefined;

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
        getShowId(this.show),
      );

      this.removeRule();
      this.addRule();
    });
  }

  ngOnDestroy(): void {
    this.removeRule();
  }

  /*
   * Make sure the show poster is on top of the other posters in the show list when transitioning
   */
  private addRule(): void {
    this.ruleIndex = this.getGlobalStyles().insertRule(
      `::view-transition-group(${getShowId(this.show)}) { z-index: 50; }`,
      0,
    );
  }

  /*
   * Remove the rule added above
   */
  private removeRule(): void {
    const ruleIndex = this.ruleIndex;
    setTimeout(() => {
      if (ruleIndex !== undefined) this.getGlobalStyles().deleteRule(ruleIndex);
    }, 1);
  }

  private getGlobalStyles(): CSSStyleSheet {
    // Global styles are added in the following order:
    // 1. Roboto font stylesheet
    // 2. Material icons stylesheet
    // 3. styles.css (global styles, compiled from src/styles.scss)
    const globalStyles = document.styleSheets[2];
    if (!globalStyles?.href?.endsWith('/styles.css')) {
      throw new Error('globalStyles not found');
    }
    return globalStyles;
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
