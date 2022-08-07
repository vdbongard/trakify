import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ErrorComponent } from './components/error/error.component';
import { RedirectComponent } from './components/redirect/redirect.component';
import { ShowComponent } from './logged-in/components/show-pages/show/show/show.component';
import { SeasonComponent } from './logged-in/components/show-pages/season/season/season.component';
import { EpisodeComponent } from './logged-in/components/show-pages/episode/episode/episode.component';
import { CanActivateLoggedIn } from './auth-guard';
import { ShowsComponent } from './logged-in/components/show-pages/other/shows/shows/shows.component';
import { LoginComponent } from './components/login/login.component';
import { AddShowComponent } from './logged-in/components/show-pages/other/add-show/add-show.component';
import { SearchComponent } from './logged-in/components/show-pages/other/search/search.component';
import { UpcomingComponent } from './logged-in/components/show-pages/other/upcoming/upcoming.component';
import { WatchlistComponent } from './logged-in/components/list-pages/watchlist/watchlist.component';
import { ListsComponent } from './logged-in/components/list-pages/lists/lists.component';
import { StatisticsComponent } from './logged-in/components/statistics/statistics.component';

const routes: Routes = [
  { path: '', redirectTo: 'series', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'redirect', component: RedirectComponent },
  { path: 'series', component: ShowsComponent, canActivate: [CanActivateLoggedIn] },
  {
    path: 'series/add-series',
    component: AddShowComponent,
    canActivate: [CanActivateLoggedIn],
  },
  {
    path: 'series/search',
    component: SearchComponent,
    canActivate: [CanActivateLoggedIn],
  },
  {
    path: 'series/upcoming',
    component: UpcomingComponent,
    canActivate: [CanActivateLoggedIn],
  },
  {
    path: 'series/watchlist',
    component: WatchlistComponent,
    canActivate: [CanActivateLoggedIn],
  },
  { path: 'series/s/:slug', component: ShowComponent, canActivate: [CanActivateLoggedIn] },
  {
    path: 'series/s/:slug/season/:season',
    component: SeasonComponent,
    canActivate: [CanActivateLoggedIn],
  },
  {
    path: 'series/s/:slug/season/:season/episode/:episode',
    component: EpisodeComponent,
    canActivate: [CanActivateLoggedIn],
  },
  {
    path: 'lists',
    component: ListsComponent,
    canActivate: [CanActivateLoggedIn],
  },
  { path: 'statistics', component: StatisticsComponent, canActivate: [CanActivateLoggedIn] },
  { path: '**', component: ErrorComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { scrollPositionRestoration: 'enabled' })],
  exports: [RouterModule],
  providers: [CanActivateLoggedIn],
})
export class AppRoutingModule {}
