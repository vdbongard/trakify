import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Show } from '@type/interfaces/Trakt';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 't-show-links',
  standalone: true,
  imports: [CommonModule, MatButtonModule],
  template: `
    <h2 class="mat-subheading-2">Links</h2>
    <div class="links">
      <a
        *ngIf="show?.ids?.slug"
        mat-stroked-button
        [href]="'https://trakt.tv/shows/' + show?.ids?.slug"
        target="_blank"
        rel="noopener norefferer"
        >Trakt</a
      >
      <a
        *ngIf="show?.ids?.tmdb"
        mat-stroked-button
        [href]="'https://www.themoviedb.org/tv/' + show?.ids?.tmdb"
        target="_blank"
        rel="noopener norefferer"
        >TMDB</a
      >
      <a
        *ngIf="show?.ids?.imdb"
        mat-stroked-button
        [href]="'https://imdb.com/title/' + show?.ids?.imdb"
        target="_blank"
        rel="noopener norefferer"
        >IMDB</a
      >
      <a
        *ngIf="show?.ids?.tvdb"
        mat-stroked-button
        [href]="'https://www.thetvdb.com/dereferrer/series/' + show?.ids?.tvdb"
        target="_blank"
        rel="noopener norefferer"
        >TVDB</a
      >
    </div>
  `,
  styles: [
    `
      .links {
        display: flex;
        flex-wrap: wrap;
        gap: 1rem;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShowLinksComponent {
  @Input() show?: Show | null;
}
