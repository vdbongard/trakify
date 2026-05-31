import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { EMPTY, of, throwError } from 'rxjs';
import { DialogService } from './dialog.service';
import { ShowService } from '../../pages/shows/data/show.service';
import { ListService } from '../../pages/lists/data/list.service';
import { SyncService } from './sync.service';
import { AddListDialogComponent } from '../components/add-list-dialog/add-list-dialog.component';
import { ConfirmDialogComponent } from '../components/confirm-dialog/confirm-dialog.component';
import { ListDialogComponent } from '../components/list-dialog/list-dialog.component';
import { ListItemsDialogComponent } from '../../pages/lists/ui/list-items-dialog/list-items-dialog.component';
import { VideoDialogComponent } from '../components/video-dialog/video-dialog.component';

describe('DialogService', () => {
  let service: DialogService;

  let dialogMock: {
    open: ReturnType<typeof vi.fn>;
  };

  let routerMock: {
    navigateByUrl: ReturnType<typeof vi.fn>;
  };

  let snackBarMock: {
    open: ReturnType<typeof vi.fn>;
  };

  let listServiceMock: {
    lists: { s: ReturnType<typeof signal> };
    getListItems$: ReturnType<typeof vi.fn>;
    addShowsToList: ReturnType<typeof vi.fn>;
    removeShowsFromList: ReturnType<typeof vi.fn>;
    addList: ReturnType<typeof vi.fn>;
  };

  let showServiceMock: {
    getShows$: ReturnType<typeof vi.fn>;
  };

  let syncServiceMock: {
    syncNew: ReturnType<typeof vi.fn>;
  };

  const listA = {
    ids: {
      trakt: 101,
      slug: 'favorites',
    },
    name: 'Favorites',
  } as never;

  const listB = {
    ids: {
      trakt: 202,
      slug: 'to-watch',
    },
    name: 'To Watch',
  } as never;

  const showA = {
    ids: {
      trakt: 7,
    },
    title: 'Alpha',
  } as never;

  const showB = {
    ids: {
      trakt: 9,
    },
    title: 'Beta',
  } as never;

  const emptyListResponse = {
    not_found: {
      shows: [],
    },
  } as never;

  const notFoundResponse = {
    not_found: {
      shows: [{ ids: { trakt: 7 } }],
    },
  } as never;

  beforeEach(() => {
    dialogMock = {
      open: vi.fn(() => ({
        afterClosed: vi.fn(() => of(undefined)),
      })),
    };

    routerMock = {
      navigateByUrl: vi.fn(() => Promise.resolve(true)),
    };

    snackBarMock = {
      open: vi.fn(() => ({
        onAction: vi.fn(() => EMPTY),
      })),
    };

    listServiceMock = {
      lists: {
        s: signal([listA, listB]),
      },
      getListItems$: vi.fn((slug: string) => {
        if (slug === 'favorites') {
          return of([{ show: { ids: { trakt: 7 } } }]);
        }
        return of([{ show: { ids: { trakt: 42 } } }]);
      }),
      addShowsToList: vi.fn(() => of(emptyListResponse)),
      removeShowsFromList: vi.fn(() => of(emptyListResponse)),
      addList: vi.fn(() => of({ ids: { slug: 'my-list' } })),
    };

    showServiceMock = {
      getShows$: vi.fn(() => of([showB, showA])),
    };

    syncServiceMock = {
      syncNew: vi.fn(async () => undefined),
    };

    TestBed.configureTestingModule({
      providers: [
        { provide: MatDialog, useValue: dialogMock },
        { provide: Router, useValue: routerMock },
        { provide: MatSnackBar, useValue: snackBarMock },
        { provide: ListService, useValue: listServiceMock },
        { provide: ShowService, useValue: showServiceMock },
        { provide: SyncService, useValue: syncServiceMock },
      ],
    });

    service = TestBed.inject(DialogService);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('manageLists', () => {
    it('should open list dialog with selected list ids', async () => {
      service.manageLists(7);

      await vi.waitFor(() => {
        expect(dialogMock.open).toHaveBeenCalled();
      });

      expect(dialogMock.open).toHaveBeenCalledWith(ListDialogComponent, {
        width: '250px',
        data: {
          showId: 7,
          lists: [listA, listB],
          listIds: [101],
        },
      });
    });

    it('should add and remove list memberships then sync when confirmed', async () => {
      dialogMock.open.mockReturnValueOnce({
        afterClosed: vi.fn(() =>
          of({
            added: [101],
            removed: [202],
          }),
        ),
      });

      service.manageLists(7);

      await vi.waitFor(() => {
        expect(listServiceMock.addShowsToList).toHaveBeenCalled();
      });

      expect(listServiceMock.addShowsToList).toHaveBeenCalledWith(101, [7]);
      expect(listServiceMock.removeShowsFromList).toHaveBeenCalledWith(202, [7]);
      expect(syncServiceMock.syncNew).toHaveBeenCalled();
    });

    it('should do nothing when dialog closes without result', () => {
      dialogMock.open.mockReturnValueOnce({
        afterClosed: vi.fn(() => of(undefined)),
      });

      service.manageLists(7);

      expect(listServiceMock.addShowsToList).not.toHaveBeenCalled();
      expect(listServiceMock.removeShowsFromList).not.toHaveBeenCalled();
      expect(syncServiceMock.syncNew).not.toHaveBeenCalled();
    });

    it('should report not_found results from list updates', async () => {
      const onErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
      listServiceMock.addShowsToList.mockReturnValueOnce(of(notFoundResponse));
      dialogMock.open.mockReturnValueOnce({
        afterClosed: vi.fn(() =>
          of({
            added: [101],
            removed: [],
          }),
        ),
      });

      service.manageLists(7);

      await vi.waitFor(() => {
        expect(onErrorSpy).toHaveBeenCalled();
      });

      expect(snackBarMock.open).toHaveBeenCalledWith('Show(s) not found', 'Reload', {
        duration: 6000,
      });
    });

    it('should handle upstream errors while loading lists', async () => {
      const onErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
      listServiceMock.getListItems$.mockReturnValueOnce(throwError(() => new Error('boom')));

      service.manageLists(7);

      await vi.waitFor(() => {
        expect(onErrorSpy).toHaveBeenCalled();
      });

      expect(snackBarMock.open).toHaveBeenCalledWith('boom', 'Reload', {
        duration: 6000,
      });
    });
  });

  describe('manageListItems', () => {
    it('should return early when list is missing', () => {
      service.manageListItems(undefined);

      expect(dialogMock.open).not.toHaveBeenCalled();
    });

    it('should open list items dialog with alphabetically sorted shows', () => {
      listServiceMock.getListItems$.mockReturnValueOnce(of([{ show: showA }]));

      service.manageListItems(listA);

      expect(dialogMock.open).toHaveBeenCalledWith(ListItemsDialogComponent, {
        width: '500px',
        data: {
          list: listA,
          listItems: [{ show: showA }],
          shows: [showA, showB],
        },
      });
    });

    it('should add and remove items then sync when confirmed', () => {
      dialogMock.open.mockReturnValueOnce({
        afterClosed: vi.fn(() =>
          of({
            added: [7],
            removed: [9],
          }),
        ),
      });

      service.manageListItems(listA);

      expect(listServiceMock.addShowsToList).toHaveBeenCalledWith(101, [7]);
      expect(listServiceMock.removeShowsFromList).toHaveBeenCalledWith(101, [9]);
      expect(syncServiceMock.syncNew).toHaveBeenCalled();
    });

    it('should do nothing when list items dialog closes without result', () => {
      dialogMock.open.mockReturnValueOnce({
        afterClosed: vi.fn(() => of(undefined)),
      });

      service.manageListItems(listA);

      expect(listServiceMock.addShowsToList).not.toHaveBeenCalled();
      expect(listServiceMock.removeShowsFromList).not.toHaveBeenCalled();
      expect(syncServiceMock.syncNew).not.toHaveBeenCalled();
    });

    it('should report not_found results from list item updates', () => {
      const onErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
      listServiceMock.addShowsToList.mockReturnValueOnce(of(notFoundResponse));
      dialogMock.open.mockReturnValueOnce({
        afterClosed: vi.fn(() =>
          of({
            added: [7],
            removed: [],
          }),
        ),
      });

      service.manageListItems(listA);

      expect(onErrorSpy).toHaveBeenCalled();
      expect(snackBarMock.open).toHaveBeenCalledWith('Show(s) not found', 'Reload', {
        duration: 6000,
      });
    });

    it('should handle errors from list items or shows loading', () => {
      const onErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
      listServiceMock.getListItems$.mockReturnValueOnce(throwError(() => new Error('broken')));

      service.manageListItems(listA);

      expect(onErrorSpy).toHaveBeenCalled();
      expect(snackBarMock.open).toHaveBeenCalledWith('broken', 'Reload', {
        duration: 6000,
      });
    });
  });

  describe('addList', () => {
    it('should do nothing when add list dialog closes without result', () => {
      dialogMock.open.mockReturnValueOnce({
        afterClosed: vi.fn(() => of(undefined)),
      });

      service.addList();

      expect(listServiceMock.addList).not.toHaveBeenCalled();
      expect(syncServiceMock.syncNew).not.toHaveBeenCalled();
      expect(routerMock.navigateByUrl).not.toHaveBeenCalled();
    });

    it('should add list, sync, and navigate when result is provided', async () => {
      dialogMock.open.mockReturnValueOnce({
        afterClosed: vi.fn(() => of({ name: 'My List' })),
      });

      service.addList();
      await vi.waitFor(() => {
        expect(routerMock.navigateByUrl).toHaveBeenCalledWith('/lists?slug=my-list');
      });

      expect(dialogMock.open).toHaveBeenCalledWith(AddListDialogComponent);
      expect(listServiceMock.addList).toHaveBeenCalledWith({ name: 'My List' });
      expect(syncServiceMock.syncNew).toHaveBeenCalled();
    });
  });

  describe('confirm', () => {
    it('should open confirm dialog and resolve boolean result', async () => {
      dialogMock.open.mockReturnValueOnce({
        afterClosed: vi.fn(() => of(true)),
      });

      const result = await service.confirm({
        title: 'Delete',
        message: 'Are you sure?',
        confirmButton: 'Delete',
      });

      expect(dialogMock.open).toHaveBeenCalledWith(ConfirmDialogComponent, {
        data: {
          title: 'Delete',
          message: 'Are you sure?',
          confirmButton: 'Delete',
        },
      });
      expect(result).toBe(true);
    });

    it('should resolve false when confirm dialog is cancelled', async () => {
      dialogMock.open.mockReturnValueOnce({
        afterClosed: vi.fn(() => of(false)),
      });

      const result = await service.confirm({
        title: 'Cancel',
        message: 'Do you wish to abort?',
        confirmButton: 'Leave',
      });

      expect(dialogMock.open).toHaveBeenCalledWith(ConfirmDialogComponent, {
        data: {
          title: 'Cancel',
          message: 'Do you wish to abort?',
          confirmButton: 'Leave',
        },
      });
      expect(result).toBe(false);
    });

    it('should resolve undefined when dialog is closed with no result', async () => {
      dialogMock.open.mockReturnValueOnce({
        afterClosed: vi.fn(() => of(undefined)),
      });

      const result = await service.confirm({
        title: 'Noop',
        message: 'Are you really sure?',
        confirmButton: 'Continue',
      });
      expect(dialogMock.open).toHaveBeenCalledWith(ConfirmDialogComponent, {
        data: {
          title: 'Noop',
          message: 'Are you really sure?',
          confirmButton: 'Continue',
        },
      });
      expect(result).toBe(undefined);
    });
  });

  describe('showTrailer', () => {
    it('should open video dialog with trailer data', () => {
      const trailer = {
        key: 'abcd',
      } as never;

      service.showTrailer(trailer);

      expect(dialogMock.open).toHaveBeenCalledWith(VideoDialogComponent, {
        width: '65rem',
        maxWidth: '100%',
        panelClass: 'video-dialog',
        data: {
          video: trailer,
        },
      });
    });
  });
});
