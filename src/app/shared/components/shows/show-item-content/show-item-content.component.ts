import { Component, EventEmitter, Input, OnChanges, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EpisodeFull, Show, ShowProgress, ShowWatched } from '@type/Trakt';
import { TmdbSeason, TmdbShow } from '@type/Tmdb';
import { TickerComponent } from '@shared/components/ticker/ticker.component';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { RelativeDatePipe } from '@shared/pipes/relativeDate.pipe';
import { IsShowEndedPipe } from '@shared/pipes/is-show-ended.pipe';
import { SimpleChangesTyped } from '@type/SimpleChanges';
import { RemainingPipe } from '@shared/pipes/remaining.pipe';
import { EpisodeCountComponent } from '@shared/components/episode-count/episode-count.component';
import { AiredPipe } from '@shared/pipes/aired.pipe';

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
    RemainingPipe,
    EpisodeCountComponent,
    AiredPipe,
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
  @Input() tmdbSeason?: TmdbSeason | null;
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
  network?: string;

  ngOnChanges(changes: SimpleChangesTyped<this>): void {
    if (changes.tmdbShow) {
      this.episodes = this.tmdbShow?.number_of_episodes ?? 0;
    }
    if (changes.tmdbShow) {
      this.network = this.tmdbShow?.networks?.[0]?.name;
    }
  }

  preventEvent(event: Event): void {
    event.stopPropagation();
    event.preventDefault();
  }
}
