import { Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { VideoDialogData } from '@type/Dialog';
import { DomSanitizer } from '@angular/platform-browser';

@Component({
  selector: 't-video-dialog',
  templateUrl: './video-dialog.component.html',
  styleUrls: ['./video-dialog.component.scss'],
  standalone: true,
})
export class VideoDialogComponent {
  data: VideoDialogData = inject(MAT_DIALOG_DATA);
  sanitizer = inject(DomSanitizer);

  safeURL = this.sanitizer.bypassSecurityTrustResourceUrl(
    `https://www.youtube.com/embed/${this.data.video.key}?autoplay=1`
  );
}
