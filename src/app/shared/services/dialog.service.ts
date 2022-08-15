import { Injectable } from '@angular/core';
import { combineLatest, forkJoin, Observable, of, switchMap, take, zip } from 'rxjs';
import { ListDialogComponent } from '../components/list-dialog/list-dialog.component';
import {
  ConfirmDialogData,
  ListItemsDialogData,
  ListsDialogData,
} from '../../../types/interfaces/Dialog';
import { AddToListResponse, RemoveFromListResponse } from '../../../types/interfaces/TraktResponse';
import { List } from '../../../types/interfaces/TraktList';
import { ListItemsDialogComponent } from '../../lists/components/list-items-dialog/list-items-dialog.component';
import { AddListDialogComponent } from '../components/add-list-dialog/add-list-dialog.component';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { ShowService } from './trakt/show.service';
import { ListService } from './trakt/list.service';
import { SyncService } from './sync.service';
import { onError } from '../helper/error';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ConfirmDialogComponent } from '../components/confirm-dialog/confirm-dialog.component';
import { Season, TraktShow } from '../../../types/interfaces/Trakt';
import { SeasonService } from './trakt/season.service';

@Injectable({
  providedIn: 'root',
})
export class DialogService {
  constructor(
    private router: Router,
    private dialog: MatDialog,
    private showService: ShowService,
    private listService: ListService,
    private syncService: SyncService,
    private snackBar: MatSnackBar,
    private seasonService: SeasonService
  ) {}

  manageListsViaDialog(showId: number): void {
    this.listService.lists$
      .pipe(
        switchMap((lists) =>
          zip([
            of(lists),
            forkJoin(
              lists.map((list) => this.listService.getListItems$(list.ids.slug).pipe(take(1)))
            ),
          ])
        ),
        take(1)
      )
      .subscribe(([lists, listsListItems]) => {
        const isListContainingShow = listsListItems.map(
          (list) => !!list?.find((listItem) => listItem.show.ids.trakt === showId)
        );
        const listIds = lists
          .map((list, i) => isListContainingShow[i] && list.ids.trakt)
          .filter(Boolean) as number[];

        const dialogRef = this.dialog.open<ListDialogComponent, ListsDialogData>(
          ListDialogComponent,
          {
            width: '250px',
            data: { showId, lists, listIds },
          }
        );

        dialogRef.afterClosed().subscribe((result) => {
          if (!result) return;

          const observables: Observable<AddToListResponse | RemoveFromListResponse>[] = [];

          if (result.added.length > 0) {
            observables.push(
              ...result.added.map((add: number) => this.listService.addShowsToList(add, [showId]))
            );
          }

          if (result.removed.length > 0) {
            observables.push(
              ...result.removed.map((remove: number) =>
                this.listService.removeShowsFromList(remove, [showId])
              )
            );
          }

          forkJoin(observables).subscribe((responses) => {
            responses.forEach((res) => {
              if (res.not_found.shows.length > 0)
                return onError(res, this.snackBar, undefined, 'Show(s) not found');
            });
          });
        });
      });
  }

  manageListItemsViaDialog(list?: List): void {
    if (!list) return;
    combineLatest([this.listService.getListItems$(list.ids.slug), this.showService.getShows$()])
      .pipe(take(1))
      .subscribe(([listItems, shows]) => {
        shows.sort((a, b) => {
          return a.title > b.title ? 1 : -1;
        });
        const dialogRef = this.dialog.open<ListItemsDialogComponent, ListItemsDialogData>(
          ListItemsDialogComponent,
          {
            width: '500px',
            data: { list, listItems, shows },
          }
        );

        dialogRef.afterClosed().subscribe((result?: { added: number[]; removed: number[] }) => {
          if (!result) return;

          const observables: Observable<AddToListResponse | RemoveFromListResponse>[] = [];

          if (result.added.length > 0) {
            observables.push(this.listService.addShowsToList(list.ids.trakt, result.added));
          }

          if (result.removed.length > 0) {
            observables.push(this.listService.removeShowsFromList(list.ids.trakt, result.removed));
          }

          forkJoin(observables).subscribe(async (responses) => {
            responses.forEach((res) => {
              if (res.not_found.shows.length > 0)
                return onError(res, this.snackBar, undefined, 'Show(s) not found');
            });
            await this.syncService.syncNew();
          });
        });
      });
  }

  addListViaDialog(): void {
    const dialogRef = this.dialog.open<AddListDialogComponent>(AddListDialogComponent);

    dialogRef.afterClosed().subscribe((result: Partial<List>) => {
      if (!result) return;

      this.listService.addList(result).subscribe(async (response) => {
        await this.syncService.syncNew();
        await this.router.navigateByUrl(`/lists?slug=${response.ids.slug}`);
      });
    });
  }

