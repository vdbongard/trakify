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
import { AddShowComponent } from './components/pages/add-show/add-show.component';
import { SearchComponent } from './components/pages/search/search.component';
import { UpcomingComponent } from './components/pages/upcoming/upcoming.component';
import { WatchlistComponent } from './components/pages/watchlist/watchlist.component';
import { ListsComponent } from './components/pages/lists/lists.component';

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
  {
    path: 'add-series',
    component: AddShowComponent,
    canActivate: [CanActivateLoggedIn],
  },
  {
    path: 'search',
    component: SearchComponent,
    canActivate: [CanActivateLoggedIn],
  },
  {
    path: 'upcoming',
    component: UpcomingComponent,
    canActivate: [CanActivateLoggedIn],
  },
  {
    path: 'watchlist',
    component: WatchlistComponent,
    canActivate: [CanActivateLoggedIn],
  },
  {
    path: 'lists',
    component: ListsComponent,
    canActivate: [CanActivateLoggedIn],
  },
  {
    path: 'lists/:slug',
    component: ListsComponent,
    canActivate: [CanActivateLoggedIn],
  },
  { path: '**', component: ErrorComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { scrollPositionRestoration: 'enabled' })],
  exports: [RouterModule],
  providers: [CanActivateLoggedIn],
})
export class AppRoutingModule {}
