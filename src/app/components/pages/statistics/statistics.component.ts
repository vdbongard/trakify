import { Component, OnInit } from '@angular/core';
import { BaseComponent } from '../../../helper/base-component';
import { ShowService } from '../../../services/show.service';
import { Stats } from '../../../../types/interfaces/Trakt';

@Component({
  selector: 'app-statistics',
  templateUrl: './statistics.component.html',
  styleUrls: ['./statistics.component.scss'],
})
export class StatisticsComponent extends BaseComponent implements OnInit {
  stats?: Stats;

  constructor(private showService: ShowService) {
    super();
  }

  ngOnInit(): void {
    this.showService.fetchStats().subscribe((stats) => {
      this.stats = stats;
    });
  }
}
