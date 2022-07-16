import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { ShowInfo } from '../../../../types/interfaces/Show';
import { ShowService } from '../../../services/show.service';
import { TmdbService } from '../../../services/tmdb.service';
import { ActivatedRoute, Router } from '@angular/router';
import { TmdbShow } from '../../../../types/interfaces/Tmdb';
import { BaseComponent } from '../../../helper/base-component';
import { LoadingState } from '../../../../types/enum';

@Component({
  selector: 'app-search',
  templateUrl: './search.component.html',
  styleUrls: ['./search.component.scss'],
})
export class SearchComponent extends BaseComponent implements OnInit, OnDestroy {
  loadingState = new Subject<LoadingState>();
  shows: ShowInfo[] = [];
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

    this.shows = [];

    this.showService.searchForAddedShows$(searchValue).subscribe({
      next: async (shows) => {
        shows.forEach((show) => {
          this.shows.push({
            show,
            tmdbShow: this.tmdbShows?.[show.ids.tmdb],
          });
        });

        this.loadingState.next(LoadingState.SUCCESS);
      },
      error: () => this.loadingState.next(LoadingState.ERROR),
    });
  }

  async searchByNavigating(): Promise<void> {
    await this.router.navigate(['series', 'search'], {
      queryParams: { search: this.searchValue || null },
      replaceUrl: true,
    });
  }
}
