import { Routes } from '@angular/router';
import { path } from '@helper/path';
import { about, lists, login, redirect, shows, statistics } from '@shared/paths';
import { loggedIn } from '@shared/canActivate/logged-in';

export const routes: Routes = [
  { path: '', redirectTo: path(shows), pathMatch: 'full' },
  {
    path: path(login),
    loadComponent: () => import('./app/home/pages/login/login.component'),
    title: 'Login - Trakify',
  },
  {
    path: path(redirect),
    loadComponent: () => import('./app/home/pages/redirect/redirect.component'),
  },
  {
    path: path(shows),
    loadChildren: () => import('./app/shows/routes'),
  },
  {
    path: path(lists),
    loadChildren: () => import('./app/lists/routes'),
    canActivate: [loggedIn],
  },
  {
    path: path(statistics),
    loadChildren: () => import('./app/statistics/routes'),
    canActivate: [loggedIn],
  },
  {
    path: path(about),
    loadComponent: () => import('./app/home/pages/about/about.component'),
    title: 'About - Trakify',
  },
  {
    path: '**',
    loadComponent: () => import('./app/home/pages/error/error.component'),
    title: 'Oops - Trakify',
  },
];
