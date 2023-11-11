import { Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';

import type { ConfirmDialogData } from '@type/Dialog';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 't-confirm-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule],
  templateUrl: './confirm-dialog.component.html',
  styleUrl: './confirm-dialog.component.scss',
})
export class ConfirmDialogComponent {
  data = inject(MAT_DIALOG_DATA) as ConfirmDialogData;
}
