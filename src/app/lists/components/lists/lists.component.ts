import { Component, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { BehaviorSubject, combineLatest, map, of, switchMap, takeUntil } from 'rxjs';

import { ShowService } from '@services/trakt/show.service';
import { TmdbService } from '@services/tmdb.service';
import { ListService } from '@services/trakt/list.service';
import { DialogService } from '@services/dialog.service';
import { BaseComponent } from '@helper/base-component';
import { onError } from '@helper/error';

import { LoadingState } from '@type/enum';

import type { ShowInfo } from '@type/interfaces/Show';
import type { List } from '@type/interfaces/TraktList';

@Component({
  selector: 't-lists',
  templateUrl: './lists.component.html',
  styleUrls: ['./lists.component.scss'],
})
export class ListsComponent extends BaseComponent implements OnInit {
  pageState = new BehaviorSubject<LoadingState>(LoadingState.LOADING);
  listItemsLoadingState = new BehaviorSubject<LoadingState>(LoadingState.LOADING);
  lists?: List[];
  activeListIndex = 0;
  showsInfos?: ShowInfo[];

  constructor(
    public showService: ShowService,
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
    combineLatest([this.listService.lists.$, this.route.queryParamMap])
      .pipe(
        switchMap(([lists, params]) => {
          this.pageState.next(LoadingState.SUCCESS);
          this.title.setTitle(`Lists - Trakify`);

          this.lists = lists;
          if (!this.lists || this.lists.length === 0) return of([]);

          const slug = params.get('slug');

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

          return combineLatest(
            this.showsInfos.map((showInfo) =>
              this.tmdbService.getTmdbShow$(showInfo.show?.ids, { fetch: true })
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
      .subscribe({ error: (error) => onError(error, this.snackBar, this.pageState) });
  }
}
