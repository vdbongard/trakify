import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { BehaviorSubject, map, takeUntil } from 'rxjs';

import { BaseComponent } from '@helper/base-component';
import { onError } from '@helper/error';
import { TmdbService } from '@services/tmdb.service';
import { ShowService } from '@services/trakt/show.service';

import { LoadingState } from '@type/enum';

import type { ShowInfo } from '@type/interfaces/Show';
import type { TmdbShow } from '@type/interfaces/Tmdb';
import { z } from 'zod';

@Component({
  selector: 't-search',
  templateUrl: './search.component.html',
  styleUrls: ['./search.component.scss'],
})
export class SearchComponent extends BaseComponent implements OnInit, OnDestroy {
  pageState = new BehaviorSubject<LoadingState>(LoadingState.LOADING);
  showsInfos?: ShowInfo[];
  searchValue?: string;
  tmdbShows?: { [showId: number]: TmdbShow | undefined };

  @ViewChild('searchInput') searchInput?: HTMLInputElement;

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
    this.tmdbService
      .getTmdbShows$()
      .pipe(takeUntil(this.destroy$))
      .subscribe((tmdbShows) => (this.tmdbShows = tmdbShows));

    this.route.queryParams
      .pipe(
        map((queryParams) => queryParamSchema.parse(queryParams)),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: async (queryParams) => {
          this.showsInfos = undefined;
          this.searchValue = queryParams.search;
          this.search(this.searchValue);
          this.pageState.next(LoadingState.SUCCESS);
          if (!this.searchValue) this.searchInput?.focus?.();
        },
        error: (error) => onError(error, this.snackBar, this.pageState),
      });
  }

  search(searchValue?: string | null): void {
    if (!searchValue) return;

    this.showsInfos = undefined;

    this.showService.searchForAddedShows$(searchValue).subscribe({
      next: async (shows) => {
        shows.forEach((show) => {
          if (!this.showsInfos) this.showsInfos = [];
          this.showsInfos.push({
            show,
            tmdbShow: show.ids.tmdb ? this.tmdbShows?.[show.ids.tmdb] : undefined,
          });
        });
        console.debug('showsInfos', this.showsInfos);
        this.pageState.next(LoadingState.SUCCESS);
      },
      error: (error) => onError(error, this.snackBar, this.pageState),
    });
  }

  async searchByNavigating(): Promise<void> {
    await this.router.navigate(['series', 'search'], {
      queryParams: { search: this.searchValue ?? null },
      replaceUrl: true,
    });
  }
}

const queryParamSchema = z.object({
  search: z.string().optional(),
});
