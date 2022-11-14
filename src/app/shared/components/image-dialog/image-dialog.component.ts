import { ChangeDetectionStrategy, Component, Inject } from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ImageDialogData } from '@type/interfaces/Dialog';

@Component({
  selector: 't-image-dialog',
  standalone: true,
  imports: [CommonModule, NgOptimizedImage],
  template: `
    <img
      [src]="data.imageUrl"
      [alt]="data.name"
      class="image"
      fetchpriority="high"
      (click)="dialogRef.close()"
      (keyup)="dialogRef.close()"
    />
  `,
  styles: [
    `
      .image {
        max-width: 100vw;
        max-height: 100vh;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ImageDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<ImageDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ImageDialogData
  ) {}
}
