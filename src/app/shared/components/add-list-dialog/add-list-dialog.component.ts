import { ChangeDetectionStrategy, Component } from '@angular/core';
import {
  MatLegacyDialogModule as MatDialogModule,
  MatLegacyDialogRef as MatDialogRef,
} from '@angular/material/legacy-dialog';
import { FormsModule } from '@angular/forms';
import { MatLegacyInputModule as MatInputModule } from '@angular/material/legacy-input';
import { MatLegacyButtonModule as MatButtonModule } from '@angular/material/legacy-button';

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
