import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { ShowsProgressComponent } from './features/shows-progress/shows-progress.component';
import { ShowsWithSearchComponent } from './features/shows-with-search/shows-with-search.component';
import { SearchComponent } from './features/search/search.component';
import { UpcomingComponent } from './features/upcoming/upcoming.component';
import { WatchlistComponent } from './features/watchlist/watchlist.component';
import { ShowComponent } from './features/show/show.component';
import { SeasonComponent } from './features/season/season.component';
import { EpisodeComponent } from './features/episode/episode.component';
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
} from '@shared/paths';
import { CanActivateLoggedIn } from '@shared/canActivate/can-activate-logged-in';
import { CanActivateLoggedOut } from '@shared/canActivate/can-activate-logged-out';

const routes: Routes = [
  {
    path: '',
    component: ShowsWithSearchComponent,
    canActivate: [CanActivateLoggedOut],
    title: 'Shows - Trakify',
  },
  {
    path: path(showsProgress.pattern, shows.pattern),
    component: ShowsProgressComponent,
    title: 'Shows - Trakify',
    canActivate: [CanActivateLoggedIn],
    resolve: { showInfos: ShowsResolver },
  },
  {
    path: path(addShow.pattern, shows.pattern),
    component: ShowsWithSearchComponent,
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
