import { Component, inject } from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ImageDialogData } from '@type/Dialog';

@Component({
  selector: 't-image-dialog',
  standalone: true,
  imports: [CommonModule, NgOptimizedImage],
  templateUrl: './image-dialog.component.html',
  styleUrls: ['./image-dialog.component.scss'],
})
export class ImageDialogComponent {
  dialogRef = inject(MatDialogRef<ImageDialogComponent>);
  data: ImageDialogData = inject(MAT_DIALOG_DATA);
}
