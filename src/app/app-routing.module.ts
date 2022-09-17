import { NgModule } from '@angular/core';
import { Router, RouterModule, Routes } from '@angular/router';

import { CanActivateLoggedIn } from './auth-guard';

import { ErrorComponent } from './components/error/error.component';
import { RedirectComponent } from './components/redirect/redirect.component';
import { LoginComponent } from './components/login/login.component';
import { lists, login, redirect, shows, statistics } from './shared/paths';
import { path } from '@helper/path';

const routes: Routes = [
  { path: '', redirectTo: path(shows.pattern), pathMatch: 'full' },
  { path: path(login.pattern), component: LoginComponent, title: 'Login - Trakify' },
  { path: path(redirect.pattern), component: RedirectComponent },
  {
    path: path(shows.pattern),
    loadChildren: () => import('./shows/shows.module').then((m) => m.ShowsModule),
    canActivate: [CanActivateLoggedIn],
  },
  {
    path: path(lists.pattern),
    loadChildren: () => import('./lists/lists.module').then((m) => m.ListsModule),
    canActivate: [CanActivateLoggedIn],
  },
  {
    path: path(statistics.pattern),
    loadChildren: () => import('./statistics/statistics.module').then((m) => m.StatisticsModule),
    canActivate: [CanActivateLoggedIn],
  },
  { path: '**', component: ErrorComponent, title: '404 - Trakify' },
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, {
      scrollPositionRestoration: 'disabled',
      useHash: true,
      initialNavigation: 'disabled',
    }),
  ],
  exports: [RouterModule],
  providers: [CanActivateLoggedIn],
})
export class AppRoutingModule {
  constructor(router: Router) {
    const relativeUrl = location.href.replace(document.baseURI, '/').replace('#/', '');
    console.debug('relativeUrl', relativeUrl);
    return router.navigateByUrl(relativeUrl);
  }
}
