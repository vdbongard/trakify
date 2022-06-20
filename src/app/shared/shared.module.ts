import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EpisodeComponent } from './components/episode/episode.component';
import { MatButtonModule } from '@angular/material/button';

@NgModule({
  declarations: [EpisodeComponent],
  imports: [CommonModule, MatButtonModule],
  exports: [EpisodeComponent],
})
export class SharedModule {}
