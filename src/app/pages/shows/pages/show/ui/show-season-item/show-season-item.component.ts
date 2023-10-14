import { Component, computed, Input, signal, Signal } from '@angular/core';
import type { EpisodeFull, ShowProgress } from '@type/Trakt';
import type { TmdbShowSeason } from '@type/Tmdb';
import { CommonModule } from '@angular/common';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { getAiredEpisodesInSeason } from '@helper/episodes';
import { seasonTitle } from '@helper/seasonTitle';

@Component({
  selector: 't-show-season-item',
  templateUrl: './show-season-item.component.html',
  styleUrls: ['./show-season-item.component.scss'],
  standalone: true,
  imports: [CommonModule, MatProgressBarModule],
})
export class ShowSeasonItemComponent {
  @Input({ required: true }) showProgress!: Signal<ShowProgress | undefined>;

  _season = signal<TmdbShowSeason>(getDefaultTmdbSeason());
  @Input({ required: true }) set season(value: TmdbShowSeason) {
    this._season.set(value);
  }

  @Input({ required: true }) seasonsEpisodes!: Signal<
    Record<string, EpisodeFull[] | undefined> | undefined
  >;

  seasonProgress = computed(() => {
    const showProgress = this.showProgress();
    if (!showProgress) return;
    return showProgress.seasons.find((season) => season.number === this._season()?.season_number);
  });

  seasonTitle = computed(() =>
    seasonTitle('Season ' + (this.seasonProgress()?.number ?? this._season()?.season_number)),
  );

  episodesAired = computed(() => {
    const seasonProgress = this.seasonProgress();
    const seasonsEpisodes = this.seasonsEpisodes?.();
    if (!seasonProgress && !seasonsEpisodes) return 0;

    const season = this._season();
    const seasonNumber = seasonProgress?.number ?? season?.season_number;
    if (seasonNumber === undefined) return 0;
    return getAiredEpisodesInSeason(seasonsEpisodes?.[seasonNumber] ?? [], seasonProgress);
  });
}

export function getDefaultTmdbSeason(): TmdbShowSeason {
  return {
    air_date: null,
    episode_count: 0,
    id: 0,
    name: '',
    overview: '',
    poster_path: null,
    season_number: 0,
  };
}
