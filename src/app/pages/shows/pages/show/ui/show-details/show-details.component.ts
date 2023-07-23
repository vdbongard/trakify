import { Component, computed, Input, Signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TmdbShow } from '@type/Tmdb';
import { GenrePipe } from '@shared/pipes/genre.pipe';
import { CreatedByPipe } from '../../../../utils/pipes/createdBy.pipe';
import { IsInFuturePipe } from '@shared/pipes/is-in-future.pipe';

@Component({
  selector: 't-show-details',
  standalone: true,
  imports: [CommonModule, GenrePipe, CreatedByPipe, IsInFuturePipe],
  templateUrl: './show-details.component.html',
  styleUrls: ['./show-details.component.scss'],
})
export class ShowDetailsComponent {
  @Input({ required: true }) tmdbShow!: Signal<TmdbShow | undefined | null>;

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
}
