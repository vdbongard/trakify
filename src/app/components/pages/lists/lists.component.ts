import { Component, OnDestroy, OnInit } from '@angular/core';
import { ShowService } from '../../../services/show.service';
import { BehaviorSubject, forkJoin, of, Subscription, switchMap, zip } from 'rxjs';
import { List } from '../../../../types/interfaces/Trakt';
import { ActivatedRoute, Router } from '@angular/router';
import { ShowInfo } from '../../../../types/interfaces/Show';
import { wait } from '../../../helper/wait';
import { TmdbService } from '../../../services/tmdb.service';

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
  slug?: string;
  isLoading = new BehaviorSubject<boolean>(false);

  constructor(
    public showService: ShowService,
    public tmdbService: TmdbService,
    public router: Router,
    public route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.subscriptions = [
      this.route.queryParams.subscribe(async (params) => {
        this.slug = params['slug'];
        if (!this.slug) return;

        this.isLoading.next(true);
        this.shows = [];

        this.showService
          .fetchListItems(this.slug)
          .pipe(
            switchMap((listItems) => {
              return zip(
                of(listItems),
                forkJoin(
                  listItems.map((listItem) => {
                    return this.tmdbService.fetchShow(listItem.show.ids.tmdb);
                  })
                )
              );
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
      }),
      this.showService.fetchLists().subscribe(async (lists) => {
        this.lists = lists;
        this.activeList = this.lists.find((list) => list.ids.slug === this.slug) || this.lists[0];
        if (this.activeList) {
          await this.router.navigateByUrl(`/lists?slug=${this.activeList.ids.slug}`);
        }
      }),
    ];
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((subscription) => subscription.unsubscribe());
  }
}
