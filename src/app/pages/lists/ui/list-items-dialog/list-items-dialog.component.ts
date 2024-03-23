import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import type { ListItemsDialogData } from '@type/Dialog';
import { MatButtonModule } from '@angular/material/button';
import { ListItemComponent } from '../list-item/list-item.component';
import { MatCheckboxChange } from '@angular/material/checkbox';
import { ListItem } from '@type/TraktList';

@Component({
  selector: 't-list-items-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule, ListItemComponent],
  templateUrl: './list-items-dialog.component.html',
  styleUrl: './list-items-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ListItemsDialogComponent {
  dialogRef = inject(MatDialogRef<ListItemsDialogComponent>);
  data = inject(MAT_DIALOG_DATA) as ListItemsDialogData;

  added = signal<number[]>([]);
  removed = signal<number[]>([]);

  onChange(event: MatCheckboxChange, showId: number): void {
    const isShowInList = isInList(this.data.listItems ?? [], showId);
    if (event.checked) {
      if (!isShowInList && !this.added().includes(showId)) {
        this.added.update((v) => [...v, showId]);
      }
    } else {
      if (isShowInList && !this.removed().includes(showId)) {
        this.removed.update((v) => [...v, showId]);
      }
    }
  }

  apply(): void {
    this.dialogRef.close({ added: this.added(), removed: this.removed() });
  }
}

export function isInList(listItems: ListItem[], showId: number): boolean {
  return listItems.map((listItem) => listItem.show.ids.trakt).includes(showId);
}
