import { Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatCheckboxChange, MatCheckboxModule } from '@angular/material/checkbox';

import type { ListsDialogData } from '@type/Dialog';
import type { List } from '@type/TraktList';
import { NgForOf } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { NgGenericPipeModule } from 'ng-generic-pipe';

@Component({
  selector: 't-list-dialog',
  templateUrl: './list-dialog.component.html',
  styleUrls: ['./list-dialog.component.scss'],
  standalone: true,
  imports: [MatDialogModule, MatCheckboxModule, NgForOf, MatButtonModule, NgGenericPipeModule],
})
export class ListDialogComponent {
  dialogRef = inject(MatDialogRef<ListDialogComponent>);
  data = inject(MAT_DIALOG_DATA) as ListsDialogData;

  added: number[] = [];
  removed: number[] = [];

  onChange(event: MatCheckboxChange, list: List): void {
    const isInList = this.data.listIds.includes(list.ids.trakt);
    if (event.checked) {
      if (!isInList && !this.added.includes(list.ids.trakt)) {
        this.added.push(list.ids.trakt);
      }
    } else {
      if (isInList && !this.removed.includes(list.ids.trakt)) {
        this.removed.push(list.ids.trakt);
      }
    }
  }

  apply(): void {
    this.dialogRef.close({ added: this.added, removed: this.removed });
  }

  isInList(listId: number): boolean {
    return this.data.listIds.includes(listId);
  }
}
