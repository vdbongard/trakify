import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { OAuthModule, OAuthStorage } from 'angular-oauth2-oidc';
import { ErrorComponent } from './components/other-pages/error/error.component';
import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';
import { MatButtonModule } from '@angular/material/button';
import { RedirectComponent } from './components/other-pages/redirect/redirect.component';
import { MatCardModule } from '@angular/material/card';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatListModule } from '@angular/material/list';
import { MatRippleModule } from '@angular/material/core';
import { ShowComponent } from './components/show-pages/show/show/show.component';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatRadioModule } from '@angular/material/radio';
import { FormsModule } from '@angular/forms';
import { ShowsComponent } from './components/other-show-pages/shows/shows/shows.component';
import { SeasonItemComponent } from './components/show-pages/show/season-item/season-item.component';
import { SeasonComponent } from './components/show-pages/season/season/season.component';
import { EpisodeItemComponent } from './components/show-pages/season/episode-item/episode-item.component';
import { EpisodeComponent } from './components/show-pages/episode/episode/episode.component';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ServiceWorkerModule } from '@angular/service-worker';
import { environment } from '../environments/environment';
import { LoginComponent } from './components/other-pages/login/login.component';
import { SharedModule } from './shared/shared.module';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { AddShowComponent } from './components/other-show-pages/add-show/add-show.component';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { SearchComponent } from './components/other-show-pages/search/search.component';
import { A11yModule } from '@angular/cdk/a11y';
import { MatTabsModule } from '@angular/material/tabs';
import { UpcomingComponent } from './components/other-show-pages/upcoming/upcoming.component';
import { WatchlistComponent } from './components/list-pages/watchlist/watchlist.component';
import { ListsComponent } from './components/list-pages/lists/lists.component';
import { MatSidenavModule } from '@angular/material/sidenav';
import { StatisticsComponent } from './components/other-pages/statistics/statistics.component';
import { Interceptor } from './interceptors/interceptor';
import { MatChipsModule } from '@angular/material/chips';

export function storageFactory(): OAuthStorage {
  return localStorage;
}

@NgModule({
  declarations: [
    AppComponent,
    ErrorComponent,
    RedirectComponent,
    ShowComponent,
    ShowsComponent,
    SeasonItemComponent,
    SeasonComponent,
    EpisodeItemComponent,
    EpisodeComponent,
    LoginComponent,
    AddShowComponent,
    SearchComponent,
    UpcomingComponent,
    WatchlistComponent,
    ListsComponent,
    StatisticsComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    HttpClientModule,
    OAuthModule.forRoot({
      resourceServer: {
        allowedUrls: ['https://api.trakt.tv'],
        sendAccessToken: true,
      },
    }),
    MatButtonModule,
    MatCardModule,
    MatToolbarModule,
    MatListModule,
    MatRippleModule,
    MatProgressBarModule,
    MatIconModule,
    MatMenuModule,
    MatCheckboxModule,
    MatRadioModule,
    FormsModule,
    MatProgressSpinnerModule,
    ServiceWorkerModule.register('ngsw-worker.js', {
      enabled: environment.production,
      // Register the ServiceWorker as soon as the application is stable
      // or after 30 seconds (whichever comes first).
      registrationStrategy: 'registerWhenStable:30000',
    }),
    SharedModule,
    MatSnackBarModule,
    MatFormFieldModule,
    MatInputModule,
    A11yModule,
    MatTabsModule,
    MatSidenavModule,
    MatChipsModule,
  ],
  providers: [
    { provide: OAuthStorage, useFactory: storageFactory },
    { provide: HTTP_INTERCEPTORS, useClass: Interceptor, multi: true },
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
