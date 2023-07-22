import { Routes } from '@angular/router';
import { path } from '@helper/path';
import { about, lists, login, loginNew, redirect, shows, statistics } from '@shared/paths';
import { LoginComponent } from './app/home/pages/login/login.component';
import { RedirectComponent } from './app/home/pages/redirect/redirect.component';
import { loggedIn } from '@shared/canActivate/logged-in';
import { ErrorComponent } from './app/home/pages/error/error.component';
import { LoginNewComponent } from './app/home/pages/login-new/login-new.component';
import { AboutComponent } from './app/home/pages/about/about.component';

export const routes: Routes = [
  { path: '', redirectTo: path(shows), pathMatch: 'full' },
  { path: path(login), component: LoginComponent, title: 'Login - Trakify' },
  { path: path(loginNew), component: LoginNewComponent, title: 'Login - Trakify' },
  { path: path(redirect), component: RedirectComponent },
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
  { path: path(about), component: AboutComponent, title: 'About - Trakify' },
  { path: '**', component: ErrorComponent, title: 'Oops - Trakify' },
];
