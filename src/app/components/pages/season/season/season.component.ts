import { Component, OnInit } from '@angular/core';
import { switchMap, takeUntil } from 'rxjs';
import { ActivatedRoute } from '@angular/router';
import { ShowService } from '../../../../services/show.service';
import { BaseComponent } from '../../../../helper/base-component';
import { SeasonInfo } from '../../../../../types/interfaces/Show';

@Component({
  selector: 'app-season',
  templateUrl: './season.component.html',
  styleUrls: ['./season.component.scss'],
})
export class SeasonComponent extends BaseComponent implements OnInit {
  seasonInfo?: SeasonInfo;

  constructor(private route: ActivatedRoute, public showService: ShowService) {
    super();
  }

  ngOnInit(): void {
    this.route.params
      .pipe(
        switchMap((params) => {
          return this.showService.getSeasonInfo$(params['slug'], parseInt(params['season']));
        }),
        takeUntil(this.destroy$)
      )
      .subscribe(async (seasonInfo) => (this.seasonInfo = seasonInfo));
  }
}
