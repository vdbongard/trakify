import { Routes } from '@angular/router';
import { path } from '@helper/path';
import { about, lists, login, redirect, shows, statistics } from '@shared/paths';
import showRoutes from './pages/shows/routes';
import { loggedIn } from '@shared/guards/logged-in';

export const routes: Routes = [
  { path: '', redirectTo: path(shows), pathMatch: 'full' },
  {
    path: path(login),
    loadComponent: () => import('./pages/login/login.component'),
    title: 'Login - Trakify',
  },
  {
    path: path(redirect),
    loadComponent: () => import('./pages/redirect/redirect.component'),
  },
  ...showRoutes,
  {
    path: path(lists),
    loadComponent: () => import('./pages/lists/lists.component'),
    canActivate: [loggedIn],
  },
  {
    path: path(statistics),
    loadComponent: () => import('./pages/statistics/statistics.component'),
    title: 'Statistics - Trakify',
    canActivate: [loggedIn],
  },
  {
    path: path(about),
    loadComponent: () => import('./pages/about/about.component'),
    title: 'About - Trakify',
  },
  { path: 'hello', loadComponent: () => import('./pages/hello.analog') },
  {
    path: '**',
    loadComponent: () => import('./pages/error/error.component'),
    title: 'Oops - Trakify',
  },
];
