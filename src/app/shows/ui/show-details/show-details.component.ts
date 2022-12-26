import { Component, Input, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TmdbShow } from '@type/Tmdb';
import { GenrePipe } from '@shared/pipes/genre.pipe';
import { CreatedByPipe } from '../../utils/pipes/createdBy.pipe';
import { IsInFuturePipe } from '@shared/pipes/is-in-future.pipe';
import { SimpleChangesTyped } from '@type/SimpleChanges';

@Component({
  selector: 't-show-details',
  standalone: true,
  imports: [CommonModule, GenrePipe, CreatedByPipe, IsInFuturePipe],
  templateUrl: './show-details.component.html',
  styleUrls: ['./show-details.component.scss'],
})
export class ShowDetailsComponent implements OnChanges {
  @Input() tmdbShow?: TmdbShow | null;

  hasDetails = false;

  ngOnChanges(changes: SimpleChangesTyped<this>): void {
    if (changes.tmdbShow) {
      this.hasDetails = Boolean(
        this.tmdbShow &&
          (this.tmdbShow.genres.length ||
            this.tmdbShow.created_by.length ||
            this.tmdbShow.first_air_date ||
            this.tmdbShow.vote_count ||
            this.tmdbShow.episode_run_time.length ||
            this.tmdbShow.type !== 'Scripted')
      );
    }
  }
}
