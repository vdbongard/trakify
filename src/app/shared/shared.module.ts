import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EpisodeComponent } from './components/episode/episode.component';
import { MatButtonModule } from '@angular/material/button';
import { ShowsComponent } from './components/shows/shows.component';
import { MatListModule } from '@angular/material/list';
import { ShowItemComponent } from './components/show-item/show-item.component';
import { RouterModule } from '@angular/router';
import { MatRippleModule } from '@angular/material/core';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatIconModule } from '@angular/material/icon';

@NgModule({
  declarations: [EpisodeComponent, ShowsComponent, ShowItemComponent],
  imports: [
    CommonModule,
    MatButtonModule,
    MatListModule,
    RouterModule,
    MatRippleModule,
    MatProgressBarModule,
    MatIconModule,
  ],
  exports: [EpisodeComponent, ShowsComponent],
})
export class SharedModule {}
