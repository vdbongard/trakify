import { Component, OnDestroy, OnInit } from '@angular/core';
import { BehaviorSubject, Subscription } from 'rxjs';
import { ShowInfo } from '../../../../types/interfaces/Show';
import { wait } from '../../../helper/wait';
import { ShowService } from '../../../services/show.service';
import { TmdbService } from '../../../services/tmdb.service';
import { ActivatedRoute, Router } from '@angular/router';
import { TmdbShow } from '../../../../types/interfaces/Tmdb';

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
  tmdbShows?: { [showId: number]: TmdbShow };

  constructor(
    public showService: ShowService,
    public tmdbService: TmdbService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.subscriptions = [
      this.tmdbService.tmdbShows$.subscribe((tmdbShows) => (this.tmdbShows = tmdbShows)),
      this.route.queryParams.subscribe(async (queryParams) => {
        this.shows = [];
        this.searchValue = queryParams['search'];
        this.search(this.searchValue);
      }),
    ];
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((subscription) => subscription.unsubscribe());
  }

  search(searchValue = this.searchValue): void {
    if (!searchValue) return;

    this.isLoading.next(true);
    this.shows = [];

    this.showService.searchForAddedShows$(searchValue).subscribe(async (shows) => {
      shows.forEach((show) => {
        this.shows.push({
          show,
          tmdbShow: this.tmdbShows?.[show.ids.tmdb],
        });
      });

      await wait();
      this.isLoading.next(false);
    });
  }

  async searchByNavigating(): Promise<void> {
    if (!this.searchValue) {
      await this.router.navigate(['series', 'search']);
      return;
    }

    await this.router.navigate(['series', 'search'], { queryParams: { search: this.searchValue } });
  }
}
