import { Routes } from '@angular/router';
import showRoutes from './pages/shows/routes';
import { loggedIn } from '@shared/guards/logged-in';

export const routes: Routes = [
  { path: '', redirectTo: 'shows', pathMatch: 'full' },
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login.component'),
    title: 'Login - Trakify',
  },
  {
    path: 'redirect',
    loadComponent: () => import('./pages/redirect/redirect.component'),
  },
  ...showRoutes,
  {
    path: 'lists',
    loadComponent: () => import('./pages/lists/lists.component'),
    canActivate: [loggedIn],
  },
  {
    path: 'statistics',
    loadComponent: () => import('./pages/statistics/statistics.component'),
    title: 'Statistics - Trakify',
    canActivate: [loggedIn],
  },
  {
    path: 'about',
    loadComponent: () => import('./pages/about/about.component'),
    title: 'About - Trakify',
  },
  {
    path: '**',
    loadComponent: () => import('./pages/error/error.component'),
    title: 'Oops - Trakify',
  },
];
