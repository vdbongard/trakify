import { Injectable } from '@angular/core';
import { BehaviorSubject, combineLatest, forkJoin, Observable, of, switchMap, zip } from 'rxjs';
import { ListDialogComponent } from '../shared/components/list-dialog/list-dialog.component';
import { ListItemsDialogData, ListsDialogData } from '../../types/interfaces/Dialog';
import { AddToListResponse, RemoveFromListResponse } from '../../types/interfaces/TraktResponse';
import { List } from '../../types/interfaces/TraktList';
import { ListItemsDialogComponent } from '../shared/components/list-items-dialog/list-items-dialog.component';
import { AddListDialogComponent } from '../shared/components/add-list-dialog/add-list-dialog.component';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { ShowService } from './show.service';
import { ListService } from './list.service';

@Injectable({
  providedIn: 'root',
})
export class DialogService {
  updated = new BehaviorSubject(undefined);

  constructor(
    private router: Router,
    private dialog: MatDialog,
    private showService: ShowService,
    private listService: ListService
  ) {}

  manageListsViaDialog(showId: number): void {
    this.listService
      .fetchLists()
      .pipe(
        switchMap((lists) =>
          zip([
            of(lists),
            forkJoin(lists.map((list) => this.listService.fetchListItems(list.ids.trakt))),
          ])
        )
      )
      .subscribe(([lists, listsListItems]) => {
        const isListContainingShow = listsListItems.map(
          (list) => !!list.find((listItem) => listItem.show.ids.trakt === showId)
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
              if (res.not_found.shows.length > 0) {
                console.error('res', res);
              }
            });
          });
        });
      });
  }

  manageListItemsViaDialog(list: List): void {
    combineLatest([
      this.listService.fetchListItems(list.ids.trakt),
      this.showService.getShowsWatchedWatchlistedAndAdded$(),
    ]).subscribe(([listItems, shows]) => {
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

        forkJoin(observables).subscribe((responses) => {
          responses.forEach((res) => {
            if (res.not_found.shows.length > 0) {
              console.error('res', res);
            }
          });
          this.updated.next(undefined);
        });
      });
    });
  }

  addListViaDialog(): void {
    const dialogRef = this.dialog.open<AddListDialogComponent>(AddListDialogComponent);

    dialogRef.afterClosed().subscribe((result: Partial<List>) => {
      if (!result) return;

      this.listService.addList(result).subscribe(async (response) => {
        await this.router.navigateByUrl(`/lists?slug=${response.ids.slug}`);
        this.updated.next(undefined);
      });
    });
  }
}
