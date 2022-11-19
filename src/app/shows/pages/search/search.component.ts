import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatLegacySnackBar as MatSnackBar } from '@angular/material/legacy-snack-bar';
import { BehaviorSubject, map, takeUntil } from 'rxjs';

import { Base } from '@helper/base';
import { onError } from '@helper/error';
import { TmdbService } from '../../data/tmdb.service';
import { ShowService } from '../../data/show.service';

import { LoadingState } from '@type/enum';

import type { ShowInfo } from '@type/interfaces/Show';
import type { TmdbShow } from '@type/interfaces/Tmdb';
import { z } from 'zod';

@Component({
  selector: 't-search',
  templateUrl: './search.component.html',
  styleUrls: ['./search.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SearchComponent extends Base implements OnInit, OnDestroy {
  pageState = new BehaviorSubject<LoadingState>(LoadingState.LOADING);
  showsInfos?: ShowInfo[];
  searchValue?: string;
  tmdbShows?: { [showId: number]: TmdbShow | undefined };

  @ViewChild('searchInput') searchInput?: HTMLInputElement;

  constructor(
    public showService: ShowService,
    public tmdbService: TmdbService,
    public router: Router,
    private route: ActivatedRoute,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef
  ) {
    super();
  }

  ngOnInit(): void {
    this.tmdbService
      .getTmdbShows$()
      .pipe(takeUntil(this.destroy$))
      .subscribe((tmdbShows) => {
        this.cdr.markForCheck();
        this.tmdbShows = tmdbShows;
      });

    this.route.queryParams
      .pipe(
        map((queryParams) => queryParamSchema.parse(queryParams)),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: async (queryParams) => {
          this.cdr.markForCheck();
          this.showsInfos = undefined;
          this.searchValue = queryParams.q;
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
        this.cdr.markForCheck();
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
    await this.router.navigate([], {
      queryParams: { q: this.searchValue ?? null },
      replaceUrl: true,
    });
  }
}

const queryParamSchema = z.object({
  q: z.string().optional(),
});
