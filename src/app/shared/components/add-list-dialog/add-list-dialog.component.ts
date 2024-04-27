import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatInputModule } from '@angular/material/input';

@Component({
  selector: 't-list-dialog',
  standalone: true,
  imports: [FormsModule, MatDialogModule, MatInputModule, MatButtonModule],
  templateUrl: './add-list-dialog.component.html',
  styleUrl: './add-list-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddListDialogComponent {
  dialogRef = inject(MatDialogRef<AddListDialogComponent>);

  name = signal('');

  createList(): void {
    if (!this.name()) return;
    this.dialogRef.close({ name: this.name() });
  }
}
