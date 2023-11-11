import { Component, inject } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ImageDialogData } from '@type/Dialog';

@Component({
  selector: 't-image-dialog',
  standalone: true,
  imports: [NgOptimizedImage],
  templateUrl: './image-dialog.component.html',
  styleUrls: ['./image-dialog.component.scss'],
})
export class ImageDialogComponent {
  dialogRef = inject(MatDialogRef<ImageDialogComponent>);
  data = inject(MAT_DIALOG_DATA) as ImageDialogData;
}
