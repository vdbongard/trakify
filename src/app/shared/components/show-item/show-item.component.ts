import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
} from '@angular/core';
import { MatMenu, MatMenuModule } from '@angular/material/menu';

import type { EpisodeFull, Show, ShowProgress, ShowWatched } from '@type/interfaces/Trakt';
import type { TmdbSeason, TmdbShow } from '@type/interfaces/Tmdb';
import { PosterPrefixSm } from '@constants';
import { MatIconModule } from '@angular/material/icon';
import { IsShowEndedPipe } from '../../pipes/is-show-ended.pipe';
import { RelativeDatePipe } from '../../pipes/relativeDate.pipe';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 't-show-item',
  templateUrl: './show-item.component.html',
  styleUrls: ['./show-item.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    MatIconModule,
    CommonModule,
    MatProgressBarModule,
    MatMenuModule,
    NgOptimizedImage,
    IsShowEndedPipe,
    RelativeDatePipe,
    MatButtonModule,
  ],
})
export class ShowItemComponent implements OnChanges {
  @Input() isLoggedIn?: boolean | null;
  @Input() show?: Show;
  @Input() showWatched?: ShowWatched;
  @Input() progress?: ShowProgress;
  @Input() tmdbShow?: TmdbShow;
  @Input() tmdbSeason?: TmdbSeason | null;
  @Input() isFavorite?: boolean;
  @Input() isHidden?: boolean;
  @Input() isWatchlist?: boolean;
  @Input() episode?: EpisodeFull | null;
  @Input() withYear?: boolean;
  @Input() withEpisode?: boolean;
  @Input() withAddButtons?: boolean;
  @Input() withEpisodesCount?: boolean;
  @Input() withProgressbar?: boolean;
  @Input() withRelativeDate?: boolean;
  @Input() menu?: MatMenu;

  @Output() addFavorite = new EventEmitter<Show>();
  @Output() removeFavorite = new EventEmitter<Show>();
  @Output() addShow = new EventEmitter<Show>();
  @Output() removeShow = new EventEmitter<Show>();

  posterLoaded = false;
  initialIndex?: number;
  posterPrefixLg = PosterPrefixSm;

  ngOnChanges(changes: SimpleChanges): void {
    if (
      changes['i']?.firstChange &&
      changes['i']?.currentValue !== undefined &&
      this.initialIndex === undefined
    ) {
      this.initialIndex = changes['i'].currentValue;
    }
  }

  preventEvent(event: Event): void {
    event.stopPropagation();
    event.preventDefault();
  }
}
