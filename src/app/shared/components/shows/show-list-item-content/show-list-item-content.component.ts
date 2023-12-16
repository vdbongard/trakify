import { Component, computed, EventEmitter, Input, Output, Signal } from '@angular/core';
import { DecimalPipe, formatDate } from '@angular/common';
import { EpisodeFull, Show, ShowProgress, ShowWatched } from '@type/Trakt';
import { TmdbSeason, TmdbShow } from '@type/Tmdb';
import { TickerComponent } from '@shared/components/ticker/ticker.component';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { EpisodeCountComponent } from '@shared/components/episode-count/episode-count.component';
import { getAiredEpisodes } from '@helper/episodes';
import { isShowEnded } from '@helper/isShowEnded';
import { getRelativeDate } from '@helper/getRelativeDate';
import { ShowMeta } from '@type/Chip';

@Component({
  selector: 't-show-list-item-content',
  standalone: true,
  imports: [
    DecimalPipe,
    TickerComponent,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    EpisodeCountComponent,
  ],
  templateUrl: './show-list-item-content.component.html',
  styleUrl: './show-list-item-content.component.scss',
})
export class ShowListItemContentComponent {
  @Input({ required: true }) showProgress!: Signal<ShowProgress | undefined>;
  @Input({ required: true }) tmdbShow!: Signal<TmdbShow | undefined>;
  @Input({ required: true }) tmdbSeason!: Signal<TmdbSeason | null | undefined>;
  @Input({ required: true }) episode!: Signal<EpisodeFull | undefined>;
  @Input() isLoggedIn?: boolean | null;
  @Input() show?: Show;
  @Input() showMeta?: ShowMeta[];
  @Input() showWatched?: ShowWatched;
  @Input() isFavorite?: boolean;
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
  isShowEnded = computed(() => isShowEnded(this.tmdbShow()));
  firstAiredDate = computed(() => {
    if (!this.episode()?.first_aired) return '';
    return formatDate(this.episode()!.first_aired!, 'd. MMM. yyyy (E.)', 'en');
  });
  firstAiredRelativeDate = computed(() =>
    getRelativeDate(this.episode()?.first_aired, 'd. MMM. yyyy (E.)'),
  );

  preventEvent(event: Event): void {
    event.stopPropagation();
    event.preventDefault();
  }
}
