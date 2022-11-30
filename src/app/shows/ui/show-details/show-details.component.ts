import { ChangeDetectionStrategy, Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TmdbShow } from '@type/interfaces/Tmdb';
import { GenrePipe } from '@shared/pipes/genre.pipe';
import { CreatedByPipe } from '../../utils/pipes/createdBy.pipe';
import { IsInFuturePipe } from '@shared/pipes/is-in-future.pipe';

@Component({
  selector: 't-show-details',
  standalone: true,
  imports: [CommonModule, GenrePipe, CreatedByPipe, IsInFuturePipe],
  template: `
    <h2 class="mat-subtitle-1">Details</h2>
    <div class="details">
      <ng-container *ngIf="tmdbShow && hasDetails; else noDetails">
        <p *ngIf="tmdbShow.genres.length" class="mat-body">Genre: {{ tmdbShow.genres | genre }}</p>
        <p *ngIf="tmdbShow.created_by.length" class="mat-body">
          Created by: {{ tmdbShow.created_by | createdBy }}
        </p>
        <p *ngIf="tmdbShow.first_air_date" class="mat-body">
          <ng-container *ngIf="tmdbShow.first_air_date | isInFuture; else isInPast">
            First airing
          </ng-container>
          <ng-template #isInPast>First aired</ng-template>:
          {{ tmdbShow.first_air_date | date : 'd. MMM. yyyy' }}
        </p>
        <p *ngIf="tmdbShow.vote_count" class="mat-body">
          Rating: {{ tmdbShow.vote_average | number : '1.0-1' }}
          <span class="votes">({{ tmdbShow.vote_count }} votes)</span>
        </p>
        <p *ngIf="tmdbShow.episode_run_time.length" class="mat-body">
          Runtime: {{ tmdbShow.episode_run_time[0] + 'min' }}
        </p>
        <p *ngIf="tmdbShow.type !== 'Scripted'" class="mat-body">Type: {{ tmdbShow.type }}</p>
      </ng-container>
      <ng-template #noDetails><p class="mat-body">No details available.</p></ng-template>
    </div>
  `,
  styles: [
    `
      @import '../../../shared/styles';

      .details {
        display: grid;
        grid-template-columns: 1fr;
        gap: 0.5rem;

        @media (min-width: $breakpoint-sm) {
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
        }

        > * {
          margin: 0;
        }
      }

      .votes {
        color: var(--text-color-2);
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShowDetailsComponent implements OnChanges {
  @Input() tmdbShow?: TmdbShow | null;

  hasDetails = false;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['tmdbShow']) {
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