  removeList(listSlug?: string): void {
    if (!listSlug) return onError(undefined, this.snackBar, undefined, 'List is missing');

    this.confirm({
      title: 'Remove list?',
      message: 'Do you want to remove the active list?',
      confirmButton: 'Remove',
    }).subscribe((result) => {
      if (!result) return;

      this.listService.removeList({ ids: { slug: listSlug } } as List).subscribe({
        next: async () => {
          this.listService
            .syncLists({
              force: true,
              publishSingle: true,
            })
            .subscribe();
        },
        error: (error) => onError(error, this.snackBar),
      });
    });
  }

  confirm(confirmData: ConfirmDialogData): Observable<boolean> {
    const dialogRef = this.dialog.open<ConfirmDialogComponent>(ConfirmDialogComponent, {
      data: confirmData,
    });

    return dialogRef.afterClosed();
  }

  syncAddShow(show?: TraktShow): void {
    if (!show) return onError(undefined, this.snackBar, undefined, 'Show is missing');

    this.confirm({
      title: 'Mark as seen?',
      message: 'Do you want to mark the show as seen?',
      confirmButton: 'Mark as seen',
    }).subscribe((result) => {
      if (!result) return;

      this.showService.addShow(show).subscribe({
        next: async (res) => {
          if (res.not_found.shows.length > 0)
            return onError(res, this.snackBar, undefined, 'Show(s) not found');

          forkJoin([
            this.showService.syncShowProgress(show.ids.trakt, {
              force: true,
              publishSingle: true,
            }),
            this.showService.syncShowsWatched({ force: true, publishSingle: true }),
          ]).subscribe();
        },
        error: (error) => onError(error, this.snackBar),
      });
    });
  }

  syncRemoveShow(show?: TraktShow): void {
    if (!show) return onError(undefined, this.snackBar, undefined, 'Show is missing');

    this.confirm({
      title: 'Remove show?',
      message: 'Do you want to remove the show?',
      confirmButton: 'Remove',
    }).subscribe((result) => {
      if (!result) return;

      this.showService.removeShow(show).subscribe({
        next: async (res) => {
          if (res.not_found.shows.length > 0)
            return onError(res, this.snackBar, undefined, 'Show(s) not found');

          forkJoin([
            this.showService.syncShowProgress(show.ids.trakt, {
              force: true,
              publishSingle: true,
            }),
            this.showService.syncShowsWatched({ force: true, publishSingle: true }),
          ]).subscribe();

          this.showService.removeFavorite(show);
        },
        error: (error) => onError(error, this.snackBar),
      });
    });
  }

  syncAddSeason(season?: Season, show?: TraktShow): void {
    if (!season || !show)
      return onError(undefined, this.snackBar, undefined, 'Season or show is missing');

    this.confirm({
      title: 'Mark as seen?',
      message: 'Do you want to mark the season as seen?',
      confirmButton: 'Mark as seen',
    }).subscribe((result) => {
      if (!result) return;

      this.seasonService.addSeason(season).subscribe({
        next: async (res) => {
          if (res.not_found.shows.length > 0)
            return onError(res, this.snackBar, undefined, 'Show(s) not found');

          forkJoin([
            this.showService.syncShowProgress(show.ids.trakt, {
              force: true,
              publishSingle: true,
            }),
            this.showService.syncShowsWatched({ force: true, publishSingle: true }),
          ]).subscribe();
        },
        error: (error) => onError(error, this.snackBar),
      });
    });
  }

  syncRemoveSeason(season?: Season, show?: TraktShow): void {
    if (!season || !show)
      return onError(undefined, this.snackBar, undefined, 'Season or show is missing');

    this.confirm({
      title: 'Mark as unseen?',
      message: 'Do you want to mark the season as not seen?',
      confirmButton: 'Mark as unseen',
    }).subscribe((result) => {
      if (!result) return;

      this.seasonService.removeSeason(season).subscribe({
        next: async (res) => {
          if (res.not_found.shows.length > 0)
            return onError(res, this.snackBar, undefined, 'Show(s) not found');

          forkJoin([
            this.showService.syncShowProgress(show.ids.trakt, {
              force: true,
              publishSingle: true,
            }),
            this.showService.syncShowsWatched({ force: true, publishSingle: true }),
          ]).subscribe();
        },
        error: (error) => onError(error, this.snackBar),
      });
    });
  }
}
