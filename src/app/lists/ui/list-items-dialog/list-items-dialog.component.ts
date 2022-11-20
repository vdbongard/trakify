import { ChangeDetectionStrategy, Component, Inject } from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatCheckboxChange } from '@angular/material/checkbox';

import { IsInListPipe } from '../../utils/pipes/is-in-list.pipe';

import type { ListItemsDialogData } from '@type/interfaces/Dialog';

@Component({
  selector: 't-list-items-dialog',
  templateUrl: './list-items-dialog.component.html',
  styleUrls: ['./list-items-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
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
