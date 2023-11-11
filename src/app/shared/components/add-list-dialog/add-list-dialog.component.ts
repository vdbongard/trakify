import { Component, inject } from '@angular/core';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { FormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 't-list-dialog',
  templateUrl: './add-list-dialog.component.html',
  styleUrl: './add-list-dialog.component.scss',
  standalone: true,
  imports: [FormsModule, MatDialogModule, MatInputModule, MatButtonModule],
})
export class AddListDialogComponent {
  dialogRef = inject(MatDialogRef<AddListDialogComponent>);

  name?: string;

  createList(): void {
    if (!this.name) return;
    this.dialogRef.close({ name: this.name });
  }
}
