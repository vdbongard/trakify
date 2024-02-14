import {
  afterRender,
  Component,
  ElementRef,
  EventEmitter,
  input,
  OnChanges,
  Output,
  viewChild,
} from '@angular/core';
import { MatMenu, MatMenuModule } from '@angular/material/menu';
import type { EpisodeFull, Show, ShowProgress, ShowWatched } from '@type/Trakt';
import type { TmdbSeason, TmdbShow } from '@type/Tmdb';
import { ImagePrefixW154 } from '@constants';
import { MatIconModule } from '@angular/material/icon';
import { NgOptimizedImage } from '@angular/common';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatButtonModule } from '@angular/material/button';
import { TickerComponent } from '@shared/components/ticker/ticker.component';
import { ShowListItemContentComponent } from '@shared/components/shows/show-list-item-content/show-list-item-content.component';
import { SimpleChangesTyped } from '@type/SimpleChanges';
import { ShowMeta } from '@type/Chip';
import { getShowId } from '@helper/IdGetters';

@Component({
  selector: 't-show-list-item',
  standalone: true,
  imports: [
    MatIconModule,
    MatProgressBarModule,
    MatMenuModule,
    NgOptimizedImage,
    MatButtonModule,
    TickerComponent,
    ShowListItemContentComponent,
  ],
  templateUrl: './show-list-item.component.html',
  styleUrl: './show-list-item.component.scss',
})
export class ShowListItemComponent implements OnChanges {
  show = input<Show>();
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

  @Output() addFavorite = new EventEmitter<Show>();
  @Output() removeFavorite = new EventEmitter<Show>();
  @Output() addShow = new EventEmitter<Show>();
  @Output() removeShow = new EventEmitter<Show>();

  posterImage = viewChild<ElementRef<HTMLImageElement>>('posterImage');

  posterLoaded = false;
  initialIndex?: number;

  protected readonly ImagePrefixW154 = ImagePrefixW154;

  constructor() {
    afterRender(() => {
      this.setViewTransitionName();
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
