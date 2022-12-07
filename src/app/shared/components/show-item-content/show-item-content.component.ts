import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EpisodeFull, Show, ShowProgress, ShowWatched } from '@type/interfaces/Trakt';
import { TmdbShow } from '@type/interfaces/Tmdb';
import { TickerComponent } from '@shared/components/ticker/ticker.component';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { RelativeDatePipe } from '@shared/pipes/relativeDate.pipe';
import { IsShowEndedPipe } from '@shared/pipes/is-show-ended.pipe';

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
  ],
  template: `
    <p class="mat-small top-subtitle" ticker>
      <ng-container *ngIf="tmdbShow !== undefined; else tmdbShowLoading">
        <ng-container *ngIf="tmdbShow">
          <ng-container *ngIf="withEpisodesCount">
            <ng-container *ngIf="tmdbShow && (!progress || progress.completed === 0)">
              {{ tmdbShow.number_of_episodes }} episodes
            </ng-container>
            <ng-container
              *ngIf="progress && progress.completed > 0 && progress.aired - progress.completed"
            >
              {{ progress.aired - progress.completed }} remaining
            </ng-container>
            <ng-container
              *ngIf="tmdbShow?.networks?.[0] && (!progress || (progress && progress.aired - progress.completed))"
            >
              ·
            </ng-container>
          </ng-container>
          <ng-container *ngIf="tmdbShow.networks?.[0]">
            {{ tmdbShow.networks?.[0]?.name }}
          </ng-container>
        </ng-container>
      </ng-container>
      <ng-template #tmdbShowLoading>...</ng-template>
    </p>

    <div class="title-wrapper" *ngIf="show">
      <h2 class="mat-headline-6 title" ticker>
        {{ tmdbShow?.name || show.title }}
        {{ withYear && show.year !== null ? ' (' + show.year + ')' : '' }}
      </h2>
      <button
        *ngIf="isLoggedIn"
        mat-icon-button
        aria-label="Favorite"
        class="favorite-button"
        [class.remove]="!isFavorite"
        (click)="
          preventEvent($event); isFavorite ? removeFavorite.emit(show) : addFavorite.emit(show)
        "
      >
        <mat-icon class="favorite-icon">{{ isFavorite ? 'star' : 'star_outline' }}</mat-icon>
      </button>
    </div>

    <mat-progress-bar
      *ngIf="withProgressbar && progress && showWatched"
      class="progress-bar"
      mode="determinate"
      color="accent"
      [value]="(progress.completed / progress.aired) * 100"
      aria-label="Shows episodes completed percentage of all aired episodes"
    ></mat-progress-bar>

    <ng-container *ngIf="withEpisode">
      <ng-container *ngIf="episode">
        <p class="mat-small next-episode-text" ticker>
          S{{ episode.season | number : '2.0-0' }}E{{ episode.number | number : '2.0-0' }}
          {{ episode.title }}
        </p>
        <p class="mat-small next-episode-date" ticker>
          {{
            withRelativeDate && episode.first_aired
              ? (episode.first_aired | relativeDate : 'd. MMM. yyyy (E.)')
              : (episode.first_aired | date : 'd. MMM. yyyy (E.)')
          }}
        </p>
      </ng-container>

      <ng-container *ngIf="episode === null && !(tmdbShow | isShowEnded)">
        <p class="mat-small show-status">{{ tmdbShow?.status }}</p>
      </ng-container>
    </ng-container>
  `,
  styles: [
    `
      @import '../../../shared/styles';

      :host {
        display: block;
        width: 100%;
        overflow: hidden;
      }

      .title-wrapper {
        display: flex;
        align-items: center;
        margin-bottom: 0.125rem;
        --icon-size: 1rem;

        @media (min-width: $breakpoint-sm) {
          margin-bottom: 0.5rem;
          --icon-size: 1.25rem;
        }

        @media (min-width: $breakpoint-xl) {
          margin-bottom: 0.75rem;
        }

        .title {
          margin-bottom: 0;
          margin-right: 0.25rem;
          font-size: rem(16px);
          font-weight: 400;
          line-height: rem(24px);

          @media (min-width: $breakpoint-sm) {
            font-size: 1.5rem;
            font-weight: 500;
            line-height: rem(32px);
          }

          &:hover {
            cursor: pointer;
          }
        }

        .favorite-button {
          width: var(--icon-size);
          height: var(--icon-size);
          font-size: var(--icon-size);
          padding: 0;
        }

        .favorite-button.remove {
          display: none;
        }

        &:hover .favorite-button.remove {
          display: flex;
        }

        .favorite-icon {
          width: var(--icon-size);
          height: var(--icon-size);
          font-size: var(--icon-size);
          line-height: var(--icon-size);
        }
      }

      .progress-bar {
        margin-bottom: 0.25rem;

        @media (min-width: $breakpoint-sm) {
          margin-bottom: 0.75rem;
        }

        @media (min-width: $breakpoint-xl) {
          margin-bottom: 1rem;
        }
      }

      .top-subtitle {
        margin: 0;
        color: var(--text-color-2);

        @media (min-width: $breakpoint-sm) {
          margin-bottom: rem(4px);
        }

        @media (min-width: $breakpoint-xl) {
          margin-bottom: rem(8px);
        }
      }

      .next-episode-text {
        margin: 0;

        @media (min-width: $breakpoint-sm) {
          margin-bottom: 0.25rem;
        }

        @media (min-width: $breakpoint-xl) {
          margin-bottom: 0.5rem;
        }
      }

      .next-episode-date {
        margin: 0;
        color: var(--text-color-2);

        @media (min-width: $breakpoint-sm) {
          margin-top: 0.25rem;
        }

        @media (min-width: $breakpoint-xl) {
          margin-top: 0.5rem;
        }
      }

      .show-status {
        margin: 0;
        color: var(--text-color-2);
      }
    `,
  ],
})
export class ShowItemContentComponent {
  @Input() isLoggedIn?: boolean | null;
  @Input() show?: Show;
  @Input() showWatched?: ShowWatched;
  @Input() progress?: ShowProgress;
  @Input() tmdbShow?: TmdbShow | null;
  @Input() isFavorite?: boolean;
  @Input() episode?: EpisodeFull | null;
  @Input() withYear?: boolean;
  @Input() withEpisode?: boolean;
  @Input() withEpisodesCount?: boolean;
  @Input() withProgressbar?: boolean;
  @Input() withRelativeDate?: boolean;

  @Output() addFavorite = new EventEmitter<Show>();
  @Output() removeFavorite = new EventEmitter<Show>();

  preventEvent(event: Event): void {
    event.stopPropagation();
    event.preventDefault();
  }
}
