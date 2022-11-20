import { ChangeDetectionStrategy, Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { VideoDialogData } from '@type/interfaces/Dialog';
import { DomSanitizer } from '@angular/platform-browser';

@Component({
  selector: 't-video-dialog',
  template: `<iframe
    width="1040"
    height="585"
    title="Trailer"
    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
    allowfullscreen
    [src]="safeURL"
  ></iframe>`,
  styles: [
    `
              iframe {
                height: auto;
                border: 0;
                aspect-ratio: 16/9;
              }
            `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
})
export class VideoDialogComponent {
  safeURL = this.sanitizer.bypassSecurityTrustResourceUrl(
    `https://www.youtube.com/embed/${this.data.video.key}?autoplay=1`
  );

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: VideoDialogData,
    private sanitizer: DomSanitizer
  ) {}
}
