import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { ActivatedRoute } from '@angular/router';
import { SeasonProgress } from '../../../../../types/interfaces/Trakt';
import { ShowService } from '../../../../services/show.service';

@Component({
  selector: 'app-season',
  templateUrl: './season.component.html',
  styleUrls: ['./season.component.scss'],
})
export class SeasonComponent implements OnInit, OnDestroy {
  subscriptions: Subscription[] = [];
  season?: SeasonProgress;
  slug?: string;

  constructor(private route: ActivatedRoute, public showService: ShowService) {}

  ngOnInit(): void {
    this.subscriptions = [
      this.route.params.subscribe((params) => {
        this.slug = params['slug'];
        if (!this.slug) return;

        const seasonNumber = params['season'];

        const ids = this.showService.getIdForSlug(this.slug);
        if (!ids) return;

        this.season = this.showService.getSeasonProgressLocally(ids.trakt, seasonNumber);
      }),
    ];
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((subscription) => subscription.unsubscribe());
  }
}
