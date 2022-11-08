import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TmdbShow } from '@type/interfaces/Tmdb';
import { GenrePipe } from '../../../../shared/pipes/genre.pipe';
import { CreatedByPipe } from '../../../pipes/createdBy.pipe';

@Component({
  selector: 't-show-details',
  standalone: true,
  imports: [CommonModule, GenrePipe, CreatedByPipe],
  template: `
    <h2 class="mat-subheading-2">Details</h2>
    <div *ngIf="tmdbShow" class="details">
      <p *ngIf="tmdbShow.genres.length">Genre: {{ tmdbShow.genres | genre }}</p>
      <p *ngIf="tmdbShow.created_by[0]">Created by: {{ tmdbShow.created_by | createdBy }}</p>
      <p *ngIf="tmdbShow.first_air_date">
        First aired: {{ tmdbShow.first_air_date | date: 'd. MMM. yyyy' }}
      </p>
      <p *ngIf="tmdbShow.vote_count">
        Rating: {{ tmdbShow.vote_average | number: '1.0-1' }}
        <span class="votes">({{ tmdbShow.vote_count }} votes)</span>
      </p>
      <p *ngIf="tmdbShow.episode_run_time[0]">
        Runtime: {{ tmdbShow.episode_run_time[0] + 'min' }}
      </p>
      <p *ngIf="tmdbShow.type !== 'Scripted'">Type: {{ tmdbShow.type }}</p>
    </div>
  `,
  styles: [
    `
      @import 'src/app/styles';

      .details {
        display: grid;
        grid-template-columns: 1fr;
        margin-top: rem(-8px);

        @media (min-width: $breakpoint-sm) {
          grid-template-columns: 1fr 1fr;
        }

        > * {
          margin-top: 0.5rem;
          margin-bottom: 0.5rem;
        }
      }

      .votes {
        color: var(--text-color-2);
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShowDetailsComponent {
  @Input() tmdbShow?: TmdbShow | null;
}
