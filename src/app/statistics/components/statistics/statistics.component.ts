import { Component, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { BehaviorSubject, takeUntil } from 'rxjs';

import { BaseComponent } from '../../../shared/helper/base-component';
import { StatsService } from '../../../shared/services/stats.service';
import { onError } from '../../../shared/helper/error';

import { LoadingState } from 'src/types/enum';

import type { Stats } from 'src/types/interfaces/Trakt';
import type { EpisodeStats, ShowStats } from 'src/types/interfaces/Stats';

@Component({
  selector: 't-statistics',
  templateUrl: './statistics.component.html',
  styleUrls: ['./statistics.component.scss'],
})
export class StatisticsComponent extends BaseComponent implements OnInit {
  pageState = new BehaviorSubject<LoadingState>(LoadingState.LOADING);
  stats?: Stats;
  episodeStats?: EpisodeStats;
  showStats?: ShowStats;

  constructor(private statsService: StatsService, private snackBar: MatSnackBar) {
    super();
  }

  ngOnInit(): void {
    this.statsService
      .getStats$()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: async ([episodeStats, showStats]) => {
          this.episodeStats = episodeStats;
          this.showStats = showStats;
        },
        error: (error) => onError(error, this.snackBar, this.pageState),
      });

    this.statsService.fetchStats().subscribe({
      next: (stats) => {
        this.stats = stats;
        this.pageState.next(LoadingState.SUCCESS);
      },
      error: (error) => onError(error, this.snackBar, this.pageState),
    });
  }
}
