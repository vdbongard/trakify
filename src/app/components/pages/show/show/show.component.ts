import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { catchError, of, switchMap, take, takeUntil } from 'rxjs';
import { TmdbService } from '../../../../services/tmdb.service';
import { ShowService } from '../../../../services/show.service';
import { TmdbConfiguration } from '../../../../../types/interfaces/Tmdb';
import { SyncService } from '../../../../services/sync.service';
import { ShowInfo } from '../../../../../types/interfaces/Show';
import { BaseComponent } from '../../../../helper/base-component';

@Component({
  selector: 'app-show',
  templateUrl: './show.component.html',
  styleUrls: ['./show.component.scss'],
})
export class ShowComponent extends BaseComponent implements OnInit {
  showInfo?: ShowInfo;
  tmdbConfig?: TmdbConfiguration;

  constructor(
    private route: ActivatedRoute,
    public router: Router,
    private showService: ShowService,
    public syncService: SyncService,
    private tmdbService: TmdbService
  ) {
    super();
  }

  ngOnInit(): void {
    this.route.params
      .pipe(
        switchMap((params) => this.showService.getShowInfo$(params['slug'])),
        takeUntil(this.destroy$)
      )
      .subscribe((showInfo) => (this.showInfo = showInfo));

    this.tmdbService.tmdbConfig$
      .pipe(takeUntil(this.destroy$))
      .subscribe((config) => (this.tmdbConfig = config));
  }

  addToHistory(showInfo: ShowInfo): void {
    this.setNextEpisode(showInfo);
    this.syncService.syncAddToHistory(showInfo.show?.ids, showInfo.nextEpisode);
  }

  setNextEpisode(showInfo: ShowInfo): void {
    if (!showInfo.show) return;

    const episode = showInfo.nextEpisode;
    if (episode) {
      this.showService
        .getEpisode$(showInfo.show.ids, episode.season, episode.number + 1, true)
        .pipe(
          catchError(() => {
            if (!showInfo.show) return of(undefined);
            return this.showService.getEpisode$(showInfo.show.ids, episode.season + 1, 1, true);
          }),
          take(1)
        )
        .subscribe({
          next: (nextEpisode) =>
            this.showService.setNextEpisode(showInfo.show?.ids.trakt, nextEpisode),
          error: () => this.showService.setNextEpisode(showInfo.show?.ids.trakt, null),
        });
    } else {
      this.showService.setNextEpisode(showInfo.show.ids.trakt, null);
    }
  }
}
