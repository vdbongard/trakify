import { Component, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { BehaviorSubject, combineLatest, map, of, switchMap, takeUntil } from 'rxjs';
import { TmdbService } from '../../../shows/data/tmdb.service';
import { ListService } from '../../data/list.service';
import { DialogService } from '@services/dialog.service';
import { Base } from '@helper/base';
import { onError } from '@helper/error';

import { LoadingState } from '@type/enum';

import type { ShowInfo } from '@type/interfaces/Show';
import type { List } from '@type/interfaces/TraktList';
import { z } from 'zod';
import { NgForOf, NgIf } from '@angular/common';
import { LoadingComponent } from '@shared/components/loading/loading.component';
import { MatTabsModule } from '@angular/material/tabs';
import { ShowsComponent } from '@shared/components/shows/shows.component';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 't-lists',
  templateUrl: './lists.component.html',
  styleUrls: ['./lists.component.scss'],
  standalone: true,
  imports: [
    NgIf,
    NgForOf,
    RouterLink,
    LoadingComponent,
    MatTabsModule,
    ShowsComponent,
    MatButtonModule,
    MatIconModule,
  ],
})
export class ListsComponent extends Base implements OnInit {
  pageState = new BehaviorSubject<LoadingState>(LoadingState.LOADING);
  listItemsLoadingState = new BehaviorSubject<LoadingState>(LoadingState.LOADING);
  lists?: List[];
  activeListIndex = 0;
  showsInfos?: ShowInfo[];

  constructor(
    public tmdbService: TmdbService,
    public router: Router,
    public route: ActivatedRoute,
    public listService: ListService,
    public dialogService: DialogService,
    private snackBar: MatSnackBar,
    private title: Title
  ) {
    super();
  }

  ngOnInit(): void {
    combineLatest([this.listService.lists.$, this.route.queryParams])
      .pipe(
        map(
          ([lists, queryParams]) =>
            [lists, queryParamSchema.parse(queryParams)] as [
              List[],
              z.infer<typeof queryParamSchema>
            ]
        ),
        switchMap(([lists, queryParams]) => {
          this.pageState.next(LoadingState.SUCCESS);
          this.title.setTitle(`Lists - Trakify`);

          this.lists = lists;
          if (!this.lists || this.lists.length === 0) return of([]);

          const slug = queryParams.slug;

          const index = slug !== null ? this.lists.findIndex((list) => list.ids.slug === slug) : -1;
          this.activeListIndex = index >= 0 ? index : 0;
          this.title.setTitle(`${this.lists[this.activeListIndex].name} - Lists - Trakify`);

          if (!slug || index === -1) {
            this.router.navigate([], {
              queryParamsHandling: 'merge',
              queryParams: {
                slug: this.lists[this.activeListIndex].ids.slug,
              },
            });
            return of([]);
          }

          return this.listService.getListItems$(slug);
        }),
        switchMap((listItems) => {
          this.listItemsLoadingState.next(LoadingState.SUCCESS);

          if (!listItems || listItems.length === 0) {
            this.showsInfos = [];
            return of([]);
          }

          const showsInfos = listItems.map(
            (listItem): ShowInfo => ({
              show: listItem.show,
            })
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
              this.tmdbService.getTmdbShow$(showInfo.show, false, { fetch: true })
            )
          );
        }),
        map((tmdbShows) => {
          if (tmdbShows.length === 0) return;

          this.showsInfos = this.showsInfos?.map(
            (showInfo, i): ShowInfo => ({
              ...showInfo,
              tmdbShow: tmdbShows[i],
            })
          );
        }),
        takeUntil(this.destroy$)
      )
      .subscribe({
        error: (error) => onError(error, this.snackBar, this.pageState),
      });
  }
}

const queryParamSchema = z.object({
  slug: z.string().optional(),
});
