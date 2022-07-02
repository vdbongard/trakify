import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatCheckboxChange } from '@angular/material/checkbox';
import { List } from '../../../../types/interfaces/Trakt';
import { ListsDialogData } from '../../../../types/interfaces/Dialog';

@Component({
  selector: 'app-list-dialog',
  templateUrl: './list-dialog.component.html',
  styleUrls: ['./list-dialog.component.scss'],
})
export class ListDialogComponent {
  added: number[] = [];
  removed: number[] = [];

  constructor(
    public dialogRef: MatDialogRef<ListDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ListsDialogData
  ) {}

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
