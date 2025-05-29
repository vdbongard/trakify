import {
  ApplicationConfig,
  importProvidersFrom,
  isDevMode,
  provideZoneChangeDetection,
} from '@angular/core';
import {
  provideRouter,
  withComponentInputBinding,
  withInMemoryScrolling,
  withViewTransitions,
} from '@angular/router';

import { routes } from './app.routes';
import { provideServiceWorker } from '@angular/service-worker';
import { provideHttpClient, withInterceptors, withInterceptorsFromDi } from '@angular/common/http';
import { apiAuthInterceptor } from '@shared/interceptors/api-auth.interceptor';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { OAuthStorage, provideOAuthClient } from 'angular-oauth2-oidc';
import { firebaseProviders } from '../firebase.providers';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialogModule } from '@angular/material/dialog';
import {
  provideTanStackQuery,
  QueryClient,
  withDevtools,
} from '@tanstack/angular-query-experimental';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(
      routes,
      withInMemoryScrolling({ scrollPositionRestoration: 'enabled' }),
      withViewTransitions(),
      withComponentInputBinding(),
    ),
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000',
    }),
    provideHttpClient(withInterceptors([apiAuthInterceptor]), withInterceptorsFromDi()),
    provideAnimationsAsync(),
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
    firebaseProviders,
    importProvidersFrom(MatSnackBarModule, MatDialogModule),
    provideTanStackQuery(
      new QueryClient(),
      withDevtools(() => ({
        initialIsOpen: true,
        buttonPosition: 'bottom-left',
        // Disabled in Angular 20 due to an error with missing InjectionContext
        // loadDevtools: inject(DevtoolsOptionsService).isDebug(),
      })),
    ),
  ],
};
