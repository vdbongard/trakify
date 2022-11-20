import { ChangeDetectionStrategy, Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatCheckboxChange, MatCheckboxModule } from '@angular/material/checkbox';

import type { ListsDialogData } from '@type/interfaces/Dialog';
import type { List } from '@type/interfaces/TraktList';
import { IncludesPipe } from '../../pipes/includes.pipe';
import { NgForOf } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 't-list-dialog',
  templateUrl: './list-dialog.component.html',
  styleUrls: ['./list-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [MatDialogModule, MatCheckboxModule, IncludesPipe, NgForOf, MatButtonModule],
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
