import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Show } from '@type/interfaces/Trakt';
import { MatButtonModule } from '@angular/material/button';
import { TmdbShow } from '@type/interfaces/Tmdb';

@Component({
  selector: 't-show-links',
  standalone: true,
  imports: [CommonModule, MatButtonModule],
  template: `
    <h2 class="mat-subtitle-1">Links</h2>
    <div class="links">
      <a
        *ngIf="tmdbShow?.homepage"
        mat-stroked-button
        [href]="tmdbShow?.homepage"
        target="_blank"
        rel="noopener norefferer"
        >Website</a
      >
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
      <a
        *ngIf="tmdbShow?.external_ids?.twitter_id"
        mat-stroked-button
        [href]="'https://www.twitter.com/' + tmdbShow?.external_ids?.twitter_id"
        target="_blank"
        rel="noopener norefferer"
        >Twitter</a
      >
      <a
        *ngIf="tmdbShow?.external_ids?.instagram_id"
        mat-stroked-button
        [href]="'https://www.instagram.com/' + tmdbShow?.external_ids?.instagram_id"
        target="_blank"
        rel="noopener norefferer"
        >Instagram</a
      >
      <a
        *ngIf="tmdbShow?.external_ids?.facebook_id"
        mat-stroked-button
        [href]="'https://www.facebook.com/' + tmdbShow?.external_ids?.facebook_id"
        target="_blank"
        rel="noopener norefferer"
        >Facebook</a
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
})
export class ShowLinksComponent {
  @Input() show?: Show | null;
  @Input() tmdbShow?: TmdbShow | null;
}