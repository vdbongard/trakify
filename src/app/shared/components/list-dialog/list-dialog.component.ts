import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { type MatCheckboxChange, MatCheckboxModule } from '@angular/material/checkbox';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import type { ListsDialogData } from '@type/Dialog';
import type { List } from '@type/TraktList';

@Component({
  selector: 't-list-dialog',
  standalone: true,
  imports: [MatDialogModule, MatCheckboxModule, MatButtonModule],
  templateUrl: './list-dialog.component.html',
  styleUrl: './list-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ListDialogComponent {
  dialogRef = inject(MatDialogRef<ListDialogComponent>);
  data = inject(MAT_DIALOG_DATA) as ListsDialogData;

  added = signal<number[]>([]);
  removed = signal<number[]>([]);

  onChange(event: MatCheckboxChange, list: List): void {
    const isInList = this.data.listIds.includes(list.ids.trakt);
    if (event.checked) {
      if (!isInList && !this.added().includes(list.ids.trakt)) {
        this.added.update((v) => [...v, list.ids.trakt]);
      }
    } else {
      if (isInList && !this.removed().includes(list.ids.trakt)) {
        this.removed.update((v) => [...v, list.ids.trakt]);
      }
    }
  }

  apply(): void {
    this.dialogRef.close({ added: this.added(), removed: this.removed() });
  }

  isInList(listId: number): boolean {
    return this.data.listIds.includes(listId);
  }
}
