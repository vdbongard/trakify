import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatCheckboxChange } from '@angular/material/checkbox';

import { IsInListPipe } from '../../pipes/is-in-list.pipe';

import type { ListItemsDialogData } from '@type/interfaces/Dialog';

@Component({
  selector: 't-list-items-dialog',
  templateUrl: './list-items-dialog.component.html',
  styleUrls: ['./list-items-dialog.component.scss'],
})
export class ListItemsDialogComponent {
  added: string[] = [];
  removed: string[] = [];
  isInList = new IsInListPipe();

  constructor(
    public dialogRef: MatDialogRef<ListItemsDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ListItemsDialogData
  ) {}

  onChange(event: MatCheckboxChange, showSlug: string): void {
    const isInList = this.isInList.transform(showSlug, this.data.listItems);
    if (event.checked) {
      if (!isInList && !this.added.includes(showSlug)) {
        this.added.push(showSlug);
      }
    } else {
      if (isInList && !this.removed.includes(showSlug)) {
        this.removed.push(showSlug);
      }
    }
  }

  apply(): void {
    this.dialogRef.close({ added: this.added, removed: this.removed });
  }
}
