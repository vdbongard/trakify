import { A11yModule } from '@angular/cdk/a11y';
import { Component, DestroyRef, type ElementRef, inject, signal, viewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Router } from '@angular/router';
import { onError } from '@helper/error';
import { LoadingComponent } from '@shared/components/loading/loading.component';
import { ShowsComponent } from '@shared/components/shows/shows.component';
import { LoadingState } from '@type/Enum';
import type { ShowInfo } from '@type/Show';
import type { TmdbShow } from '@type/Tmdb';
import { delay, map } from 'rxjs';
import { z } from 'zod';
import { ShowService } from '../../data/show.service';
import { TmdbService } from '../../data/tmdb.service';

@Component({
  selector: 't-search',
  standalone: true,
  imports: [
    MatFormFieldModule,
    MatInputModule,
    FormsModule,
    A11yModule,
    LoadingComponent,
    ShowsComponent,
  ],
  templateUrl: './search.component.html',
  styleUrl: './search.component.scss',
})
export default class SearchComponent {
  showService = inject(ShowService);
  tmdbService = inject(TmdbService);
  router = inject(Router);
  route = inject(ActivatedRoute);
  snackBar = inject(MatSnackBar);
  destroyRef = inject(DestroyRef);

  searchInput = viewChild<ElementRef<HTMLInputElement>>('searchInput');

  pageState = signal(LoadingState.LOADING);
  showsInfos?: ShowInfo[];
  searchValue?: string;
  tmdbShows?: Record<number, TmdbShow | undefined>;

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
          this.searchValue = queryParams.q;
          this.search(this.searchValue);
        },
        error: (error) => onError(error, this.snackBar, [this.pageState]),
      });
  }

  search(searchValue?: string | null): void {
    if (!searchValue) {
      this.showsInfos = undefined;
      this.searchInput()?.nativeElement.focus?.();
      this.pageState.set(LoadingState.SUCCESS);
      return;
    }

    this.pageState.set(LoadingState.LOADING);

    this.showService
      .searchForAddedShows$(searchValue)
      .pipe(
        delay(0), // wait a tick for search input to be updated immediately before performing search
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (shows) => {
          this.showsInfos = shows.map((show) => ({
            show,
            tmdbShow: this.tmdbShows?.[show.ids.tmdb ?? -1],
          }));
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
