import { Component, computed, Input, OnChanges, signal, Signal } from '@angular/core';
import type { EpisodeFull, ShowProgress } from '@type/Trakt';
import type { TmdbShowSeason } from '@type/Tmdb';
import { CommonModule } from '@angular/common';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { SimpleChangesTyped } from '@type/SimpleChanges';
import { getAiredEpisodesInSeason } from '@helper/episodes';
import { seasonTitle } from '@helper/seasonTitle';

@Component({
  selector: 't-show-season-item',
  templateUrl: './show-season-item.component.html',
  styleUrls: ['./show-season-item.component.scss'],
  standalone: true,
  imports: [CommonModule, MatProgressBarModule],
})
export class ShowSeasonItemComponent implements OnChanges {
  @Input({ required: true }) showProgress!: Signal<ShowProgress | undefined>;
  _season = signal<TmdbShowSeason>(getDefaultTmdbSeason());
  @Input({ required: true }) set season(value: TmdbShowSeason) {
    this._season.set(value);
  }
  @Input() seasonsEpisodes?: Record<string, EpisodeFull[] | undefined> | null;

  seasonProgress = computed(() => {
    const showProgress = this.showProgress();
    if (!showProgress) return;
    return showProgress.seasons.find((season) => season.number === this._season()?.season_number);
  });

  seasonTitle = computed(() =>
    seasonTitle('Season ' + (this.seasonProgress()?.number ?? this._season()?.season_number)),
  );

  episodesAired = 0;

  ngOnChanges(changes: SimpleChangesTyped<this>): void {
    if (changes.seasonProgress || changes.seasonsEpisodes) {
      const seasonNumber = this.seasonProgress()?.number ?? this._season()?.season_number;
      if (seasonNumber === undefined) return;
      this.episodesAired = getAiredEpisodesInSeason(
        this.seasonsEpisodes?.[seasonNumber] ?? [],
        this.seasonProgress(),
      );
    }
  }
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
