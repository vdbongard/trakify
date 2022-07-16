import { Component, OnInit } from '@angular/core';
import { ShowService } from '../../../services/show.service';
import {
  combineLatest,
  forkJoin,
  of,
  Subject,
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
import { ListService } from '../../../services/list.service';
import { DialogService } from '../../../services/dialog.service';
import { BaseComponent } from '../../../helper/base-component';
import { LoadingState } from '../../../../types/enum';

@Component({
  selector: 'app-lists',
  templateUrl: './lists.component.html',
  styleUrls: ['./lists.component.scss'],
})
export class ListsComponent extends BaseComponent implements OnInit {
  loadingState = new Subject<LoadingState>();
  lists: List[] = [];
  activeList?: List;
  shows: ShowInfo[] = [];

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
        this.getLists(slug);
        this.getListItems(slug);
      });
  }

  getLists(slug?: string): Subscription {
    return this.listService.fetchLists().subscribe({
      next: async (lists) => {
        this.lists = lists;
        this.activeList =
          (slug && this.lists.find((list) => list.ids.slug === slug)) || this.lists[0];
        if (this.activeList) {
          await this.router.navigate(['/lists'], {
            queryParamsHandling: 'merge',
            queryParams: {
              slug: this.activeList.ids.slug,
            },
          });
        }
      },
      error: () => this.loadingState.next(LoadingState.ERROR),
    });
  }

  getListItems(slug?: string): void {
    if (!slug) return;

    this.listService
      .fetchListItems(slug)
      .pipe(
        switchMap((listItems) => {
          return zip([
            of(listItems),
            forkJoin(
              listItems.map((listItem) => {
                return this.tmdbService.getTmdbShow$(listItem.show.ids.tmdb).pipe(take(1));
              })
            ),
          ]);
        })
      )
      .subscribe({
        next: async ([listItems, tmdbShows]) => {
          this.shows = listItems.map((listItem, i) => {
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
