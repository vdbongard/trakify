import { Component, OnInit } from '@angular/core';
import { BehaviorSubject, switchMap, takeUntil } from 'rxjs';
import { ActivatedRoute } from '@angular/router';
import { BaseComponent } from '../../../../helper/base-component';
import { SeasonInfo } from '../../../../../types/interfaces/Show';
import { BreadcrumbPart } from '../../../../shared/components/breadcrumb/breadcrumb.component';
import { InfoService } from '../../../../services/info.service';
import { LoadingState } from '../../../../../types/enum';

@Component({
  selector: 'app-season',
  templateUrl: './season.component.html',
  styleUrls: ['./season.component.scss'],
})
export class SeasonComponent extends BaseComponent implements OnInit {
  loadingState = new BehaviorSubject<LoadingState>(LoadingState.LOADING);
  seasonInfo?: SeasonInfo;
  breadcrumbParts?: BreadcrumbPart[];

  constructor(private route: ActivatedRoute, public infoService: InfoService) {
    super();
  }

  ngOnInit(): void {
    this.route.params
      .pipe(
        switchMap((params) =>
          this.infoService.getSeasonInfo$(params['slug'], parseInt(params['season']))
        ),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: async (seasonInfo) => {
          this.seasonInfo = seasonInfo;
          this.breadcrumbParts = [
            {
              name: seasonInfo?.show?.title,
              link: `/series/s/${seasonInfo?.show?.ids.slug}`,
            },
            {
              name: `Season ${seasonInfo?.seasonNumber}`,
              link: `/series/s/${seasonInfo?.show?.ids.slug}/season/${seasonInfo?.seasonNumber}`,
            },
          ];
          this.loadingState.next(LoadingState.SUCCESS);
        },
        error: () => this.loadingState.next(LoadingState.ERROR),
      });
  }
}
