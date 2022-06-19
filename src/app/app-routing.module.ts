import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './components/pages/home/home.component';
import { ErrorComponent } from './components/pages/error/error.component';
import { RedirectComponent } from './components/pages/redirect/redirect.component';
import { ShowComponent } from './components/pages/show/show/show.component';
import { SeasonComponent } from './components/pages/season/season/season.component';
import { EpisodeComponent } from './components/pages/episode/episode/episode.component';

const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'redirect', component: RedirectComponent },
  { path: 'series/:slug', component: ShowComponent },
  { path: 'series/:slug/season/:season', component: SeasonComponent },
  { path: 'series/:slug/season/:season/episode/:episode', component: EpisodeComponent },
  { path: '**', component: ErrorComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
