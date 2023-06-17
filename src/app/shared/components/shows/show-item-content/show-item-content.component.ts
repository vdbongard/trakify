import { Component, computed, EventEmitter, Input, Output, Signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EpisodeFull, Show, ShowProgress, ShowWatched } from '@type/Trakt';
import { TmdbSeason, TmdbShow } from '@type/Tmdb';
import { TickerComponent } from '@shared/components/ticker/ticker.component';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { RelativeDatePipe } from '@shared/pipes/relativeDate.pipe';
import { IsShowEndedPipe } from '@shared/pipes/is-show-ended.pipe';
import { EpisodeCountComponent } from '@shared/components/episode-count/episode-count.component';
import { getAiredEpisodes } from '@helper/episodes';

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
    EpisodeCountComponent,
  ],
  templateUrl: './show-item-content.component.html',
  styleUrls: ['./show-item-content.component.scss'],
})
export class ShowItemContentComponent {
  @Input() isLoggedIn?: boolean | null;
  @Input() show?: Show;
  @Input() showWatched?: ShowWatched;
  @Input({ required: true }) showProgress!: Signal<ShowProgress | undefined>;
  @Input({ required: true }) tmdbShow!: Signal<TmdbShow | null | undefined>;
  @Input({ required: true }) tmdbSeason!: Signal<TmdbSeason | null | undefined>;
  @Input() isFavorite?: boolean;
  @Input({ required: true }) episode!: Signal<EpisodeFull | undefined>;
  @Input() withYear?: boolean;
  @Input() withEpisode?: boolean;
  @Input() withEpisodesCount?: boolean;
  @Input() withProgressbar?: boolean;
  @Input() withRelativeDate?: boolean;

  @Output() addFavorite = new EventEmitter<Show>();
  @Output() removeFavorite = new EventEmitter<Show>();

  episodes = computed(() => this.tmdbShow()?.number_of_episodes ?? 0);
  network = computed(() => this.tmdbShow()?.networks?.[0]?.name);
  progress = computed(() => {
    if (!this.showProgress()) return 0;
    const airedEpisodes = getAiredEpisodes(this.showProgress()!, this.episode(), this.tmdbSeason());
    return (this.showProgress()!.completed / airedEpisodes) * 100;
  });

  preventEvent(event: Event): void {
    event.stopPropagation();
    event.preventDefault();
  }
}
