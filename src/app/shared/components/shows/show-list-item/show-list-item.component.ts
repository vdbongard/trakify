import {
  afterEveryRender,
  Component,
  computed,
  ElementRef,
  input,
  linkedSignal,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { MatMenu, MatMenuModule } from '@angular/material/menu';
import type { EpisodeFull, Show, ShowProgress, ShowWatched } from '@type/Trakt';
import type { TmdbSeason, TmdbShow } from '@type/Tmdb';
import { ImagePrefixW185 } from '@constants';
import { MatIconModule } from '@angular/material/icon';
import { NgOptimizedImage } from '@angular/common';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatButtonModule } from '@angular/material/button';
import { ShowListItemContentComponent } from '@shared/components/shows/show-list-item-content/show-list-item-content.component';
import { ShowMeta } from '@type/Chip';
import { getShowId } from '@helper/IdGetters';
import { getShowPosterPath } from '@helper/getShowPosterPath';

@Component({
  selector: 't-show-list-item',
  imports: [
    MatIconModule,
    MatProgressBarModule,
    MatMenuModule,
    NgOptimizedImage,
    MatButtonModule,
    ShowListItemContentComponent,
  ],
  templateUrl: './show-list-item.component.html',
  styleUrl: './show-list-item.component.scss',
})
export class ShowListItemComponent {
  show = input.required<Show>();
  showMeta = input<ShowMeta[]>();
  showWatched = input<ShowWatched>();
  progress = input<ShowProgress>();
  tmdbShow = input<TmdbShow>();
  tmdbSeason = input<TmdbSeason>();
  isLoggedIn = input<boolean>();
  isFavorite = input<boolean>();
  isHidden = input<boolean>();
  isWatchlist = input<boolean>();
  withEagerImage = input<boolean>();
  episode = input<EpisodeFull>();
  withYear = input<boolean>();
  withEpisode = input<boolean>();
  withAddButtons = input<boolean>();
  withEpisodesCount = input<boolean>();
  withProgressbar = input<boolean>();
  withRelativeDate = input<boolean>();
  withoutCustomProperty = input<boolean>();
  menu = input<MatMenu>();
  i = input<number>();

  addFavorite = output<Show>();
  removeFavorite = output<Show>();
  addShow = output<Show>();
  removeShow = output<Show>();

  posterImage = viewChild<ElementRef<HTMLImageElement>>('posterImage');

  posterLoaded = signal(false);

  /** The poster comes from the TMDB show's own season list (see `getShowPosterPath`), so this row
   *  and the Show page it links to name the same artwork before any season request lands. */
  posterPath = computed(() =>
    getShowPosterPath(this.tmdbShow(), this.progress()?.next_episode?.season, this.tmdbSeason()),
  );

  /** The index decides preloading once, at the first render. Freezing it keeps `priority`
   *  from flipping when a refetch shifts the row down the list, because NgOptimizedImage
   *  rejects a `priority` change after the image has been initialised. */
  initialIndex = linkedSignal<number | undefined, number | undefined>({
    source: () => this.i(),
    computation: (i, previous) => previous?.value ?? i,
  });

  /** Poster preloading follows the row's position in the whole list, so a list split into pages
   *  preloads one screenful rather than a screenful per page. */
  isPriority = computed(() => (this.initialIndex() ?? Infinity) <= 4);

  /** A row in the first page request loads eagerly — it is one the reader scrolls into next —
   *  while later pages stay lazy. A priority poster is already eager, and NgOptimizedImage rejects
   *  a `loading` input next to `priority`, so it is left undefined for that one. */
  imageLoading = computed(() =>
    !this.isPriority() && this.withEagerImage() ? 'eager' : undefined,
  );

  protected readonly ImagePrefixW185 = ImagePrefixW185;

  constructor() {
    afterEveryRender(() => {
      this.setViewTransitionName();
    });
  }

  private setViewTransitionName(): void {
    if (this.withoutCustomProperty() || !this.show()) return;
    this.posterImage()?.nativeElement.style.setProperty(
      'view-transition-name',
      getShowId(this.show()),
    );
  }

  preventEvent(event: Event): void {
    event.stopPropagation();
    event.preventDefault();
  }
}
