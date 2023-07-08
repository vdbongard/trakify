import { Component } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { BehaviorSubject } from 'rxjs';
import { StatsService } from '../../data/stats.service';
import { onError } from '@helper/error';

import { LoadingState } from '@type/Enum';

import type { Stats } from '@type/Trakt';
import type { EpisodeStats, ShowStats } from '@type/Stats';
import { MinutesPipe } from '@shared/pipes/minutes.pipe';
import { LoadingComponent } from '@shared/components/loading/loading.component';
import { NgIf } from '@angular/common';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 't-statistics',
  templateUrl: './statistics.component.html',
  styleUrls: ['./statistics.component.scss'],
  standalone: true,
  imports: [NgIf, MinutesPipe, LoadingComponent, MatProgressBarModule],
})
export class StatisticsComponent {
  pageState = new BehaviorSubject<LoadingState>(LoadingState.LOADING);
  stats?: Stats;
  episodeStats?: EpisodeStats;
  showStats?: ShowStats;

  constructor(
    private statsService: StatsService,
    private snackBar: MatSnackBar,
  ) {
    this.statsService
      .getStats$()
      .pipe(takeUntilDestroyed())
      .subscribe({
        next: async ([showStats, episodeStats]) => {
          this.episodeStats = episodeStats;
          this.showStats = showStats;
        },
        error: (error) => onError(error, this.snackBar, [this.pageState]),
      });

    this.statsService.fetchStats().subscribe({
      next: (stats) => {
        this.stats = stats;
        this.pageState.next(LoadingState.SUCCESS);
      },
      error: (error) => onError(error, this.snackBar, [this.pageState]),
    });
  }
}
