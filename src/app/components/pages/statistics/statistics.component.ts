import { Component, OnInit } from '@angular/core';
import { BaseComponent } from '../../../helper/base-component';
import { ShowService } from '../../../services/show.service';
import { Stats } from '../../../../types/interfaces/Trakt';
import { BehaviorSubject } from 'rxjs';
import { LoadingState } from '../../../../types/enum';

@Component({
  selector: 'app-statistics',
  templateUrl: './statistics.component.html',
  styleUrls: ['./statistics.component.scss'],
})
export class StatisticsComponent extends BaseComponent implements OnInit {
  loadingState = new BehaviorSubject<LoadingState>(LoadingState.LOADING);
  stats?: Stats;
  episodeCount?: number;
  watchedEpisodeCount?: number;

  constructor(private showService: ShowService) {
    super();
  }

  ngOnInit(): void {
    this.showService.getStats$().subscribe({
      next: async ([stats, [episodeCount, watchedEpisodeCount]]) => {
        this.stats = stats;
        this.episodeCount = episodeCount;
        this.watchedEpisodeCount = watchedEpisodeCount;
        this.loadingState.next(LoadingState.SUCCESS);
      },
      error: () => this.loadingState.next(LoadingState.ERROR),
    });
  }
}
