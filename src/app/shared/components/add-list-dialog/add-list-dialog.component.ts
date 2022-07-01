import { Component } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-list-dialog',
  templateUrl: './add-list-dialog.component.html',
  styleUrls: ['./add-list-dialog.component.scss'],
})
export class AddListDialogComponent {
  name?: string;

  constructor(public dialogRef: MatDialogRef<AddListDialogComponent>) {}

  createList(): void {
    if (!this.name) return;
    this.dialogRef.close({ name: this.name });
  }
}
