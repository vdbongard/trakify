import { inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { firstValueFrom, from } from 'rxjs';
import { AddListDialogComponent } from '../components/add-list-dialog/add-list-dialog.component';
import { ListDialogComponent } from '../components/list-dialog/list-dialog.component';
import { ListItemsDialogComponent } from '../../pages/lists/ui/list-items-dialog/list-items-dialog.component';
import { ShowService } from '../../pages/shows/data/show.service';
import { ListService } from '../../pages/lists/data/list.service';
import { SyncService } from './sync.service';
import { onError } from '@helper/error';
import { ConfirmDialogComponent } from '../components/confirm-dialog/confirm-dialog.component';
import type { ConfirmDialogData, ListItemsDialogData, ListsDialogData } from '@type/Dialog';
import { VideoDialogData } from '@type/Dialog';
import type { AddToListResponse, RemoveFromListResponse } from '@type/TraktResponse';
import type { List } from '@type/TraktList';
import { VideoDialogComponent } from '../components/video-dialog/video-dialog.component';
import { Video } from '@type/Tmdb';
import { errorDelay } from '@helper/errorDelay';

@Injectable({
  providedIn: 'root',
})
export class DialogService {
  router = inject(Router);
  dialog = inject(MatDialog);
  showService = inject(ShowService);
  listService = inject(ListService);
  syncService = inject(SyncService);
  snackBar = inject(MatSnackBar);

  async manageLists(showId: number): Promise<void> {
    try {
      const lists = this.listService.lists.s();
      const listsListItems =
        lists?.map((list) => this.listService.getListItems(list.ids.slug)) ?? [];
      const isListContainingShow = listsListItems.map(
        (list) => list?.some((listItem) => listItem.show.ids.trakt === showId) ?? false,
      );
      const listIds =
        (lists
          ?.map((list, i) => isListContainingShow[i] && list.ids.trakt)
          .filter(Boolean) as number[]) ?? [];

      const dialogRef = this.dialog.open<ListDialogComponent, ListsDialogData>(
        ListDialogComponent,
        {
          width: '250px',
          data: { showId, lists: lists ?? [], listIds },
        },
      );

      const result = await firstValueFrom(dialogRef.afterClosed());
      if (!result) return;

      const tasks: Promise<AddToListResponse | RemoveFromListResponse>[] = [
        ...result.added.map((add: number) =>
          firstValueFrom(this.listService.addShowsToList(add, [showId])),
        ),
        ...result.removed.map((remove: number) =>
          firstValueFrom(this.listService.removeShowsFromList(remove, [showId])),
        ),
      ];
      // forkJoin([]) never emitted, so an empty confirm skipped the sync: keep it that way.
      if (tasks.length === 0) return;

      const responses = await Promise.all(tasks);
      this.reportNotFoundShows(responses);

      await this.syncService.syncNew();
    } catch (error) {
      onError(error, this.snackBar);
    }
  }

  async manageListItems(list?: List): Promise<void> {
    if (!list) return;
    try {
      const listItems = this.listService.getListItems(list.ids.slug);
      const shows = this.showService.showsTranslated();
      const sortedShows = [...shows].sort((a, b) => {
        return a.title > b.title ? 1 : -1;
      });
      const dialogRef = this.dialog.open<ListItemsDialogComponent, ListItemsDialogData>(
        ListItemsDialogComponent,
        {
          width: '500px',
          data: { list, listItems, shows: sortedShows },
        },
      );

      const result: { added: number[]; removed: number[] } | undefined = await firstValueFrom(
        dialogRef.afterClosed(),
      );
      if (!result) return;
      // forkJoin([]) never emitted, so an empty confirm skipped the sync: keep it that way.
      if (result.added.length === 0 && result.removed.length === 0) return;

      // One retry after the Trakt-aware delay, as before: the second failure propagates.
      const runListUpdates = (): Promise<(AddToListResponse | RemoveFromListResponse)[]> =>
        Promise.all([
          ...(result.added.length > 0
            ? [firstValueFrom(this.listService.addShowsToList(list.ids.trakt, result.added))]
            : []),
          ...(result.removed.length > 0
            ? [firstValueFrom(this.listService.removeShowsFromList(list.ids.trakt, result.removed))]
            : []),
        ]);

      const responses = await runListUpdates().catch(async (error: unknown) => {
        await firstValueFrom(from(errorDelay(error)));
        return runListUpdates();
      });
      this.reportNotFoundShows(responses);
      await this.syncService.syncNew();
    } catch (error) {
      onError(error, this.snackBar);
    }
  }

  async addList(): Promise<void> {
    const dialogRef = this.dialog.open<AddListDialogComponent>(AddListDialogComponent);

    try {
      const result: Partial<List> | undefined = await firstValueFrom(dialogRef.afterClosed());
      if (!result) return;

      const response = await firstValueFrom(this.listService.addList(result));
      await this.syncService.syncNew();
      await this.router.navigateByUrl(`/lists?slug=${response.ids.slug}`);
    } catch (error) {
      onError(error, this.snackBar);
    }
  }

  confirm(confirmData: ConfirmDialogData): Promise<boolean> {
    const dialogRef = this.dialog.open<ConfirmDialogComponent>(ConfirmDialogComponent, {
      data: confirmData,
    });

    return firstValueFrom(dialogRef.afterClosed());
  }

  showTrailer(trailer: Video): void {
    this.dialog.open<VideoDialogComponent, VideoDialogData>(VideoDialogComponent, {
      width: '65rem',
      maxWidth: '100%',
      panelClass: 'video-dialog',
      data: { video: trailer },
    });
  }

  private reportNotFoundShows(responses: (AddToListResponse | RemoveFromListResponse)[]): void {
    responses.forEach((res) => {
      if (res.not_found.shows.length > 0)
        return onError(res, this.snackBar, undefined, 'Show(s) not found');
    });
  }
}
