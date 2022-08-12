import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { BehaviorSubject, takeUntil } from 'rxjs';
import { BaseComponent } from '../../../shared/helper/base-component';
import { onError } from '../../../shared/helper/error';
import { TmdbService } from '../../../shared/services/tmdb.service';
import { ShowInfo } from '../../../../types/interfaces/Show';
import { ShowService } from '../../../shared/services/trakt/show.service';
import { LoadingState } from '../../../../types/enum';
import { TmdbShow } from '../../../../types/interfaces/Tmdb';

@Component({
  selector: 'app-search',
  templateUrl: './search.component.html',
  styleUrls: ['./search.component.scss'],
})
export class SearchComponent extends BaseComponent implements OnInit, OnDestroy {
  loadingState = new BehaviorSubject<LoadingState>(LoadingState.LOADING);
  showsInfos: ShowInfo[] = [];
  searchValue?: string;
  tmdbShows?: { [showId: number]: TmdbShow | undefined };

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
        this.showsInfos = [];
        this.searchValue = queryParams['search'];
        this.search(this.searchValue);
        this.loadingState.next(LoadingState.SUCCESS);
      },
      error: (error) => onError(error, this.snackBar, this.loadingState),
    });
  }

  search(searchValue?: string): void {
    if (!searchValue) return;

    this.showsInfos = [];

    this.showService.searchForAddedShows$(searchValue).subscribe({
      next: async (shows) => {
        shows.forEach((show) => {
          this.showsInfos.push({
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
      queryParams: { search: this.searchValue ?? null },
      replaceUrl: true,
    });
  }
}
