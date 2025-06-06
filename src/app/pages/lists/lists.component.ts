import { Component, inject, signal, viewChild } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { combineLatest, map, of, switchMap } from 'rxjs';
import { TmdbService } from '../shows/data/tmdb.service';
import { ListService } from './data/list.service';
import { DialogService } from '@services/dialog.service';
import { onError } from '@helper/error';
import { LoadingState } from '@type/Enum';
import type { ShowInfo } from '@type/Show';
import type { List } from '@type/TraktList';
import { z } from 'zod';
import { LoadingComponent } from '@shared/components/loading/loading.component';
import { MatTabNav, MatTabsModule } from '@angular/material/tabs';
import { ShowsComponent } from '@shared/components/shows/shows.component';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { SwipeDirective } from '@shared/directives/swipe.directive';
import { mod } from '@helper/mod';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { onKeyArrow } from '@helper/onKeyArrow';

@Component({
  selector: 't-lists',
  imports: [
    RouterLink,
    LoadingComponent,
    MatTabsModule,
    ShowsComponent,
    MatButtonModule,
    MatIconModule,
    SwipeDirective,
  ],
  templateUrl: './lists.component.html',
  styleUrl: './lists.component.scss',
})
export default class ListsComponent {
  tmdbService = inject(TmdbService);
  router = inject(Router);
  route = inject(ActivatedRoute);
  listService = inject(ListService);
  dialogService = inject(DialogService);
  snackBar = inject(MatSnackBar);
  title = inject(Title);

  tabs = viewChild(MatTabNav);

  pageState = signal(LoadingState.LOADING);
  listItemsLoadingState = signal(LoadingState.LOADING);
  lists?: List[];
  activeListIndex?: number;
  showsInfos?: ShowInfo[];

  constructor() {
    onKeyArrow({
      arrowLeft: () => void this.previous(),
      arrowRight: () => void this.next(),
    });

    combineLatest([toObservable(this.listService.lists.s), this.route.queryParams])
      .pipe(
        map(
          ([lists, queryParams]) =>
            [lists, queryParamSchema.parse(queryParams)] as [
              List[],
              z.infer<typeof queryParamSchema>,
            ],
        ),
        switchMap(([lists, queryParams]) => {
          this.pageState.set(LoadingState.SUCCESS);
          this.title.setTitle(`Lists - Trakify`);

          this.lists = lists;
          const slug = queryParams.slug;

          if (!this.lists || this.lists.length === 0) {
            if (slug) void this.router.navigate([]);
            return of([]);
          }

          const index = slug !== null ? this.lists.findIndex((list) => list.ids.slug === slug) : -1;
          this.activeListIndex = index >= 0 ? index : undefined;
          if (this.activeListIndex !== undefined) {
            this.title.setTitle(`${this.lists[this.activeListIndex].name} - Lists - Trakify`);
          }

          if (!slug || index === -1) {
            void this.router.navigate([], {
              queryParamsHandling: 'merge',
              queryParams: {
                slug:
                  this.activeListIndex !== undefined
                    ? this.lists[this.activeListIndex].ids.slug
                    : this.lists[0].ids.slug,
              },
            });
            return of([]);
          }

          return this.listService.getListItems$(slug);
        }),
        switchMap((listItems) => {
          this.listItemsLoadingState.set(LoadingState.SUCCESS);

          if (!listItems || listItems.length === 0) {
            this.showsInfos = [];
            return of([]);
          }

          const showsInfos = listItems.map(
            (listItem): ShowInfo => ({
              show: listItem.show,
            }),
          );

          showsInfos?.sort((a, b) => {
            if (!a.show) return 1;
            if (!b.show) return -1;
            return a.show.title > b.show.title ? 1 : -1;
          });

          this.showsInfos = showsInfos;
          console.debug('showsInfos', this.showsInfos);

          return combineLatest(
            this.showsInfos.map((showInfo) =>
              this.tmdbService.getTmdbShow$(showInfo.show, false, { fetch: true }),
            ),
          );
        }),
        map((tmdbShows) => {
          if (tmdbShows.length === 0) return;

          this.showsInfos = this.showsInfos?.map(
            (showInfo, i): ShowInfo => ({
              ...showInfo,
              tmdbShow: tmdbShows[i],
            }),
          );
        }),
        takeUntilDestroyed(),
      )
      .subscribe({
        error: (error) => onError(error, this.snackBar, [this.pageState]),
      });
  }

  async previous(): Promise<void> {
    if (!this.tabs()) return;

    const newListIndex = mod(this.tabs()!.selectedIndex - 1, this.lists?.length);
    const list: List | undefined = this.lists?.[newListIndex];
    if (!list) return;

    await this.router.navigate([], { queryParams: { slug: list.ids.slug } });
  }

  async next(): Promise<void> {
    if (!this.tabs()) return;

    const newListIndex = mod(this.tabs()!.selectedIndex + 1, this.lists?.length);
    const list: List | undefined = this.lists?.[newListIndex];
    if (!list) return;

    await this.router.navigate([], { queryParams: { slug: list.ids.slug } });
  }
}

const queryParamSchema = z.object({
  slug: z.string().optional(),
});
