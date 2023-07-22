import { Routes } from '@angular/router';
import { ShowsProgressComponent } from './pages/shows-progress/shows-progress.component';
import { ShowsWithSearchComponent } from './pages/shows-with-search/shows-with-search.component';
import { SearchComponent } from './pages/search/search.component';
import { UpcomingComponent } from './pages/upcoming/upcoming.component';
import { WatchlistComponent } from './pages/watchlist/watchlist.component';
import { ShowComponent } from './pages/show/show.component';
import { SeasonComponent } from './pages/season/season.component';
import { EpisodeComponent } from './pages/episode/episode.component';
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
import { loggedIn } from '@shared/canActivate/logged-in';
import { loggedOut } from '@shared/canActivate/logged-out';

export default [
  {
    path: '',
    component: ShowsWithSearchComponent,
    canActivate: [loggedOut],
    title: 'Shows - Trakify',
  },
  {
    path: path(showsProgress, shows),
    component: ShowsProgressComponent,
    title: 'Progress - Trakify',
    canActivate: [loggedIn],
  },
  {
    path: path(addShow, shows),
    component: ShowsWithSearchComponent,
    title: 'Shows - Trakify',
  },
  {
    path: path(show, shows),
    component: ShowComponent,
    title: 'Show - Trakify',
  },
  {
    path: path(season, shows),
    component: SeasonComponent,
    title: 'Season - Trakify',
  },
  {
    path: path(episode, shows),
    component: EpisodeComponent,
    title: 'Episode - Trakify',
  },

  {
    path: path(search, shows),
    component: SearchComponent,
    canActivate: [loggedIn],
    title: 'Search - Trakify',
  },
  {
    path: path(upcoming, shows),
    component: UpcomingComponent,
    canActivate: [loggedIn],
    title: 'Upcoming - Trakify',
  },
  {
    path: path(watchlist, shows),
    component: WatchlistComponent,
    canActivate: [loggedIn],
    title: 'Watchlist - Trakify',
  },
] as Routes;
