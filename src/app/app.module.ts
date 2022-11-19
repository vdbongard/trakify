import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';
import { ServiceWorkerModule } from '@angular/service-worker';
import { FormsModule } from '@angular/forms';
import { NgOptimizedImage } from '@angular/common';

import { environment } from '../environments/environment';

import { AppRoutingModule } from './app-routing.module';

import { AppComponent } from './app.component';
import { ErrorComponent } from './home/pages/error/error.component';
import { RedirectComponent } from './home/pages/redirect/redirect.component';
import { LoginComponent } from './home/pages/login/login.component';

import { OAuthModule, OAuthStorage } from 'angular-oauth2-oidc';

import { Interceptor } from '@shared/interceptors/interceptor';

import { MatLegacyMenuModule as MatMenuModule } from '@angular/material/legacy-menu';
import { MatIconModule } from '@angular/material/icon';
import { MatLegacyCheckboxModule as MatCheckboxModule } from '@angular/material/legacy-checkbox';
import { MatLegacyRadioModule as MatRadioModule } from '@angular/material/legacy-radio';
import { MatLegacyTabsModule as MatTabsModule } from '@angular/material/legacy-tabs';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatLegacyListModule as MatListModule } from '@angular/material/legacy-list';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatLegacyProgressSpinnerModule as MatProgressSpinnerModule } from '@angular/material/legacy-progress-spinner';
import { MatLegacySnackBarModule as MatSnackBarModule } from '@angular/material/legacy-snack-bar';
import { MatLegacyButtonModule as MatButtonModule } from '@angular/material/legacy-button';
import { IncludesPipe } from '@shared/pipes/includes.pipe';
import { IsFavoritePipe } from '@shared/pipes/is-favorite.pipe';
import { StartsWithPipe } from '@shared/pipes/starts-with.pipe';
import { NgGenericPipeModule } from 'ng-generic-pipe';
import { MatLegacyDialogModule as MatDialogModule } from '@angular/material/legacy-dialog';
import { IsHiddenPipe } from '@shared/pipes/is-hidden.pipe';
import { CategoryPipe } from '@shared/pipes/category.pipe';

@NgModule({
  declarations: [AppComponent, ErrorComponent, RedirectComponent, LoginComponent],
  imports: [
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    HttpClientModule,
    FormsModule,
    ServiceWorkerModule.register('ngsw-worker.js', {
      enabled: environment.production,
      // Register the ServiceWorker as soon as the application is stable
      // or after 30 seconds (whichever comes first).
      registrationStrategy: 'registerWhenStable:30000',
    }),
    OAuthModule.forRoot({
      resourceServer: {
        allowedUrls: ['https://api.trakt.tv'],
        sendAccessToken: true,
      },
    }),
    MatMenuModule,
    MatIconModule,
    MatCheckboxModule,
    MatRadioModule,
    MatTabsModule,
    MatSidenavModule,
    MatListModule,
    MatToolbarModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatButtonModule,
    NgOptimizedImage,
    IncludesPipe,
    IsFavoritePipe,
    StartsWithPipe,
    NgGenericPipeModule,
    MatDialogModule,
    IsHiddenPipe,
    CategoryPipe,
  ],
  providers: [
    { provide: OAuthStorage, useFactory: (): OAuthStorage => localStorage },
    { provide: HTTP_INTERCEPTORS, useClass: Interceptor, multi: true },
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
