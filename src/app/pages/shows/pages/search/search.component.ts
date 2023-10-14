import { Component, DestroyRef, inject, signal, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { map } from 'rxjs';
import { onError } from '@helper/error';
import { TmdbService } from '../../data/tmdb.service';
import { ShowService } from '../../data/show.service';
import { LoadingState } from '@type/Enum';
import type { ShowInfo } from '@type/Show';
import type { TmdbShow } from '@type/Tmdb';
import { z } from 'zod';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { A11yModule } from '@angular/cdk/a11y';
import { LoadingComponent } from '@shared/components/loading/loading.component';
import { ShowsComponent } from '@shared/components/shows/shows.component';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

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
export default class SearchComponent {
  showService = inject(ShowService);
  tmdbService = inject(TmdbService);
  router = inject(Router);
  route = inject(ActivatedRoute);
  snackBar = inject(MatSnackBar);
  destroyRef = inject(DestroyRef);

  pageState = signal(LoadingState.LOADING);
  showsInfos?: ShowInfo[];
  searchValue?: string;
  tmdbShows?: Record<number, TmdbShow | undefined>;

  @ViewChild('searchInput') searchInput?: HTMLInputElement;

  constructor() {
    this.tmdbService
      .getTmdbShows$()
      .pipe(takeUntilDestroyed())
      .subscribe((tmdbShows) => {
        this.tmdbShows = tmdbShows;
      });

    this.route.queryParams
      .pipe(
        map((queryParams) => queryParamSchema.parse(queryParams)),
        takeUntilDestroyed(),
      )
      .subscribe({
        next: (queryParams) => {
          this.showsInfos = undefined;
          this.searchValue = queryParams.q;
          this.search(this.searchValue);
          this.pageState.set(LoadingState.SUCCESS);
          if (!this.searchValue) this.searchInput?.focus?.();
        },
        error: (error) => onError(error, this.snackBar, [this.pageState]),
      });
  }

  search(searchValue?: string | null): void {
    if (!searchValue) return;

    this.showsInfos = undefined;

    this.showService
      .searchForAddedShows$(searchValue)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (shows) => {
          shows.forEach((show) => {
            if (!this.showsInfos) this.showsInfos = [];
            this.showsInfos.push({
              show,
              tmdbShow: show.ids.tmdb ? this.tmdbShows?.[show.ids.tmdb] : undefined,
            });
          });
          console.debug('showsInfos', this.showsInfos);
          this.pageState.set(LoadingState.SUCCESS);
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
