import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ErrorComponent } from './components/pages/error/error.component';
import { RedirectComponent } from './components/pages/redirect/redirect.component';
import { ShowComponent } from './components/pages/show/show/show.component';
import { SeasonComponent } from './components/pages/season/season/season.component';
import { EpisodeComponent } from './components/pages/episode/episode/episode.component';
import { CanActivateLoggedIn } from './auth-guard';
import { ShowsComponent } from './components/pages/shows/shows/shows.component';
import { LoginComponent } from './components/pages/login/login.component';

const routes: Routes = [
  { path: '', component: ShowsComponent, canActivate: [CanActivateLoggedIn] },
  { path: 'login', component: LoginComponent },
  { path: 'redirect', component: RedirectComponent },
  { path: 'series/:slug', component: ShowComponent, canActivate: [CanActivateLoggedIn] },
  {
    path: 'series/:slug/season/:season',
    component: SeasonComponent,
    canActivate: [CanActivateLoggedIn],
  },
  {
    path: 'series/:slug/season/:season/episode/:episode',
    component: EpisodeComponent,
    canActivate: [CanActivateLoggedIn],
  },
  { path: '**', component: ErrorComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
  providers: [CanActivateLoggedIn],
})
export class AppRoutingModule {}
