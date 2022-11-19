import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { MatLegacySnackBar as MatSnackBar } from '@angular/material/legacy-snack-bar';
import { BehaviorSubject, takeUntil } from 'rxjs';

import { Base } from '@helper/base';
import { StatsService } from '../../data/stats.service';
import { onError } from '@helper/error';

import { LoadingState } from '@type/enum';

import type { Stats } from '@type/interfaces/Trakt';
import type { EpisodeStats, ShowStats } from '@type/interfaces/Stats';

@Component({
  selector: 't-statistics',
  templateUrl: './statistics.component.html',
  styleUrls: ['./statistics.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatisticsComponent extends Base implements OnInit {
  pageState = new BehaviorSubject<LoadingState>(LoadingState.LOADING);
  stats?: Stats;
  episodeStats?: EpisodeStats;
  showStats?: ShowStats;

  constructor(
    private statsService: StatsService,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef
  ) {
    super();
  }

  ngOnInit(): void {
    this.statsService
      .getStats$()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: async ([showStats, episodeStats]) => {
          this.cdr.markForCheck();
          this.episodeStats = episodeStats;
          this.showStats = showStats;
        },
        error: (error) => onError(error, this.snackBar, this.pageState),
      });

    this.statsService.fetchStats().subscribe({
      next: (stats) => {
        this.cdr.markForCheck();
        this.stats = stats;
        this.pageState.next(LoadingState.SUCCESS);
      },
      error: (error) => onError(error, this.snackBar, this.pageState),
    });
  }
}
