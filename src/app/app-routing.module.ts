import { NgModule } from '@angular/core';
import { Router, RouterModule, Routes } from '@angular/router';

import { CanActivateLoggedIn } from '@shared/canActivate/can-activate-logged-in';

import { ErrorComponent } from './home/features/error/error.component';
import { RedirectComponent } from './home/features/redirect/redirect.component';
import { LoginComponent } from './home/features/login/login.component';
import { lists, login, redirect, shows, statistics } from '@shared/paths';
import { path } from '@helper/path';
import { CanActivateLoggedOut } from '@shared/canActivate/can-activate-logged-out';

const routes: Routes = [
  { path: '', redirectTo: path(shows.pattern), pathMatch: 'full' },
  { path: path(login.pattern), component: LoginComponent, title: 'Login - Trakify' },
  { path: path(redirect.pattern), component: RedirectComponent },
  {
    path: path(shows.pattern),
    loadChildren: () => import('./shows/shows.module').then((m) => m.ShowsModule),
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
  providers: [CanActivateLoggedIn, CanActivateLoggedOut],
})
export class AppRoutingModule {
  constructor(router: Router) {
    const relativeUrl = location.href.replace(document.baseURI, '/').replace('#/', '');
    console.debug('relativeUrl', relativeUrl);
    return router.navigateByUrl(relativeUrl);
  }
}
