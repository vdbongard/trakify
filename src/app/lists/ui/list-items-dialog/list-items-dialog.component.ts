import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatCheckboxChange, MatCheckboxModule } from '@angular/material/checkbox';

import { IsInListPipe } from '../../utils/pipes/is-in-list.pipe';

import type { ListItemsDialogData } from '@type/Dialog';
import { MatButtonModule } from '@angular/material/button';
import { NgForOf } from '@angular/common';

@Component({
  selector: 't-list-items-dialog',
  templateUrl: './list-items-dialog.component.html',
  styleUrls: ['./list-items-dialog.component.scss'],
  standalone: true,
  imports: [NgForOf, MatDialogModule, MatCheckboxModule, IsInListPipe, MatButtonModule],
})
export class ListItemsDialogComponent {
  added: number[] = [];
  removed: number[] = [];
  isInList = new IsInListPipe();

  constructor(
    public dialogRef: MatDialogRef<ListItemsDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ListItemsDialogData
  ) {}

  onChange(event: MatCheckboxChange, showId: number): void {
    const isInList = this.isInList.transform(showId, this.data.listItems);
    if (event.checked) {
      if (!isInList && !this.added.includes(showId)) {
        this.added.push(showId);
      }
    } else {
      if (isInList && !this.removed.includes(showId)) {
        this.removed.push(showId);
      }
    }
  }

  apply(): void {
    this.dialogRef.close({ added: this.added, removed: this.removed });
  }
}
