import { ChangeDetectionStrategy, Component } from '@angular/core';
import {
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { FormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 't-list-dialog',
  templateUrl: './add-list-dialog.component.html',
  styleUrls: ['./add-list-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [FormsModule, MatDialogModule, MatInputModule, MatButtonModule],
})
export class AddListDialogComponent {
  name?: string;

  constructor(public dialogRef: MatDialogRef<AddListDialogComponent>) {}

  createList(): void {
    if (!this.name) return;
    this.dialogRef.close({ name: this.name });
  }
}
