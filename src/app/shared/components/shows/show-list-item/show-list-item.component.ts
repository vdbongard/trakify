import {
  afterRender,
  Component,
  effect,
  ElementRef,
  input,
  OnChanges,
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
import { SimpleChangesTyped } from '@type/SimpleChanges';
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
export class ShowListItemComponent implements OnChanges {
  show = input.required<Show>();
  showMeta = input<ShowMeta[]>();
  showWatched = input<ShowWatched>();
  progress = input<ShowProgress>();
  tmdbShow = input<TmdbShow | null>();
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
  initialIndex?: number;

  protected readonly ImagePrefixW185 = ImagePrefixW185;

  constructor() {
    afterRender(() => {
      this.setViewTransitionName();
    });

    effect(() => {
      this.posterLoaded.set(!!this.posterImage()?.nativeElement.complete);
    });
  }

  ngOnChanges(changes: SimpleChangesTyped<this>): void {
    if (
      changes.i?.firstChange &&
      changes.i.currentValue !== undefined &&
      this.initialIndex === undefined
    ) {
      this.initialIndex = this.i();
    }
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
