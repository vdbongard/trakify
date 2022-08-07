import { RouterModule, Routes } from '@angular/router';
import { ShowsComponent } from './components/show/other/shows/shows/shows.component';
import { CanActivateLoggedIn } from '../auth-guard';
import { AddShowComponent } from './components/show/other/add-show/add-show.component';
import { SearchComponent } from './components/show/other/search/search.component';
import { UpcomingComponent } from './components/show/other/upcoming/upcoming.component';
import { WatchlistComponent } from './components/lists/watchlist/watchlist.component';
import { ShowComponent } from './components/show/show/show/show.component';
import { SeasonComponent } from './components/show/season/season/season.component';
import { EpisodeComponent } from './components/show/episode/episode/episode.component';
import { ListsComponent } from './components/lists/lists/lists.component';
import { StatisticsComponent } from './components/statistics/statistics.component';
import { ErrorComponent } from '../components/error/error.component';
import { NgModule } from '@angular/core';

const routes: Routes = [
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
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
  providers: [CanActivateLoggedIn],
})
export class LoggedInRoutingModule {}
