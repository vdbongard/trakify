import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { BehaviorSubject, map, takeUntil } from 'rxjs';

import { Base } from '@helper/base';
import { onError } from '@helper/error';
import { TmdbService } from '../../data/tmdb.service';
import { ShowService } from '../../data/show.service';

import { LoadingState } from '@type/enum';

import type { ShowInfo } from '@type/interfaces/Show';
import type { TmdbShow } from '@type/interfaces/Tmdb';
import { z } from 'zod';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { A11yModule } from '@angular/cdk/a11y';
import { LoadingComponent } from '@shared/components/loading/loading.component';
import { ShowsComponent } from '@shared/components/shows/shows.component';

@Component({
  selector: 't-search',
  templateUrl: './search.component.html',
  styleUrls: ['./search.component.scss'],
  standalone: true,
  imports: [
    MatFormFieldModule,
    MatInputModule,
    FormsModule,
    A11yModule,
    LoadingComponent,
    ShowsComponent,
  ],
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
    private snackBar: MatSnackBar
  ) {
    super();
  }

  ngOnInit(): void {
    this.tmdbService
      .getTmdbShows$()
      .pipe(takeUntil(this.destroy$))
      .subscribe((tmdbShows) => {
        this.tmdbShows = tmdbShows;
      });

    this.route.queryParams
      .pipe(
        map((queryParams) => queryParamSchema.parse(queryParams)),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: async (queryParams) => {
          this.showsInfos = undefined;
          this.searchValue = queryParams.q;
          this.search(this.searchValue);
          this.pageState.next(LoadingState.SUCCESS);
          if (!this.searchValue) this.searchInput?.focus?.();
        },
        error: (error) => onError(error, this.snackBar, [this.pageState]),
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
      error: (error) => onError(error, this.snackBar, [this.pageState]),
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
