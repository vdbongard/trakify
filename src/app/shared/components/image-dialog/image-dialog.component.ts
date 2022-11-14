import { ChangeDetectionStrategy, Component, Inject } from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ImageDialogData } from '@type/interfaces/Dialog';

@Component({
  selector: 't-image-dialog',
  standalone: true,
  imports: [CommonModule, NgOptimizedImage],
  template: ` <img [src]="data.imageUrl" [alt]="data.name" class="image" fetchpriority="high" /> `,
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
  constructor(@Inject(MAT_DIALOG_DATA) public data: ImageDialogData) {}
}
