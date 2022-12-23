import { importProvidersFrom, isDevMode } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { OAuthStorage, provideOAuthClient } from 'angular-oauth2-oidc';
import { provideHttpClient, withInterceptors, withInterceptorsFromDi } from '@angular/common/http';
import { provideRouter, withInMemoryScrolling } from '@angular/router';
import { ServiceWorkerModule } from '@angular/service-worker';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialogModule } from '@angular/material/dialog';
import { provideAnimations } from '@angular/platform-browser/animations';
import { routes } from './routes';
import { authInterceptor } from '@shared/interceptors/interceptor';
import './firebase';
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import {
  getAnalytics,
  provideAnalytics,
  ScreenTrackingService,
  UserTrackingService,
} from '@angular/fire/analytics';
import { getAuth, provideAuth } from '@angular/fire/auth';
import { getFirestore, provideFirestore } from '@angular/fire/firestore';
import { firebaseConfig } from './firebase';
import { NgxAuthFirebaseUIModule } from 'ngx-auth-firebaseui';

bootstrapApplication(AppComponent, {
  providers: [
    provideRouter(routes, withInMemoryScrolling({ scrollPositionRestoration: 'disabled' })),
    provideHttpClient(withInterceptors([authInterceptor]), withInterceptorsFromDi()),
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
        return localStorage;
      },
    },
    importProvidersFrom(
      ServiceWorkerModule.register('ngsw-worker.js', {
        enabled: !isDevMode(),
        // Register the ServiceWorker as soon as the application is stable
        // or after 30 seconds (whichever comes first).
        registrationStrategy: 'registerWhenStable:30000',
      }),
      MatSnackBarModule,
      MatDialogModule,
      provideFirebaseApp(() => initializeApp(firebaseConfig)),
      provideAnalytics(() => getAnalytics()),
      provideAuth(() => getAuth()),
      provideFirestore(() => getFirestore()),
      NgxAuthFirebaseUIModule.forRoot(firebaseConfig)
    ),
    ScreenTrackingService,
    UserTrackingService,
  ],
}).catch((err) => console.error(err));
