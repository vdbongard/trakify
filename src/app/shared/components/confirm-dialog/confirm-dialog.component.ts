import { Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';

import type { ConfirmDialogData } from '@type/Dialog';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 't-confirm-dialog',
  templateUrl: './confirm-dialog.component.html',
  styleUrls: ['./confirm-dialog.component.scss'],
  standalone: true,
  imports: [MatDialogModule, MatButtonModule],
})
export class ConfirmDialogComponent {
  data: ConfirmDialogData = inject(MAT_DIALOG_DATA);
}
