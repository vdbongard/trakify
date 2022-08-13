import { Component, OnInit } from '@angular/core';
import { ShowService } from '../../../shared/services/trakt/show.service';
import {
  BehaviorSubject,
  defaultIfEmpty,
  forkJoin,
  of,
  Subscription,
  switchMap,
  take,
  takeUntil,
  zip,
} from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { ShowInfo } from '../../../../types/interfaces/Show';
import { TmdbService } from '../../../shared/services/tmdb.service';
import { List } from '../../../../types/interfaces/TraktList';
import { ListService } from '../../../shared/services/trakt/list.service';
import { DialogService } from '../../../shared/services/dialog.service';
import { BaseComponent } from '../../../shared/helper/base-component';
import { LoadingState } from '../../../../types/enum';
import { wait } from '../../../shared/helper/wait';
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
  activeListIndex?: number;
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
    this.route.queryParams.pipe(takeUntil(this.destroy$)).subscribe(async (params) => {
      const slug = params['slug'];
      if (!this.lists) {
        this.getLists(slug);
      }
      if (slug) {
        await this.getListItems(slug);
      }
    });
  }

  getLists(slug?: string): Subscription {
    return this.listService.lists$.pipe(take(1)).subscribe({
      next: async (lists) => {
        this.loadingState.next(LoadingState.SUCCESS);
        this.lists = lists;
        if (this.lists.length === 0) return;

        this.activeListIndex =
          (slug && this.lists.findIndex((list) => list.ids.slug === slug)) || 0;

        if (this.activeListIndex >= 0) {
          await this.router.navigate([], {
            queryParamsHandling: 'merge',
            queryParams: {
              slug: this.lists[this.activeListIndex].ids.slug,
            },
          });
        }

        await wait(); // fix ink bar not visible at first
      },
      error: (error) => onError(error, this.snackBar, this.loadingState),
    });
  }

  async getListItems(slug?: string): Promise<void> {
    if (!slug) return;

    this.listItemsLoadingState.next(LoadingState.LOADING);
    this.showsInfos = undefined;
    await wait(); // wait for next render for list to leave

    this.listService
      .getListItems$(slug)
      .pipe(
        switchMap((listItems) => {
          const tmdbShows =
            listItems?.map((listItem) => {
              return this.tmdbService.getTmdbShow$(listItem.show.ids).pipe(take(1));
            }) ?? [];
          return zip([of(listItems), forkJoin(tmdbShows)]).pipe(defaultIfEmpty([[], []]));
        }),
        take(1)
      )
      .subscribe({
        next: async ([listItems, tmdbShows]) => {
          this.listItemsLoadingState.next(LoadingState.SUCCESS);
          this.showsInfos = listItems?.map(
            (listItem, i): ShowInfo => ({
              show: listItem.show,
              tmdbShow: tmdbShows[i],
            })
          );
        },
        error: (error) => onError(error, this.snackBar, this.loadingState),
      });
  }
}
