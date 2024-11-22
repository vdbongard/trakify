import { Component, computed, input, output } from '@angular/core';
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
  showProgress = input<ShowProgress>();
  tmdbShow = input<TmdbShow | null>();
  tmdbSeason = input<TmdbSeason>();
  episode = input<EpisodeFull>();
  show = input<Show>();
  showMeta = input<ShowMeta[]>();
  showWatched = input<ShowWatched>();
  isLoggedIn = input<boolean>();
  isFavorite = input<boolean>();
  withYear = input<boolean>();
  withEpisode = input<boolean>();
  withEpisodesCount = input<boolean>();
  withProgressbar = input<boolean>();
  withRelativeDate = input<boolean>();

  addFavorite = output<Show>();
  removeFavorite = output<Show>();

  episodes = computed(() => this.tmdbShow()?.number_of_episodes ?? 0);
  network = computed(() => this.tmdbShow()?.networks?.[0]?.name);
  progress = computed(() => {
    if (!this.showProgress()) return 0;
    const airedEpisodes = getAiredEpisodes(this.showProgress()!, this.episode(), this.tmdbSeason());
    return (this.showProgress()!.completed / airedEpisodes) * 100;
  });
  isShowEnded = computed(() => this.tmdbShow() && isShowEnded(this.tmdbShow()!));
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
