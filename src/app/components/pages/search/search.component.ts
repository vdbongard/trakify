import { Component, OnDestroy, OnInit } from '@angular/core';
import { BehaviorSubject, takeUntil } from 'rxjs';
import { ShowInfo } from '../../../../types/interfaces/Show';
import { wait } from '../../../helper/wait';
import { ShowService } from '../../../services/show.service';
import { TmdbService } from '../../../services/tmdb.service';
import { ActivatedRoute, Router } from '@angular/router';
import { TmdbShow } from '../../../../types/interfaces/Tmdb';
import { BaseComponent } from '../../../helper/base-component';

@Component({
  selector: 'app-search',
  templateUrl: './search.component.html',
  styleUrls: ['./search.component.scss'],
})
export class SearchComponent extends BaseComponent implements OnInit, OnDestroy {
  shows: ShowInfo[] = [];
  isLoading = new BehaviorSubject<boolean>(false);
  searchValue?: string;
  tmdbShows?: { [showId: number]: TmdbShow };

  constructor(
    public showService: ShowService,
    public tmdbService: TmdbService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    super();
  }

  ngOnInit(): void {
    this.tmdbService.tmdbShows$
      .pipe(takeUntil(this.destroy$))
      .subscribe((tmdbShows) => (this.tmdbShows = tmdbShows));

    this.route.queryParams.pipe(takeUntil(this.destroy$)).subscribe(async (queryParams) => {
      this.shows = [];
      this.searchValue = queryParams['search'];
      this.search(this.searchValue);
    });
  }

  search(searchValue?: string): void {
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

    await this.router.navigate(['series', 'search'], {
      queryParams: { search: this.searchValue },
      replaceUrl: true,
    });
  }
}
