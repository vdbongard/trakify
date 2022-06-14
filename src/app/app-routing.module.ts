import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './components/home/home.component';
import { ErrorComponent } from './components/error/error.component';
import { RedirectComponent } from './components/redirect/redirect.component';
import { ShowComponent } from './components/show/show.component';
import { SeasonComponent } from './components/season/season.component';
import { EpisodeComponent } from './components/episode/episode.component';

const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'redirect', component: RedirectComponent },
  { path: 'series/:slug', component: ShowComponent },
  { path: 'series/:slug/season/:season-number', component: SeasonComponent },
  {
    path: 'series/:slug/season/:season-number/episode/:episode-number',
    component: EpisodeComponent,
  },
  { path: '**', component: ErrorComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
