import {
  ApplicationConfig,
  importProvidersFrom,
  inject,
  isDevMode,
  PLATFORM_ID,
} from '@angular/core';
import { provideRouter, withInMemoryScrolling, withViewTransitions } from '@angular/router';
import { routes } from './app.routes';
import { provideClientHydration } from '@angular/platform-browser';
import {
  provideHttpClient,
  withFetch,
  withInterceptors,
  withInterceptorsFromDi,
} from '@angular/common/http';
import { apiAuthInterceptor } from '@shared/interceptors/api-auth.interceptor';
import { provideAnimations } from '@angular/platform-browser/animations';
import { OAuthStorage, provideOAuthClient } from 'angular-oauth2-oidc';
import { provideServiceWorker } from '@angular/service-worker';
import { firebaseProviders } from '../firebase.providers';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialogModule } from '@angular/material/dialog';
import { isPlatformBrowser } from '@angular/common';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(
      routes,
      withInMemoryScrolling({ scrollPositionRestoration: 'disabled' }),
      withViewTransitions(),
    ),
    provideHttpClient(
      withInterceptors([apiAuthInterceptor]),
      withInterceptorsFromDi(),
      withFetch(),
    ),
    provideAnimations(),
    provideOAuthClient({
      resourceServer: {
        allowedUrls: ['https://api.trakt.tv'],
        sendAccessToken: true,
      },
    }),
    {
      provide: OAuthStorage,
      useFactory: (): OAuthStorage => {
        if (!isPlatformBrowser(inject(PLATFORM_ID))) {
          return {
            getItem: () => null,
            removeItem: () => {},
            setItem: () => {},
          } as OAuthStorage;
        }
        return localStorage;
      },
    },
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      // Register the ServiceWorker as soon as the application is stable
      // or after 30 seconds (whichever comes first).
      registrationStrategy: 'registerWhenStable:30000',
    }),
    firebaseProviders,
    importProvidersFrom(MatSnackBarModule, MatDialogModule),
    provideClientHydration(),
  ],
};
