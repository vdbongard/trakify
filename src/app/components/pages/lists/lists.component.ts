import { Component, OnDestroy, OnInit } from '@angular/core';
import { ShowService } from '../../../services/show.service';
import { BehaviorSubject, combineLatest, forkJoin, of, Subscription, switchMap, zip } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { ShowInfo } from '../../../../types/interfaces/Show';
import { wait } from '../../../helper/wait';
import { TmdbService } from '../../../services/tmdb.service';
import { List } from '../../../../types/interfaces/TraktList';
import { ListService } from '../../../services/list.service';
import { DialogService } from '../../../services/dialog.service';

@Component({
  selector: 'app-lists',
  templateUrl: './lists.component.html',
  styleUrls: ['./lists.component.scss'],
})
export class ListsComponent implements OnInit, OnDestroy {
  subscriptions: Subscription[] = [];
  lists: List[] = [];
  activeList?: List;
  shows: ShowInfo[] = [];
  isLoading = new BehaviorSubject<boolean>(false);

  constructor(
    public showService: ShowService,
    public tmdbService: TmdbService,
    public router: Router,
    public route: ActivatedRoute,
    public listService: ListService,
    public dialogService: DialogService
  ) {}

  ngOnInit(): void {
    this.subscriptions = [
      combineLatest([this.route.queryParams, this.showService.updated]).subscribe(
        async ([params]) => {
          const slug = params['slug'];
          this.getLists(slug);
          this.getListItems(slug);
        }
      ),
    ];
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((subscription) => subscription.unsubscribe());
  }

  getLists(slug?: string): Subscription {
    return this.listService.fetchLists().subscribe(async (lists) => {
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
    });
  }

  getListItems(slug?: string): void {
    if (!slug) return;
    this.isLoading.next(true);
    this.shows = [];

    this.listService
      .fetchListItems(slug)
      .pipe(
        switchMap((listItems) => {
          return zip([
            of(listItems),
            forkJoin(
              listItems.map((listItem) => {
                return this.tmdbService.fetchTmdbShow(listItem.show.ids.tmdb);
              })
            ),
          ]);
        })
      )
      .subscribe(async ([listItems, tmdbShows]) => {
        this.shows = listItems.map((listItem, i) => {
          return {
            show: listItem.show,
            tmdbShow: tmdbShows[i],
          };
        });
        await wait();
        this.isLoading.next(false);
      });
  }
}
