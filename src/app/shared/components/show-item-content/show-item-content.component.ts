import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EpisodeFull, Show, ShowProgress, ShowWatched } from '@type/interfaces/Trakt';
import { TmdbShow } from '@type/interfaces/Tmdb';
import { TickerComponent } from '@shared/components/ticker/ticker.component';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { RelativeDatePipe } from '@shared/pipes/relativeDate.pipe';
import { IsShowEndedPipe } from '@shared/pipes/is-show-ended.pipe';

@Component({
  selector: 't-show-item-content',
  standalone: true,
  imports: [
    CommonModule,
    TickerComponent,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    RelativeDatePipe,
    IsShowEndedPipe,
  ],
  templateUrl: './show-item-content.component.html',
  styleUrls: ['./show-item-content.component.scss'],
})
export class ShowItemContentComponent implements OnChanges {
  @Input() isLoggedIn?: boolean | null;
  @Input() show?: Show;
  @Input() showWatched?: ShowWatched;
  @Input() showProgress?: ShowProgress;
  @Input() tmdbShow?: TmdbShow | null;
  @Input() isFavorite?: boolean;
  @Input() episode?: EpisodeFull | null;
  @Input() withYear?: boolean;
  @Input() withEpisode?: boolean;
  @Input() withEpisodesCount?: boolean;
  @Input() withProgressbar?: boolean;
  @Input() withRelativeDate?: boolean;

  @Output() addFavorite = new EventEmitter<Show>();
  @Output() removeFavorite = new EventEmitter<Show>();

  episodes = 0;
  episodesRemaining = 0;
  network: string | undefined;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['tmdbShow'] || changes['progress']) {
      this.episodes = this.tmdbShow?.number_of_episodes ?? 0;
    }
    if (changes['progress']) {
      this.episodesRemaining =
        this.showProgress && this.showProgress.completed > 0
          ? this.showProgress.aired - this.showProgress.completed
          : 0;
    }
    if (changes['tmdbShow']) {
      this.network = this.tmdbShow?.networks?.[0]?.name;
    }
  }

  preventEvent(event: Event): void {
    event.stopPropagation();
    event.preventDefault();
  }
}
