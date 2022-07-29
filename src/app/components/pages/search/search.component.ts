import { Component, OnDestroy, OnInit } from '@angular/core';
import { BehaviorSubject, takeUntil } from 'rxjs';
import { ShowInfo } from '../../../../types/interfaces/Show';
import { ShowService } from '../../../services/trakt/show.service';
import { TmdbService } from '../../../services/tmdb.service';
import { ActivatedRoute, Router } from '@angular/router';
import { TmdbShow } from '../../../../types/interfaces/Tmdb';
import { BaseComponent } from '../../../helper/base-component';
import { LoadingState } from '../../../../types/enum';
import { onError } from '../../../helper/error';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-search',
  templateUrl: './search.component.html',
  styleUrls: ['./search.component.scss'],
})
export class SearchComponent extends BaseComponent implements OnInit, OnDestroy {
  loadingState = new BehaviorSubject<LoadingState>(LoadingState.LOADING);
  shows: ShowInfo[] = [];
  searchValue?: string;
  tmdbShows?: { [showId: number]: TmdbShow };

  constructor(
    public showService: ShowService,
    public tmdbService: TmdbService,
    private router: Router,
    private route: ActivatedRoute,
    private snackBar: MatSnackBar
  ) {
    super();
  }

  ngOnInit(): void {
    this.tmdbService.tmdbShows$
      .pipe(takeUntil(this.destroy$))
      .subscribe((tmdbShows) => (this.tmdbShows = tmdbShows));

    this.route.queryParams.pipe(takeUntil(this.destroy$)).subscribe({
      next: async (queryParams) => {
        this.shows = [];
        this.searchValue = queryParams['search'];
        this.search(this.searchValue);
      },
      error: (error) => onError(error, this.snackBar, this.loadingState),
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
      error: (error) => onError(error, this.snackBar, this.loadingState),
    });
  }

  async searchByNavigating(): Promise<void> {
    await this.router.navigate(['series', 'search'], {
      queryParams: { search: this.searchValue || null },
      replaceUrl: true,
    });
  }
}
