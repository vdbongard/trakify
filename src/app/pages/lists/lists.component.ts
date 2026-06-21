import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  viewChild,
} from '@angular/core';
import { Title } from '@angular/platform-browser';
import { Router, RouterLink } from '@angular/router';
import { lastValueFrom } from 'rxjs';
import { TmdbService } from '../shows/data/tmdb.service';
import { ListService } from './data/list.service';
import { DialogService } from '@services/dialog.service';
import { queryKeys } from '@shared/query-keys';
import type { ShowInfo } from '@type/Show';
import type { ListItem } from '@type/TraktList';
import { injectQuery } from '@tanstack/angular-query-experimental';
import { MatTabNav, MatTabsModule } from '@angular/material/tabs';
import { ShowsComponent } from '@shared/components/shows/shows.component';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { SwipeDirective } from '@shared/directives/swipe.directive';
import { mod } from '@helper/mod';
import { onKeyArrow } from '@helper/onKeyArrow';
import { SpinnerComponent } from '@shared/components/spinner/spinner.component';
import { ErrorText } from '@shared/components/error-text/error-text.component';

@Component({
  selector: 't-lists',
  imports: [
    RouterLink,
    MatTabsModule,
    ShowsComponent,
    MatButtonModule,
    MatIconModule,
    SwipeDirective,
    SpinnerComponent,
    ErrorText,
  ],
  templateUrl: './lists.component.html',
  styleUrl: './lists.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class ListsComponent {
  router = inject(Router);
  listService = inject(ListService);
  dialogService = inject(DialogService);
  tmdbService = inject(TmdbService);
  title = inject(Title);

  slug = input<string>();

  tabs = viewChild(MatTabNav);

  lists = this.listService.lists.s;

  validSlug = computed(() => {
    const slug = this.slug();
    const lists = this.lists();
    if (!slug || !lists?.length) return undefined;
    return lists.findIndex((list) => list.ids.slug === slug) >= 0 ? slug : undefined;
  });

  activeListIndex = computed(() => {
    const slug = this.validSlug();
    if (!slug) return undefined;
    return this.lists().findIndex((list) => list.ids.slug === slug);
  });

  activeList = computed(() => {
    const index = this.activeListIndex();
    if (index === undefined) return undefined;
    return this.lists()[index];
  });

  listItemsQuery = injectQuery(() => ({
    queryKey: queryKeys.listItems(this.validSlug()),
    queryFn: (): Promise<ListItem[] | undefined> =>
      lastValueFrom(this.listService.getListItems$(this.validSlug()!)),
    enabled: !!this.validSlug(),
  }));

  showsInfosWithoutTmdb = computed<ShowInfo[]>(() => {
    const items = this.listItemsQuery.data() ?? [];
    return items
      .map((item): ShowInfo => ({ show: item.show }))
      .sort((a, b) => (a.show?.title ?? '').localeCompare(b.show?.title ?? ''));
  });

  shows = computed(() => this.showsInfosWithoutTmdb().map((s) => s.show));

  tmdbShowQueries = this.tmdbService.getTmdbShowQueries(this.shows);

  isPending = computed(() => {
    const queries = this.tmdbShowQueries();
    // @ts-expect-error status signal type issue in TanStack Query injectQueries
    return queries.some((q) => q.status() === 'pending');
  });

  showsInfos = this.tmdbService.getShowsInfosWithTmdb(
    this.tmdbShowQueries,
    this.showsInfosWithoutTmdb,
  );

  readonly redirectEffect = effect(() => {
    const lists = this.lists();

    const slug = this.slug();

    if (lists.length === 0) {
      if (slug) void this.router.navigate([]);
      return;
    }

    const index = slug ? lists.findIndex((list) => list.ids.slug === slug) : -1;

    if (!slug || index === -1) {
      void this.router.navigate([], {
        queryParamsHandling: 'merge',
        queryParams: { slug: lists[0].ids.slug },
      });
    }
  });

  readonly setTitleEffect = effect(() => {
    const activeList = this.activeList();
    if (activeList) {
      this.title.setTitle(`${activeList.name} - Lists - Trakify`);
    } else {
      this.title.setTitle('Lists - Trakify');
    }
  });

  constructor() {
    onKeyArrow({
      arrowLeft: () => void this.previous(),
      arrowRight: () => void this.next(),
    });
  }

  async previous(): Promise<void> {
    if (!this.tabs()) return;

    const newListIndex = mod(this.tabs()!.selectedIndex - 1, this.lists()?.length);
    const list = this.lists()?.[newListIndex];
    if (!list) return;

    await this.router.navigate([], { queryParams: { slug: list.ids.slug } });
  }

  async next(): Promise<void> {
    if (!this.tabs()) return;

    const newListIndex = mod(this.tabs()!.selectedIndex + 1, this.lists()?.length);
    const list = this.lists()?.[newListIndex];
    if (!list) return;

    await this.router.navigate([], { queryParams: { slug: list.ids.slug } });
  }
}
