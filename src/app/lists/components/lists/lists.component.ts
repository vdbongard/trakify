import { Component, OnInit } from '@angular/core';
import { ShowService } from '../../../shared/services/trakt/show.service';
import { BehaviorSubject, combineLatest, of, switchMap, takeUntil } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { ShowInfo } from '../../../../types/interfaces/Show';
import { TmdbService } from '../../../shared/services/tmdb.service';
import { List } from '../../../../types/interfaces/TraktList';
import { ListService } from '../../../shared/services/trakt/list.service';
import { DialogService } from '../../../shared/services/dialog.service';
import { BaseComponent } from '../../../shared/helper/base-component';
import { LoadingState } from '../../../../types/enum';
import { onError } from '../../../shared/helper/error';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-lists',
  templateUrl: './lists.component.html',
  styleUrls: ['./lists.component.scss'],
})
export class ListsComponent extends BaseComponent implements OnInit {
  loadingState = new BehaviorSubject<LoadingState>(LoadingState.LOADING);
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
    private snackBar: MatSnackBar
  ) {
    super();
  }

  ngOnInit(): void {
    combineLatest([this.listService.lists$, this.route.queryParams])
      .pipe(
        switchMap(([lists, params]) => {
          this.loadingState.next(LoadingState.SUCCESS);
          this.lists = lists;
          if (this.lists.length === 0) return of([]);

          const slug = params['slug'];

          const index = slug && lists.findIndex((list) => list.ids.slug === slug);
          this.activeListIndex = index >= 0 ? index : 0;

          if (!slug || index === -1) {
            this.router.navigate([], {
              queryParamsHandling: 'merge',
              queryParams: {
                slug: lists[this.activeListIndex].ids.slug,
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

          this.showsInfos = listItems.map(
            (listItem): ShowInfo => ({
              show: listItem.show,
            })
          );

          return combineLatest(
            listItems.map((listItem) => this.tmdbService.getTmdbShow$(listItem.show.ids))
          );
        }),
        switchMap((tmdbShows) => {
          if (tmdbShows.length === 0) return of(undefined);

          this.showsInfos = this.showsInfos?.map(
            (showInfo, i): ShowInfo => ({
              ...showInfo,
              tmdbShow: tmdbShows[i],
            })
          );

          return of(undefined);
        }),
        takeUntil(this.destroy$)
      )
      .subscribe({
        error: (error) => onError(error, this.snackBar, this.loadingState),
      });
  }
}
