import { Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatCheckboxChange, MatCheckboxModule } from '@angular/material/checkbox';

import type { ListsDialogData } from '@type/Dialog';
import type { List } from '@type/TraktList';
import { IncludesPipe } from '../../pipes/includes.pipe';
import { NgForOf } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 't-list-dialog',
  templateUrl: './list-dialog.component.html',
  styleUrls: ['./list-dialog.component.scss'],
  standalone: true,
  imports: [MatDialogModule, MatCheckboxModule, IncludesPipe, NgForOf, MatButtonModule],
})
export class ListDialogComponent {
  dialogRef = inject(MatDialogRef<ListDialogComponent>);
  data: ListsDialogData = inject(MAT_DIALOG_DATA);

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
}
