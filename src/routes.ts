import { Routes } from '@angular/router';
import { path } from '@helper/path';
import { about, lists, login, redirect, shows, statistics } from '@shared/paths';
import { loggedIn } from '@shared/guards/logged-in';
import showRoutes from './app/pages/shows/routes';

export const routes: Routes = [
  { path: '', redirectTo: path(shows), pathMatch: 'full' },
  {
    path: path(login),
    loadComponent: () => import('./app/pages/login/login.component'),
    title: 'Login - Trakify',
  },
  {
    path: path(redirect),
    loadComponent: () => import('./app/pages/redirect/redirect.component'),
  },
  ...showRoutes,
  {
    path: path(lists),
    loadComponent: () => import('./app/pages/lists/lists.component'),
    canActivate: [loggedIn],
  },
  {
    path: path(statistics),
    loadComponent: () => import('./app/pages/statistics/statistics.component'),
    title: 'Statistics - Trakify',
    canActivate: [loggedIn],
  },
  {
    path: path(about),
    loadComponent: () => import('./app/pages/about/about.component'),
    title: 'About - Trakify',
  },
  {
    path: '**',
    loadComponent: () => import('./app/pages/error/error.component'),
    title: 'Oops - Trakify',
  },
];
