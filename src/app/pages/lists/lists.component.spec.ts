import { ComponentFixture, TestBed } from '@angular/core/testing';
import ListsComponent from './lists.component';
import { ActivatedRoute, Router } from '@angular/router';
import { BehaviorSubject, of } from 'rxjs';
import { signal } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Title } from '@angular/platform-browser';
import { ListService } from './data/list.service';
import { TmdbService } from '../shows/data/tmdb.service';
import { DialogService } from '@services/dialog.service';
import type { List, ListItem } from '@type/TraktList';
import { mockShow } from '@shared/mocks/mockShow';

describe('ListsComponent', () => {
  let fixture: ComponentFixture<ListsComponent>;
  let component: ListsComponent;

  let queryParams$: BehaviorSubject<Record<string, string | undefined>>;
  let listItemsBySlug: Record<string, ListItem[]>;
  let listServiceMock: {
    lists: { s: ReturnType<typeof signal<List[]>> };
    getListItems$: ReturnType<typeof vi.fn>;
  };
  let routerMock: {
    navigate: ReturnType<typeof vi.fn>;
    url: string;
  };
  let titleMock: {
    setTitle: ReturnType<typeof vi.fn>;
  };

  const makeList = (id: number, slug: string, name: string): List =>
    ({
      allow_comments: true,
      comment_count: 0,
      created_at: '2020-01-01T00:00:00.000Z',
      description: null,
      display_numbers: false,
      ids: { trakt: id, slug },
      item_count: 0,
      likes: 0,
      name,
      privacy: 'public',
      sort_by: 'rank',
      sort_how: 'asc',
      type: 'personal',
      updated_at: '2020-01-01T00:00:00.000Z',
      user: {
        ids: { slug: 'user' },
        name: 'User',
        private: false,
        username: 'user',
        vip: false,
        vip_ep: false,
      },
    }) as List;

  const makeListItem = (id: number, title: string): ListItem =>
    ({
      id,
      listed_at: '2020-01-01T00:00:00.000Z',
      notes: null,
      rank: id,
      type: 'show',
      show: {
        ...mockShow,
        title,
        ids: {
          ...mockShow.ids,
          trakt: id,
          slug: `show-${id}`,
          tmdb: id,
          tvdb: id,
          tvrage: id,
          imdb: `tt${id}`,
        },
      },
    }) as ListItem;

  beforeEach(async () => {
    queryParams$ = new BehaviorSubject<Record<string, string | undefined>>({});

    listItemsBySlug = {
      backlog: [makeListItem(2, 'Beta'), makeListItem(1, 'Alpha')],
      favorites: [makeListItem(3, 'Gamma')],
    };

    listServiceMock = {
      lists: {
        s: signal<List[]>([]),
      },
      getListItems$: vi.fn((slug: string) => of(listItemsBySlug[slug] ?? [])),
    };

    routerMock = {
      navigate: vi.fn(() => Promise.resolve(true)),
      url: '/lists',
    };

    titleMock = {
      setTitle: vi.fn(),
    };

    await TestBed.configureTestingModule({
      providers: [
        { provide: ListService, useValue: listServiceMock },
        {
          provide: TmdbService,
          useValue: {
            getTmdbShow$: vi.fn((show: { ids: { trakt: number } }) =>
              of({ id: show.ids.trakt, name: `TMDB ${show.ids.trakt}` }),
            ),
          },
        },
        {
          provide: DialogService,
          useValue: {
            manageListItems: vi.fn(),
          },
        },
        { provide: Router, useValue: routerMock },
        {
          provide: ActivatedRoute,
          useValue: {
            queryParams: queryParams$.asObservable(),
          },
        },
        { provide: MatSnackBar, useValue: { open: vi.fn() } },
        { provide: Title, useValue: titleMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ListsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render loading state initially', () => {
    const loading = fixture.nativeElement.querySelector('t-loading');
    const tabsNav = fixture.nativeElement.querySelector('nav[mat-tab-nav-bar]');

    expect(loading).toBeTruthy();
    expect(tabsNav).toBeFalsy();
  });

  it('should show no list added when lists empty', () => {
    const message = fixture.nativeElement.querySelector('h2');
    const listItemsFab = fixture.nativeElement.querySelector('button[mat-fab]');

    expect(message).toBeTruthy();
    expect(message.textContent.trim()).toBe('No list added.');
    expect(listItemsFab).toBeFalsy();
  });

  it('navigates to first list slug when slug query param is missing', async () => {
    const lists = [makeList(1, 'backlog', 'Backlog'), makeList(2, 'favorites', 'Favorites')];
    listServiceMock.lists.s.set(lists);
    queryParams$.next({});

    fixture.detectChanges();
    await fixture.whenStable();

    expect(routerMock.navigate).toHaveBeenCalledWith([], {
      queryParamsHandling: 'merge',
      queryParams: { slug: 'backlog' },
    });
    expect(component.activeListIndex).toBeUndefined();
  });

  it('loads list items for valid slug and sorts shows by title', async () => {
    const lists = [makeList(1, 'backlog', 'Backlog'), makeList(2, 'favorites', 'Favorites')];
    listServiceMock.lists.s.set(lists);
    queryParams$.next({ slug: 'backlog' });

    fixture.detectChanges();
    await fixture.whenStable();

    expect(listServiceMock.getListItems$).toHaveBeenCalledWith('backlog');
    expect(component.activeListIndex).toBe(0);
    expect(component.showsInfos?.map((showInfo) => showInfo.show.title)).toEqual(['Alpha', 'Beta']);
  });

  it('navigates to empty query when slug exists but lists are empty', async () => {
    listServiceMock.lists.s.set([]);
    queryParams$.next({ slug: 'missing' });

    fixture.detectChanges();
    await fixture.whenStable();

    expect(routerMock.navigate).toHaveBeenCalledWith([]);
  });

  it('navigates to previous and next list based on selected tab index', async () => {
    component.lists = [makeList(1, 'backlog', 'Backlog'), makeList(2, 'favorites', 'Favorites')];
    component.tabs = (() => ({ selectedIndex: 0 })) as never;

    await component.previous();
    await component.next();

    expect(routerMock.navigate).toHaveBeenCalledWith([], {
      queryParams: { slug: 'favorites' },
    });
    expect(routerMock.navigate).toHaveBeenCalledWith([], {
      queryParams: { slug: 'favorites' },
    });
  });

  it('does not navigate when tabs or target list is missing', async () => {
    component.tabs = (() => undefined) as never;
    await component.previous();

    component.tabs = (() => ({ selectedIndex: 0 })) as never;
    component.lists = [];
    await component.next();

    expect(routerMock.navigate).not.toHaveBeenCalledWith([], {
      queryParams: { slug: undefined },
    });
  });
});
