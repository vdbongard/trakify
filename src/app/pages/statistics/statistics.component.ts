import { Component, computed, inject, signal } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { StatsService } from './data/stats.service';
import { onError } from '@helper/error';
import { LoadingState } from '@type/Enum';
import type { Stats } from '@type/Trakt';
import { LoadingComponent } from '@shared/components/loading/loading.component';
import { CommonModule } from '@angular/common';
import { MatProgressBarModule } from '@angular/material/progress-bar';
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

  showStats = this.statsService.getShowStats();
  episodeStats = this.statsService.getEpisodeStats();
  apiStatsState = signal(LoadingState.LOADING);
  apiStats = signal<Stats | undefined>(undefined);
  daysWatched = computed(() => minutesToDays(this.apiStats()?.episodes.minutes ?? 0));

  constructor() {
    this.statsService.fetchStats().subscribe({
      next: (stats) => {
        this.apiStats.set(stats);
        this.apiStatsState.set(LoadingState.SUCCESS);
      },
      error: (error) => onError(error, this.snackBar, [this.apiStatsState]),
    });
  }
}
