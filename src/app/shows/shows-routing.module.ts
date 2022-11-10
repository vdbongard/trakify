import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { ShowsProgressComponent } from './pages/shows-progress/shows-progress.component';
import { ShowsWithSearchComponent } from './pages/shows-with-search/shows-with-search.component';
import { SearchComponent } from './pages/search/search.component';
import { UpcomingComponent } from './pages/upcoming/upcoming.component';
import { WatchlistComponent } from './pages/watchlist/watchlist.component';
import { ShowComponent } from './pages/show/show.component';
import { SeasonComponent } from './pages/season/season.component';
import { EpisodeComponent } from './pages/episode/episode.component';
import { ShowsResolver } from './utils/shows.resolver';
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
import { LoggedIn } from '@shared/canActivate/logged-in';
import { LoggedOut } from '@shared/canActivate/logged-out';

const routes: Routes = [
  {
    path: '',
    component: ShowsWithSearchComponent,
    canActivate: [LoggedOut],
    title: 'Shows - Trakify',
  },
  {
    path: path(showsProgress.pattern, shows.pattern),
    component: ShowsProgressComponent,
    title: 'Shows - Trakify',
    canActivate: [LoggedIn],
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
    canActivate: [LoggedIn],
    title: 'Search - Trakify',
  },
  {
    path: path(upcoming.pattern, shows.pattern),
    component: UpcomingComponent,
    canActivate: [LoggedIn],
    title: 'Upcoming - Trakify',
  },
  {
    path: path(watchlist.pattern, shows.pattern),
    component: WatchlistComponent,
    canActivate: [LoggedIn],
    title: 'Watchlist - Trakify',
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ShowsRoutingModule {}
