import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatCheckboxChange } from '@angular/material/checkbox';

import type { ListsDialogData } from '@type/interfaces/Dialog';
import type { List } from '@type/interfaces/TraktList';

@Component({
  selector: 't-list-dialog',
  templateUrl: './list-dialog.component.html',
  styleUrls: ['./list-dialog.component.scss'],
})
export class ListDialogComponent {
  added: string[] = [];
  removed: string[] = [];

  constructor(
    public dialogRef: MatDialogRef<ListDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ListsDialogData
  ) {}

  onChange(event: MatCheckboxChange, list: List): void {
    const isInList = this.data.listSlugs.includes(list.ids.slug);
    if (event.checked) {
      if (!isInList && !this.added.includes(list.ids.slug)) {
        this.added.push(list.ids.slug);
      }
    } else {
      if (isInList && !this.removed.includes(list.ids.slug)) {
        this.removed.push(list.ids.slug);
      }
    }
  }

  apply(): void {
    this.dialogRef.close({ added: this.added, removed: this.removed });
  }
}
