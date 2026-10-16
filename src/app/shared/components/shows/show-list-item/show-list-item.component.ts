import {
  afterEveryRender,
  Component,
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

  /** The index decides preloading once, at the first render. Freezing it keeps `priority`
   *  from flipping when a refetch shifts the row down the list, because NgOptimizedImage
   *  rejects a `priority` change after the image has been initialised. */
  initialIndex = linkedSignal<number | undefined, number | undefined>({
    source: () => this.i(),
    computation: (i, previous) => previous?.value ?? i,
  });

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
