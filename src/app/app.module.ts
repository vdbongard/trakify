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
import { ErrorComponent } from './components/error/error.component';
import { RedirectComponent } from './components/redirect/redirect.component';
import { LoginComponent } from './components/login/login.component';

import { OAuthModule, OAuthStorage } from 'angular-oauth2-oidc';

import { Interceptor } from './interceptors/interceptor';

import { MatMenuModule } from '@angular/material/menu';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatRadioModule } from '@angular/material/radio';
import { MatTabsModule } from '@angular/material/tabs';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatButtonModule } from '@angular/material/button';
import { IncludesPipe } from './shared/pipes/includes.pipe';
import { IsFavoritePipe } from './shared/pipes/is-favorite.pipe';
import { StartsWithPipe } from './shared/pipes/starts-with.pipe';
import { NgGenericPipeModule } from 'ng-generic-pipe';
import { MatDialogModule } from '@angular/material/dialog';
import { IsHiddenPipe } from './shared/pipes/is-hidden.pipe';
import { CategoryPipe } from './shared/pipes/category.pipe';

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
