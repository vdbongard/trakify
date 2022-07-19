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

  constructor(private showService: ShowService) {
    super();
  }

  ngOnInit(): void {
    this.showService.fetchStats().subscribe({
      next: async (stats) => {
        this.stats = stats;
        this.loadingState.next(LoadingState.SUCCESS);
      },
      error: () => this.loadingState.next(LoadingState.ERROR),
    });
  }
}
