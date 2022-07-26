import { Component, OnInit } from '@angular/core';
import { BaseComponent } from '../../../helper/base-component';
import { Stats } from '../../../../types/interfaces/Trakt';
import { BehaviorSubject, takeUntil } from 'rxjs';
import { LoadingState } from '../../../../types/enum';
import { EpisodeStats, ShowStats } from '../../../../types/interfaces/Stats';
import { StatsService } from '../../../services/stats.service';

@Component({
  selector: 'app-statistics',
  templateUrl: './statistics.component.html',
  styleUrls: ['./statistics.component.scss'],
})
export class StatisticsComponent extends BaseComponent implements OnInit {
  loadingState = new BehaviorSubject<LoadingState>(LoadingState.LOADING);
  stats?: Stats;
  episodeStats?: EpisodeStats;
  showStats?: ShowStats;

  constructor(private statsService: StatsService) {
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
          this.loadingState.next(LoadingState.SUCCESS);
        },
        error: () => this.loadingState.next(LoadingState.ERROR),
      });

    this.statsService.fetchStats().subscribe({
      next: (stats) => {
        this.stats = stats;
      },
      error: () => this.loadingState.next(LoadingState.ERROR),
    });
  }
}
