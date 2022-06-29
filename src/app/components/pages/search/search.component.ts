import { Component, OnDestroy, OnInit } from '@angular/core';
import { BehaviorSubject, forkJoin, of, Subscription } from 'rxjs';
import { ShowInfo } from '../../../../types/interfaces/Show';
import { wait } from '../../../helper/wait';
import { ShowService } from '../../../services/show.service';
import { TmdbService } from '../../../services/tmdb.service';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-search',
  templateUrl: './search.component.html',
  styleUrls: ['./search.component.scss'],
})
export class SearchComponent implements OnInit, OnDestroy {
  subscriptions: Subscription[] = [];
  shows: ShowInfo[] = [];
  isLoading = new BehaviorSubject<boolean>(false);
  searchValue?: string;

  constructor(
    public showService: ShowService,
    public tmdbService: TmdbService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.subscriptions = [
      this.route.queryParams.subscribe(async (queryParams) => {
        this.shows = [];

        this.searchValue = queryParams['search'];
        if (!this.searchValue) return;

        this.isLoading.next(true);

        this.showService.searchForAddedShows(this.searchValue).subscribe((results) => {
          forkJoin(
            results.map((result) => {
              const tmdbId = result.ids.tmdb;
              if (!tmdbId) return of(undefined);
              return this.tmdbService.fetchShow(tmdbId);
            })
          ).subscribe(async (tmdbShows) => {
            for (let i = 0; i < tmdbShows.length; i++) {
              this.shows.push({
                show: results[i],
                tmdbShow: tmdbShows[i],
              });
            }

            await wait();
            this.isLoading.next(false);
          });
        });
      }),
    ];
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((subscription) => subscription.unsubscribe());
  }

  async searchSubmitted(): Promise<void> {
    if (!this.searchValue) {
      await this.router.navigate(['search']);
      return;
    }

    await this.router.navigate(['search'], { queryParams: { search: this.searchValue } });
  }
}
