import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { ShowsComponent } from './components/shows/shows.component';
import { AddShowComponent } from './components/add-show/add-show.component';
import { SearchComponent } from './components/search/search.component';
import { UpcomingComponent } from './components/upcoming/upcoming.component';
import { WatchlistComponent } from './components/watchlist/watchlist.component';
import { ShowComponent } from './components/show/show/show.component';
import { SeasonComponent } from './components/season/season/season.component';
import { EpisodeComponent } from './components/episode/episode/episode.component';
import { ShowsResolver } from './shows.resolver';
import { path } from '@helper/path';
import {
  addShow,
  episode,
  search,
  season,
  show,
  shows,
  showsProgress,
  upcoming,
  watchlist,
} from 'src/app/paths';
import { CanActivateLoggedIn } from '../can-activate-logged-in';
import { CanActivateLoggedOut } from '../can-activate-logged-out';

const routes: Routes = [
  {
    path: '',
    component: AddShowComponent,
    canActivate: [CanActivateLoggedOut],
    title: 'Shows - Trakify',
  },
  {
    path: path(showsProgress.pattern, shows.pattern),
    component: ShowsComponent,
    title: 'Shows - Trakify',
    canActivate: [CanActivateLoggedIn],
    resolve: { showInfos: ShowsResolver },
  },
  {
    path: path(addShow.pattern, shows.pattern),
    component: AddShowComponent,
    title: 'Add Show - Trakify',
  },
  {
    path: path(show.pattern, shows.pattern),
    component: ShowComponent,
    title: 'Show - Trakify',
  },
  {
    path: path(season.pattern, shows.pattern),
    component: SeasonComponent,
    title: 'Season - Trakify',
  },
  {
    path: path(episode.pattern, shows.pattern),
    component: EpisodeComponent,
    title: 'Episode - Trakify',
  },

  {
    path: path(search.pattern, shows.pattern),
    component: SearchComponent,
    canActivate: [CanActivateLoggedIn],
    title: 'Search - Trakify',
  },
  {
    path: path(upcoming.pattern, shows.pattern),
    component: UpcomingComponent,
    canActivate: [CanActivateLoggedIn],
    title: 'Upcoming - Trakify',
  },
  {
    path: path(watchlist.pattern, shows.pattern),
    component: WatchlistComponent,
    canActivate: [CanActivateLoggedIn],
    title: 'Watchlist - Trakify',
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ShowsRoutingModule {}
