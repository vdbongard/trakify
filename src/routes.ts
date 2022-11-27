import { Routes } from '@angular/router';
import { path } from '@helper/path';
import { lists, login, redirect, shows, statistics } from '@shared/paths';
import { LoginComponent } from './app/home/pages/login/login.component';
import { RedirectComponent } from './app/home/pages/redirect/redirect.component';
import { LoggedIn } from '@shared/canActivate/logged-in';
import { ErrorComponent } from './app/home/pages/error/error.component';

export const routes: Routes = [
  { path: '', redirectTo: path(shows.pattern), pathMatch: 'full' },
  { path: path(login.pattern), component: LoginComponent, title: 'Login - Trakify' },
  { path: path(redirect.pattern), component: RedirectComponent },
  {
    path: path(shows.pattern),
    loadChildren: () => import('./app/shows/shows.module').then((m) => m.ShowsModule),
  },
  {
    path: path(lists.pattern),
    loadChildren: () => import('./app/lists/lists.module').then((m) => m.ListsModule),
    canActivate: [LoggedIn],
  },
  {
    path: path(statistics.pattern),
    loadChildren: () =>
      import('./app/statistics/statistics.module').then((m) => m.StatisticsModule),
    canActivate: [LoggedIn],
  },
  { path: '**', component: ErrorComponent, title: '404 - Trakify' },
];
