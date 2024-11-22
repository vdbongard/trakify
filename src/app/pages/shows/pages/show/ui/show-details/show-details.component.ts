import { Component, computed, input } from '@angular/core';
import { TmdbShow } from '@type/Tmdb';
import { DatePipe, DecimalPipe } from '@angular/common';

@Component({
  selector: 't-show-details',
  imports: [DecimalPipe, DatePipe],
  templateUrl: './show-details.component.html',
  styleUrl: './show-details.component.scss',
})
export class ShowDetailsComponent {
  tmdbShow = input<TmdbShow>();

  hasDetails = computed(() => {
    const tmdbShow = this.tmdbShow();
    return Boolean(
      tmdbShow &&
        (tmdbShow.genres.length ||
          tmdbShow.created_by.length ||
          tmdbShow.first_air_date ||
          tmdbShow.vote_count ||
          tmdbShow.episode_run_time.length ||
          tmdbShow.type !== 'Scripted'),
    );
  });

  genres = computed(() => {
    const tmdbShow = this.tmdbShow();
    if (!tmdbShow) return '';
    return tmdbShow.genres.map((genre) => genre.name).join(', ');
  });

  createdBy = computed(() => {
    const tmdbShow = this.tmdbShow();
    if (!tmdbShow) return '';
    return tmdbShow.created_by.map((creator) => creator.name).join(', ');
  });

  isInFuture = computed(() => {
    const tmdbShow = this.tmdbShow();
    if (!tmdbShow) return false;
    return new Date(tmdbShow.first_air_date) > new Date();
  });
}
