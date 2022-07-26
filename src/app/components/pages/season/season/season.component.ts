import { Component, OnInit } from '@angular/core';
import { switchMap, takeUntil } from 'rxjs';
import { ActivatedRoute } from '@angular/router';
import { BaseComponent } from '../../../../helper/base-component';
import { SeasonInfo } from '../../../../../types/interfaces/Show';
import { BreadcrumbPart } from '../../../../shared/components/breadcrumb/breadcrumb.component';
import { InfoService } from '../../../../services/info.service';

@Component({
  selector: 'app-season',
  templateUrl: './season.component.html',
  styleUrls: ['./season.component.scss'],
})
export class SeasonComponent extends BaseComponent implements OnInit {
  seasonInfo?: SeasonInfo;
  breadcrumbParts?: BreadcrumbPart[];

  constructor(private route: ActivatedRoute, public infoService: InfoService) {
    super();
  }

  ngOnInit(): void {
    this.route.params
      .pipe(
        switchMap((params) => {
          return this.infoService.getSeasonInfo$(params['slug'], parseInt(params['season']));
        }),
        takeUntil(this.destroy$)
      )
      .subscribe(async (seasonInfo) => {
        this.seasonInfo = seasonInfo;
        this.breadcrumbParts = [
          {
            name: seasonInfo?.showTranslation?.title || seasonInfo?.show?.title,
            link: `/series/s/${seasonInfo?.show?.ids.slug}`,
          },
          {
            name: `Season ${seasonInfo?.seasonNumber}`,
            link: `/series/s/${seasonInfo?.show?.ids.slug}/season/${seasonInfo?.seasonNumber}`,
          },
        ];
      });
  }
}
