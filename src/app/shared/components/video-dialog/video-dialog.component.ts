import { Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { DomSanitizer } from '@angular/platform-browser';
import type { VideoDialogData } from '@type/Dialog';

@Component({
  selector: 't-video-dialog',
  standalone: true,
  templateUrl: './video-dialog.component.html',
  styleUrl: './video-dialog.component.scss',
})
export class VideoDialogComponent {
  data = inject(MAT_DIALOG_DATA) as VideoDialogData;
  sanitizer = inject(DomSanitizer);

  protected readonly SafeURL = this.sanitizer.bypassSecurityTrustResourceUrl(
    `https://www.youtube.com/embed/${this.data.video.key}?autoplay=1`,
  );
}
