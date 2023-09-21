import { Component, computed, inject, signal } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { StatsService } from './data/stats.service';
import { onError } from '@helper/error';
import { LoadingState } from '@type/Enum';
import type { Stats } from '@type/Trakt';
import type { EpisodeStats, ShowStats } from '@type/Stats';
import { LoadingComponent } from '@shared/components/loading/loading.component';
import { CommonModule } from '@angular/common';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { minutesToDays } from '@helper/minutesToDays';

@Component({
  selector: 't-statistics',
  templateUrl: './statistics.component.html',
  styleUrls: ['./statistics.component.scss'],
  standalone: true,
  imports: [CommonModule, LoadingComponent, MatProgressBarModule],
})
export default class StatisticsComponent {
  statsService = inject(StatsService);
  snackBar = inject(MatSnackBar);

  pageState = signal(LoadingState.LOADING);
  stats = signal<Stats | undefined>(undefined);
  episodeStats?: EpisodeStats;
  showStats?: ShowStats;
  daysWatched = computed(() => minutesToDays(this.stats()?.episodes.minutes ?? 0));

  constructor() {
    this.statsService
      .getStats$()
      .pipe(takeUntilDestroyed())
      .subscribe({
        next: ([showStats, episodeStats]) => {
          this.episodeStats = episodeStats;
          this.showStats = showStats;
        },
        error: (error) => onError(error, this.snackBar, [this.pageState]),
      });

    this.statsService.fetchStats().subscribe({
      next: (stats) => {
        this.stats.set(stats);
        this.pageState.set(LoadingState.SUCCESS);
      },
      error: (error) => onError(error, this.snackBar, [this.pageState]),
    });
  }
}
