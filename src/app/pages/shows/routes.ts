import type { Routes } from '@angular/router';
import { path } from '@helper/path';
import { loggedIn } from '@shared/guards/logged-in';
import { loggedOut } from '@shared/guards/logged-out';
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

const routes: Routes = [
  {
    path: path(shows),
    loadComponent: () => import('./pages/shows-with-search/shows-with-search.component'),
    canActivate: [loggedOut],
    title: 'Shows - Trakify',
  },
  {
    path: path(showsProgress),
    loadComponent: () => import('./pages/shows-progress/shows-progress.component'),
    title: 'Progress - Trakify',
    canActivate: [loggedIn],
  },
  {
    path: path(addShow),
    loadComponent: () => import('./pages/shows-with-search/shows-with-search.component'),
    title: 'Shows - Trakify',
    canActivate: [loggedIn],
  },
  {
    path: path(show),
    loadComponent: () => import('./pages/show/show.component'),
    title: 'Show - Trakify',
  },
  {
    path: path(season),
    loadComponent: () => import('./pages/season/season.component'),
    title: 'Season - Trakify',
  },
  {
    path: path(episode),
    loadComponent: () => import('./pages/episode/episode.component'),
    title: 'Episode - Trakify',
  },

  {
    path: path(search),
    loadComponent: () => import('./pages/search/search.component'),
    canActivate: [loggedIn],
    title: 'Search - Trakify',
  },
  {
    path: path(upcoming),
    loadComponent: () => import('./pages/upcoming/upcoming.component'),
    canActivate: [loggedIn],
    title: 'Upcoming - Trakify',
  },
  {
    path: path(watchlist),
    loadComponent: () => import('./pages/watchlist/watchlist.component'),
    canActivate: [loggedIn],
    title: 'Watchlist - Trakify',
  },
];

export default routes;
