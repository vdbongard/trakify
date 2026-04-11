import { Routes } from '@angular/router';
import { loggedIn } from '@shared/guards/logged-in';
import { loggedOut } from '@shared/guards/logged-out';

const routes: Routes = [
  {
    path: 'shows',
    loadComponent: () => import('./pages/shows-with-search/shows-with-search.component'),
    canActivate: [loggedOut],
    title: 'Shows - Trakify',
  },
  {
    path: 'shows/progress',
    loadComponent: () => import('./pages/shows-progress/shows-progress.component'),
    title: 'Progress - Trakify',
    canActivate: [loggedIn],
  },
  {
    path: 'shows/add-show',
    loadComponent: () => import('./pages/shows-with-search/shows-with-search.component'),
    title: 'Shows - Trakify',
    canActivate: [loggedIn],
  },
  {
    path: 'shows/s/:show',
    loadComponent: () => import('./pages/show/show.component'),
    title: 'Show - Trakify',
  },
  {
    path: 'shows/s/:show/season/:season',
    loadComponent: () => import('./pages/season/season.component'),
    title: 'Season - Trakify',
  },
  {
    path: 'shows/s/:show/season/:season/episode/:episode',
    loadComponent: () => import('./pages/episode/episode.component'),
    title: 'Episode - Trakify',
  },
  {
    path: 'shows/search',
    loadComponent: () => import('./pages/search/search.component'),
    canActivate: [loggedIn],
    title: 'Search - Trakify',
  },
  {
    path: 'shows/upcoming',
    loadComponent: () => import('./pages/upcoming/upcoming.component'),
    canActivate: [loggedIn],
    title: 'Upcoming - Trakify',
  },
  {
    path: 'shows/watchlist',
    loadComponent: () => import('./pages/watchlist/watchlist.component'),
    canActivate: [loggedIn],
    title: 'Watchlist - Trakify',
  },
];

export default routes;
