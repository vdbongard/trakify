import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { CanActivateLoggedIn } from './auth-guard';

import { ErrorComponent } from './components/error/error.component';
import { RedirectComponent } from './components/redirect/redirect.component';
import { LoginComponent } from './components/login/login.component';

const routes: Routes = [
  { path: '', redirectTo: 'series', pathMatch: 'full' },
  { path: 'login', component: LoginComponent, title: 'Login - Trakify' },
  { path: 'redirect', component: RedirectComponent },
  {
    path: 'series',
    loadChildren: () => import('./shows/shows.module').then((m) => m.ShowsModule),
    canActivate: [CanActivateLoggedIn],
  },
  {
    path: 'lists',
    loadChildren: () => import('./lists/lists.module').then((m) => m.ListsModule),
    canActivate: [CanActivateLoggedIn],
  },
  {
    path: 'statistics',
    loadChildren: () => import('./statistics/statistics.module').then((m) => m.StatisticsModule),
    canActivate: [CanActivateLoggedIn],
  },
  { path: '**', component: ErrorComponent, title: '404 - Trakify' },
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { scrollPositionRestoration: 'disabled', useHash: false }),
  ],
  exports: [RouterModule],
  providers: [CanActivateLoggedIn],
})
export class AppRoutingModule {}
