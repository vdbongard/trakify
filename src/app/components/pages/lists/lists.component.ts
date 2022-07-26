import { Component, OnInit } from '@angular/core';
import { ShowService } from '../../../services/trakt/show.service';
import {
  BehaviorSubject,
  combineLatest,
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
import { TmdbService } from '../../../services/tmdb.service';
import { List } from '../../../../types/interfaces/TraktList';
import { ListService } from '../../../services/trakt/list.service';
import { DialogService } from '../../../services/dialog.service';
import { BaseComponent } from '../../../helper/base-component';
import { LoadingState } from '../../../../types/enum';
import { wait } from '../../../helper/wait';

@Component({
  selector: 'app-lists',
  templateUrl: './lists.component.html',
  styleUrls: ['./lists.component.scss'],
})
export class ListsComponent extends BaseComponent implements OnInit {
  loadingState = new BehaviorSubject<LoadingState>(LoadingState.LOADING);
  lists?: List[];
  activeListIndex?: number;
  shows?: ShowInfo[] = [];

  constructor(
    public showService: ShowService,
    public tmdbService: TmdbService,
    public router: Router,
    public route: ActivatedRoute,
    public listService: ListService,
    public dialogService: DialogService
  ) {
    super();
  }

  ngOnInit(): void {
    combineLatest([this.route.queryParams, this.listService.updated])
      .pipe(takeUntil(this.destroy$))
      .subscribe(async ([params]) => {
        const slug = params['slug'];
        if (!this.lists) {
          this.getLists(slug);
        }
        if (slug) {
          this.getListItems(slug);
        }
      });
  }

  getLists(slug?: string): Subscription {
    return this.listService.lists$.pipe(take(1)).subscribe({
      next: async (lists) => {
        this.lists = lists;
        this.activeListIndex =
          (slug && this.lists.findIndex((list) => list.ids.slug === slug)) || 0;

        if (this.activeListIndex >= 0) {
          await this.router.navigate(['/lists'], {
            queryParamsHandling: 'merge',
            queryParams: {
              slug: this.lists[this.activeListIndex].ids.slug,
            },
          });
        }

        await wait(); // fix ink bar not visible at first
      },
      error: () => this.loadingState.next(LoadingState.ERROR),
    });
  }

  getListItems(slug?: string): void {
    if (!slug) return;

    this.listService
      .getListItems$(slug)
      .pipe(
        switchMap((listItems) => {
          const tmdbShows =
            listItems?.map((listItem) => {
              return this.tmdbService.getTmdbShow$(listItem.show.ids).pipe(take(1));
            }) || [];
          return zip([of(listItems), forkJoin(tmdbShows)]);
        }),
        take(1)
      )
      .subscribe({
        next: async ([listItems, tmdbShows]) => {
          this.shows = listItems?.map((listItem, i): ShowInfo => {
            return {
              show: listItem.show,
              tmdbShow: tmdbShows[i],
            };
          });
          this.loadingState.next(LoadingState.SUCCESS);
        },
        error: () => this.loadingState.next(LoadingState.ERROR),
      });
  }
}
