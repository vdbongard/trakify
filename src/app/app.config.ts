import { ApplicationConfig, importProvidersFrom, inject, isDevMode } from '@angular/core';
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
  provideTanStackQuery,
  QueryClient,
  withDevtools,
} from '@tanstack/angular-query-experimental';
import { DevtoolsOptionsService } from '@services/devtools-options.service';

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
      withDevtools(() => ({
        initialIsOpen: true,
        buttonPosition: 'bottom-left',
        loadDevtools: inject(DevtoolsOptionsService).isDebug(),
      })),
    ),
  ],
};
