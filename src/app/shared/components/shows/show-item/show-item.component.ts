import {
  afterRender,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  signal,
  ViewChild,
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
import { ShowItemContentComponent } from '@shared/components/shows/show-item-content/show-item-content.component';
import { SimpleChangesTyped } from '@type/SimpleChanges';
import { ShowMeta } from '@type/Chip';
import { getShowId } from '@helper/IdGetters';

@Component({
  selector: 't-show-item',
  standalone: true,
  imports: [
    MatIconModule,
    MatProgressBarModule,
    MatMenuModule,
    NgOptimizedImage,
    MatButtonModule,
    TickerComponent,
    ShowItemContentComponent,
  ],
  templateUrl: './show-item.component.html',
  styleUrl: './show-item.component.scss',
})
export class ShowItemComponent implements OnChanges {
  @Input() isLoggedIn?: boolean | null;
  @Input() show?: Show;
  @Input() showMeta?: ShowMeta[];
  @Input() showWatched?: ShowWatched;

  _progress = signal<ShowProgress | undefined>(undefined);
  @Input() set progress(value: ShowProgress | undefined) {
    this._progress.set(value ? { ...value } : value);
  }

  get progress(): ShowProgress | undefined {
    return this._progress();
  }

  _tmdbShow = signal<TmdbShow | undefined>(undefined);
  @Input({ required: true }) set tmdbShow(value: TmdbShow | undefined) {
    this._tmdbShow.set(value ? { ...value } : value);
  }

  get tmdbShow(): TmdbShow | undefined {
    return this._tmdbShow();
  }

  _tmdbSeason = signal<TmdbSeason | null | undefined>(undefined);
  @Input() set tmdbSeason(value: TmdbSeason | null | undefined) {
    this._tmdbSeason.set(value ? { ...value } : value);
  }

  get tmdbSeason(): TmdbSeason | null | undefined {
    return this._tmdbSeason();
  }

  @Input() isFavorite?: boolean;
  @Input() isHidden?: boolean;
  @Input() isWatchlist?: boolean;

  _episode = signal<EpisodeFull | undefined>(undefined);
  @Input() set episode(value: EpisodeFull | undefined) {
    this._episode.set(value ? { ...value } : value);
  }

  get episode(): EpisodeFull | undefined {
    return this._episode();
  }

  @Input() withYear?: boolean;
  @Input() withEpisode?: boolean;
  @Input() withAddButtons?: boolean;
  @Input() withEpisodesCount?: boolean;
  @Input() withProgressbar?: boolean;
  @Input() withRelativeDate?: boolean;
  @Input() menu?: MatMenu;
  @Input() i?: number;

  @Output() addFavorite = new EventEmitter<Show>();
  @Output() removeFavorite = new EventEmitter<Show>();
  @Output() addShow = new EventEmitter<Show>();
  @Output() removeShow = new EventEmitter<Show>();

  @ViewChild('posterImage') posterImage!: ElementRef<HTMLImageElement>;

  posterLoaded = false;
  initialIndex?: number;
  posterPrefixLg = ImagePrefixW154;

  constructor() {
    afterRender(() => {
      this.posterImage?.nativeElement.style.setProperty('--show-id', getShowId(this.show));
    });
  }

  ngOnChanges(changes: SimpleChangesTyped<this>): void {
    if (
      changes.i?.firstChange &&
      changes.i.currentValue !== undefined &&
      this.initialIndex === undefined
    ) {
      this.initialIndex = changes.i.currentValue;
    }
  }

  preventEvent(event: Event): void {
    event.stopPropagation();
    event.preventDefault();
  }
}
