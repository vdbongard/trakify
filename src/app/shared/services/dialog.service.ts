import { inject, Injectable, Injector } from '@angular/core';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import {
  combineLatest,
  defaultIfEmpty,
  firstValueFrom,
  forkJoin,
  type Observable,
  of,
  retry,
  switchMap,
  take,
  zip,
} from 'rxjs';
import { AddListDialogComponent } from '../components/add-list-dialog/add-list-dialog.component';
import { ListDialogComponent } from '../components/list-dialog/list-dialog.component';
import { ListItemsDialogComponent } from '../../pages/lists/ui/list-items-dialog/list-items-dialog.component';
import { ShowService } from '../../pages/shows/data/show.service';
import { ListService } from '../../pages/lists/data/list.service';
import { SyncService } from './sync.service';
import { onError } from '@helper/error';
import { ConfirmDialogComponent } from '../components/confirm-dialog/confirm-dialog.component';
import type { ConfirmDialogData, ListItemsDialogData, ListsDialogData } from '@type/Dialog';
import type { VideoDialogData } from '@type/Dialog';
import type { AddToListResponse, RemoveFromListResponse } from '@type/TraktResponse';
import type { List } from '@type/TraktList';
import * as Paths from '@shared/paths';
import { VideoDialogComponent } from '../components/video-dialog/video-dialog.component';
import type { Video } from '@type/Tmdb';
import { errorDelay } from '@helper/errorDelay';
import { toObservable } from '@angular/core/rxjs-interop';

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
  injector = inject(Injector);

  manageLists(showId: number): void {
    toObservable(this.listService.lists.s, { injector: this.injector })
      .pipe(
        switchMap((lists) =>
          zip([
            of(lists),
            forkJoin(
              lists?.map((list) => this.listService.getListItems$(list.ids.slug).pipe(take(1))) ??
                [],
            ).pipe(defaultIfEmpty([])),
          ]),
        ),
        take(1),
      )
      .subscribe({
        next: ([lists, listsListItems]) => {
          const isListContainingShow = listsListItems.map(
            (list) => !!list?.find((listItem) => listItem.show.ids.trakt === showId),
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

          dialogRef.afterClosed().subscribe((result) => {
            if (!result) return;

            const observables: Observable<AddToListResponse | RemoveFromListResponse>[] = [];

            if (result.added.length > 0) {
              observables.push(
                ...result.added.map((add: number) =>
                  this.listService.addShowsToList(add, [showId]),
                ),
              );
            }

            if (result.removed.length > 0) {
              observables.push(
                ...result.removed.map((remove: number) =>
                  this.listService.removeShowsFromList(remove, [showId]),
                ),
              );
            }

            forkJoin(observables).subscribe(async (responses) => {
              responses.forEach((res) => {
                if (res.not_found.shows.length > 0)
                  return onError(res, this.snackBar, undefined, 'Show(s) not found');
              });

              await this.syncService.syncNew();
            });
          });
        },
        error: (error) => onError(error, this.snackBar),
      });
  }

  manageListItems(list?: List): void {
    if (!list) return;
    combineLatest([this.listService.getListItems$(list.ids.slug), this.showService.getShows$(true)])
      .pipe(take(1))
      .subscribe({
        next: ([listItems, shows]) => {
          shows.sort((a, b) => {
            return a.title > b.title ? 1 : -1;
          });
          const dialogRef = this.dialog.open<ListItemsDialogComponent, ListItemsDialogData>(
            ListItemsDialogComponent,
            {
              width: '500px',
              data: { list, listItems, shows },
            },
          );

          dialogRef.afterClosed().subscribe((result?: { added: number[]; removed: number[] }) => {
            if (!result) return;

            const observables: Observable<AddToListResponse | RemoveFromListResponse>[] = [];

            if (result.added.length > 0) {
              observables.push(this.listService.addShowsToList(list.ids.trakt, result.added));
            }

            if (result.removed.length > 0) {
              observables.push(
                this.listService.removeShowsFromList(list.ids.trakt, result.removed),
              );
            }

            forkJoin(observables)
              .pipe(
                retry({
                  count: 1,
                  delay: errorDelay,
                }),
              )
              .subscribe((responses) => {
                responses.forEach((res) => {
                  if (res.not_found.shows.length > 0)
                    return onError(res, this.snackBar, undefined, 'Show(s) not found');
                });
                void this.syncService.syncNew();
              });
          });
        },
        error: (error) => onError(error, this.snackBar),
      });
  }

  addList(): void {
    const dialogRef = this.dialog.open<AddListDialogComponent>(AddListDialogComponent);

    dialogRef.afterClosed().subscribe((result: Partial<List>) => {
      if (!result) return;

      this.listService.addList(result).subscribe((response) => {
        void this.syncService.syncNew();
        void this.router.navigateByUrl(`${Paths.lists({})}?slug=${response.ids.slug}`);
      });
    });
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
}
