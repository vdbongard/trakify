import { Component, computed, inject, signal } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { StatsService } from './data/stats.service';
import { onError } from '@helper/error';
import { LoadingState } from '@type/Enum';
import type { Stats } from '@type/Trakt';
import { LoadingComponent } from '@shared/components/loading/loading.component';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { minutesToDays } from '@helper/minutesToDays';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 't-statistics',
  standalone: true,
  imports: [LoadingComponent, MatProgressBarModule],
  templateUrl: './statistics.component.html',
  styleUrl: './statistics.component.scss',
})
export default class StatisticsComponent {
  statsService = inject(StatsService);
  snackBar = inject(MatSnackBar);

  showStats = this.statsService.getShowStats();
  episodeStats = this.statsService.getEpisodeStats();
  apiStatsState = signal(LoadingState.LOADING);
  apiStats = signal<Stats | undefined>(undefined);
  daysWatched = computed(() => minutesToDays(this.apiStats()?.episodes.minutes ?? 0));

  constructor() {
    this.statsService
      .fetchStats()
      .pipe(takeUntilDestroyed())
      .subscribe({
        next: (stats) => {
          this.apiStats.set({ ...stats });
          this.apiStatsState.set(LoadingState.SUCCESS);
        },
        error: (error) => onError(error, this.snackBar, [this.apiStatsState]),
      });
  }
}
