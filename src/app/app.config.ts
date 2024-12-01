import { ApplicationConfig, importProvidersFrom, isDevMode } from '@angular/core';
import {
  provideRouter,
  withComponentInputBinding,
  withInMemoryScrolling,
  withViewTransitions,
} from '@angular/router';
import { routes } from './app.routes';
import { provideHttpClient, withInterceptors, withInterceptorsFromDi } from '@angular/common/http';
import { apiAuthInterceptor } from '@shared/interceptors/api-auth.interceptor';
import { provideAnimations } from '@angular/platform-browser/animations';
import { OAuthStorage, provideOAuthClient } from 'angular-oauth2-oidc';
import { provideServiceWorker } from '@angular/service-worker';
import { firebaseProviders } from '../firebase.providers';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialogModule } from '@angular/material/dialog';
import {
  DevtoolsOptions,
  provideTanStackQuery,
  QueryClient,
  withDevtools,
} from '@tanstack/angular-query-experimental';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(
      routes,
      withInMemoryScrolling({ scrollPositionRestoration: 'enabled' }),
      withViewTransitions(),
      withComponentInputBinding(),
    ),
    provideHttpClient(withInterceptors([apiAuthInterceptor]), withInterceptorsFromDi()),
    provideAnimations(),
    provideOAuthClient({
      resourceServer: {
        allowedUrls: ['https://api.trakt.tv'],
        sendAccessToken: true,
      },
    }),
    {
      provide: OAuthStorage,
      useFactory: (): OAuthStorage => localStorage,
    },
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      // Register the ServiceWorker as soon as the application is stable
      // or after 30 seconds (whichever comes first).
      registrationStrategy: 'registerWhenStable:30000',
    }),
    firebaseProviders,
    importProvidersFrom(MatSnackBarModule, MatDialogModule),
    provideTanStackQuery(
      new QueryClient(),
      withDevtools(() => {
        const searchParams = new URLSearchParams(window.location.search);
        const isDebug = searchParams.get('debug') === '1';
        const options: DevtoolsOptions = {
          initialIsOpen: true,
          buttonPosition: 'bottom-left',
        };
        return isDebug ? { ...options, loadDevtools: true } : { loadDevtools: 'auto' };
      }),
    ),
  ],
};
